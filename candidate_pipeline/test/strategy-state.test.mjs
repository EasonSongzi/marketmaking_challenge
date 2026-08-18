import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  activeChallenger,
  cacheEvaluation,
  cachedEvaluation,
  compareStrategy,
  currentRevision,
  loadRegistry,
  saveRegistry,
  storeRevision,
} from "../src/strategy-state.mjs";

function summary(points, bankruptcies = 0) {
  return {
    passed: bankruptcies ? 19 : 20,
    total: 20,
    bankruptcies,
    scoredPointsHundredths: points,
    combinedPnlCents: points,
    minimumCapital: { endingCashCents: bankruptcies ? -100 : 800, startingCapitalCents: 1000 },
  };
}

function evaluation(candidateId, sourceSha256, points, bankruptcies = 0) {
  return {
    schemaVersion: 1,
    candidateId,
    valid: true,
    eligible: false,
    sourcePath: "/tmp/source.py",
    sourceSha256,
    modifiedLines: 2,
    summary: summary(points, bankruptcies),
    baselineDelta: { scoredPointsHundredths: points - 900, combinedPnlCents: points - 900 },
    reasons: bankruptcies ? ["Bankruptcy reported in cases: 7"] : [],
  };
}

test("stores immutable full-source challenger revisions", async (t) => {
  const repo = await fs.mkdtemp(path.join(tmpdir(), "strategy-state-"));
  t.after(() => fs.rm(repo, { recursive: true, force: true }));
  const first = path.join(repo, "first.py");
  const second = path.join(repo, "second.py");
  await fs.writeFile(first, "first\n");
  await fs.writeFile(second, "second\n");
  const firstSha = createHash("sha256").update("first\n").digest("hex");
  const secondSha = createHash("sha256").update("second\n").digest("hex");
  const baseline = { strategy: "champion", sourceSha256: "a".repeat(64), resultArtifact: "best.md", summary: summary(900) };
  const registry = await loadRegistry(repo, baseline);
  const firstEvaluation = evaluation("candidate", firstSha, 850, 1);
  const stored = await storeRevision({
    repo,
    registry,
    challengerId: "challenger-a",
    sourcePath: first,
    evaluation: firstEvaluation,
    method: "quote",
    origin: "explore",
    rationale: "tunable risk",
  });
  const secondEvaluation = evaluation("candidate-tuned", secondSha, 950);
  await storeRevision({
    repo,
    registry,
    challengerId: "challenger-a",
    sourcePath: second,
    evaluation: secondEvaluation,
    method: "quote",
    origin: "explore",
    rationale: "tunable risk",
  });
  await saveRegistry(repo, registry);
  const loaded = await loadRegistry(repo, baseline);
  const challenger = activeChallenger(loaded, "challenger-a");
  assert.equal(challenger.revisions.length, 2);
  assert.equal(currentRevision(challenger).evaluation.candidateId, "candidate-tuned");
  assert.equal(await fs.readFile(stored.destination, "utf8"), "first\n");
});

test("pool comparison prefers safe revisions before raw score", () => {
  const unsafe = evaluation("unsafe", "a".repeat(64), 1300, 1);
  const safe = evaluation("safe", "b".repeat(64), 1200);
  assert.equal([unsafe, safe].sort(compareStrategy)[0].candidateId, "safe");
});

test("cached evidence is rebound to the current champion", () => {
  const registry = { evaluations: {} };
  const original = evaluation("old", "a".repeat(64), 950);
  cacheEvaluation(registry, original);
  const rebound = cachedEvaluation(
    registry,
    original.sourceSha256,
    "new-id",
    "/tmp/new.py",
    { summary: summary(900) },
  );
  assert.equal(rebound.candidateId, "new-id");
  assert.equal(rebound.eligible, true);
  assert.equal(rebound.cached, true);
});

test("runtime-failure cache preserves unavailable ranking data and remains comparable", () => {
  const registry = { evaluations: {} };
  const runtime = evaluation("runtime", "c".repeat(64), 70);
  runtime.summary = {
    passed: 5,
    total: 20,
    bankruptcies: null,
    scoredPointsHundredths: 70,
    combinedPnlCents: null,
    minimumCapital: null,
    runtimeErrors: 15,
  };
  runtime.reasons = [
    "Cases did not pass: 5",
    "Candidate runtime error in cases 5: ValueError: invalid quote",
  ];
  cacheEvaluation(registry, runtime);

  const rebound = cachedEvaluation(
    registry,
    runtime.sourceSha256,
    "runtime-rebound",
    "/tmp/runtime.py",
    { summary: summary(900) },
  );
  assert.equal(rebound.eligible, false);
  assert.equal(rebound.summary.combinedPnlCents, null);
  assert.equal(rebound.baselineDelta.combinedPnlCents, null);
  assert.match(rebound.reasons.join("\n"), /runtime error/);
  assert.equal([runtime, evaluation("safe", "d".repeat(64), 60)].sort(compareStrategy)[0].candidateId, "safe");
});
