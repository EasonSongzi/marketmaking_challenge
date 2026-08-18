export const baseline = {
  schemaVersion: 1,
  strategy: "rfq-only-v1",
  resultArtifact: "results/baselines/rfq-only-v1.md",
  summary: {
    passed: 20,
    total: 20,
    bankruptcies: 0,
    scoredPointsHundredths: 900,
    combinedPnlCents: -273,
    minimumCapital: {
      endingCashCents: 769,
      startingCapitalCents: 1000,
    },
  },
};

export const baselineV2 = {
  ...baseline,
  schemaVersion: 2,
  sourceSha256: "b".repeat(64),
  experimentId: "experiment-001",
};

function decimal(hundredths) {
  const sign = hundredths < 0 ? "-" : "";
  const magnitude = Math.abs(hundredths);
  return `${sign}${Math.floor(magnitude / 100)}.${String(magnitude % 100).padStart(2, "0")}`;
}

export function rawCase(number, options = {}) {
  const passed = options.passed ?? true;
  if (number === 1) {
    return {
      number,
      text: options.text ?? `Compiler Message\nResult: ${passed ? "PASS" : "FAIL"} (max_error=0.0000)`,
    };
  }
  const endingCashCents = options.endingCashCents ?? 1000;
  const startingCapitalCents = options.startingCapitalCents ?? 1000;
  const scoreHundredths = options.scoreHundredths ?? (number <= 4 ? 100 : 60);
  return {
    number,
    text: options.text ?? [
      "Ranking:",
      "1. Mola mola: $0.0",
      `Mola mola bankrupt: ${options.bankrupt ? "True" : "False"} (cash balance: ${decimal(endingCashCents)}, starting capital: ${decimal(startingCapitalCents)})`,
      `Result: ${passed ? "PASS" : "FAIL"} (score=${decimal(scoreHundredths)})`,
    ].join("\n"),
  };
}

export function rawReport(overrides = {}) {
  return {
    schemaVersion: 1,
    createdAt: "2026-08-18T03:27:46.978Z",
    questionUrl: "https://www.hackerrank.com/example",
    label: "candidate-a",
    sourcePath: "/tmp/worktree/Market_making_binary_option.py",
    sourceSha256: "a".repeat(64),
    cases: Array.from({ length: 20 }, (_, index) => rawCase(index + 1)),
    ...overrides,
  };
}

export function evaluation(overrides = {}) {
  return {
    schemaVersion: 1,
    candidateId: "candidate-a",
    valid: true,
    eligible: true,
    sourcePath: "/tmp/worktree/Market_making_binary_option.py",
    sourceSha256: "a".repeat(64),
    modifiedLines: 10,
    summary: {
      passed: 20,
      total: 20,
      bankruptcies: 0,
      scoredPointsHundredths: 1000,
      combinedPnlCents: 100,
      minimumCapital: {
        endingCashCents: 800,
        startingCapitalCents: 1000,
      },
    },
    baselineDelta: {
      scoredPointsHundredths: 100,
      combinedPnlCents: 373,
    },
    reasons: [],
    evaluationPath: "/tmp/evaluation.json",
    ...overrides,
  };
}
