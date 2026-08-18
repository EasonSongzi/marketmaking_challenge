import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { archiveGeneration, resumeRun } from "./loop.mjs";
import { cachedEvaluation, fileSha256, loadRegistry } from "./strategy-state.mjs";

const SOURCE = "Market_making_binary_option.py";
const WORKTREE_ROOT = "/tmp/akuna-market-maker";
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
const SKIPPED_STATUSES = new Set(["evaluated", "invalid"]);

export class GenerationInputError extends Error {}

function timestamp() {
  return new Date().toISOString();
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    throw new GenerationInputError(`Cannot read ${label} ${filePath}: ${error.message}`);
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(temporaryPath, filePath);
}

function requireAbsolute(filePath, flag) {
  if (!path.isAbsolute(filePath ?? "")) throw new GenerationInputError(`${flag} must be an absolute path`);
}

function candidateSource(candidate) {
  return candidate.sourcePath ?? path.join(candidate.worktreePath, SOURCE);
}

function currentGeneration(state) {
  if (![1, 2].includes(state?.schemaVersion) || typeof state.runId !== "string" || !state.runId) {
    throw new GenerationInputError("Loop state must use a supported schema and include runId");
  }
  const generation = state.generations?.at(-1);
  if (!generation || !["prepared", "preparing"].includes(generation.status)) {
    throw new GenerationInputError("Loop state does not contain a prepared generation");
  }
  if (!Number.isSafeInteger(generation.number) || generation.number !== state.generations.length) {
    throw new GenerationInputError("Prepared generation number does not match loop state history");
  }
  const mode = generation.mode ?? "explore";
  if (mode === "explore" && generation.candidates?.length !== 3) {
    throw new GenerationInputError("Explore generation must contain exactly three candidates");
  }
  if (mode === "tune" && (!generation.materialized || generation.candidates?.length !== generation.sampleCount)) {
    throw new GenerationInputError("Tune generation must be materialized before evaluation");
  }
  const ids = new Set();
  for (const candidate of generation.candidates) {
    if (!ID_PATTERN.test(candidate?.id ?? "") || ids.has(candidate.id)) {
      throw new GenerationInputError("Candidate IDs must be unique lowercase slugs");
    }
    ids.add(candidate.id);
    requireAbsolute(candidate.worktreePath, `worktreePath for ${candidate.id}`);
    requireAbsolute(candidate.resultDirectory, `resultDirectory for ${candidate.id}`);
    requireAbsolute(candidateSource(candidate), `sourcePath for ${candidate.id}`);
    if (!SKIPPED_STATUSES.has(candidate.status) && candidate.status !== "prepared") {
      throw new GenerationInputError(`Candidate ${candidate.id} has unsupported status ${candidate.status}`);
    }
  }
  return generation;
}

function resolvePaths(options, state, generation) {
  const statePath = path.resolve(options.statePath);
  const runDirectory = path.dirname(statePath);
  const repo = path.dirname(path.dirname(path.dirname(runDirectory)));
  if (statePath !== path.join(repo, "results", "runs", state.runId, "state.json")) {
    throw new GenerationInputError("--state does not match the run identity");
  }
  if (path.resolve(options.baselinePath) !== path.join(repo, "results", "baselines", "best.json")) {
    throw new GenerationInputError("--baseline does not match the repository baseline");
  }
  const outputPath = path.resolve(options.outputPath);
  if (outputPath === statePath || !outputPath.startsWith(`${runDirectory}${path.sep}`)) {
    throw new GenerationInputError("--output must stay inside the run directory");
  }
  const generationRoot = path.join(WORKTREE_ROOT, state.runId, `g${String(generation.number).padStart(2, "0")}`);
  for (const candidate of generation.candidates) {
    if (!path.resolve(candidate.worktreePath).startsWith(`${generationRoot}${path.sep}`)) {
      throw new GenerationInputError(`Unexpected worktreePath for ${candidate.id}`);
    }
    if (!path.resolve(candidateSource(candidate)).startsWith(`${path.resolve(candidate.worktreePath)}${path.sep}`)) {
      throw new GenerationInputError(`Candidate source escapes its worktree: ${candidate.id}`);
    }
    if (!path.resolve(candidate.resultDirectory).startsWith(`${path.dirname(path.resolve(candidateSource(candidate)))}${path.sep}`)) {
      throw new GenerationInputError(`Candidate result directory is not beside its source: ${candidate.id}`);
    }
  }
  return { repo };
}

function runProcess(command, argumentsList) {
  return new Promise((resolve) => {
    const child = spawn(command, argumentsList, { stdio: "inherit" });
    child.once("error", () => resolve(1));
    child.once("close", (code, signal) => resolve(signal === null ? code ?? 1 : 1));
  });
}

function candidateArguments(candidate, baselinePath) {
  return [
    "--source", candidateSource(candidate),
    "--result-dir", candidate.resultDirectory,
    "--label", candidate.id,
    "--baseline", baselinePath,
  ];
}

export function failureMessage(candidateId, { final, integrity = false }) {
  const kind = integrity ? "integrity" : "runner";
  const suffix = integrity ? "" : final ? " after retry" : "; automatic retry requested";
  return `${candidateId} ${kind} failure${suffix}`;
}

