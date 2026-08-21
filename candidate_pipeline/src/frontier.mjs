import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { evaluateCandidate } from "./evaluate.mjs";
import { promotionSafetyReason } from "./objective.mjs";
import {
  cacheEvaluation,
  loadRegistry,
  saveRegistry,
  storeRevision,
  syncChampion,
} from "./strategy-state.mjs";

const SOURCE = "Market_making_binary_option.py";

async function filesBelow(directory) {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesBelow(entryPath));
    else output.push(entryPath);
  }
  return output;
}

async function sha256(filePath) {
  return createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, filePath);
}

function archiveIdentity(repo, rawPath) {
  const relative = path.relative(repo, rawPath).split(path.sep);
  const runsIndex = relative.indexOf("runs");
  const archiveIndex = relative.indexOf("archive");
  if (runsIndex < 0 || archiveIndex < 0) throw new Error(`Raw report is outside a run archive: ${rawPath}`);
  return {
    runId: relative[runsIndex + 1],
    generation: Number(relative[archiveIndex + 1].slice(1)),
    candidateId: relative[archiveIndex + 2],
  };
}

function summaryBaseline() {
  return {
    schemaVersion: 1,
    strategy: "archive-index",
    resultArtifact: "archive-index.md",
    summary: {
      passed: 20,
      total: 20,
      bankruptcies: 0,
      scoredPointsHundredths: 0,
      combinedPnlCents: 0,
      minimumCapital: { endingCashCents: 1, startingCapitalCents: 1 },
    },
  };
}

function scoredCases(evaluation) {
  return evaluation.caseResults.filter(({ number }) => number >= 5 && number <= 20);
}

function compactCase(result) {
  return {
    number: result.number,
    scoreHundredths: result.scoreHundredths,
    bankrupt: result.bankrupt,
    rank: result.ranking.rank,
    participantCount: result.ranking.participantCount,
    ourPnlCents: result.ranking.ourPnlCents,
    leaderName: result.ranking.leaderName,
    leaderPnlCents: result.ranking.leaderPnlCents,
    gapToLeaderCents: result.ranking.gapToLeaderCents,
    runnerUpName: result.ranking.runnerUpName,
    runnerUpPnlCents: result.ranking.runnerUpPnlCents,
    marginToRunnerUpCents: result.ranking.marginToRunnerUpCents,
  };
}

function recordMetrics(record) {
  const cases = scoredCases(record.evaluation);
  const losing = cases.filter(({ scoreHundredths }) => scoreHundredths < 100);
  const held = cases.filter(({ scoreHundredths }) => scoreHundredths === 100);
  return {
    scoreVector: cases.map(({ number, scoreHundredths }) => `${number}:${scoreHundredths}`).join(","),
    gapSumCents: losing.reduce((total, { ranking }) => total + ranking.gapToLeaderCents, 0),
    minimumHeldMarginCents: Math.min(...held.map(({ ranking }) => ranking.marginToRunnerUpCents)),
    losingCases: losing.map(({ number }) => number),
    heldCases: held.map(({ number }) => number),
  };
}

function comparePortfolio(first, second) {
  return first.metrics.gapSumCents - second.metrics.gapSumCents
    || second.metrics.minimumHeldMarginCents - first.metrics.minimumHeldMarginCents
    || first.sourceLines - second.sourceLines
    || first.label.localeCompare(second.label)
    || first.sourceSha256.localeCompare(second.sourceSha256);
}

function compareCase(first, second, number) {
  const firstCase = first.compactCases.find((result) => result.number === number);
  const secondCase = second.compactCases.find((result) => result.number === number);
  const firstCost = firstCase.gapToLeaderCents * (100 - secondCase.scoreHundredths);
  const secondCost = secondCase.gapToLeaderCents * (100 - firstCase.scoreHundredths);
  return firstCost - secondCost || comparePortfolio(first, second);
}

