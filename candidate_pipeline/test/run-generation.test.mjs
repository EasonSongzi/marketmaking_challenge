import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { GenerationInputError, failureMessage, runGeneration } from "../src/run-generation.mjs";

const scopedSource = `\
class MarketMaker:
    def __init__(self, a: list, b: list, c: float) -> None:
        pass
    def on_step_advance(self, a: list, b: list) -> None:
        pass
    def on_trade(self, a: object, b: float, c: int, d: int) -> None:
        pass
    @property
    def name(self) -> str:
        return "fixture"
    def price_option(self, option: object) -> float:
        return 0.5
    def price_option_from_parameters(self, parameters: object, option: object) -> float:
        return 0.5
    def quote(self, option: object, counterparty_id: int) -> object:
        return None
    def respond_to_fok(self, option: object, order: object) -> bool:
        return False
    def warm_up(self, history: object) -> None:
        pass
`;

function summary(points = 900) {
  return {
    passed: 20,
    total: 20,
    bankruptcies: 0,
    scoredPointsHundredths: points,
    combinedPnlCents: 100,
    minimumCapital: { endingCashCents: 800, startingCapitalCents: 1000 },
  };
}

async function fixture(statuses = ["prepared", "prepared", "prepared"]) {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "run-generation-test-"));
  const statePath = path.join(directory, "results", "runs", "run-001", "state.json");
  const baselinePath = path.join(directory, "results", "baselines", "best.json");
  const outputPath = path.join(path.dirname(statePath), "statuses.json");
  const candidates = [];
  for (const [index, id] of ["candidate-a", "candidate-b", "candidate-c"].entries()) {
    const worktreePath = path.join("/tmp", "akuna-market-maker", "run-001", "g01", id);
    const sourcePath = path.join(worktreePath, "Market_making_binary_option.py");
    await fs.mkdir(worktreePath, { recursive: true });
    await fs.writeFile(sourcePath, `# ${id}\n`);
    candidates.push({
      id,
      status: statuses[index],
      worktreePath,
      resultDirectory: path.join(worktreePath, ".candidate-results", "run-001", id),
    });
  }
  const state = {
    schemaVersion: 2,
    runId: "run-001",
    generations: [{ number: 1, mode: "explore", method: "quote", status: "prepared", candidates }],
  };
  const baseline = {
    schemaVersion: 2,
    strategy: "baseline",
    resultArtifact: "results/baselines/base.md",
    sourceSha256: "a".repeat(64),
    experimentId: "old:g01:base",
    summary: summary(),
  };
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.mkdir(path.dirname(baselinePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state));
  await fs.writeFile(baselinePath, JSON.stringify(baseline));
  return { directory, statePath, baselinePath, outputPath, candidates };
}

async function removeFixture(input) {
  await fs.rm(input.directory, { recursive: true, force: true });
  await fs.rm("/tmp/akuna-market-maker/run-001", { recursive: true, force: true });
}

test("runs candidates serially and preserves successful exit codes", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const order = [];
  const codes = { "candidate-a": 0, "candidate-b": 2, "candidate-c": 0 };
  const result = await runGeneration(input, {
    async executeCandidate(_command, _arguments, candidate) {
      order.push(candidate.id);
      return codes[candidate.id];
    },
  });
  assert.equal(result.exitCode, 0);
  assert.deepEqual(order, ["candidate-a", "candidate-b", "candidate-c"]);
  assert.deepEqual(result.output.candidates.map(({ status, exitCode }) => ({ status, exitCode })), [
    { status: "completed", exitCode: 0 },
    { status: "completed", exitCode: 2 },
    { status: "completed", exitCode: 0 },
  ]);
});

test("continues after an explicit candidate failure exits 2", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const order = [];
  const result = await runGeneration(input, {
    async executeCandidate(_command, _arguments, candidate) {
      order.push(candidate.id);
      return candidate.id === "candidate-a" ? 2 : 0;
    },
  });

  assert.equal(result.exitCode, 0);
  assert.deepEqual(order, ["candidate-a", "candidate-b", "candidate-c"]);
});

test("retries the same candidate once and resets after success", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const outcomes = { "candidate-a": [1, 0], "candidate-b": [1, 2], "candidate-c": [0] };
  const recovered = [];
  const result = await runGeneration(input, {
    async executeCandidate(_command, _arguments, candidate) {
      return outcomes[candidate.id].shift();
    },
    async recoverFailure(value) {
      recovered.push(value);
    },
  });
  assert.equal(result.exitCode, 0);
  assert.deepEqual(recovered.map(({ candidateId, final }) => [candidateId, final]), [
    ["candidate-a", false],
    ["candidate-b", false],
  ]);
  assert.deepEqual(result.output.candidates.map(({ attempts }) => attempts.length), [2, 2, 1]);
});

