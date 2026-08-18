import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { countModifiedLines, evaluateCandidate, evaluateRun } from "../src/evaluate.mjs";
import { baseline, baselineV2, rawCase, rawReport } from "./fixtures/run-data.mjs";

const matchingHash = "a".repeat(64);
const evaluateScript = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../evaluate.sh");

function equalScoreCases(minimumCash = 1000) {
  return Array.from({ length: 20 }, (_, index) => {
    const number = index + 1;
    if (number < 5) {
      return rawCase(number);
    }
    return rawCase(number, {
      endingCashCents: number === 5 ? minimumCash : 1000,
      scoreHundredths: number <= 13 ? 100 : 0,
    });
  });
}

test("evaluateCandidate accepts a complete 20/20 higher-scoring result", () => {
  const result = evaluateCandidate(rawReport(), baseline, matchingHash, 12);

  assert.equal(result.valid, true);
  assert.equal(result.eligible, true);
  assert.equal(result.summary.passed, 20);
  assert.equal(result.summary.bankruptcies, 0);
  assert.equal(result.summary.scoredPointsHundredths, 960);
  assert.equal(result.modifiedLines, 12);
});

test("evaluateCandidate accepts baseline schema versions 1 and 2", () => {
  assert.equal(evaluateCandidate(rawReport(), baseline, matchingHash).valid, true);
  assert.equal(evaluateCandidate(rawReport(), baselineV2, matchingHash).valid, true);
});

test("evaluateCandidate requires source and experiment identity for baseline schema version 2", () => {
  const missingSource = { ...baselineV2, sourceSha256: undefined };
  const malformedSource = { ...baselineV2, sourceSha256: "not-a-sha" };
  const missingExperiment = { ...baselineV2, experimentId: "" };

  for (const invalidBaseline of [missingSource, malformedSource, missingExperiment]) {
    const result = evaluateCandidate(rawReport(), invalidBaseline, matchingHash);
    assert.equal(result.valid, false);
    assert.match(result.reasons.join("\n"), /Baseline JSON/);
  }
});

test("evaluateCandidate rejects 19/19 even when every available case passes", () => {
  const report = rawReport();
  report.cases = report.cases.slice(0, 19);
  const result = evaluateCandidate(report, baseline, matchingHash);

  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /exactly 20/);
});

test("evaluateCandidate rejects missing and duplicate case numbers", () => {
  const missing = rawReport();
  missing.cases = missing.cases.filter(({ number }) => number !== 10);
  assert.match(
    evaluateCandidate(missing, baseline, matchingHash).reasons.join("\n"),
    /missing case numbers: 10/,
  );

  const duplicate = rawReport();
  duplicate.cases[19] = rawCase(19);
  assert.match(
    evaluateCandidate(duplicate, baseline, matchingHash).reasons.join("\n"),
    /duplicate case numbers/,
  );
});

test("evaluateCandidate treats FAIL and bankruptcy as valid but ineligible performance", () => {
  const failed = rawReport();
  failed.cases[5] = rawCase(6, { passed: false });
  const failedResult = evaluateCandidate(failed, baseline, matchingHash);
  assert.equal(failedResult.valid, true);
  assert.equal(failedResult.eligible, false);
  assert.match(failedResult.reasons.join("\n"), /did not pass: 6/);

  const bankrupt = rawReport();
  bankrupt.cases[5] = rawCase(6, { bankrupt: true });
  const bankruptResult = evaluateCandidate(bankrupt, baseline, matchingHash);
  assert.equal(bankruptResult.valid, true);
  assert.equal(bankruptResult.eligible, false);
  assert.match(bankruptResult.reasons.join("\n"), /Bankruptcy/);
});

test("evaluate CLI exits 2 for failed or bankrupt strategies with intact evidence", async (t) => {
  const scenarios = [
    ["failed", { passed: false }],
    ["bankrupt", { bankrupt: true }],
  ];
  for (const [name, caseOptions] of scenarios) {
    await t.test(name, async () => {
      const directory = await fs.mkdtemp(path.join(tmpdir(), `akuna-evaluate-${name}-`));
      try {
        const sourcePath = path.join(directory, "Market_making_binary_option.py");
        const baselinePath = path.join(directory, "best.json");
        const source = "candidate\n";
        const sourceSha256 = createHash("sha256").update(source).digest("hex");
        const cases = Array.from({ length: 20 }, (_, index) => (
          index === 5 ? rawCase(index + 1, caseOptions) : rawCase(index + 1)
        ));
        await fs.writeFile(sourcePath, source);
        await fs.writeFile(baselinePath, JSON.stringify(baseline));
        await fs.writeFile(
          path.join(directory, "hackerrank-run-fixture.json"),
          JSON.stringify(rawReport({ sourcePath, sourceSha256, cases })),
        );

        const result = spawnSync(
          "bash",
          [evaluateScript, "--run-dir", directory, "--baseline", baselinePath],
          { encoding: "utf8" },
        );
        assert.equal(result.status, 2, result.stderr);
        const evaluation = JSON.parse(await fs.readFile(path.join(directory, "evaluation.json"), "utf8"));
        assert.equal(evaluation.valid, true);
        assert.equal(evaluation.eligible, false);
      } finally {
        await fs.rm(directory, { recursive: true });
      }
    });
  }
});