async function archiveRecord(repo, rawPath) {
  const raw = JSON.parse(await fs.readFile(rawPath, "utf8"));
  const archiveDirectory = path.dirname(path.dirname(rawPath));
  const sourcePath = path.join(archiveDirectory, SOURCE);
  const sourceSha256 = await sha256(sourcePath);
  if (sourceSha256 !== raw.sourceSha256) throw new Error("Archived source SHA-256 does not match raw evidence");
  const evaluation = evaluateCandidate(raw, summaryBaseline(), raw.sourceSha256);
  if (!evaluation.valid) throw new Error(evaluation.reasons.join("; "));
  if (evaluation.caseResults.some(({ number, ranking }) => number >= 2 && ranking === undefined)) {
    throw new Error("Archived runtime failure has no complete Ranking evidence");
  }
  evaluation.sourcePath = sourcePath;
  evaluation.sourceSha256 = sourceSha256;
  const contents = await fs.readFile(sourcePath, "utf8");
  const markdown = (await fs.readdir(path.dirname(rawPath)))
    .find((name) => /^hackerrank-run-.*\.md$/.test(name));
  const record = {
    ...archiveIdentity(repo, rawPath),
    label: raw.label,
    sourcePath,
    sourceSha256,
    rawPath,
    markdownPath: markdown ? path.join(path.dirname(rawPath), markdown) : null,
    sourceLines: (contents.match(/\n/g) ?? []).length,
    evaluation,
  };
  record.compactCases = scoredCases(evaluation).map(compactCase);
  record.metrics = recordMetrics(record);
  return record;
}

export function selectFrontier(records) {
  const maxScoreHundredths = Math.max(...records.map(({ evaluation }) => evaluation.summary.scoredPointsHundredths));
  const plateau = records.filter(({ evaluation }) => (
    evaluation.summary.scoredPointsHundredths === maxScoreHundredths
    && promotionSafetyReason(evaluation) === null
  ));
  plateau.sort(comparePortfolio);
  const anchor = plateau[0];
  const frontierByCase = Object.fromEntries(anchor.metrics.losingCases.map((number) => [
    number,
    [...plateau].sort((first, second) => compareCase(first, second, number))[0],
  ]));
  const vectorCounts = new Map();
  for (const record of plateau) {
    vectorCounts.set(record.metrics.scoreVector, (vectorCounts.get(record.metrics.scoreVector) ?? 0) + 1);
  }
  return {
    maxScoreHundredths,
    scoreVectors: [...vectorCounts].map(([vector, count]) => ({ vector, count })),
    anchor,
    frontierByCase,
    plateau,
  };
}

export async function buildFrontier(repo) {
  const archiveFiles = (await filesBelow(path.join(repo, "results", "runs")))
    .filter((filePath) => filePath.includes(`${path.sep}archive${path.sep}`))
    .filter((filePath) => /raw\/hackerrank-run-.*\.json$/.test(filePath));
  const recordsBySha = new Map();
  const rejected = [];
  const parsed = await Promise.all(archiveFiles.map(async (rawPath) => {
    try {
      return { record: await archiveRecord(repo, rawPath) };
    } catch (error) {
      return { rejected: { rawPath: path.relative(repo, rawPath), reason: error.message } };
    }
  }));
  for (const result of parsed) {
    if (result.rejected) rejected.push(result.rejected);
    else if (!recordsBySha.has(result.record.sourceSha256)) {
      recordsBySha.set(result.record.sourceSha256, result.record);
    }
  }
  const records = [...recordsBySha.values()];
  const selected = selectFrontier(records);
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scannedReports: archiveFiles.length,
    uniqueValidSources: records.length,
    rejected,
    plateauSources: selected.plateau.length,
    ...selected,
  };
}

function publicRecord(repo, record) {
  return {
    runId: record.runId,
    generation: record.generation,
    candidateId: record.candidateId,
    label: record.label,
    sourcePath: path.relative(repo, record.sourcePath),
    sourceSha256: record.sourceSha256,
    sourceLines: record.sourceLines,
    summary: record.evaluation.summary,
    metrics: record.metrics,
    cases: record.compactCases,
  };
}