test("stops after the same candidate fails twice", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const recovered = [];
  const result = await runGeneration(input, {
    async executeCandidate() { return 1; },
    async recoverFailure(value) { recovered.push(value); },
  });
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.hardFailureCandidateId, "candidate-a");
  assert.deepEqual(recovered.map(({ final }) => final), [false, true]);
  assert.equal(result.output.candidates[1].status, "pending");
});

test("integrity failure does not retry and skipped candidates stay skipped", async (t) => {
  const input = await fixture(["evaluated", "prepared", "prepared"]);
  t.after(() => removeFixture(input));
  let executions = 0;
  let recovery;
  const result = await runGeneration({ ...input, invalidIds: ["candidate-b"] }, {
    async executeCandidate() { executions += 1; return 3; },
    async recoverFailure(value) { recovery = value; },
  });
  assert.equal(result.exitCode, 3);
  assert.equal(executions, 1);
  assert.equal(recovery.integrity, true);
  assert.deepEqual(result.output.candidates.map(({ status }) => status), [
    "skipped-evaluated", "skipped-invalid", "hard-failure",
  ]);
});

test("integrity failure text does not claim an unperformed retry", () => {
  assert.equal(failureMessage("candidate-a", { integrity: true, final: true }), "candidate-a integrity failure");
  assert.equal(failureMessage("candidate-a", { integrity: false, final: true }), "candidate-a runner failure after retry");
});

test("reuses a cached source SHA without executing the runner", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const sourcePath = path.join(input.candidates[0].worktreePath, "Market_making_binary_option.py");
  const sourceSha256 = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
  const registry = {
    schemaVersion: 1,
    champion: { id: "baseline" },
    challengers: [],
    evaluations: {
      [sourceSha256]: { valid: true, modifiedLines: 1, summary: summary(950), reasons: [] },
    },
  };
  await fs.writeFile(path.join(input.directory, "results", "strategy-state.json"), JSON.stringify(registry));
  let executions = 0;
  const result = await runGeneration(input, {
    async executeCandidate() { executions += 1; return 0; },
  });
  assert.equal(result.output.candidates[0].status, "cache-hit");
  assert.equal(executions, 2);
  const evaluation = JSON.parse(await fs.readFile(path.join(input.candidates[0].resultDirectory, "evaluation.json")));
  assert.equal(evaluation.cached, true);
  assert.equal(evaluation.eligible, true);
});

test("Explore skips a candidate that changes a non-target core method", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const parentPath = path.join(input.directory, "Market_making_binary_option.py");
  await fs.writeFile(parentPath, scopedSource);
  for (const candidate of input.candidates) {
    await fs.writeFile(path.join(candidate.worktreePath, "Market_making_binary_option.py"), scopedSource);
  }
  await fs.writeFile(
    path.join(input.candidates[0].worktreePath, "Market_making_binary_option.py"),
    scopedSource.replace("        return False", "        return True"),
  );
  const state = JSON.parse(await fs.readFile(input.statePath));
  state.generations[0].method = "quote";
  state.generations[0].parent = {
    type: "champion",
    id: "baseline",
    sourcePath: "Market_making_binary_option.py",
    sourceSha256: createHash("sha256").update(scopedSource).digest("hex"),
  };
  await fs.writeFile(input.statePath, JSON.stringify(state));
  let executions = 0;
  const result = await runGeneration(input, {
    async executeCandidate() { executions += 1; return 0; },
  });
  assert.equal(result.output.candidates[0].status, "scope-invalid");
  assert.equal(result.output.candidates[0].scopeValidated, undefined);
  assert.ok(result.output.candidates.slice(1).every(({ scopeValidated }) => scopeValidated));
  assert.equal(executions, 2);
});

test("rejects unknown invalid IDs and malformed state before execution", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  await assert.rejects(
    runGeneration({ ...input, invalidIds: ["unknown"] }),
    (error) => error instanceof GenerationInputError && /Unknown invalid candidate/.test(error.message),
  );
  const state = JSON.parse(await fs.readFile(input.statePath));
  state.generations[0].candidates[0].status = "pending";
  await fs.writeFile(input.statePath, JSON.stringify(state));
  await assert.rejects(runGeneration(input), /unsupported status pending/);
});

test("rejects path and generation identity tampering", async (t) => {
  const input = await fixture();
  t.after(() => removeFixture(input));
  const state = JSON.parse(await fs.readFile(input.statePath));
  state.generations[0].candidates[0].resultDirectory = "/tmp/elsewhere";
  await fs.writeFile(input.statePath, JSON.stringify(state));
  await assert.rejects(runGeneration(input), /result directory/);
});
