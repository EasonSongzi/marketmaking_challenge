import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compareCapital, parseCaseResult } from "./case-result.mjs";

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
  };
}

export function evaluateCandidate(rawReport, baseline, currentSourceSha256, lineCount = null) {
  const reasons = [];
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
    reasons.push("Raw report schemaVersion is not supported");
  }
  if (candidateId === null) {
    reasons.push("Raw report label is missing");
  }
  if (sourcePath === null || sourceSha256 === null) {
    reasons.push("Raw report source path or SHA-256 is missing");
  } else if (currentSourceSha256 !== sourceSha256) {
    reasons.push("Source SHA-256 no longer matches the tested source");
  }

  const rawCases = Array.isArray(rawReport?.cases) ? rawReport.cases : [];
  if (!Array.isArray(rawReport?.cases)) {
    reasons.push("Raw report cases must be an array");
  }
  if (rawCases.length !== 20) {
    reasons.push(`Expected exactly 20 cases, found ${rawCases.length}`);
  }

  const numbers = rawCases.map((rawCase) => rawCase?.number);
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    reasons.push("Raw report contains duplicate case numbers");
  }
  const missingNumbers = Array.from({ length: 20 }, (_, index) => index + 1)
    .filter((number) => !uniqueNumbers.has(number));
  if (missingNumbers.length > 0) {
    reasons.push(`Raw report is missing case numbers: ${missingNumbers.join(", ")}`);
  }

  const parsedCases = [];
  for (const rawCase of rawCases) {
    try {
      parsedCases.push(parseCaseResult(rawCase));
    } catch (error) {
      reasons.push(`Case ${rawCase?.number ?? "unknown"} cannot be parsed: ${error.message}`);
    }
  }

  const failed = parsedCases.filter((result) => !result.passed);
  if (failed.length > 0) {
    reasons.push(`Cases did not pass: ${failed.map(({ number }) => number).join(", ")}`);
  }
  const financialCases = parsedCases.filter(({ number }) => number >= 2 && number <= 20);
  if (financialCases.length !== 19) {
    reasons.push(`Expected bankruptcy data for 19 cases, found ${financialCases.length}`);
  }
  const bankruptcies = financialCases.filter(({ bankrupt }) => bankrupt);
  if (bankruptcies.length > 0) {
    reasons.push(`Bankruptcy reported in cases: ${bankruptcies.map(({ number }) => number).join(", ")}`);
  }
  const scoredCases = parsedCases.filter(({ number, scoreHundredths }) => (
    number >= 5 && number <= 20 && Number.isSafeInteger(scoreHundredths)
  ));
  if (scoredCases.length !== 16) {
    reasons.push(`Expected exactly 16 SCORED results, found ${scoredCases.length}`);
  }

  const minimumCapital = financialCases.reduce(
    (minimum, result) => minimum === null || compareCapital(result, minimum) < 0 ? result : minimum,
    null,
  );
  const summary = {
    passed: parsedCases.filter(({ passed }) => passed).length,
    total: rawCases.length,
    bankruptcies: bankruptcies.length,
    scoredPointsHundredths: scoredCases.reduce((total, result) => total + result.scoreHundredths, 0),
    combinedPnlCents: scoredCases.reduce((total, result) => total + result.pnlCents, 0),
    minimumCapital: minimumCapital === null ? null : {
      endingCashCents: minimumCapital.endingCashCents,
      startingCapitalCents: minimumCapital.startingCapitalCents,
    },
  };

  const invalidBaseline = baselineReason(baseline);
  if (invalidBaseline !== null) {
    reasons.push(invalidBaseline);
  }
  const valid = reasons.length === 0;
  let eligible = false;
  if (valid) {
    const pointComparison = summary.scoredPointsHundredths - baseline.summary.scoredPointsHundredths;
    eligible = pointComparison > 0 || (
      pointComparison === 0
      && compareCapital(summary.minimumCapital, baseline.summary.minimumCapital) > 0
    );
    if (!eligible) {
      reasons.push("Candidate did not strictly exceed the baseline");
    }
  }

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
      combinedPnlCents: summary.combinedPnlCents - baseline.summary.combinedPnlCents,
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
