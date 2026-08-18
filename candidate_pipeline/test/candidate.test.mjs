import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runCandidate } from "../src/candidate.mjs";

const options = {
  sourcePath: "/tmp/worktree/Market_making_binary_option.py",
  resultDirectory: "/tmp/main/results/runs/run-001/candidate-a",
  label: "candidate-a",
  baselinePath: "/tmp/main/results/baselines/best.json",
};

function fakeExecution(statuses) {
  const calls = [];
  return {
    calls,
    execute: async (command, argumentsList) => {
      calls.push({ command, argumentsList });
      return statuses[calls.length - 1];
    },
  };
}

test("runCandidate evaluates after runner status 0 and preserves evaluator status", async () => {
  const fake = fakeExecution([0, 2]);
  const status = await runCandidate(options, {
    execute: fake.execute,
    runnerPath: "/fake/run.sh",
    evaluatorPath: "/fake/evaluate.sh",
  });

  assert.equal(status, 2);
  assert.equal(fake.calls.length, 2);
});

test("runCandidate also evaluates after runner status 2", async () => {
  const fake = fakeExecution([2, 0]);
  const status = await runCandidate(options, { execute: fake.execute });
  assert.equal(status, 0);
  assert.equal(fake.calls.length, 2);
  assert.equal(
    fake.calls[0].command,
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../auto_extract_result/run.sh"),
  );
});

test("runCandidate returns 2 when intact evidence proves a candidate failure", async () => {
  const fake = fakeExecution([2, 2]);
  const status = await runCandidate(options, { execute: fake.execute });
  assert.equal(status, 2);
  assert.equal(fake.calls.length, 2);
});

test("runCandidate stops after runner status 1", async () => {
  const fake = fakeExecution([1]);
  const status = await runCandidate(options, { execute: fake.execute });
  assert.equal(status, 1);
  assert.equal(fake.calls.length, 1);
});

test("runCandidate passes source, label, result directory, and baseline exactly", async () => {
  const fake = fakeExecution([0, 3]);
  const status = await runCandidate(options, {
    execute: fake.execute,
    runnerPath: "/fake/run.sh",
    evaluatorPath: "/fake/evaluate.sh",
  });

  assert.equal(status, 3);
  assert.deepEqual(fake.calls, [
    {
      command: "/fake/run.sh",
      argumentsList: [
        "--source", options.sourcePath,
        "--result-dir", options.resultDirectory,
        "--label", options.label,
      ],
    },
    {
      command: "/fake/evaluate.sh",
      argumentsList: [
        "--run-dir", options.resultDirectory,
        "--baseline", options.baselinePath,
      ],
    },
  ]);
});