async function recoverFailure({ repo, runId, candidateId, final, integrity = false }) {
  const kind = integrity ? "integrity" : "runner";
  const message = failureMessage(candidateId, { final, integrity });
  await archiveGeneration({ repo, runId, failure: message, failureKind: kind });
  if (!final && !integrity) await resumeRun({ repo, runId });
}

function initialRecord(candidate, invalidIds) {
  if (candidate.status === "evaluated") return { id: candidate.id, status: "skipped-evaluated", attempts: [] };
  if (candidate.status === "invalid" || invalidIds.has(candidate.id)) {
    return { id: candidate.id, status: "skipped-invalid", attempts: [] };
  }
  return { id: candidate.id, status: "pending", attempts: [] };
}

export async function runGeneration(options, dependencies = {}) {
  requireAbsolute(options.statePath, "--state");
  requireAbsolute(options.baselinePath, "--baseline");
  requireAbsolute(options.outputPath, "--output");
  const state = await readJson(options.statePath, "loop state");
  const generation = currentGeneration(state);
  const { repo } = resolvePaths(options, state, generation);
  const baseline = await readJson(options.baselinePath, "baseline");
  const registry = await loadRegistry(repo, baseline);
  const candidateIds = new Set(generation.candidates.map(({ id }) => id));
  const invalidIds = new Set(options.invalidIds ?? []);
  for (const candidateId of invalidIds) {
    if (!candidateIds.has(candidateId)) throw new GenerationInputError(`Unknown invalid candidate: ${candidateId}`);
  }

  const output = {
    schemaVersion: 2,
    runId: state.runId,
    generation: generation.number,
    mode: generation.mode ?? "explore",
    status: "running",
    startedAt: timestamp(),
    completedAt: null,
    exitCode: null,
    hardFailureCandidateId: null,
    candidates: generation.candidates.map((candidate) => initialRecord(candidate, invalidIds)),
  };
  const persist = dependencies.writeStatus ?? writeJsonAtomic;
  const execute = dependencies.executeCandidate ?? runProcess;
  const recover = dependencies.recoverFailure ?? recoverFailure;
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidateCommand = dependencies.candidateCommand ?? path.join(scriptDirectory, "..", "candidate.sh");
  await persist(options.outputPath, output);

  for (const candidate of generation.candidates) {
    const record = output.candidates.find(({ id }) => id === candidate.id);
    if (record.status.startsWith("skipped-")) continue;
    const sourcePath = candidateSource(candidate);
    const sourceSha256 = await fileSha256(sourcePath);
    const cached = cachedEvaluation(registry, sourceSha256, candidate.id, sourcePath, baseline);
    if (cached) {
      await fs.mkdir(candidate.resultDirectory, { recursive: true });
      await fs.writeFile(path.join(candidate.resultDirectory, "evaluation.json"), `${JSON.stringify(cached, null, 2)}\n`);
      record.status = "cache-hit";
      record.sourceSha256 = sourceSha256;
      record.completedAt = timestamp();
      await persist(options.outputPath, output);
      continue;
    }

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      record.status = "running";
      const startedAt = timestamp();
      const exitCode = await execute(candidateCommand, candidateArguments(candidate, options.baselinePath), candidate);
      record.attempts.push({ attempt, startedAt, completedAt: timestamp(), exitCode });
      if (exitCode === 0 || exitCode === 2) {
        record.status = "completed";
        record.exitCode = exitCode;
        record.completedAt = timestamp();
        await persist(options.outputPath, output);
        break;
      }
      if (exitCode === 3) {
        record.status = "hard-failure";
        output.status = "failed";
        output.exitCode = 3;
        output.hardFailureCandidateId = candidate.id;
        output.completedAt = timestamp();
        await recover({ repo, runId: state.runId, candidateId: candidate.id, final: true, integrity: true });
        await persist(options.outputPath, output);
        return { exitCode: 3, output };
      }
      const final = attempt === 2;
      record.status = final ? "hard-failure" : "retrying";
      await recover({ repo, runId: state.runId, candidateId: candidate.id, final });
      await persist(options.outputPath, output);
      if (final) {
        output.status = "failed";
        output.exitCode = 1;
        output.hardFailureCandidateId = candidate.id;
        output.completedAt = timestamp();
        await persist(options.outputPath, output);
        return { exitCode: 1, output };
      }
    }
  }

  output.status = "complete";
  output.exitCode = 0;
  output.completedAt = timestamp();
  await persist(options.outputPath, output);
  return { exitCode: 0, output };
}

function parseOptions(argumentsList) {
  const options = { invalidIds: [] };
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!flag?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new GenerationInputError(`${flag ?? "Option"} requires a value`);
    }
    if (flag === "--state") options.statePath = value;
    else if (flag === "--baseline") options.baselinePath = value;
    else if (flag === "--output") options.outputPath = value;
    else if (flag === "--invalid") options.invalidIds.push(value);
    else throw new GenerationInputError(`Unknown option: ${flag}`);
  }
  return options;
}

async function main() {
  const result = await runGeneration(parseOptions(process.argv.slice(2)));
  console.log(JSON.stringify(result.output, null, 2));
  process.exitCode = result.exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Generation run failed: ${error.message}`);
    process.exitCode = error instanceof GenerationInputError ? 3 : 1;
  });
}
