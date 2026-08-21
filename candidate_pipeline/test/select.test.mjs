import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { selectCandidates, selectFromFiles } from "../src/select.mjs";
import { evaluation } from "./fixtures/run-data.mjs";

function candidate(candidateId, summary = {}, overrides = {}) {
  const base = evaluation({ candidateId });
  return {
    ...base,
    ...overrides,
    summary: { ...base.summary, ...summary },
    evaluationPath: `/tmp/${candidateId}/evaluation.json`,
  };
}

test("selectCandidates selects one eligible candidate", () => {
  const selection = selectCandidates([candidate("candidate-a")]);
  assert.equal(selection.promotion, true);
  assert.equal(selection.winner.candidateId, "candidate-a");
});

test("selectCandidates orders multiple candidates by points", () => {
  const selection = selectCandidates([
    candidate("lower", { scoredPointsHundredths: 1000 }),
    candidate("higher", { scoredPointsHundredths: 1100 }),
  ]);
  assert.equal(selection.winner.candidateId, "higher");
});

test("selectCandidates ignores PnL and capital when scores tie", () => {
  const selection = selectCandidates([
    candidate("higher-capital", {
      combinedPnlCents: 99,
      minimumCapital: { endingCashCents: 9, startingCapitalCents: 10 },
    }),
    candidate("higher-pnl", {
      combinedPnlCents: 100,
      minimumCapital: { endingCashCents: 7, startingCapitalCents: 10 },
    }),
  ]);
  assert.equal(selection.winner.candidateId, "higher-capital");
});

test("selectCandidates breaks score ties by modified lines", () => {
  const capitalIgnored = selectCandidates([
    candidate("lower-capital", { minimumCapital: { endingCashCents: 799, startingCapitalCents: 1000 } }),
    candidate("higher-capital", { minimumCapital: { endingCashCents: 4, startingCapitalCents: 5 } }),
  ]);
  assert.equal(capitalIgnored.winner.candidateId, "higher-capital");

  const diffWinner = selectCandidates([
    candidate("larger-diff", {}, { modifiedLines: 11 }),
    candidate("smaller-diff", {}, { modifiedLines: 10 }),
  ]);
  assert.equal(diffWinner.winner.candidateId, "smaller-diff");
});

test("selectCandidates uses candidate ID as the final deterministic tie-break", () => {
  const selection = selectCandidates([candidate("candidate-b"), candidate("candidate-a")]);
  assert.equal(selection.winner.candidateId, "candidate-a");
});

test("selectCandidates records no promotion when nobody is eligible", () => {
  const selection = selectCandidates([
    candidate("valid-but-lower", {}, { eligible: false }),
    candidate("invalid", {}, { valid: false, eligible: false }),
  ]);
  assert.deepEqual(selection, {
    schemaVersion: 1,
    promotion: false,
    winner: null,
    reason: "No candidate passed the promotion gate",
  });
});

test("selectFromFiles rejects damaged evaluation JSON", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-select-bad-"));
  const evaluationPath = path.join(directory, "evaluation.json");
  try {
    await fs.writeFile(evaluationPath, "not json");
    await assert.rejects(selectFromFiles([evaluationPath]), /Cannot read evaluation/);
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});

test("selectFromFiles rejects a candidate whose source SHA changed", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-select-sha-"));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  const evaluationPath = path.join(directory, "evaluation.json");
  try {
    const source = "tested source\n";
    const sourceSha256 = createHash("sha256").update(source).digest("hex");
    await fs.writeFile(sourcePath, "changed source\n");
    await fs.writeFile(
      evaluationPath,
      JSON.stringify(evaluation({ sourcePath, sourceSha256 })),
    );
    await assert.rejects(selectFromFiles([evaluationPath]), /Source SHA-256 changed/);
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});

test("selectFromFiles accepts a valid ineligible runtime failure with unavailable ranking data", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-select-runtime-"));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  const evaluationPath = path.join(directory, "evaluation.json");
  try {
    const source = "runtime failure source\n";
    const sourceSha256 = createHash("sha256").update(source).digest("hex");
    const runtimeEvaluation = evaluation({
      eligible: false,
      sourcePath,
      sourceSha256,
      summary: {
        passed: 5,
        total: 20,
        bankruptcies: null,
        scoredPointsHundredths: 70,
        combinedPnlCents: null,
        minimumCapital: null,
        runtimeErrors: 15,
      },
      baselineDelta: { scoredPointsHundredths: -1160, combinedPnlCents: null },
      reasons: ["Candidate runtime error in cases 5: ValueError: invalid quote"],
    });
    await fs.writeFile(sourcePath, source);
    await fs.writeFile(evaluationPath, JSON.stringify(runtimeEvaluation));

    const selection = await selectFromFiles([evaluationPath]);
    assert.equal(selection.promotion, false);
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});