export function publicFrontier(repo, frontier) {
  return {
    schemaVersion: frontier.schemaVersion,
    generatedAt: frontier.generatedAt,
    scannedReports: frontier.scannedReports,
    uniqueValidSources: frontier.uniqueValidSources,
    rejectedReports: frontier.rejected.length,
    maxScoreHundredths: frontier.maxScoreHundredths,
    plateauSources: frontier.plateauSources,
    scoreVectors: frontier.scoreVectors,
    anchor: publicRecord(repo, frontier.anchor),
    frontierByCase: Object.fromEntries(Object.entries(frontier.frontierByCase).map(([number, record]) => (
      [number, publicRecord(repo, record)]
    ))),
    plateau: frontier.plateau.map((record) => publicRecord(repo, record)),
  };
}

function baselineMarkdown(baseline) {
  return [
    "# Champion Compatibility Pointer",
    "",
    `- Current champion: \`${baseline.strategy}\``,
    "- Canonical record: `results/champion/champion.json`",
    `- Result file: \`${baseline.resultArtifact}\``,
    `- Source SHA-256: \`${baseline.sourceSha256}\``,
    `- Experiment: \`${baseline.experiment.runId}\`, generation ${baseline.experiment.generation}, candidate \`${baseline.experiment.candidateId}\``,
    `- SCORED points: ${(baseline.summary.scoredPointsHundredths / 100).toFixed(2)}/16.00`,
    `- Available cases passed: ${baseline.summary.passed}/${baseline.summary.total}`,
    `- Bankruptcies: ${baseline.summary.bankruptcies}`,
    "- Selection: score plateau, aggregate losing-case gap, held-margin floor, source lines, candidate ID",
    "",
  ].join("\n");
}

function challengerId(label) {
  const slug = label.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  return `frontier-${slug}`.slice(0, 85);
}