test("evaluateCandidate rejects an incomplete set of 16 SCORED results", () => {
  const report = rawReport();
  report.cases[4] = rawCase(5, {
    text: "Mola mola bankrupt: False (cash balance: 10.00, starting capital: 10.00)\nResult: PASS",
  });
  const result = evaluateCandidate(report, baseline, matchingHash);

  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /exactly 16 SCORED results/);
});

test("evaluateCandidate promotes equal points only with a higher capital ratio", () => {
  const higherCapital = rawReport({ cases: equalScoreCases(770) });
  const equalCapital = rawReport({ cases: equalScoreCases(769) });

  assert.equal(evaluateCandidate(higherCapital, baseline, matchingHash).eligible, true);
  const equalResult = evaluateCandidate(equalCapital, baseline, matchingHash);
  assert.equal(equalResult.valid, true);
  assert.equal(equalResult.eligible, false);
  assert.match(equalResult.reasons.join("\n"), /did not strictly exceed/);
});

test("evaluateCandidate rejects a source SHA change", () => {
  const result = evaluateCandidate(rawReport(), baseline, "b".repeat(64));
  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /no longer matches/);
});

test("evaluateCandidate rejects malformed baseline JSON", () => {
  const result = evaluateCandidate(rawReport(), { schemaVersion: 1 }, matchingHash);
  assert.equal(result.valid, false);
  assert.match(result.reasons.join("\n"), /Baseline JSON/);
});

test("evaluateCandidate sums PnL only across SCORED cases", () => {
  const report = rawReport();
  report.cases[1] = rawCase(2, { endingCashCents: 5000 });
  report.cases[4] = rawCase(5, { endingCashCents: 1185 });
  const result = evaluateCandidate(report, baseline, matchingHash);

  assert.equal(result.summary.combinedPnlCents, 185);
});

test("evaluateRun requires exactly one raw HackerRank JSON and verifies the source", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-evaluate-"));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  const baselinePath = path.join(directory, "best.json");
  try {
    await fs.writeFile(sourcePath, "candidate\n");
    await fs.writeFile(baselinePath, JSON.stringify(baseline));
    await assert.rejects(
      evaluateRun({ runDirectory: directory, baselinePath }),
      /exactly one raw HackerRank JSON/,
    );

    const hash = createHash("sha256").update("candidate\n").digest("hex");
    const report = rawReport({ sourcePath, sourceSha256: hash });
    await fs.writeFile(path.join(directory, "hackerrank-run-one.json"), JSON.stringify(report));
    const result = await evaluateRun({ runDirectory: directory, baselinePath });
    assert.equal(result.valid, true);

    await fs.writeFile(path.join(directory, "hackerrank-run-two.json"), JSON.stringify(report));
    await assert.rejects(
      evaluateRun({ runDirectory: directory, baselinePath }),
      /exactly one raw HackerRank JSON/,
    );
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});

test("countModifiedLines resolves a symlinked worktree path", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-diff-"));
  const repository = path.join(directory, "repository");
  const alias = path.join(directory, "alias");
  const sourcePath = path.join(repository, "Market_making_binary_option.py");
  try {
    await fs.mkdir(repository);
    await fs.writeFile(sourcePath, "one\ntwo\n");
    spawnSync("git", ["init", "-q"], { cwd: repository });
    spawnSync("git", ["add", "Market_making_binary_option.py"], { cwd: repository });
    spawnSync(
      "git",
      ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "base"],
      { cwd: repository },
    );
    await fs.symlink(repository, alias);
    await fs.writeFile(sourcePath, "one changed\ntwo changed\n");

    assert.equal(countModifiedLines(path.join(alias, "Market_making_binary_option.py")), 4);
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});
