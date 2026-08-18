import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = "Market_making_binary_option.py";
const WORKTREE_ROOT = "/tmp/akuna-market-maker";
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;
const RUNNABLE_STATUS = "prepared";
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
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

function requireAbsolute(filePath, flag) {
  if (!path.isAbsolute(filePath ?? "")) {
    throw new GenerationInputError(`${flag} must be an absolute path`);
  }
}

function assertCandidate(candidate) {
  if (!ID_PATTERN.test(candidate?.id ?? "")) {
    throw new GenerationInputError(`Candidate ID must match ${ID_PATTERN}`);
  }
  requireAbsolute(candidate.worktreePath, `worktreePath for ${candidate.id}`);
  requireAbsolute(candidate.resultDirectory, `resultDirectory for ${candidate.id}`);
  if (!SKIPPED_STATUSES.has(candidate.status) && candidate.status !== RUNNABLE_STATUS) {
    throw new GenerationInputError(
      `Candidate ${candidate.id} has unsupported generation status ${candidate.status ?? "missing"}`,
    );
  }
}

function currentGeneration(state) {
  if (state?.schemaVersion !== 1 || typeof state.runId !== "string" || !state.runId) {
    throw new GenerationInputError("Loop state must use schemaVersion 1 and include runId");
  }
  const generation = state.generations?.at(-1);
  if (!generation || !["prepared", "preparing"].includes(generation.status)) {
    throw new GenerationInputError("Loop state does not contain a prepared generation");
  }
  if (!Number.isSafeInteger(generation.number) || generation.number <= 0) {
    throw new GenerationInputError("Prepared generation has an invalid number");
  }
  if (generation.number !== state.generations.length) {
    throw new GenerationInputError("Prepared generation number does not match loop state history");
  }
  if (!Array.isArray(generation.candidates) || generation.candidates.length !== 3) {
    throw new GenerationInputError("Prepared generation must contain exactly three candidates");
  }
  const ids = new Set();
  for (const candidate of generation.candidates) {
    assertCandidate(candidate);
    if (ids.has(candidate.id)) throw new GenerationInputError(`Duplicate candidate ID: ${candidate.id}`);
    ids.add(candidate.id);
  }
  return generation;
}

function validatePaths(options, state, generation) {
  const statePath = path.resolve(options.statePath);
  const runDirectory = path.dirname(statePath);
  const repo = path.dirname(path.dirname(path.dirname(runDirectory)));
  const expectedStatePath = path.join(repo, "results", "runs", state.runId, "state.json");
  if (statePath !== expectedStatePath) {
    throw new GenerationInputError(`--state must equal ${expectedStatePath}`);
  }
  const expectedBaselinePath = path.join(repo, "results", "baselines", "best.json");
  if (path.resolve(options.baselinePath) !== expectedBaselinePath) {
    throw new GenerationInputError(`--baseline must equal ${expectedBaselinePath}`);
  }
  const outputPath = path.resolve(options.outputPath);
  if (outputPath === statePath || !outputPath.startsWith(`${runDirectory}${path.sep}`)) {
    throw new GenerationInputError(`--output must stay below ${runDirectory} and must not replace state.json`);
  }

  const generationName = `g${String(generation.number).padStart(2, "0")}`;
  for (const candidate of generation.candidates) {
    const expectedWorktree = path.join(WORKTREE_ROOT, state.runId, generationName, candidate.id);
    if (path.resolve(candidate.worktreePath) !== expectedWorktree) {
      throw new GenerationInputError(`Unexpected worktreePath for ${candidate.id}`);
    }
    const expectedResultDirectory = path.join(
      expectedWorktree,
      ".candidate-results",
      state.runId,
      candidate.id,
    );
    if (path.resolve(candidate.resultDirectory) !== expectedResultDirectory) {
      throw new GenerationInputError(`Unexpected resultDirectory for ${candidate.id}`);
    }
  }
}

function makeEventQueue() {
  const queued = [];
  let resolveNext = null;
  return {
    push(event) {
      if (resolveNext) {
        const resolve = resolveNext;
        resolveNext = null;
        resolve(event);
      } else {
        queued.push(event);
      }
    },
    next() {
      if (queued.length > 0) return Promise.resolve(queued.shift());
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },
  };
}

function spawnCandidate(command, argumentsList) {
  return spawn(command, argumentsList, {
    detached: process.platform !== "win32",
    stdio: "inherit",
  });
}

