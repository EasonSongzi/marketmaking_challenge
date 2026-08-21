import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import {
  compareObjective,
  defaultObjective,
  improvesObjective,
  promotionEligible,
  promotionReason,
} from "./objective.mjs";

const REGISTRY = path.join("results", "strategy-state.json");
const CHALLENGERS = path.join("results", "challengers");

export class StrategyStateError extends Error {}

export function registryPath(repo) {
  return path.join(repo, REGISTRY);
}

export function challengersPath(repo) {
  return path.join(repo, CHALLENGERS);
}

export async function fileSha256(filePath) {
  return createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function championFromBaseline(baseline) {
  return {
    id: baseline.strategy,
    sourcePath: "Market_making_binary_option.py",
    sourceSha256: baseline.sourceSha256,
    resultArtifact: baseline.resultArtifact,
    experimentId: baseline.experimentId ?? null,
    summary: structuredClone(baseline.summary),
    ...(Array.isArray(baseline.caseResults) ? { caseResults: structuredClone(baseline.caseResults) } : {}),
  };
}

function validateRegistry(registry) {
  if (registry?.schemaVersion !== 1 || !registry.champion || !Array.isArray(registry.challengers)) {
    throw new StrategyStateError("Strategy registry must use schemaVersion 1");
  }
  if (typeof registry.evaluations !== "object" || registry.evaluations === null) {
    throw new StrategyStateError("Strategy registry evaluations must be an object");
  }
  for (const challenger of registry.challengers) {
    if (
      typeof challenger.id !== "string"
      || !["active", "retired", "promoted"].includes(challenger.status)
      || !Number.isSafeInteger(challenger.tuningAttempts)
      || challenger.tuningAttempts < 0
      || !Array.isArray(challenger.revisions)
      || challenger.revisions.length === 0
      || !Number.isSafeInteger(challenger.currentRevision)
    ) {
      throw new StrategyStateError(`Malformed challenger: ${challenger?.id ?? "unknown"}`);
    }
    const revision = challenger.revisions.find(({ number }) => number === challenger.currentRevision);
    if (!revision) throw new StrategyStateError(`Missing current revision for ${challenger.id}`);
    if (challenger.derivedFrom !== undefined && (
      typeof challenger.derivedFrom?.challengerId !== "string"
      || !Number.isSafeInteger(challenger.derivedFrom?.revision)
      || !/^[a-f0-9]{64}$/.test(challenger.derivedFrom?.sourceSha256 ?? "")
    )) {
      throw new StrategyStateError(`Malformed derived challenger parent: ${challenger.id}`);
    }
  }
}

export async function loadRegistry(repo, baseline) {
  let registry;
  try {
    registry = JSON.parse(await fs.readFile(registryPath(repo), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw new StrategyStateError(`Cannot read strategy registry: ${error.message}`);
    registry = {
      schemaVersion: 1,
      champion: championFromBaseline(baseline),
      challengers: [],
      evaluations: {},
    };
  }
  validateRegistry(registry);
  return registry;
}

export async function saveRegistry(repo, registry) {
  validateRegistry(registry);
  const output = registryPath(repo);
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(registry, null, 2)}\n`);
  await fs.rename(temporary, output);
}

export function cacheEvaluation(registry, evaluation) {
  if (!evaluation?.valid || !/^[a-f0-9]{64}$/.test(evaluation.sourceSha256 ?? "")) return;
  registry.evaluations[evaluation.sourceSha256] = {
    schemaVersion: evaluation.schemaVersion,
    valid: true,
    modifiedLines: evaluation.modifiedLines,
    summary: structuredClone(evaluation.summary),
    ...(Array.isArray(evaluation.caseResults)
      ? { caseResults: structuredClone(evaluation.caseResults) }
      : {}),
    reasons: [...evaluation.reasons],
  };
}

export function cachedEvaluation(registry, sourceSha256, candidateId, sourcePath, baseline) {
  const cached = registry.evaluations[sourceSha256];
  if (!cached?.valid) return null;
  const rebound = {
    schemaVersion: cached.schemaVersion ?? 1,
    candidateId,
    valid: true,
    eligible: false,
    sourcePath,
    sourceSha256,
    modifiedLines: cached.modifiedLines,
    summary: structuredClone(cached.summary),
    ...(Array.isArray(cached.caseResults)
      ? { caseResults: structuredClone(cached.caseResults) }
      : {}),
  };
  const eligible = promotionEligible(rebound, baseline.summary);
  const performanceReasons = cached.reasons.filter((reason) => (
    reason.startsWith("Cases did not pass:")
    || reason.startsWith("Guard cases did not pass:")
    || reason.startsWith("Scored cases failed without bankruptcy:")
    || reason.startsWith("Candidate runtime error in cases ")
  ));
  if (!eligible && performanceReasons.length === 0) {
    performanceReasons.push(promotionReason(rebound, baseline.summary));
  }
  return {
    ...rebound,
    eligible,
    baselineDelta: {
      scoredPointsHundredths:
        cached.summary.scoredPointsHundredths - baseline.summary.scoredPointsHundredths,
      combinedPnlCents: cached.summary.combinedPnlCents === null
        ? null
        : cached.summary.combinedPnlCents - baseline.summary.combinedPnlCents,
    },
    reasons: performanceReasons,
    cached: true,
  };
}

export function compareStrategy(first, second, objective = defaultObjective(), parent = second) {
  return compareObjective(first, second, objective, parent);
}

export function strictlyImproves(candidate, parent, objective = defaultObjective()) {
  return improvesObjective(candidate, parent, objective);
}

export function currentRevision(challenger) {
  return challenger.revisions.find(({ number }) => number === challenger.currentRevision);
}

export function activeChallenger(registry, challengerId) {
  const challenger = registry.challengers.find(({ id, status }) => (
    id === challengerId && status === "active"
  ));
  return challenger ?? null;
}

function nextRevision(challenger) {
  return challenger ? Math.max(...challenger.revisions.map(({ number }) => number)) + 1 : 0;
}

function revisionMarkdown(challengerId, revision, evaluation) {
  const summary = evaluation.summary;
  const pnl = summary.combinedPnlCents === null
    ? "n/a"
    : (summary.combinedPnlCents / 100).toFixed(2);
  return [
    `# Challenger ${challengerId} r${String(revision).padStart(2, "0")}`,
    "",
    `- Source SHA-256: \`${evaluation.sourceSha256}\``,
    `- Passed: ${summary.passed}/${summary.total}`,
    `- Bankruptcies: ${summary.bankruptcies ?? "n/a"}`,
    `- SCORED points: ${(summary.scoredPointsHundredths / 100).toFixed(2)}/16.00`,
    `- Combined PnL: ${pnl}`,
    "",
  ].join("\n");
}

export async function storeRevision({
  repo,
  registry,
  challengerId,
  sourcePath,
  evaluation,
  method,
  origin,
  rationale,
  derivedFrom,
  status = "active",
}) {
  const sourceSha256 = await fileSha256(sourcePath);
  if (evaluation?.sourceSha256 !== sourceSha256) {
    throw new StrategyStateError(`Evaluation source SHA does not match ${challengerId}`);
  }
  let challenger = registry.challengers.find(({ id }) => id === challengerId);
  const existing = challenger?.revisions.find((revision) => revision.sourceSha256 === sourceSha256);
  if (existing) {
    challenger.status = status;
    challenger.currentRevision = existing.number;
    return { challenger, revision: existing, destination: path.join(repo, existing.sourcePath) };
  }
  const number = nextRevision(challenger);
  const relativeSourcePath = path.join(CHALLENGERS, challengerId, `r${String(number).padStart(2, "0")}.py`);
  const relativeEvaluationPath = path.join(CHALLENGERS, challengerId, `r${String(number).padStart(2, "0")}.json`);
  const relativeSummaryPath = path.join(CHALLENGERS, challengerId, `r${String(number).padStart(2, "0")}.md`);
  const destination = path.join(repo, relativeSourcePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  try {
    const existingHash = await fileSha256(destination);
    if (existingHash !== sourceSha256) throw new StrategyStateError(`Immutable revision changed: ${relativeSourcePath}`);
  } catch (error) {
    if (error instanceof StrategyStateError) throw error;
    if (error.code !== "ENOENT") throw error;
    await fs.copyFile(sourcePath, destination);
  }
  const storedEvaluation = structuredClone(evaluation);
  storedEvaluation.sourcePath = relativeSourcePath;
  storedEvaluation.sourceSha256 = sourceSha256;
  await fs.writeFile(path.join(repo, relativeEvaluationPath), `${JSON.stringify(storedEvaluation, null, 2)}\n`);
  await fs.writeFile(path.join(repo, relativeSummaryPath), revisionMarkdown(challengerId, number, storedEvaluation));
  const revision = {
    number,
    sourcePath: relativeSourcePath,
    sourceSha256,
    evaluationPath: relativeEvaluationPath,
    summaryPath: relativeSummaryPath,
    evaluation: storedEvaluation,
    createdAt: new Date().toISOString(),
  };
  if (!challenger) {
    challenger = {
      id: challengerId,
      status,
      method,
      origin,
      rationale,
      tuningAttempts: 0,
      currentRevision: number,
      revisions: [],
      tuningHistory: [],
      ...(derivedFrom ? { derivedFrom: structuredClone(derivedFrom) } : {}),
    };
    registry.challengers.push(challenger);
  }
  challenger.status = status;
  challenger.method = method;
  challenger.currentRevision = number;
  challenger.revisions.push(revision);
  cacheEvaluation(registry, evaluation);
  return { challenger, revision, destination };
}

export function syncChampion(registry, baseline) {
  registry.champion = championFromBaseline(baseline);
}