export async function retrackStrategy(repo, { apply = false } = {}) {
  const frontier = await buildFrontier(repo);
  const outputPath = path.join(repo, "results", "frontier.json");
  if (!apply) return { repo, action: "frontier", outputPath, frontier: publicFrontier(repo, frontier) };

  const currentChampionPath = path.join(repo, "results", "champion", "champion.json");
  const currentChampion = JSON.parse(await fs.readFile(currentChampionPath, "utf8"));
  const currentSourcePath = path.join(repo, SOURCE);
  if (await sha256(currentSourcePath) !== currentChampion.sourceSha256) {
    throw new Error("Current strategy does not match the canonical champion before retracking");
  }
  const currentRecord = [...frontier.plateau]
    .find(({ sourceSha256 }) => sourceSha256 === currentChampion.sourceSha256);
  if (!currentRecord) throw new Error("Current champion has no valid archived Ranking evidence");

  const baselinePath = path.join(repo, "results", "baselines", "best.json");
  const currentBaseline = JSON.parse(await fs.readFile(baselinePath, "utf8"));
  const registry = await loadRegistry(repo, currentBaseline);
  const preservedResearchShas = registry.challengers
    .filter(({ origin, frontier: metadata }) => (
      origin === "score-frontier" && metadata?.targetCases?.length === 0
    ))
    .map((challenger) => challenger.revisions
      .find(({ number }) => number === challenger.currentRevision)?.sourceSha256)
    .filter((sourceSha256) => sourceSha256 && sourceSha256 !== frontier.anchor.sourceSha256);
  const retiredAt = new Date().toISOString();
  for (const challenger of registry.challengers.filter(({ status }) => status === "active")) {
    challenger.status = "retired";
    challenger.retirement = { reason: "Replaced by score-frontier retracking", at: retiredAt };
  }

  const researchRecords = new Map();
  if (currentRecord.sourceSha256 !== frontier.anchor.sourceSha256) {
    researchRecords.set(currentRecord.sourceSha256, currentRecord);
  }
  for (const sourceSha256 of preservedResearchShas) {
    const record = frontier.plateau.find((candidate) => candidate.sourceSha256 === sourceSha256);
    if (record) researchRecords.set(sourceSha256, record);
  }
  for (const record of Object.values(frontier.frontierByCase)) {
    if (record.sourceSha256 !== frontier.anchor.sourceSha256) researchRecords.set(record.sourceSha256, record);
  }
  for (const record of researchRecords.values()) {
    const targetCases = Object.entries(frontier.frontierByCase)
      .filter(([, candidate]) => candidate.sourceSha256 === record.sourceSha256)
      .map(([number]) => Number(number));
    const evaluation = structuredClone(record.evaluation);
    evaluation.eligible = false;
    evaluation.reasons = ["Research frontier retained during score-only objective migration"];
    const stored = await storeRevision({
      repo,
      registry,
      challengerId: challengerId(record.label),
      sourcePath: record.sourcePath,
      evaluation,
      method: "quote",
      origin: "score-frontier",
      rationale: targetCases.length > 0
        ? `Best archived score-normalized gap for cases ${targetCases.join(", ")}.`
        : "Preserves the pre-migration champion as a session-discriminator research branch.",
    });
    stored.challenger.frontier = { targetCases, selectedAt: retiredAt };
  }
  registry.challengers = registry.challengers.filter((challenger) => {
    if (challenger.origin !== "score-frontier") return true;
    const revision = challenger.revisions.find(({ number }) => number === challenger.currentRevision);
    return revision?.sourceSha256 !== frontier.anchor.sourceSha256;
  });

  const anchor = frontier.anchor;
  const baseline = {
    schemaVersion: 3,
    strategy: anchor.label,
    resultArtifact: "results/champion/result.md",
    sourceSha256: anchor.sourceSha256,
    experimentId: `${anchor.runId}:g${String(anchor.generation).padStart(2, "0")}:${anchor.candidateId}`,
    experiment: { runId: anchor.runId, generation: anchor.generation, candidateId: anchor.candidateId },
    summary: structuredClone(anchor.evaluation.summary),
    caseResults: structuredClone(anchor.evaluation.caseResults),
    anchorSelection: {
      rule: ["score", "losingGapSum", "heldMarginFloor", "sourceLines", "candidateId"],
      gapSumCents: anchor.metrics.gapSumCents,
      minimumHeldMarginCents: anchor.metrics.minimumHeldMarginCents,
      sourceLines: anchor.sourceLines,
    },
  };
  cacheEvaluation(registry, anchor.evaluation);
  syncChampion(registry, baseline);

  await fs.copyFile(anchor.sourcePath, currentSourcePath);
  await fs.mkdir(path.dirname(currentChampionPath), { recursive: true });
  const resultMarkdown = anchor.markdownPath
    ? (await fs.readFile(anchor.markdownPath, "utf8")).replace(/^- Source: .*$/m, `- Source: \`${SOURCE}\``)
    : `# ${anchor.label}\n\n${(anchor.evaluation.summary.scoredPointsHundredths / 100).toFixed(2)}/16.00\n`;
  await fs.writeFile(path.join(repo, "results", "champion", "result.md"), resultMarkdown);
  await writeJson(currentChampionPath, {
    schemaVersion: 2,
    id: baseline.strategy,
    sourcePath: SOURCE,
    sourceSha256: baseline.sourceSha256,
    resultArtifact: baseline.resultArtifact,
    experimentId: baseline.experimentId,
    experiment: baseline.experiment,
    summary: baseline.summary,
    caseResults: baseline.caseResults,
    anchorSelection: baseline.anchorSelection,
  });
  await writeJson(baselinePath, baseline);
  await fs.writeFile(path.join(repo, "results", "baselines", "best.md"), baselineMarkdown(baseline));
  await saveRegistry(repo, registry);
  await writeJson(outputPath, publicFrontier(repo, frontier));
  return {
    repo,
    action: "retracked",
    outputPath,
    anchor: publicRecord(repo, anchor),
    activeChallengers: registry.challengers.filter(({ status }) => status === "active").map(({ id }) => id),
  };
}
