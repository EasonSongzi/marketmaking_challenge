import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { compareCapital } from "./case-result.mjs";
import { evaluateRun } from "./evaluate.mjs";
import { selectFromFiles } from "./select.mjs";
import {
  activeChallenger,
  cacheEvaluation,
  challengersPath,
  compareStrategy,
  currentRevision,
  loadRegistry,
  registryPath,
  saveRegistry,
  storeRevision,
  syncChampion,
} from "./strategy-state.mjs";

const execFile = promisify(execFileCallback);
const SOURCE = "Market_making_binary_option.py";
const WORKTREE_ROOT = "/tmp/akuna-market-maker";
const METHODS = new Set(["quote", "respond_to_fok", "warm_up"]);
const MODES = new Set(["explore", "tune"]);
const FAILURE_KINDS = new Set(["authentication", "browser", "runner", "integrity"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

export class LoopInputError extends Error {}

function now() {
  return new Date().toISOString();
}

async function command(commandName, argumentsList, options = {}) {
  try {
    return await execFile(commandName, argumentsList, {
      cwd: options.cwd,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (error) {
    const detail = (error.stderr || error.stdout || error.message).trim();
    throw new LoopInputError(`${commandName} ${argumentsList.join(" ")} failed: ${detail}`);
  }
}

async function git(repo, ...argumentsList) {
  return command("git", ["-C", repo, ...argumentsList]);
}

async function gitStatus(repo, ...argumentsList) {
  try {
    const result = await execFile("git", ["-C", repo, ...argumentsList], { encoding: "utf8" });
    return { status: 0, ...result };
  } catch (error) {
    return { status: error.code, stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
  }
}

async function readJson(filePath, label = "JSON") {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    throw new LoopInputError(`Cannot read ${label} ${filePath}: ${error.message}`);
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporary, filePath);
}

async function sha256(filePath) {
  const contents = await fs.readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

function assertId(value, label) {
  if (!ID_PATTERN.test(value ?? "")) {
    throw new LoopInputError(`${label} must match ${ID_PATTERN}`);
  }
}

function ensureWorktreePath(worktreePath) {
  if (typeof worktreePath !== "string") throw new LoopInputError("Worktree path must be a string");
  const resolved = path.resolve(worktreePath);
  if (resolved === WORKTREE_ROOT || !resolved.startsWith(`${WORKTREE_ROOT}/`)) {
    throw new LoopInputError(`Worktree path must be below ${WORKTREE_ROOT}`);
  }
  return resolved;
}

async function resolveRepo(repoOption) {
  const candidate = path.resolve(repoOption ?? process.cwd());
  const { stdout } = await git(candidate, "rev-parse", "--show-toplevel");
  return stdout.trim();
}

function pathsFor(repo, runId) {
  const runDirectory = path.join(repo, "results", "runs", runId);
  const championDirectory = path.join(repo, "results", "champion");
  return {
    repo,
    runId,
    runDirectory,
    statePath: path.join(runDirectory, "state.json"),
    reportPath: path.join(repo, "results", "experiments", `${runId}.md`),
    baselinePath: path.join(repo, "results", "baselines", "best.json"),
    registryPath: registryPath(repo),
    challengersPath: challengersPath(repo),
    championDirectory,
    championRecordPath: path.join(championDirectory, "champion.json"),
    championResultPath: path.join(championDirectory, "result.md"),
    sourcePath: path.join(repo, SOURCE),
  };
}

function validateBaseline(baseline) {
  if (![1, 2].includes(baseline?.schemaVersion) || typeof baseline?.summary !== "object") {
    throw new LoopInputError("Best baseline must use schema version 1 or 2");
  }
  const summary = baseline.summary;
  const integers = [
    summary.passed,
    summary.total,
    summary.bankruptcies,
    summary.scoredPointsHundredths,
    summary.combinedPnlCents,
    summary.minimumCapital?.endingCashCents,
    summary.minimumCapital?.startingCapitalCents,
  ];
  if (!integers.every(Number.isSafeInteger) || summary.total !== 20) {
    throw new LoopInputError("Best baseline summary is incomplete");
  }
  if (baseline.schemaVersion === 2 && !/^[a-f0-9]{64}$/.test(baseline.sourceSha256 ?? "")) {
    throw new LoopInputError("Version 2 baseline is missing sourceSha256");
  }
  if (baseline.schemaVersion === 2 && (typeof baseline.experimentId !== "string" || !baseline.experimentId)) {
    throw new LoopInputError("Version 2 baseline is missing experimentId");
  }
}

async function loadState(options) {
  assertId(options.runId, "run ID");
  const repo = await resolveRepo(options.repo);
  const paths = pathsFor(repo, options.runId);
  const state = await readJson(paths.statePath, "loop state");
  if (![1, 2].includes(state.schemaVersion) || state.runId !== options.runId) {
    throw new LoopInputError("Loop state does not match a supported schema or the requested run");
  }
  validateLoadedState(paths, state);
  return { paths, state };
}

function validateLoadedState(paths, state) {
  if (!Array.isArray(state.generations)) throw new LoopInputError("Loop state generations must be an array");
  for (const [index, generation] of state.generations.entries()) {
    if (!Number.isSafeInteger(generation?.number) || generation.number <= 0 || generation.number !== index + 1) {
      throw new LoopInputError(`Generation at index ${index} has an invalid number`);
    }
    if (!Array.isArray(generation.candidates)) throw new LoopInputError(`Generation ${generation.number} candidates must be an array`);
    const mode = generation.mode ?? "explore";
    if (!MODES.has(mode)) throw new LoopInputError(`Generation ${generation.number} has an invalid mode`);
    if (mode === "explore" && generation.candidates.length !== 3) {
      throw new LoopInputError(`Explore generation ${generation.number} must contain exactly three candidates`);
    }
    if (mode === "tune" && generation.materialized && generation.candidates.length === 0) {
      throw new LoopInputError(`Tune generation ${generation.number} has no materialized candidates`);
    }
    const ids = new Set();
    for (const candidate of generation.candidates) {
      assertId(candidate?.id, `generation ${generation.number} candidate ID`);
      if (ids.has(candidate.id)) throw new LoopInputError(`Generation ${generation.number} candidate IDs must be unique`);
      ids.add(candidate.id);
    }
    validateCandidatePaths(state, generation);
    for (const candidate of generation.candidates) {
      const archiveDirectory = path.join(
        paths.runDirectory,
        "archive",
        `g${String(generation.number).padStart(2, "0")}`,
        candidate.id,
      );
      if (candidate.archiveDirectory !== undefined
        && (typeof candidate.archiveDirectory !== "string" || path.resolve(candidate.archiveDirectory) !== archiveDirectory)) {
        throw new LoopInputError(`Unexpected archive path for ${candidate.id}`);
      }
      if (candidate.archivedSourcePath !== undefined
        && (typeof candidate.archivedSourcePath !== "string"
          || path.resolve(candidate.archivedSourcePath) !== path.join(archiveDirectory, SOURCE))) {
        throw new LoopInputError(`Unexpected archived source path for ${candidate.id}`);
      }
      if (candidate.evaluationPath !== undefined) {
        if (typeof candidate.evaluationPath !== "string") throw new LoopInputError(`Unexpected evaluation path for ${candidate.id}`);
        const evaluationPath = path.resolve(candidate.evaluationPath);
        const allowed = new Set([
          path.join(candidate.resultDirectory, "evaluation.json"),
          path.join(archiveDirectory, "evaluation.json"),
        ]);
        if (!allowed.has(evaluationPath)) throw new LoopInputError(`Unexpected evaluation path for ${candidate.id}`);
      }
    }
  }
}

async function saveState(paths, state) {
  state.updatedAt = now();
  await writeJson(paths.statePath, state);
  await renderReport(paths, state);
}

function formatHundredths(value) {
  const sign = value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  return `${sign}${Math.floor(magnitude / 100)}.${String(magnitude % 100).padStart(2, "0")}`;
}

function summaryLine(summary) {
  if (!summary) return "not evaluated";
  const capital = summary.minimumCapital
    ? `${formatHundredths(summary.minimumCapital.endingCashCents)}/${formatHundredths(summary.minimumCapital.startingCapitalCents)}`
    : "n/a";
  const bankruptcies = summary.bankruptcies ?? "n/a";
  const pnl = summary.combinedPnlCents === null ? "n/a" : formatHundredths(summary.combinedPnlCents);
  const runtimeErrors = summary.runtimeErrors > 0 ? `; ${summary.runtimeErrors} runtime errors` : "";
  return `${summary.passed}/${summary.total} passed; ${bankruptcies} bankruptcies; ${formatHundredths(summary.scoredPointsHundredths)}/16.00 points; PnL ${pnl}; minimum capital ${capital}${runtimeErrors}`;
}

function recoveryInstruction(kind) {
  return ["authentication", "browser", "runner"].includes(kind)
    ? "Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved."
    : "Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.";
}

export function renderReportText(state) {
  const lines = [
    `# Market-Maker Experiment: ${state.runId}`,
    "",
    `- Status: ${state.status}`,
    `- Started: ${state.createdAt}`,
    `- Starting baseline: ${state.startingBaseline.strategy} (${formatHundredths(state.startingBaseline.summary.scoredPointsHundredths)}/16.00)`,
    `- Current baseline: ${state.baseline.strategy} (${formatHundredths(state.baseline.summary.scoredPointsHundredths)}/16.00)`,
    `- Stop condition: ${state.stopReason ?? "not reached"}`,
    `- Score trend: ${state.scoreTrend.map(formatHundredths).join(" → ")}`,
    "",
    "The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.",
  ];
  for (const generation of state.generations) {
    lines.push(
      "",
      `## Generation ${generation.number}: ${generation.mode ?? "explore"} ${generation.method}`,
      "",
      generation.rationale,
      "",
    );
    for (const candidate of generation.candidates) {
      lines.push(
        `### ${candidate.id}`,
        "",
        `- Hypothesis: ${candidate.hypothesis ?? "parameter tuning variant"}`,
        `- Implementation plan: ${candidate.implementationPlan ?? JSON.stringify(candidate.parameters ?? {})}`,
        `- Worker summary: ${candidate.implementationSummary ?? "not supplied"}`,
        `- Status: ${candidate.status}`,
        `- Result: ${summaryLine(candidate.evaluation?.summary)}`,
        `- Baseline delta: ${candidate.evaluation?.baselineDelta ? `${formatHundredths(candidate.evaluation.baselineDelta.scoredPointsHundredths)} points; PnL ${candidate.evaluation.baselineDelta.combinedPnlCents === null ? "n/a" : formatHundredths(candidate.evaluation.baselineDelta.combinedPnlCents)}` : "n/a"}`,
        "",
      );
    }
    if (generation.selection) {
      lines.push(
        `Selection: ${generation.selection.promotion ? generation.selection.winner.candidateId : generation.selection.reason}.`,
        `Promotion: ${generation.promotion ? `${generation.promotion.candidateId} (${generation.promotion.commit ?? "commit pending"})` : "none"}.`,
      );
    }
    if (generation.finding) lines.push(`Finding: ${generation.finding}`);
    if (generation.nextGenerationRationale) lines.push(`Next-generation rationale: ${generation.nextGenerationRationale}`);
    if (generation.challengerUpdate) lines.push(`Challenger update: ${generation.challengerUpdate}.`);
    if (generation.previousFailure) {
      lines.push(
        `Previous failure (${generation.previousFailure.kind}): ${generation.previousFailure.message}`,
        `Recovery instruction: ${recoveryInstruction(generation.previousFailure.kind)}`,
      );
    }
    if (generation.failure) lines.push("", `Failure (${generation.failure.kind}): ${generation.failure.message}`);
  }
  if (state.status === "failed") {
    const failureKind = state.generations.at(-1)?.failure?.kind;
    lines.push(
      "",
      "## Recovery",
      "",
      recoveryInstruction(failureKind),
    );
  }
  lines.push("");
  return lines.join("\n");
}

async function renderReport(paths, state) {
  await fs.mkdir(path.dirname(paths.reportPath), { recursive: true });
  await fs.writeFile(paths.reportPath, renderReportText(state));
}

async function hasStagedChanges(repo) {
  return (await gitStatus(repo, "diff", "--cached", "--quiet")).status !== 0;
}

async function dirtyManaged(repo, reportPath) {
  const managed = [
    SOURCE,
    "results/baselines/best.json",
    "results/baselines/best.md",
    "results/experiments",
    "results/strategy-state.json",
    "results/challengers",
    "results/champion",
  ];
  const { stdout } = await git(repo, "status", "--porcelain=v1", "--untracked-files=all", "--", ...managed);
  return stdout.trim();
}

export async function startRun(options) {
  assertId(options.runId, "run ID");
  const repo = await resolveRepo(options.repo);
  const paths = pathsFor(repo, options.runId);
  try {
    await fs.access(paths.statePath);
    throw new LoopInputError(`Run ${options.runId} already exists; use status or resume it`);
  } catch (error) {
    if (error instanceof LoopInputError) throw error;
    if (error.code !== "ENOENT") throw error;
  }
  if (await hasStagedChanges(repo)) throw new LoopInputError("Start rejected because staged changes already exist");
  const dirty = await dirtyManaged(repo, paths.reportPath);
  if (dirty) throw new LoopInputError(`Start rejected because loop-managed files are dirty:\n${dirty}`);

  const baseline = await readJson(paths.baselinePath, "best baseline");
  validateBaseline(baseline);
  const sourceSha256 = await sha256(paths.sourcePath);
  if (baseline.schemaVersion === 2 && baseline.sourceSha256 !== sourceSha256) {
    throw new LoopInputError("Current strategy SHA-256 does not match the best baseline");
  }
  const { stdout: head } = await git(repo, "rev-parse", "HEAD");
  const baselineState = {
    strategy: baseline.strategy,
    resultArtifact: baseline.resultArtifact,
    sourceSha256,
    summary: baseline.summary,
    gitCommit: head.trim(),
    legacyBaseline: baseline.schemaVersion === 1,
  };
  const registry = await loadRegistry(repo, { ...baseline, sourceSha256 });
  if (registry.champion.sourceSha256 && registry.champion.sourceSha256 !== sourceSha256) {
    throw new LoopInputError("Strategy registry champion does not match the current source");
  }
  const state = {
    schemaVersion: 2,
    runId: options.runId,
    status: "active",
    createdAt: now(),
    updatedAt: now(),
    config: {
      exploreCandidateCount: 3,
      maxTuningAttempts: 2,
      maxGenerations: options.maxGenerations ?? 6,
      targetPointsHundredths: options.targetPointsHundredths ?? 1500,
    },
    startingBaseline: structuredClone(baselineState),
    baseline: baselineState,
    generations: [],
    challengerPool: registry.challengers
      .filter(({ status }) => status === "active")
      .map(({ id }) => id),
    scoreTrend: [baseline.summary.scoredPointsHundredths],
    commits: [],
    stopReason: null,
  };
  await saveState(paths, state);
  return { paths, state };
}

function validatePlan(plan, registry) {
  const mode = plan?.mode ?? (plan?.schemaVersion === 1 ? "explore" : null);
  if (![1, 2].includes(plan?.schemaVersion) || !MODES.has(mode) || !METHODS.has(plan.method)) {
    throw new LoopInputError("Plan must use a supported schema, mode, and target method");
  }
  if (typeof plan.rationale !== "string" || !plan.rationale.trim()) {
    throw new LoopInputError("Plan rationale is required");
  }
  if (mode === "tune") {
    if (plan.schemaVersion !== 2) throw new LoopInputError("Tune plans require schemaVersion 2");
    const challenger = activeChallenger(registry, plan.challengerId);
    if (!challenger) throw new LoopInputError("Tune plan must select an active challenger");
    const revision = currentRevision(challenger);
    if (plan.parentSourceSha256 !== revision.sourceSha256) {
      throw new LoopInputError("Tune plan parentSourceSha256 does not match the challenger revision");
    }
    if (plan.method !== challenger.method) throw new LoopInputError("Tune plan method does not match the challenger");
    if (!Number.isSafeInteger(plan.sampleCount) || plan.sampleCount < 3) {
      throw new LoopInputError("Tune plan sampleCount must be at least three");
    }
    if (!Array.isArray(plan.parameters) || plan.parameters.length === 0) {
      throw new LoopInputError("Tune plan requires parameter bindings");
    }
    return mode;
  }
  if (!Array.isArray(plan.candidates) || plan.candidates.length !== 3) {
    throw new LoopInputError("Explore plan must contain exactly three candidates");
  }
  const ids = new Set();
  for (const candidate of plan.candidates) {
    assertId(candidate?.id, "candidate ID");
    if (ids.has(candidate.id)) throw new LoopInputError("Candidate IDs must be unique");
    ids.add(candidate.id);
    for (const field of ["hypothesis", "implementationPlan"]) {
      if (typeof candidate[field] !== "string" || !candidate[field].trim()) {
        throw new LoopInputError(`Candidate ${candidate.id} requires ${field}`);
      }
    }
  }
  return mode;
}

export function getStopReason(state) {
  if (state.baseline.summary.scoredPointsHundredths >= state.config.targetPointsHundredths) return "target score reached";
  if (state.generations.filter(({ status }) => ["promoted", "not-promoted"].includes(status)).length >= state.config.maxGenerations) return "generation limit reached";
  return null;
}

export async function prepareGeneration(options) {
  const { paths, state } = await loadState(options);
  const incomplete = state.generations.at(-1);
  if (state.status !== "active") throw new LoopInputError(`Run is ${state.status}, not active`);
  if (incomplete && ["preparing", "prepared"].includes(incomplete.status)) {
    await ensureWorktrees(paths, state, incomplete);
    if (incomplete.mode === "tune") {
      await fs.copyFile(
        path.join(paths.repo, incomplete.parentRevision.sourcePath),
        path.join(incomplete.designer.worktreePath, SOURCE),
      );
    }
    return { paths, state, generation: incomplete, resumed: true };
  }
  if (incomplete && !["promoted", "not-promoted"].includes(incomplete.status)) {
    return { paths, state, generation: incomplete, resumed: true };
  }
  const reason = getStopReason(state);
  if (reason) throw new LoopInputError(`Cannot prepare another generation: ${reason}`);
  const planPath = path.resolve(options.planPath ?? "");
  const plan = await readJson(planPath, "generation plan");
  const baseline = await readJson(paths.baselinePath, "best baseline");
  const registry = await loadRegistry(paths.repo, baseline);
  const mode = validatePlan(plan, registry);
  const number = state.generations.length + 1;
  const generationRoot = ensureWorktreePath(path.join(WORKTREE_ROOT, state.runId, `g${String(number).padStart(2, "0")}`));
  const planArchivePath = path.join(paths.runDirectory, `g${String(number).padStart(2, "0")}`, "plan.json");
  await writeJson(planArchivePath, plan);
  const generation = {
    number,
    mode,
    method: plan.method,
    rationale: plan.rationale.trim(),
    status: "preparing",
    planPath: path.relative(paths.repo, planArchivePath),
    candidates: (plan.candidates ?? []).map((candidate) => {
      const worktreePath = ensureWorktreePath(path.join(generationRoot, candidate.id));
      return {
        id: candidate.id,
        hypothesis: candidate.hypothesis.trim(),
        implementationPlan: candidate.implementationPlan.trim(),
        implementationSummary: null,
        status: "pending",
        worktreePath,
        resultDirectory: path.join(worktreePath, ".candidate-results", state.runId, candidate.id),
      };
    }),
    selection: null,
    promotion: null,
  };
  if (mode === "tune") {
    const challenger = activeChallenger(registry, plan.challengerId);
    const revision = currentRevision(challenger);
    const designerId = `tune-${String(number).padStart(2, "0")}`;
    const worktreePath = ensureWorktreePath(path.join(generationRoot, designerId));
    generation.challengerId = challenger.id;
    generation.parentRevision = structuredClone(revision);
    generation.sampleCount = plan.sampleCount;
    generation.designer = {
      id: designerId,
      status: "pending",
      worktreePath,
      manifestPath: path.join(worktreePath, ".tuning", state.runId, `g${String(number).padStart(2, "0")}`, "materialized-manifest.json"),
      variantsRoot: path.join(worktreePath, ".tuning", state.runId, `g${String(number).padStart(2, "0")}`, "variants"),
    };
  }
  state.generations.push(generation);
  await saveState(paths, state);
  await ensureWorktrees(paths, state, generation);
  if (mode === "tune") {
    const parentSource = path.join(paths.repo, generation.parentRevision.sourcePath);
    const designerSource = path.join(generation.designer.worktreePath, SOURCE);
    await fs.copyFile(parentSource, designerSource);
    if (await sha256(designerSource) !== generation.parentRevision.sourceSha256) {
      throw new LoopInputError("Tune designer source does not match the challenger revision");
    }
    generation.designer.status = "prepared";
    await saveState(paths, state);
  }
  return { paths, state, generation, resumed: false };
}

export async function registerTuning(options) {
  const { paths, state } = await loadState(options);
  const generation = state.generations.at(-1);
  if (state.status !== "active" || generation?.mode !== "tune" || generation.status !== "prepared") {
    throw new LoopInputError("No prepared tune generation is available");
  }
  const manifestPath = path.resolve(options.manifestPath ?? "");
  if (manifestPath !== path.resolve(generation.designer.manifestPath)) {
    throw new LoopInputError(`Tuning manifest must equal ${generation.designer.manifestPath}`);
  }
  await command(options.materializerPath ?? path.join(paths.repo, "candidate_pipeline", "materialize-tuning.sh"), [
    "--source", path.join(generation.designer.worktreePath, SOURCE),
    "--plan", path.join(paths.repo, generation.planPath),
    "--manifest", manifestPath,
    "--output-root", generation.designer.variantsRoot,
  ]);
  const manifest = await readJson(manifestPath, "materialized tuning manifest");
  if (
    manifest.schemaVersion !== 1
    || manifest.parentSourceSha256 !== generation.parentRevision.sourceSha256
    || !Array.isArray(manifest.variants)
    || manifest.variants.length !== generation.sampleCount
  ) {
    throw new LoopInputError("Tuning manifest identity or sample count is invalid");
  }
  const ids = new Set();
  const granularities = new Set();
  generation.candidates = [];
  for (const variant of manifest.variants) {
    assertId(variant?.id, "tuning variant ID");
    if (ids.has(variant.id)) throw new LoopInputError("Tuning variant IDs must be unique");
    ids.add(variant.id);
    if (!["coarse", "medium", "fine"].includes(variant.granularity)) {
      throw new LoopInputError(`Invalid tuning granularity for ${variant.id}`);
    }
    granularities.add(variant.granularity);
    const sourcePath = await fs.realpath(path.resolve(variant.sourcePath ?? ""));
    const expectedSource = path.join(generation.designer.variantsRoot, variant.id, SOURCE);
    if (sourcePath !== await fs.realpath(expectedSource) || await sha256(sourcePath) !== variant.sourceSha256) {
      throw new LoopInputError(`Tuning source identity failed for ${variant.id}`);
    }
    if (variant.checks?.compile !== true || variant.checks?.scope !== true) {
      throw new LoopInputError(`Tuning local checks are incomplete for ${variant.id}`);
    }
    generation.candidates.push({
      id: variant.id,
      granularity: variant.granularity,
      parameters: structuredClone(variant.parameters),
      hypothesis: `${variant.granularity} parameter tuning for ${generation.challengerId}`,
      implementationPlan: JSON.stringify(variant.parameters),
      implementationSummary: `Materialized ${variant.granularity} tuning vector.`,
      status: "prepared",
      worktreePath: generation.designer.worktreePath,
      sourcePath: expectedSource,
      resultDirectory: path.join(path.dirname(expectedSource), ".candidate-results", state.runId, variant.id),
    });
  }
  if (granularities.size !== 3) throw new LoopInputError("Tune generation requires coarse, medium, and fine variants");
  generation.materialized = true;
  generation.manifestPath = manifestPath;
  await saveState(paths, state);
  return { paths, state, generation };
}

async function canonicalWorktree(worktreePath) {
  try {
    return await fs.realpath(worktreePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const realTemporaryRoot = await fs.realpath("/tmp");
    return path.join(realTemporaryRoot, path.relative("/tmp", path.resolve(worktreePath)));
  }
}

async function registeredWorktrees(repo) {
  const { stdout } = await git(repo, "worktree", "list", "--porcelain");
  const worktrees = stdout.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => line.slice(9));
  return new Set(await Promise.all(worktrees.map(canonicalWorktree)));
}

async function ensureWorktrees(paths, state, generation) {
  try {
    validateCandidatePaths(state, generation);
    const registered = await registeredWorktrees(paths.repo);
    const worktreeOwners = generation.mode === "tune" ? [generation.designer] : generation.candidates;
    for (const candidate of worktreeOwners) {
      const worktreePath = ensureWorktreePath(candidate.worktreePath);
      let exists = true;
      try {
        await fs.access(worktreePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        exists = false;
      }
      const canonicalPath = await canonicalWorktree(worktreePath);
      if (exists && !registered.has(canonicalPath)) {
        throw new LoopInputError(`Refusing setup: ${worktreePath} exists but is not a registered worktree`);
      }
      if (!exists && registered.has(canonicalPath)) {
        throw new LoopInputError(`Refusing setup: ${worktreePath} is registered but missing`);
      }
      if (!exists) {
        await fs.mkdir(path.dirname(worktreePath), { recursive: true });
        await git(paths.repo, "worktree", "add", "--detach", worktreePath, state.baseline.gitCommit);
        registered.add(await canonicalWorktree(worktreePath));
      }
      if (candidate.status !== "evaluated") candidate.status = "prepared";
      await saveState(paths, state);
    }
    generation.status = "prepared";
    await saveState(paths, state);
  } catch (error) {
    generation.status = "failed";
    generation.failure = { kind: "setup", message: error.message };
    state.status = "failed";
    state.stopReason = "worktree setup failure";
    await saveState(paths, state);
    throw error;
  }
}

function recomputeEligibility(evaluation, baseline) {
  const summary = evaluation?.summary;
  const complete = evaluation?.valid === true
    && summary?.passed === 20
    && summary?.total === 20
    && summary?.bankruptcies === 0
    && Number.isSafeInteger(summary?.scoredPointsHundredths)
    && Number.isSafeInteger(summary?.minimumCapital?.endingCashCents)
    && Number.isSafeInteger(summary?.minimumCapital?.startingCapitalCents)
    && summary.minimumCapital.startingCapitalCents > 0;
  if (!complete) return false;
  const pointDelta = summary.scoredPointsHundredths - baseline.summary.scoredPointsHundredths;
  return pointDelta > 0 || (pointDelta === 0 && compareCapital(summary.minimumCapital, baseline.summary.minimumCapital) > 0);
}

async function copyCandidate(paths, state, generation, candidate, invalidIds) {
  const archiveDirectory = path.join(paths.runDirectory, "archive", `g${String(generation.number).padStart(2, "0")}`, candidate.id);
  await fs.mkdir(path.join(archiveDirectory, "raw"), { recursive: true });
  const sourcePath = candidate.sourcePath ?? path.join(candidate.worktreePath, SOURCE);
  const archivedSource = path.join(archiveDirectory, SOURCE);
  await fs.copyFile(sourcePath, archivedSource);
  const sourceSha256 = await sha256(sourcePath);
  if (await sha256(archivedSource) !== sourceSha256) throw new LoopInputError(`Archive SHA-256 failed for ${candidate.id}`);
  const patch = generation.mode === "tune"
    ? `${JSON.stringify(candidate.parameters, null, 2)}\n`
    : (await git(candidate.worktreePath, "diff", "--binary", "HEAD", "--", SOURCE)).stdout;
  await fs.writeFile(path.join(archiveDirectory, "candidate.patch"), patch);
  candidate.sourceSha256 = sourceSha256;
  candidate.archiveDirectory = archiveDirectory;
  candidate.archivedSourcePath = archivedSource;

  if (invalidIds.has(candidate.id)) {
    candidate.status = "invalid";
    return null;
  }
  const evaluationPath = path.join(candidate.resultDirectory, "evaluation.json");
  const evaluation = await readJson(evaluationPath, `evaluation for ${candidate.id}`);
  if (evaluation.candidateId !== candidate.id || evaluation.sourceSha256 !== sourceSha256) {
    throw new LoopInputError(`Evaluation identity or source SHA-256 changed for ${candidate.id}`);
  }
  evaluation.eligible = recomputeEligibility(evaluation, state.baseline);
  const entries = await fs.readdir(candidate.resultDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && /\.(?:json|md)$/.test(entry.name)) {
      await fs.copyFile(path.join(candidate.resultDirectory, entry.name), path.join(archiveDirectory, "raw", entry.name));
    }
  }
  const archivedEvaluation = path.join(archiveDirectory, "evaluation.json");
  await writeJson(archivedEvaluation, evaluation);
  candidate.evaluation = evaluation;
  candidate.evaluationPath = archivedEvaluation;
  candidate.status = "archived";
  return archivedEvaluation;
}

async function scanEvaluations(generation) {
  for (const candidate of generation.candidates) {
    const evaluationPath = path.join(candidate.resultDirectory, "evaluation.json");
    try {
      const evaluation = await readJson(evaluationPath, `evaluation for ${candidate.id}`);
      const sourcePath = candidate.sourcePath ?? path.join(candidate.worktreePath, SOURCE);
      const sourceSha256 = await sha256(sourcePath);
      if (evaluation.candidateId !== candidate.id || evaluation.sourceSha256 !== sourceSha256) continue;
      candidate.status = "evaluated";
      candidate.sourceSha256 = sourceSha256;
      candidate.evaluationPath = evaluationPath;
      candidate.evaluation = evaluation;
    } catch {
      // Incomplete or malformed evidence remains pending and will be rerun after resume.
    }
  }
}

function isRefreshableInvalid(evaluation) {
  return evaluation?.schemaVersion === 1
    && evaluation.valid === false
    && evaluation.eligible === false;
}

async function refreshLegacyEvaluations(paths, generation) {
  for (const candidate of generation.candidates) {
    const evaluationPath = path.join(candidate.resultDirectory, "evaluation.json");
    if (candidate.status !== "evaluated") {
      if (generation.failure?.kind !== "integrity") continue;
      try {
        await fs.access(evaluationPath);
      } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
    }
    const previous = await readJson(evaluationPath, `evaluation for ${candidate.id}`);
    if (!isRefreshableInvalid(previous)) continue;

    const refreshed = await evaluateRun({
      runDirectory: candidate.resultDirectory,
      baselinePath: paths.baselinePath,
    });
    if (!refreshed.valid) {
      if (generation.failure?.kind === "integrity") {
        throw new LoopInputError(`Evidence for ${candidate.id} remains invalid: ${refreshed.reasons.join("; ")}`);
      }
      continue;
    }
    if (refreshed.eligible) {
      throw new LoopInputError(`Legacy performance evaluation for ${candidate.id} could not be safely reclassified`);
    }
    const sourcePath = candidate.sourcePath ?? path.join(candidate.worktreePath, SOURCE);
    const sourceSha256 = await sha256(sourcePath);
    if (refreshed.candidateId !== candidate.id || refreshed.sourceSha256 !== sourceSha256) {
      throw new LoopInputError(`Refreshed evaluation identity or source SHA-256 changed for ${candidate.id}`);
    }
    const backupPath = path.join(candidate.resultDirectory, "evaluation.legacy-invalid.json");
    try {
      await fs.access(backupPath);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await writeJson(backupPath, previous);
    }
    await writeJson(evaluationPath, refreshed);
    candidate.status = "evaluated";
    candidate.sourceSha256 = sourceSha256;
    candidate.evaluation = refreshed;
    candidate.evaluationPath = evaluationPath;
  }
}

async function cleanupWorktrees(paths, state, generation) {
  const registered = await registeredWorktrees(paths.repo);
  const worktreeOwners = generation.mode === "tune" ? [generation.designer] : generation.candidates;
  for (const candidate of worktreeOwners) {
    const worktreePath = ensureWorktreePath(candidate.worktreePath);
    const expected = path.join(
      WORKTREE_ROOT,
      state.runId,
      `g${String(generation.number).padStart(2, "0")}`,
      candidate.id,
    );
    if (worktreePath !== expected) throw new LoopInputError(`Refusing cleanup: unexpected worktree path for ${candidate.id}`);
    if (!registered.has(await fs.realpath(worktreePath))) throw new LoopInputError(`Refusing cleanup: ${worktreePath} is not a registered worktree`);
  }
  for (const candidate of worktreeOwners) await git(paths.repo, "worktree", "remove", "--force", candidate.worktreePath);
}

function validateCandidatePaths(state, generation) {
  if (generation.mode === "tune") {
    const expectedWorktree = path.join(
      WORKTREE_ROOT,
      state.runId,
      `g${String(generation.number).padStart(2, "0")}`,
      generation.designer.id,
    );
    if (ensureWorktreePath(generation.designer.worktreePath) !== expectedWorktree) {
      throw new LoopInputError("Unexpected tune designer worktree path");
    }
    for (const candidate of generation.candidates) {
      const expectedSource = path.join(generation.designer.variantsRoot, candidate.id, SOURCE);
      if (path.resolve(candidate.sourcePath ?? "") !== expectedSource) {
        throw new LoopInputError(`Unexpected tuning source path for ${candidate.id}`);
      }
      const expectedResults = path.join(path.dirname(expectedSource), ".candidate-results", state.runId, candidate.id);
      if (path.resolve(candidate.resultDirectory ?? "") !== expectedResults) {
        throw new LoopInputError(`Unexpected tuning result path for ${candidate.id}`);
      }
    }
    return;
  }
  for (const candidate of generation.candidates) {
    const expected = path.join(
      WORKTREE_ROOT,
      state.runId,
      `g${String(generation.number).padStart(2, "0")}`,
      candidate.id,
    );
    if (ensureWorktreePath(candidate.worktreePath) !== expected) {
      throw new LoopInputError(`Unexpected worktree path for ${candidate.id}`);
    }
    const expectedResults = path.join(expected, ".candidate-results", state.runId, candidate.id);
    if (typeof candidate.resultDirectory !== "string" || path.resolve(candidate.resultDirectory) !== expectedResults) {
      throw new LoopInputError(`Unexpected result path for ${candidate.id}`);
    }
  }
}

export async function archiveGeneration(options) {
  const { paths, state } = await loadState(options);
  const generation = state.generations.at(-1);
  if (!generation || !["prepared", "preparing"].includes(generation.status)) {
    throw new LoopInputError("No prepared generation is available to archive");
  }
  if (options.failureKind && !options.failure) throw new LoopInputError("failureKind requires a failure message");
  if (options.failure && options.failureKind && !FAILURE_KINDS.has(options.failureKind)) {
    throw new LoopInputError(`failureKind must be one of: ${[...FAILURE_KINDS].join(", ")}`);
  }
  if (options.failure) {
    await scanEvaluations(generation);
    generation.status = "failed";
    generation.failure = { kind: options.failureKind ?? "runner", message: options.failure };
    state.status = "failed";
    state.stopReason = `${generation.failure.kind} failure`;
    await saveState(paths, state);
    return { paths, state, generation };
  }
  const invalidIds = new Set(options.invalidIds ?? []);
  for (const candidateId of invalidIds) {
    if (!generation.candidates.some(({ id }) => id === candidateId)) throw new LoopInputError(`Unknown invalid candidate: ${candidateId}`);
  }
  try {
    validateCandidatePaths(state, generation);
    if (!options.summariesPath) throw new LoopInputError("Successful archive requires --summaries");
    const summaries = await readJson(path.resolve(options.summariesPath), "worker summaries");
    const tuneSummary = generation.mode === "tune" ? summaries[generation.designer.id] : null;
    if (generation.mode === "tune" && (typeof tuneSummary !== "string" || !tuneSummary.trim())) {
      throw new LoopInputError(`Worker summary for ${generation.designer.id} must be a non-empty string`);
    }
    for (const candidate of generation.candidates) {
      const summary = generation.mode === "tune" ? tuneSummary : summaries[candidate.id];
      if (typeof summary !== "string" || !summary.trim()) {
        throw new LoopInputError(`Worker summary for ${candidate.id} must be a non-empty string`);
      }
      candidate.implementationSummary = summary.trim();
    }
    if (!options.analysisPath) throw new LoopInputError("Successful archive requires --analysis");
    const analysis = await readJson(path.resolve(options.analysisPath), "post-evaluation analysis");
    if (typeof analysis?.finding !== "string" || !analysis.finding.trim()) {
      throw new LoopInputError("Post-evaluation analysis requires a non-empty finding");
    }
    if (analysis.nextGenerationRationale !== undefined
      && (typeof analysis.nextGenerationRationale !== "string" || !analysis.nextGenerationRationale.trim())) {
      throw new LoopInputError("Post-evaluation nextGenerationRationale must be a non-empty string");
    }
    generation.finding = analysis.finding.trim();
    generation.nextGenerationRationale = analysis.nextGenerationRationale?.trim() ?? null;
    const evaluationPaths = [];
    for (const candidate of generation.candidates) {
      const evaluationPath = await copyCandidate(paths, state, generation, candidate, invalidIds);
      if (evaluationPath) evaluationPaths.push(evaluationPath);
    }
    const selection = evaluationPaths.length
      ? await selectFromFiles(evaluationPaths)
      : { schemaVersion: 1, promotion: false, winner: null, reason: "No valid candidate was evaluated" };
    const baseline = await readJson(paths.baselinePath, "best baseline");
    const registry = await loadRegistry(paths.repo, baseline);
    for (const candidate of generation.candidates) cacheEvaluation(registry, candidate.evaluation);
    if (selection.promotion) {
      const winner = generation.candidates.find(({ id }) => id === selection.winner.candidateId);
      selection.winner.sourcePath = winner.archivedSourcePath;
      selection.winner.evaluationPath = winner.evaluationPath;
    }
    if (generation.mode === "explore" && analysis.challenger !== undefined) {
      const decision = analysis.challenger;
      if (typeof decision?.candidateId !== "string" || typeof decision?.rationale !== "string" || !decision.rationale.trim()) {
        throw new LoopInputError("Explore challenger decision requires candidateId and rationale");
      }
      if (selection.winner?.candidateId === decision.candidateId) {
        throw new LoopInputError("The promoted winner cannot also enter the challenger pool");
      }
      const candidate = generation.candidates.find(({ id }) => id === decision.candidateId);
      if (!candidate?.evaluation?.valid) throw new LoopInputError("Only a valid evaluated candidate can enter the pool");
      const challengerId = `${state.runId}-g${String(generation.number).padStart(2, "0")}-${candidate.id}`;
      await storeRevision({
        repo: paths.repo,
        registry,
        challengerId,
        sourcePath: candidate.archivedSourcePath,
        evaluation: candidate.evaluation,
        method: generation.method,
        origin: "explore",
        rationale: decision.rationale.trim(),
      });
      generation.challengerUpdate = `admitted ${challengerId}`;
    }
    if (generation.mode === "tune") {
      const challenger = activeChallenger(registry, generation.challengerId);
      if (!challenger) throw new LoopInputError("Tune challenger is no longer active");
      const parent = currentRevision(challenger);
      challenger.tuningAttempts += 1;
      const validCandidates = generation.candidates.filter(({ evaluation }) => evaluation?.valid);
      const best = [...validCandidates].sort((first, second) => compareStrategy(first.evaluation, second.evaluation))[0] ?? null;
      const improved = best && compareStrategy(best.evaluation, parent.evaluation) < 0;
      const manifestArchive = path.join(
        paths.challengersPath,
        challenger.id,
        "tuning",
        `${state.runId}-g${String(generation.number).padStart(2, "0")}.json`,
      );
      await fs.mkdir(path.dirname(manifestArchive), { recursive: true });
      await fs.copyFile(generation.manifestPath, manifestArchive);
      challenger.tuningHistory.push({
        runId: state.runId,
        generation: generation.number,
        manifestPath: path.relative(paths.repo, manifestArchive),
        bestCandidateId: best?.id ?? null,
        improved: Boolean(improved),
      });
      if (!selection.promotion && improved) {
        await storeRevision({
          repo: paths.repo,
          registry,
          challengerId: challenger.id,
          sourcePath: best.archivedSourcePath,
          evaluation: best.evaluation,
          method: challenger.method,
          origin: challenger.origin,
          rationale: challenger.rationale,
        });
        generation.challengerUpdate = `updated ${challenger.id} to ${best.id}`;
      }
      if (!selection.promotion && challenger.tuningAttempts >= state.config.maxTuningAttempts) {
        challenger.status = "retired";
        generation.challengerUpdate = `${challenger.id} retired after ${challenger.tuningAttempts} tuning attempts`;
      }
      generation.bestTuningCandidateId = best?.id ?? null;
    }
    await saveRegistry(paths.repo, registry);
    state.challengerPool = registry.challengers.filter(({ status }) => status === "active").map(({ id }) => id);
    generation.selection = selection;
    generation.status = selection.promotion ? "archived" : "not-promoted";
    await writeJson(path.join(paths.runDirectory, `g${String(generation.number).padStart(2, "0")}`, "selection.json"), selection);
    await saveState(paths, state);
    await cleanupWorktrees(paths, state, generation);
    if (!selection.promotion) {
      const managed = [paths.registryPath, paths.reportPath];
      try {
        await fs.access(paths.challengersPath);
        managed.push(paths.challengersPath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const commit = await stageAndCommit(paths.repo, managed, `strategy: update challenger pool g${String(generation.number).padStart(2, "0")}`);
      if (commit) {
        state.baseline.gitCommit = commit;
        state.commits.push(commit);
        await saveState(paths, state);
      }
      return { paths, state, generation, commit };
    }
    return { paths, state, generation };
  } catch (error) {
    generation.status = "failed";
    generation.failure = { kind: "integrity", message: error.message };
    state.status = "failed";
    state.stopReason = "candidate evidence integrity failure";
    await saveState(paths, state);
    throw error;
  }
}

export async function resumeRun(options) {
  const { paths, state } = await loadState(options);
  const generation = state.generations.at(-1);
  if (state.status !== "failed" || generation?.status !== "failed") {
    throw new LoopInputError("Only a failed generation can be resumed");
  }
  await refreshLegacyEvaluations(paths, generation);
  state.status = "active";
  state.stopReason = null;
  generation.status = "prepared";
  generation.previousFailure = structuredClone(generation.failure);
  if (generation.previousFailure.kind === "integrity") {
    generation.previousFailure.message = generation.previousFailure.message.replace(/ after retry$/, "");
  }
  delete generation.failure;
  await saveState(paths, state);
  if (generation.previousFailure.kind === "setup") {
    await ensureWorktrees(paths, state, generation);
    if (generation.mode === "tune") {
      await fs.copyFile(
        path.join(paths.repo, generation.parentRevision.sourcePath),
        path.join(generation.designer.worktreePath, SOURCE),
      );
    }
  }
  return { paths, state, generation, resumed: true };
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
    `- SCORED points: ${formatHundredths(baseline.summary.scoredPointsHundredths)}/16.00`,
    `- Available cases passed: ${baseline.summary.passed}/${baseline.summary.total}`,
    `- Bankruptcies: ${baseline.summary.bankruptcies}`,
    "- Observed runs: 1",
    "",
  ].join("\n");
}

function championRecord(baseline) {
  return {
    schemaVersion: 1,
    id: baseline.strategy,
    sourcePath: SOURCE,
    sourceSha256: baseline.sourceSha256,
    resultArtifact: baseline.resultArtifact,
    experimentId: baseline.experimentId,
    experiment: structuredClone(baseline.experiment),
    summary: structuredClone(baseline.summary),
  };
}

async function stageAndCommit(repo, files, message) {
  if (await hasStagedChanges(repo)) throw new LoopInputError("Commit rejected because unrelated staged changes exist");
  const relativeFiles = files.map((filePath) => path.relative(repo, filePath));
  await git(repo, "add", "--", ...relativeFiles);
  const staged = await gitStatus(repo, "diff", "--cached", "--quiet");
  if (staged.status === 0) return null;
  try {
    await git(repo, "commit", "-m", message);
  } catch (error) {
    try {
      await git(repo, "restore", "--staged", "--", ...relativeFiles);
    } catch (restoreError) {
      throw new LoopInputError(`${error.message}; also failed to unstage loop files: ${restoreError.message}`);
    }
    throw error;
  }
  return (await git(repo, "rev-parse", "HEAD")).stdout.trim();
}

async function promotionPreflight(paths, state) {
  if (await hasStagedChanges(paths.repo)) throw new LoopInputError("Promotion rejected because staged changes already exist");
  if (await sha256(paths.sourcePath) !== state.baseline.sourceSha256) {
    throw new LoopInputError("Promotion rejected because the current strategy no longer matches the state baseline");
  }
  const { stdout: head } = await git(paths.repo, "rev-parse", "HEAD");
  if (head.trim() !== state.baseline.gitCommit) {
    throw new LoopInputError("Promotion rejected because HEAD no longer matches the state baseline commit");
  }
  const { stdout: dirty } = await git(
    paths.repo,
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--",
    SOURCE,
    "results/baselines",
    "results/champion",
  );
  if (dirty.trim()) throw new LoopInputError(`Promotion rejected because managed files are dirty:\n${dirty.trim()}`);
}

function promotedBaseline(state, generation, winner) {
  return {
    schemaVersion: 2,
    strategy: winner.id,
    resultArtifact: "results/champion/result.md",
    sourceSha256: winner.sourceSha256,
    experimentId: `${state.runId}:g${String(generation.number).padStart(2, "0")}:${winner.id}`,
    experiment: { runId: state.runId, generation: generation.number, candidateId: winner.id },
    summary: winner.evaluation.summary,
  };
}

function finalizePromotion(state, generation, winner, baseline, commit) {
  generation.promotion = { candidateId: winner.id, sourceSha256: winner.sourceSha256, commit };
  delete generation.promotionTransaction;
  generation.status = "promoted";
  state.baseline = {
    strategy: baseline.strategy,
    resultArtifact: baseline.resultArtifact,
    sourceSha256: baseline.sourceSha256,
    summary: baseline.summary,
    gitCommit: commit,
    legacyBaseline: false,
  };
  state.scoreTrend.push(baseline.summary.scoredPointsHundredths);
  if (commit && !state.commits.includes(commit)) state.commits.push(commit);
}

async function gitFile(repo, revision, filePath) {
  return (await git(repo, "show", `${revision}:${filePath}`)).stdout;
}

async function expectedArtifact(winner) {
  const rawDirectory = path.join(winner.archiveDirectory, "raw");
  const rawMarkdown = (await fs.readdir(rawDirectory)).find((name) => /^hackerrank-run-.*\.md$/.test(name));
  if (!rawMarkdown) return `# ${winner.id}\n\n${summaryLine(winner.evaluation.summary)}\n`;
  const contents = await fs.readFile(path.join(rawDirectory, rawMarkdown), "utf8");
  return contents.replace(/^- Source: .*$/m, `- Source: \`${SOURCE}\``);
}

async function reconcilePromotion(paths, state, generation, winner, baseline, head) {
  try {
    const source = await gitFile(paths.repo, head, SOURCE);
    const committedBaseline = JSON.parse(await gitFile(paths.repo, head, "results/baselines/best.json"));
    const artifact = await gitFile(paths.repo, head, baseline.resultArtifact);
    const bestMarkdown = await gitFile(paths.repo, head, "results/baselines/best.md");
    const committedChampion = JSON.parse(await gitFile(paths.repo, head, "results/champion/champion.json"));
    const report = await gitFile(paths.repo, head, path.relative(paths.repo, paths.reportPath));
    const sourceHash = createHash("sha256").update(source).digest("hex");
    if (
      sourceHash !== winner.sourceSha256
      || JSON.stringify(committedBaseline) !== JSON.stringify(baseline)
      || artifact !== await expectedArtifact(winner)
      || bestMarkdown !== baselineMarkdown(baseline)
      || JSON.stringify(committedChampion) !== JSON.stringify(championRecord(baseline))
      || report !== renderReportText(state)
    ) {
      throw new Error("committed promotion files do not match the pending transaction");
    }
    const { stdout: dirty } = await git(
      paths.repo,
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
      "--",
      SOURCE,
      "results/baselines",
      "results/champion",
      path.relative(paths.repo, paths.reportPath),
    );
    if (dirty.trim()) throw new Error("committed promotion files are dirty");
  } catch (error) {
    throw new LoopInputError(`Promotion transaction cannot reconcile HEAD drift: ${error.message}`);
  }
  finalizePromotion(state, generation, winner, baseline, head);
  const registry = await loadRegistry(paths.repo, baseline);
  state.challengerPool = registry.challengers.filter(({ status }) => status === "active").map(({ id }) => id);
  await saveState(paths, state);
  return { paths, state, generation, commit: head };
}

export async function promoteGeneration(options) {
  const { paths, state } = await loadState(options);
  const generation = state.generations.at(-1);
  if (state.status !== "active" || generation?.status !== "archived" || !generation.selection?.promotion) {
    throw new LoopInputError("The current generation has no archived winner to promote");
  }
  const winner = generation.candidates.find(({ id }) => id === generation.selection.winner.candidateId);
  if (!winner || await sha256(winner.archivedSourcePath) !== winner.sourceSha256) {
    throw new LoopInputError("Winner archive SHA-256 verification failed");
  }
  const baseline = promotedBaseline(state, generation, winner);
  const artifactPath = path.join(paths.repo, baseline.resultArtifact);
  if (!generation.promotionTransaction) {
    await promotionPreflight(paths, state);
    generation.promotionTransaction = {
      candidateId: winner.id,
      sourceSha256: winner.sourceSha256,
      artifactPath,
      baselineCommit: state.baseline.gitCommit,
      startedAt: now(),
    };
    await saveState(paths, state);
  } else if (
    generation.promotionTransaction.candidateId !== winner.id
    || generation.promotionTransaction.sourceSha256 !== winner.sourceSha256
    || generation.promotionTransaction.artifactPath !== artifactPath
    || generation.promotionTransaction.baselineCommit !== state.baseline.gitCommit
  ) {
    throw new LoopInputError("Promotion transaction does not match the selected winner");
  }
  const { stdout: currentHeadOutput } = await git(paths.repo, "rev-parse", "HEAD");
  const currentHead = currentHeadOutput.trim();
  if (currentHead !== state.baseline.gitCommit) {
    return reconcilePromotion(paths, state, generation, winner, baseline, currentHead);
  }
  const currentSourceHash = await sha256(paths.sourcePath);
  if (![state.baseline.sourceSha256, winner.sourceSha256].includes(currentSourceHash)) {
    throw new LoopInputError("Promotion retry rejected because the strategy is neither the baseline nor the pending winner");
  }
  await fs.mkdir(paths.championDirectory, { recursive: true });
  await fs.writeFile(artifactPath, await expectedArtifact(winner));
  const currentBaseline = await readJson(paths.baselinePath, "best baseline");
  const registry = await loadRegistry(paths.repo, currentBaseline);
  const demotedId = `${state.runId}-g${String(generation.number).padStart(2, "0")}-champion-${state.baseline.strategy}`;
  if (!registry.challengers.some(({ id }) => id === demotedId)) {
    if (currentSourceHash !== state.baseline.sourceSha256) {
      throw new LoopInputError("Cannot archive the displaced champion after source replacement");
    }
    await storeRevision({
      repo: paths.repo,
      registry,
      challengerId: demotedId,
      sourcePath: paths.sourcePath,
      evaluation: {
        schemaVersion: 1,
        candidateId: state.baseline.strategy,
        valid: true,
        eligible: false,
        sourcePath: paths.sourcePath,
        sourceSha256: state.baseline.sourceSha256,
        modifiedLines: 0,
        summary: structuredClone(state.baseline.summary),
        baselineDelta: { scoredPointsHundredths: 0, combinedPnlCents: 0 },
        reasons: ["Demoted champion"],
      },
      method: generation.method,
      origin: "demoted-champion",
      rationale: `Champion displaced by ${winner.id}`,
    });
  }
  if (generation.mode === "tune") {
    const promoted = registry.challengers.find(({ id }) => id === generation.challengerId);
    if (promoted) promoted.status = "promoted";
  }
  syncChampion(registry, baseline);
  await saveRegistry(paths.repo, registry);
  await fs.copyFile(winner.archivedSourcePath, paths.sourcePath);
  if (await sha256(paths.sourcePath) !== winner.sourceSha256) throw new LoopInputError("Promoted source SHA-256 verification failed");
  await writeJson(paths.baselinePath, baseline);
  await writeJson(paths.championRecordPath, championRecord(baseline));
  await fs.writeFile(path.join(paths.repo, "results", "baselines", "best.md"), baselineMarkdown(baseline));
  const commit = await stageAndCommit(paths.repo, [
    paths.sourcePath,
    artifactPath,
    paths.baselinePath,
    path.join(paths.repo, "results", "baselines", "best.md"),
    paths.championRecordPath,
    paths.registryPath,
    paths.challengersPath,
    paths.reportPath,
  ], `strategy: promote ${winner.id}`);
  finalizePromotion(state, generation, winner, baseline, commit);
  state.challengerPool = registry.challengers.filter(({ status }) => status === "active").map(({ id }) => id);
  await saveState(paths, state);
  return { paths, state, generation, commit };
}

export async function finishRun(options) {
  const { paths, state } = await loadState(options);
  if (state.status === "complete" && !state.finishTransaction) return { paths, state, commit: null };
  if (!state.finishTransaction) {
    const reason = state.status === "failed" ? state.stopReason : getStopReason(state);
    if (!reason) throw new LoopInputError("No stop condition has been reached");
    const { stdout: head } = await git(paths.repo, "rev-parse", "HEAD");
    state.finishTransaction = {
      reason,
      finalStatus: state.status === "failed" ? "failed" : "complete",
      baselineCommit: head.trim(),
      reportSha256: null,
      startedAt: now(),
    };
    state.status = state.finishTransaction.finalStatus;
    state.stopReason = reason;
    state.finishTransaction.reportSha256 = createHash("sha256").update(renderReportText(state)).digest("hex");
    await saveState(paths, state);
  }
  let workingReportSha256;
  try {
    workingReportSha256 = await sha256(paths.reportPath);
  } catch (error) {
    throw new LoopInputError(`Cannot verify pending finish report: ${error.message}`);
  }
  if (workingReportSha256 !== state.finishTransaction.reportSha256) {
    throw new LoopInputError("Finish transaction report changed after it was prepared");
  }
  const { stdout: currentHeadOutput } = await git(paths.repo, "rev-parse", "HEAD");
  const currentHead = currentHeadOutput.trim();
  if (currentHead !== state.finishTransaction.baselineCommit) {
    try {
      const { stdout: parentOutput } = await git(paths.repo, "rev-parse", `${currentHead}^`);
      const reportRelative = path.relative(paths.repo, paths.reportPath);
      const { stdout: changedOutput } = await git(paths.repo, "diff-tree", "--no-commit-id", "--name-only", "-r", currentHead);
      const changed = changedOutput.trim().split("\n").filter(Boolean);
      const committedReport = await gitFile(paths.repo, currentHead, reportRelative);
      const committedSha256 = createHash("sha256").update(committedReport).digest("hex");
      const { stdout: dirty } = await git(paths.repo, "status", "--porcelain=v1", "--", reportRelative);
      if (
        parentOutput.trim() !== state.finishTransaction.baselineCommit
        || changed.length !== 1
        || changed[0] !== reportRelative
        || committedSha256 !== state.finishTransaction.reportSha256
        || dirty.trim()
      ) {
        throw new Error("HEAD does not contain only the expected finished report");
      }
    } catch (error) {
      throw new LoopInputError(`Finish transaction cannot reconcile HEAD drift: ${error.message}`);
    }
    if (!state.commits.includes(currentHead)) state.commits.push(currentHead);
    delete state.finishTransaction;
    await saveState(paths, state);
    return { paths, state, commit: currentHead };
  }
  const commit = await stageAndCommit(paths.repo, [paths.reportPath], `experiment: finish ${state.runId}`);
  if (commit) state.commits.push(commit);
  delete state.finishTransaction;
  await saveState(paths, state);
  return { paths, state, commit };
}

export async function statusRun(options) {
  const loaded = await loadState(options);
  return { ...loaded, recommendedStop: getStopReason(loaded.state) };
}

function parseCli(argumentsList) {
  const [action, ...rest] = argumentsList;
  if (!action) throw new LoopInputError("Usage: loop.sh <start|prepare|register-tuning|archive|promote|finish|status|resume> --run-id ID");
  const options = { invalidIds: [] };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    if (!flag?.startsWith("--") || value === undefined || value.startsWith("--")) throw new LoopInputError(`${flag ?? "Option"} requires a value`);
    if (flag === "--run-id") options.runId = value;
    else if (flag === "--repo") options.repo = value;
    else if (flag === "--plan") options.planPath = value;
    else if (flag === "--manifest") options.manifestPath = value;
    else if (flag === "--summaries") options.summariesPath = value;
    else if (flag === "--analysis") options.analysisPath = value;
    else if (flag === "--invalid") options.invalidIds.push(value);
    else if (flag === "--failure") options.failure = value;
    else if (flag === "--failure-kind") options.failureKind = value;
    else if (flag === "--max-generations") options.maxGenerations = Number(value);
    else if (flag === "--target") options.targetPointsHundredths = Number(value);
    else throw new LoopInputError(`Unknown option: ${flag}`);
  }
  for (const name of ["maxGenerations", "targetPointsHundredths"]) {
    if (options[name] !== undefined && (!Number.isSafeInteger(options[name]) || options[name] <= 0)) throw new LoopInputError(`${name} must be a positive integer`);
  }
  if (options.failureKind && !options.failure) throw new LoopInputError("--failure-kind requires --failure");
  if (options.failureKind && !FAILURE_KINDS.has(options.failureKind)) throw new LoopInputError(`--failure-kind must be one of: ${[...FAILURE_KINDS].join(", ")}`);
  return { action, options };
}

async function main() {
  const { action, options } = parseCli(process.argv.slice(2));
  const actions = {
    start: startRun,
    prepare: prepareGeneration,
    "register-tuning": registerTuning,
    archive: archiveGeneration,
    promote: promoteGeneration,
    finish: finishRun,
    status: statusRun,
    resume: resumeRun,
  };
  if (!actions[action]) throw new LoopInputError(`Unknown action: ${action}`);
  const result = await actions[action](options);
  console.log(JSON.stringify({
    runId: result.state.runId,
    status: result.state.status,
    generation: result.generation?.number ?? result.state.generations.at(-1)?.number ?? null,
    recommendedStop: result.recommendedStop ?? getStopReason(result.state),
    statePath: result.paths.statePath,
    reportPath: result.paths.reportPath,
    commit: result.commit ?? null,
  }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Loop failed: ${error.message}`);
    process.exitCode = error instanceof LoopInputError ? 3 : 1;
  });
}
