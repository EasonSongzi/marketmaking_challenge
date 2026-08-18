import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compareCapital, comparePerformance, parseCaseResult } from "./case-result.mjs";

class InputError extends Error {}

function parseOptions(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const option = argumentsList[index];
    const value = argumentsList[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new InputError(`${option ?? "Option"} requires a value`);
    }
    if (option === "--run-dir") {
      options.runDirectory = value;
    } else if (option === "--baseline") {
      options.baselinePath = value;
    } else {
      throw new InputError(`Unknown option: ${option}`);
    }
  }
  if (!path.isAbsolute(options.runDirectory ?? "")) {
    throw new InputError("--run-dir must be an absolute path");
  }
  if (!path.isAbsolute(options.baselinePath ?? "")) {
    throw new InputError("--baseline must be an absolute path");
  }
  return options;
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    throw new InputError(`Cannot read JSON ${filePath}: ${error.message}`);
  }
}

async function sourceHash(sourcePath) {
  try {
    const source = await fs.readFile(sourcePath);
    return createHash("sha256").update(source).digest("hex");
  } catch (error) {
    throw new InputError(`Cannot read source ${sourcePath}: ${error.message}`);
  }
}

export function countModifiedLines(sourcePath) {
  const resolvedSourcePath = realpathSync(sourcePath);
  const directory = path.dirname(resolvedSourcePath);
  const rootResult = spawnSync("git", ["-C", directory, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  });
  if (rootResult.status !== 0) {
    return null;
  }

  const root = rootResult.stdout.trim();
  const relativeSource = path.relative(root, resolvedSourcePath);
  const tracked = spawnSync("git", ["-C", root, "ls-files", "--error-unmatch", relativeSource], {
    encoding: "utf8",
  });
  if (tracked.status !== 0) {
    return null;
  }

  const diff = spawnSync("git", ["-C", root, "diff", "--numstat", "HEAD", "--", relativeSource], {
    encoding: "utf8",
  });
  if (diff.status !== 0) {
    return null;
  }
  if (diff.stdout.trim() === "") {
    return 0;
  }
  const [added, deleted] = diff.stdout.trim().split(/\s+/);
  return /^\d+$/.test(added) && /^\d+$/.test(deleted) ? Number(added) + Number(deleted) : null;
}

function baselineReason(baseline) {
  const summary = baseline?.summary;
  const supportedVersion = baseline?.schemaVersion === 1 || baseline?.schemaVersion === 2;
  const validV2Identity = baseline?.schemaVersion !== 2 || (
    typeof baseline.sourceSha256 === "string"
    && /^[a-f0-9]{64}$/i.test(baseline.sourceSha256)
    && typeof baseline.experimentId === "string"
    && baseline.experimentId.length > 0
  );
  const integerFields = [
    summary?.passed,
    summary?.total,
    summary?.bankruptcies,
    summary?.scoredPointsHundredths,
    summary?.combinedPnlCents,
    summary?.minimumCapital?.endingCashCents,
    summary?.minimumCapital?.startingCapitalCents,
  ];
  if (
    !supportedVersion
    || !validV2Identity
    || !integerFields.every(Number.isSafeInteger)
    || summary.total !== 20
    || summary.minimumCapital.startingCapitalCents <= 0
  ) {
    return "Baseline JSON does not match supported schema version 1 or 2";
  }
  return null;
}

function emptySummary() {
  return {
    passed: 0,
    total: 0,
    bankruptcies: 0,
    scoredPointsHundredths: 0,
    combinedPnlCents: 0,
    minimumCapital: null,
    runtimeErrors: 0,
  };
}

function runtimeReasons(runtimeCases) {
  const casesByMessage = new Map();
  for (const result of runtimeCases) {
    const numbers = casesByMessage.get(result.runtimeError) ?? [];
    numbers.push(result.number);
    casesByMessage.set(result.runtimeError, numbers);
  }
  return [...casesByMessage].map(([message, numbers]) => (
    `Candidate runtime error in cases ${numbers.join(", ")}: ${message}`
  ));
}