function signalCandidate(child, signal) {
  if (child.pid === undefined) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

function requestTermination(child, killGraceMs, signal = signalCandidate) {
  signal(child, "SIGTERM");
  const timer = setTimeout(() => signal(child, "SIGKILL"), killGraceMs);
  timer.unref();
  return timer;
}

function candidateArguments(candidate, baselinePath) {
  return [
    "--source", path.join(candidate.worktreePath, SOURCE),
    "--result-dir", candidate.resultDirectory,
    "--label", candidate.id,
    "--baseline", baselinePath,
  ];
}

function initialRecord(candidate, invalidIds) {
  if (candidate.status === "evaluated") {
    return { id: candidate.id, status: "skipped-evaluated", exitCode: null, signal: null };
  }
  if (candidate.status === "invalid" || invalidIds.has(candidate.id)) {
    return { id: candidate.id, status: "skipped-invalid", exitCode: null, signal: null };
  }
  return { id: candidate.id, status: "pending", exitCode: null, signal: null };
}

export async function runGeneration(options, dependencies = {}) {
  requireAbsolute(options.statePath, "--state");
  requireAbsolute(options.baselinePath, "--baseline");
  requireAbsolute(options.outputPath, "--output");

  const state = await readJson(options.statePath, "loop state");
  const generation = currentGeneration(state);
  validatePaths(options, state, generation);
  await readJson(options.baselinePath, "baseline");
  const candidateIds = new Set(generation.candidates.map(({ id }) => id));
  const invalidIds = new Set(options.invalidIds ?? []);
  for (const candidateId of invalidIds) {
    if (!candidateIds.has(candidateId)) {
      throw new GenerationInputError(`Unknown invalid candidate: ${candidateId}`);
    }
  }

  const output = {
    schemaVersion: 1,
    runId: state.runId,
    generation: generation.number,
    status: "starting",
    startedAt: timestamp(),
    completedAt: null,
    exitCode: null,
    hardFailureCandidateId: null,
    candidates: generation.candidates.map((candidate) => initialRecord(candidate, invalidIds)),
  };
  const persist = dependencies.writeStatus ?? writeJsonAtomic;
  await persist(options.outputPath, output);

  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidateCommand = dependencies.candidateCommand
    ?? path.join(scriptDirectory, "..", "candidate.sh");
  const launch = dependencies.spawnCandidate ?? spawnCandidate;
  const buildArguments = dependencies.candidateArguments ?? candidateArguments;
  const signal = dependencies.signalCandidate ?? signalCandidate;
  const killGraceMs = dependencies.killGraceMs ?? 2_000;
  const events = makeEventQueue();
  const running = new Map();
  let terminalCount = output.candidates.filter(({ status }) => status.startsWith("skipped-")).length;

  for (const candidate of generation.candidates) {
    const record = output.candidates.find(({ id }) => id === candidate.id);
    if (record.status !== "pending") continue;
    record.status = "running";
    record.startedAt = timestamp();
    let child;
    try {
      child = launch(candidateCommand, buildArguments(candidate, options.baselinePath), candidate);
    } catch (error) {
      events.push({ candidateId: candidate.id, code: null, signal: null, error });
      continue;
    }
    running.set(candidate.id, { child, timer: null });
    let finished = false;
    child.once("error", (error) => {
      if (finished) return;
      finished = true;
      events.push({ candidateId: candidate.id, code: null, signal: null, error });
    });
    child.once("close", (code, closeSignal) => {
      if (finished) return;
      finished = true;
      events.push({ candidateId: candidate.id, code, signal: closeSignal, error: null });
    });
  }

  output.status = running.size === 0 && terminalCount === output.candidates.length
    ? "complete"
    : "running";
  await persist(options.outputPath, output);

  let hardExitCode = null;
  while (terminalCount < output.candidates.length) {
    const event = await events.next();
    const record = output.candidates.find(({ id }) => id === event.candidateId);
    const processState = running.get(event.candidateId);
    running.delete(event.candidateId);
    if (processState?.timer) clearTimeout(processState.timer);
    terminalCount += 1;
    record.exitCode = Number.isInteger(event.code) ? event.code : null;
    record.signal = event.signal ?? null;
    record.completedAt = timestamp();
    if (event.error) record.error = event.error.message;

    if (record.status === "cancellation-requested") {
      record.status = event.code === 0 || event.code === 2 ? "completed" : "cancelled";
    } else if (event.code === 0 || event.code === 2) {
      record.status = "completed";
    } else {
      record.status = "hard-failure";
      const candidateExitCode = event.code === 3 ? 3 : 1;
      if (hardExitCode === null) {
        hardExitCode = candidateExitCode;
        output.hardFailureCandidateId = event.candidateId;
        for (const [candidateId, sibling] of running) {
          const siblingRecord = output.candidates.find(({ id }) => id === candidateId);
          siblingRecord.status = "cancellation-requested";
          siblingRecord.cancellationRequestedAt = timestamp();
          sibling.timer = requestTermination(sibling.child, killGraceMs, signal);
        }
      }
    }
    await persist(options.outputPath, output);
  }

  output.status = hardExitCode === null ? "complete" : "failed";
  output.exitCode = hardExitCode ?? 0;
  output.completedAt = timestamp();
  await persist(options.outputPath, output);
  return { exitCode: output.exitCode, output };
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
  const options = parseOptions(process.argv.slice(2));
  const result = await runGeneration(options);
  console.log(JSON.stringify(result.output, null, 2));
  process.exitCode = result.exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Generation run failed: ${error.message}`);
    process.exitCode = error instanceof GenerationInputError ? 3 : 1;
  });
}
