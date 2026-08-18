import assert from "node:assert/strict";
import test from "node:test";

import { compareCapital, comparePerformance, parseCaseResult } from "../src/case-result.mjs";
import { rawCase, runtimeErrorCase } from "./fixtures/run-data.mjs";

test("parseCaseResult parses THEO, VERBOSE, and SCORED cases", () => {
  assert.deepEqual(parseCaseResult(rawCase(1)), {
    number: 1,
    type: "THEO",
    passed: true,
  });
  assert.deepEqual(parseCaseResult(rawCase(2)), {
    number: 2,
    type: "VERBOSE",
    passed: true,
    scoreHundredths: 100,
    bankrupt: false,
    endingCashCents: 1000,
    startingCapitalCents: 1000,
    pnlCents: 0,
  });
  assert.equal(parseCaseResult(rawCase(5)).type, "SCORED");
});

test("parseCaseResult calculates positive and negative PnL in cents", () => {
  assert.equal(parseCaseResult(rawCase(5, { endingCashCents: 1185 })).pnlCents, 185);
  assert.equal(parseCaseResult(rawCase(6, { endingCashCents: 992 })).pnlCents, -8);
});

test("parseCaseResult parses both bankruptcy values", () => {
  assert.equal(parseCaseResult(rawCase(5)).bankrupt, false);
  assert.equal(parseCaseResult(rawCase(5, { bankrupt: true })).bankrupt, true);
});

test("parseCaseResult treats an explicit HackerRank runtime error as a scored failure", () => {
  assert.deepEqual(parseCaseResult(runtimeErrorCase(5)), {
    number: 5,
    type: "SCORED",
    passed: false,
    scoreHundredths: 0,
    runtimeError: "ValueError: Quote bid price must be less than offer price",
  });
});

test("parseCaseResult rejects missing score and cash fields", () => {
  assert.throws(
    () => parseCaseResult(rawCase(5, {
      text: "Mola mola bankrupt: False (cash balance: 10.00, starting capital: 10.00)\nResult: PASS",
    })),
    /Missing score/,
  );
  assert.throws(
    () => parseCaseResult(rawCase(5, { text: "Result: PASS (score=0.40)" })),
    /bankruptcy field/,
  );
});

test("parseCaseResult rejects malformed and duplicate Result fields", () => {
  assert.throws(
    () => parseCaseResult(rawCase(1, { text: "Result: MAYBE" })),
    /Malformed Result/,
  );
  assert.throws(
    () => parseCaseResult(rawCase(1, { text: "Result: PASS\nResult: FAIL" })),
    /exactly one Result/,
  );
  assert.throws(
    () => parseCaseResult(rawCase(5, { text: "Compiler Message\nTraceback (most recent call last):" })),
    /outcome/,
  );
});

test("compareCapital uses exact integer ratios", () => {
  assert.equal(
    compareCapital(
      { endingCashCents: 1, startingCapitalCents: 3 },
      { endingCashCents: 3333, startingCapitalCents: 10000 },
    ),
    1,
  );
});

test("comparePerformance uses points, PnL, and capital ratio in order", () => {
  const base = {
    scoredPointsHundredths: 900,
    combinedPnlCents: -273,
    minimumCapital: { endingCashCents: 769, startingCapitalCents: 1000 },
  };
  assert.equal(comparePerformance({ ...base, scoredPointsHundredths: 901 }, base), 1);
  assert.equal(comparePerformance({
    ...base,
    combinedPnlCents: -272,
    minimumCapital: { endingCashCents: 7, startingCapitalCents: 10 },
  }, base), 1);
  assert.equal(comparePerformance({
    ...base,
    minimumCapital: { endingCashCents: 77, startingCapitalCents: 100 },
  }, base), 1);
  assert.equal(comparePerformance({
    ...base,
    combinedPnlCents: -274,
    minimumCapital: { endingCashCents: 9, startingCapitalCents: 10 },
  }, base), -1);
  assert.equal(comparePerformance(structuredClone(base), base), 0);
});
