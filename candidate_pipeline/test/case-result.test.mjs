import assert from "node:assert/strict";
import test from "node:test";

import { compareCapital, comparePerformance, parseCaseResult, parseRanking } from "../src/case-result.mjs";
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
    cashPnlCents: 0,
    pnlCents: 0,
    ranking: {
      entries: [
        { rank: 1, name: "Mola mola", pnlCents: 0 },
        { rank: 2, name: "Competitor 2", pnlCents: -100 },
        { rank: 3, name: "Competitor 3", pnlCents: -200 },
      ],
      rank: 1,
      participantCount: 3,
      ourPnlCents: 0,
      leaderName: "Mola mola",
      leaderPnlCents: 0,
      gapToLeaderCents: 0,
      runnerUpName: "Competitor 2",
      runnerUpPnlCents: -100,
      marginToRunnerUpCents: 100,
    },
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

test("bankruptcy keeps Ranking PnL separate from ending cash", () => {
  const result = parseCaseResult(rawCase(7, {
    text: [
      "Ranking:",
      "1. Fixed Width 0.25: $2.44",
      "2. Mola mola: $-3.93",
      "Mola mola bankrupt: True (cash balance: -1.69, starting capital: 10.00)",
      "Result: FAIL (score=0.00)",
    ].join("\n"),
  }));
  assert.equal(result.cashPnlCents, -1169);
  assert.equal(result.pnlCents, -393);
  assert.equal(result.ranking.gapToLeaderCents, 637);
});

test("parseRanking records leader gaps and held margins in cents", () => {
  const losing = parseRanking(rawCase(5).text);
  assert.equal(losing.rank, 3);
  assert.equal(losing.participantCount, 4);
  assert.equal(losing.gapToLeaderCents, 200);
  assert.equal(losing.marginToRunnerUpCents, null);

  const held = parseRanking(rawCase(5, { scoreHundredths: 100 }).text);
  assert.equal(held.runnerUpName, "Competitor 2");
  assert.equal(held.marginToRunnerUpCents, 100);
});

test("parseRanking rejects malformed order, duplicates, and missing Mola mola", () => {
  assert.throws(() => parseRanking("Ranking:\n2. Mola mola: $0.00\n1. Other: $-1.00"), /consecutive ranks/);
  assert.throws(() => parseRanking("Ranking:\n1. Mola mola: $1.00\n2. Mola mola: $0.00"), /unique names/);
  assert.throws(() => parseRanking("Ranking:\n1. Other: $1.00\n2. Tail: $0.00"), /Mola mola once/);
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
    /Ranking block/,
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

test("comparePerformance uses score only", () => {
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
  }, base), 0);
  assert.equal(comparePerformance({
    ...base,
    minimumCapital: { endingCashCents: 77, startingCapitalCents: 100 },
  }, base), 0);
  assert.equal(comparePerformance({
    ...base,
    combinedPnlCents: -274,
    minimumCapital: { endingCashCents: 9, startingCapitalCents: 10 },
  }, base), 0);
  assert.equal(comparePerformance(structuredClone(base), base), 0);
});