export function evaluateCandidate(rawReport, baseline, currentSourceSha256, lineCount = null) {
  const evidenceReasons = [];
  const performanceReasons = [];
  const candidateId = typeof rawReport?.label === "string" && rawReport.label.length > 0
    ? rawReport.label
    : null;
  const sourcePath = typeof rawReport?.sourcePath === "string" && rawReport.sourcePath.length > 0
    ? rawReport.sourcePath
    : null;
  const sourceSha256 = typeof rawReport?.sourceSha256 === "string"
    && /^[a-f0-9]{64}$/i.test(rawReport.sourceSha256)
    ? rawReport.sourceSha256
    : null;

  if (rawReport?.schemaVersion !== 1) {
    evidenceReasons.push("Raw report schemaVersion is not supported");
  }
  if (candidateId === null) {
    evidenceReasons.push("Raw report label is missing");
  }
  if (sourcePath === null || sourceSha256 === null) {
    evidenceReasons.push("Raw report source path or SHA-256 is missing");
  } else if (currentSourceSha256 !== sourceSha256) {
    evidenceReasons.push("Source SHA-256 no longer matches the tested source");
  }

  const rawCases = Array.isArray(rawReport?.cases) ? rawReport.cases : [];
  if (!Array.isArray(rawReport?.cases)) {
    evidenceReasons.push("Raw report cases must be an array");
  }
  if (rawCases.length !== 20) {
    evidenceReasons.push(`Expected exactly 20 cases, found ${rawCases.length}`);
  }

  const numbers = rawCases.map((rawCase) => rawCase?.number);
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    evidenceReasons.push("Raw report contains duplicate case numbers");
  }
  const missingNumbers = Array.from({ length: 20 }, (_, index) => index + 1)
    .filter((number) => !uniqueNumbers.has(number));
  if (missingNumbers.length > 0) {
    evidenceReasons.push(`Raw report is missing case numbers: ${missingNumbers.join(", ")}`);
  }

  const parsedCases = [];
  for (const rawCase of rawCases) {
    try {
      parsedCases.push(parseCaseResult(rawCase));
    } catch (error) {
      evidenceReasons.push(`Case ${rawCase?.number ?? "unknown"} cannot be parsed: ${error.message}`);
    }
  }

  const failed = parsedCases.filter((result) => !result.passed);
  if (failed.length > 0) {
    performanceReasons.push(`Cases did not pass: ${failed.map(({ number }) => number).join(", ")}`);
  }
  const runtimeCases = parsedCases.filter(({ runtimeError }) => typeof runtimeError === "string");
  performanceReasons.push(...runtimeReasons(runtimeCases));
  const financialOutcomes = parsedCases.filter(({ number }) => number >= 2 && number <= 20);
  if (financialOutcomes.length !== 19) {
    evidenceReasons.push(`Expected complete outcomes for 19 financial cases, found ${financialOutcomes.length}`);
  }
  const financialCases = financialOutcomes.filter(({ startingCapitalCents }) => (
    Number.isSafeInteger(startingCapitalCents)
  ));
  const bankruptcies = financialCases.filter(({ bankrupt }) => bankrupt);
  if (bankruptcies.length > 0) {
    performanceReasons.push(`Bankruptcy reported in cases: ${bankruptcies.map(({ number }) => number).join(", ")}`);
  }
  const scoredCases = parsedCases.filter(({ number, scoreHundredths }) => (
    number >= 5 && number <= 20 && Number.isSafeInteger(scoreHundredths)
  ));
  if (scoredCases.length !== 16) {
    evidenceReasons.push(`Expected exactly 16 SCORED results, found ${scoredCases.length}`);
  }

  const minimumCapital = financialCases.reduce(
    (minimum, result) => minimum === null || compareCapital(result, minimum) < 0 ? result : minimum,
    null,
  );
  const financialDataMissing = runtimeCases.some(({ number }) => number >= 2 && number <= 20);
  const scoredDataMissing = runtimeCases.some(({ number }) => number >= 5 && number <= 20);
  const summary = {
    passed: parsedCases.filter(({ passed }) => passed).length,
    total: rawCases.length,
    bankruptcies: financialDataMissing ? null : bankruptcies.length,
    scoredPointsHundredths: scoredCases.reduce((total, result) => total + result.scoreHundredths, 0),
    combinedPnlCents: scoredDataMissing
      ? null
      : scoredCases.reduce((total, result) => total + result.pnlCents, 0),
    minimumCapital: financialDataMissing || minimumCapital === null ? null : {
      endingCashCents: minimumCapital.endingCashCents,
      startingCapitalCents: minimumCapital.startingCapitalCents,
    },
    runtimeErrors: runtimeCases.length,
  };

  const invalidBaseline = baselineReason(baseline);
  if (invalidBaseline !== null) {
    evidenceReasons.push(invalidBaseline);
  }
  const valid = evidenceReasons.length === 0;
  let eligible = false;
  if (valid && performanceReasons.length === 0) {
    eligible = comparePerformance(summary, baseline.summary) > 0;
    if (!eligible) {
      performanceReasons.push("Candidate did not strictly exceed the baseline");
    }
  }
  const reasons = [...evidenceReasons, ...performanceReasons];

  return {
    schemaVersion: 1,
    candidateId,
    valid,
    eligible,
    sourcePath,
    sourceSha256,
    modifiedLines: Number.isSafeInteger(lineCount) && lineCount >= 0 ? lineCount : null,
    summary: rawCases.length === 0 ? emptySummary() : summary,
    baselineDelta: invalidBaseline === null ? {
      scoredPointsHundredths:
        summary.scoredPointsHundredths - baseline.summary.scoredPointsHundredths,
      combinedPnlCents: summary.combinedPnlCents === null
        ? null
        : summary.combinedPnlCents - baseline.summary.combinedPnlCents,
    } : null,
    reasons,
  };
}

