import assert from "node:assert/strict";
import test from "node:test";

import { selectFrontier } from "../src/frontier.mjs";

function record(label, { gap, margin, lines, caseGap = gap, score = 1330 }) {
  return {
    label,
    sourceSha256: label.padEnd(64, "0"),
    sourceLines: lines,
    evaluation: { valid: true, schemaVersion: 1, summary: { total: 20, passed: 20, bankruptcies: 0, runtimeErrors: 0, scoredPointsHundredths: score } },
    metrics: { gapSumCents: gap, minimumHeldMarginCents: margin, scoreVector: "fixture", losingCases: [6], heldCases: [9] },
    compactCases: [{ number: 6, scoreHundredths: 70, gapToLeaderCents: caseGap }],
  };
}

test("frontier selection uses gap, margin, lines, and ID in order", () => {
  const frontier = selectFrontier([
    record("later", { gap: 100, margin: 20, lines: 10 }),
    record("larger", { gap: 101, margin: 100, lines: 1 }),
    record("fragile", { gap: 100, margin: 19, lines: 1 }),
    record("anchor", { gap: 100, margin: 20, lines: 9 }),
  ]);

  assert.equal(frontier.maxScoreHundredths, 1330);
  assert.equal(frontier.plateau.length, 4);
  assert.equal(frontier.scoreVectors.length, 1);
  assert.equal(frontier.anchor.label, "anchor");
});
