import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GenerationInputError, runGeneration } from "../src/run-generation.mjs";

const fixturePath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "candidate-child.mjs",
);

async function fixture(statuses = ["prepared", "prepared", "prepared"]) {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "run-generation-test-"));
  const statePath = path.join(directory, "results", "runs", "run-001", "state.json");
  const baselinePath = path.join(directory, "results", "baselines", "best.json");
  const outputPath = path.join(path.dirname(statePath), "statuses.json");
  const candidates = ["candidate-a", "candidate-b", "candidate-c"].map((id, index) => ({
    id,
    status: statuses[index],
    worktreePath: path.join("/tmp", "akuna-market-maker", "run-001", "g01", id),
    resultDirectory: path.join(
      "/tmp",
      "akuna-market-maker",
      "run-001",
      "g01",
      id,
      ".candidate-results",
      "run-001",
      id,
    ),
  }));
  const state = {
    schemaVersion: 1,
    runId: "run-001",
    generations: [{ number: 1, status: "prepared", candidates }],
  };
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.mkdir(path.dirname(baselinePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state));
  await fs.writeFile(baselinePath, JSON.stringify({ schemaVersion: 2 }));
  return { directory, statePath, baselinePath, outputPath };
}

function childDependencies(logPath, behavior) {
  return {
    candidateCommand: process.execPath,
    candidateArguments(candidate) {
      const value = behavior[candidate.id];
      return [
        fixturePath,
        "--label", candidate.id,
        "--fixture-log", logPath,
        "--fixture-delay", String(value.delay),
        "--fixture-exit", String(value.code),
      ];
    },
    killGraceMs: 100,
  };
}

async function readLog(logPath) {
  const contents = await fs.readFile(logPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  return contents.trim().split("\n").filter(Boolean).map(JSON.parse);
}

test("runs three candidates concurrently and preserves successful exit codes", async (t) => {
  const input = await fixture();
  t.after(() => fs.rm(input.directory, { recursive: true, force: true }));
  const logPath = path.join(input.directory, "children.log");
  const result = await runGeneration(input, childDependencies(logPath, {
    "candidate-a": { delay: 80, code: 0 },
    "candidate-b": { delay: 80, code: 2 },
    "candidate-c": { delay: 80, code: 0 },
  }));

  assert.equal(result.exitCode, 0);
  assert.equal(result.output.status, "complete");
  assert.deepEqual(result.output.candidates.map(({ status, exitCode }) => ({ status, exitCode })), [
    { status: "completed", exitCode: 0 },
    { status: "completed", exitCode: 2 },
    { status: "completed", exitCode: 0 },
  ]);
  const events = await readLog(logPath);
  const firstExit = events.findIndex(({ event }) => event === "exit");
  assert.equal(events.slice(0, firstExit).filter(({ event }) => event === "start").length, 3);
});

test("first runner failure cancels and waits for running siblings", async (t) => {
  const input = await fixture();
  t.after(() => fs.rm(input.directory, { recursive: true, force: true }));
  const logPath = path.join(input.directory, "children.log");
  const result = await runGeneration(input, childDependencies(logPath, {
    "candidate-a": { delay: 50, code: 1 },
    "candidate-b": { delay: 5_000, code: 0 },
    "candidate-c": { delay: 5_000, code: 2 },
  }));

  assert.equal(result.exitCode, 1);
  assert.equal(result.output.status, "failed");
  assert.equal(result.output.hardFailureCandidateId, "candidate-a");
  assert.equal(result.output.candidates[0].status, "hard-failure");
  assert.deepEqual(result.output.candidates.slice(1).map(({ status }) => status), ["cancelled", "cancelled"]);
  assert.deepEqual((await readLog(logPath)).filter(({ event }) => event === "term").map(({ label }) => label).sort(), [
    "candidate-b",
    "candidate-c",
  ]);
  assert.deepEqual(JSON.parse(await fs.readFile(input.outputPath, "utf8")), result.output);
});

test("integrity failure exits 3 and skips evaluated and invalid candidates", async (t) => {
  const input = await fixture(["evaluated", "prepared", "prepared"]);
  t.after(() => fs.rm(input.directory, { recursive: true, force: true }));
  const logPath = path.join(input.directory, "children.log");
  const result = await runGeneration(
    { ...input, invalidIds: ["candidate-b"] },
    childDependencies(logPath, { "candidate-c": { delay: 20, code: 3 } }),
  );

  assert.equal(result.exitCode, 3);
  assert.deepEqual(result.output.candidates.map(({ status }) => status), [
    "skipped-evaluated",
    "skipped-invalid",
    "hard-failure",
  ]);
  assert.deepEqual((await readLog(logPath)).map(({ label }) => label), ["candidate-c", "candidate-c"]);
});

test("rejects unknown invalid IDs and malformed candidate state before spawning", async (t) => {
  const input = await fixture();
  t.after(() => fs.rm(input.directory, { recursive: true, force: true }));
  let spawnCount = 0;
  await assert.rejects(
    runGeneration(
      { ...input, invalidIds: ["candidate-unknown"] },
      { spawnCandidate: () => { spawnCount += 1; } },
    ),
    (error) => error instanceof GenerationInputError && /Unknown invalid candidate/.test(error.message),
  );
  assert.equal(spawnCount, 0);

  const state = JSON.parse(await fs.readFile(input.statePath, "utf8"));
  state.generations[0].candidates[0].status = "pending";
  await fs.writeFile(input.statePath, JSON.stringify(state));
  await assert.rejects(runGeneration(input), /unsupported generation status pending/);
});

test("rejects path and generation identity tampering before spawning", async (t) => {
  const tamperCases = [
    {
      label: "state path",
      mutate({ input }) {
        input.statePath = path.join(input.directory, "results", "other-runs", "run-001", "state.json");
      },
      expected: /--state must equal/,
    },
    {
      label: "baseline path",
      mutate({ input }) {
        input.baselinePath = path.join(input.directory, "best.json");
      },
      expected: /--baseline must equal/,
    },
    {
      label: "output path",
      mutate({ input }) {
        input.outputPath = path.join(input.directory, "statuses.json");
      },
      expected: /--output must stay below/,
    },
    {
      label: "generation number",
      mutate({ state }) {
        state.generations[0].number = 2;
      },
      expected: /generation number does not match/,
    },
    {
      label: "worktree path",
      mutate({ state }) {
        state.generations[0].candidates[0].worktreePath = "/tmp/elsewhere";
      },
      expected: /Unexpected worktreePath/,
    },
    {
      label: "result directory",
      mutate({ state }) {
        state.generations[0].candidates[0].resultDirectory = "/tmp/elsewhere";
      },
      expected: /Unexpected resultDirectory/,
    },
  ];

  for (const tamperCase of tamperCases) {
    await t.test(tamperCase.label, async () => {
      const input = await fixture();
      t.after(() => fs.rm(input.directory, { recursive: true, force: true }));
      const state = JSON.parse(await fs.readFile(input.statePath, "utf8"));
      tamperCase.mutate({ input, state });
      if (tamperCase.label === "state path") {
        await fs.mkdir(path.dirname(input.statePath), { recursive: true });
      }
      await fs.writeFile(input.statePath, JSON.stringify(state));
      let spawnCount = 0;
      await assert.rejects(
        runGeneration(input, { spawnCandidate: () => { spawnCount += 1; } }),
        tamperCase.expected,
      );
      assert.equal(spawnCount, 0);
    });
  }
});