async function findRawReport(runDirectory) {
  let entries;
  try {
    entries = await fs.readdir(runDirectory, { withFileTypes: true });
  } catch (error) {
    throw new InputError(`Cannot read run directory ${runDirectory}: ${error.message}`);
  }
  const reports = entries.filter(
    (entry) => entry.isFile() && /^hackerrank-run-.*\.json$/.test(entry.name),
  );
  if (reports.length !== 1) {
    throw new InputError(`Expected exactly one raw HackerRank JSON, found ${reports.length}`);
  }
  return path.join(runDirectory, reports[0].name);
}

export async function evaluateRun({ runDirectory, baselinePath }) {
  const rawPath = await findRawReport(runDirectory);
  const rawReport = await readJson(rawPath);
  const baseline = await readJson(baselinePath);
  let currentSourceSha256 = null;
  if (typeof rawReport?.sourcePath === "string" && rawReport.sourcePath.length > 0) {
    currentSourceSha256 = await sourceHash(rawReport.sourcePath);
  }
  return evaluateCandidate(
    rawReport,
    baseline,
    currentSourceSha256,
    typeof rawReport?.sourcePath === "string" ? countModifiedLines(rawReport.sourcePath) : null,
  );
}

async function main() {
  let options;
  try {
    options = parseOptions(process.argv.slice(2));
    const evaluation = await evaluateRun(options);
    const outputPath = path.join(options.runDirectory, "evaluation.json");
    await fs.writeFile(outputPath, `${JSON.stringify(evaluation, null, 2)}\n`);
    console.log(`Saved evaluation to ${outputPath}`);
    console.log(evaluation.reasons.join("\n") || "Candidate passed the promotion gate");
    process.exitCode = evaluation.valid ? (evaluation.eligible ? 0 : 2) : 3;
  } catch (error) {
    if (error instanceof InputError) {
      console.error(`Invalid evaluation input: ${error.message}`);
      process.exitCode = 3;
      return;
    }
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Evaluation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
