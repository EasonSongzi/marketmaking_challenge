import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compareCapital } from "./case-result.mjs";

class InputError extends Error {}

function parseOptions(argumentsList) {
  const candidatePaths = [];
  let outputPath;
  for (let index = 0; index < argumentsList.length; index += 2) {
    const option = argumentsList[index];
    const value = argumentsList[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new InputError(`${option ?? "Option"} requires a value`);
    }
    if (option === "--candidate") {
      candidatePaths.push(value);
    } else if (option === "--output") {
      outputPath = value;
    } else {
      throw new InputError(`Unknown option: ${option}`);
    }
  }
  if (candidatePaths.length === 0) {
    throw new InputError("At least one --candidate is required");
  }
  if (!candidatePaths.every(path.isAbsolute)) {
    throw new InputError("Every --candidate must be an absolute path");
  }
  if (!path.isAbsolute(outputPath ?? "")) {
    throw new InputError("--output must be an absolute path");
  }
  return { candidatePaths, outputPath };
}

function evaluationReason(evaluation) {
  if (
    evaluation?.schemaVersion !== 1
    || typeof evaluation.candidateId !== "string"
    || evaluation.candidateId.length === 0
    || typeof evaluation.valid !== "boolean"
    || typeof evaluation.eligible !== "boolean"
  ) {
    return "Evaluation does not match schema version 1";
  }
  if (!evaluation.valid && evaluation.eligible) {
    return "Invalid evaluation cannot be eligible";
  }
  if (!evaluation.valid) {
    return null;
  }

  const summary = evaluation.summary;
  const runtimeErrors = summary?.runtimeErrors ?? 0;
  const capital = summary?.minimumCapital;
  const capitalComplete = capital !== null
    && Number.isSafeInteger(capital?.endingCashCents)
    && Number.isSafeInteger(capital?.startingCapitalCents)
    && capital.startingCapitalCents > 0;
  const rankingComplete = Number.isSafeInteger(summary?.bankruptcies)
    && Number.isSafeInteger(summary?.combinedPnlCents)
    && capitalComplete;
  const unavailableRankingValid = runtimeErrors > 0
    && (summary?.bankruptcies === null || Number.isSafeInteger(summary?.bankruptcies))
    && (summary?.combinedPnlCents === null || Number.isSafeInteger(summary?.combinedPnlCents))
    && (capital === null || capitalComplete);
  if (
    typeof evaluation.sourcePath !== "string"
    || !/^[a-f0-9]{64}$/i.test(evaluation.sourceSha256 ?? "")
    || !Number.isSafeInteger(summary?.passed)
    || !Number.isSafeInteger(summary?.total)
    || summary.total !== 20
    || summary.passed < 0
    || summary.passed > summary.total
    || !Number.isSafeInteger(summary?.scoredPointsHundredths)
    || !Number.isSafeInteger(runtimeErrors)
    || runtimeErrors < 0
    || runtimeErrors > summary.total - summary.passed
    || (!rankingComplete && !unavailableRankingValid)
    || (evaluation.eligible && (
      !rankingComplete || summary.passed !== 20 || summary.bankruptcies !== 0
    ))
    || (evaluation.modifiedLines != null
      && (!Number.isSafeInteger(evaluation.modifiedLines) || evaluation.modifiedLines < 0))
  ) {
    return `Evaluation for ${evaluation.candidateId} is incomplete`;
  }
  return null;
}

async function readEvaluation(evaluationPath) {
  let evaluation;
  try {
    evaluation = JSON.parse(await fs.readFile(evaluationPath, "utf8"));
  } catch (error) {
    throw new InputError(`Cannot read evaluation ${evaluationPath}: ${error.message}`);
  }
  const reason = evaluationReason(evaluation);
  if (reason !== null) {
    throw new InputError(reason);
  }
  return { ...evaluation, evaluationPath };
}

async function verifySource(evaluation) {
  let source;
  try {
    source = await fs.readFile(evaluation.sourcePath);
  } catch (error) {
    throw new InputError(`Cannot read source for ${evaluation.candidateId}: ${error.message}`);
  }
  const currentHash = createHash("sha256").update(source).digest("hex");
  if (currentHash !== evaluation.sourceSha256) {
    throw new InputError(`Source SHA-256 changed for ${evaluation.candidateId}`);
  }
}

function compareCandidates(first, second) {
  const pointDelta = second.summary.scoredPointsHundredths - first.summary.scoredPointsHundredths;
  if (pointDelta !== 0) {
    return pointDelta;
  }
  const capitalComparison = compareCapital(first.summary.minimumCapital, second.summary.minimumCapital);
  if (capitalComparison !== 0) {
    return -capitalComparison;
  }
  const pnlDelta = second.summary.combinedPnlCents - first.summary.combinedPnlCents;
  if (pnlDelta !== 0) {
    return pnlDelta;
  }
  const firstLines = first.modifiedLines ?? Number.MAX_SAFE_INTEGER;
  const secondLines = second.modifiedLines ?? Number.MAX_SAFE_INTEGER;
  if (firstLines !== secondLines) {
    return firstLines - secondLines;
  }
  return first.candidateId < second.candidateId ? -1 : first.candidateId > second.candidateId ? 1 : 0;
}

export function selectCandidates(evaluations) {
  const eligible = evaluations.filter(({ valid, eligible: passedGate }) => valid && passedGate);
  if (eligible.length === 0) {
    return {
      schemaVersion: 1,
      promotion: false,
      winner: null,
      reason: "No candidate passed the promotion gate",
    };
  }
  const winner = [...eligible].sort(compareCandidates)[0];
  return {
    schemaVersion: 1,
    promotion: true,
    winner: {
      candidateId: winner.candidateId,
      sourcePath: winner.sourcePath,
      sourceSha256: winner.sourceSha256,
      evaluationPath: winner.evaluationPath,
    },
  };
}

export async function selectFromFiles(candidatePaths) {
  const evaluations = await Promise.all(candidatePaths.map(readEvaluation));
  const candidateIds = evaluations.map(({ candidateId }) => candidateId);
  if (new Set(candidateIds).size !== candidateIds.length) {
    throw new InputError("Candidate IDs must be unique");
  }
  await Promise.all(evaluations.filter(({ valid }) => valid).map(verifySource));
  return selectCandidates(evaluations);
}

async function main() {
  try {
    const options = parseOptions(process.argv.slice(2));
    const selection = await selectFromFiles(options.candidatePaths);
    await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
    await fs.writeFile(options.outputPath, `${JSON.stringify(selection, null, 2)}\n`);
    console.log(`Saved selection to ${options.outputPath}`);
    console.log(selection.promotion ? `Winner: ${selection.winner.candidateId}` : selection.reason);
    process.exitCode = selection.promotion ? 0 : 2;
  } catch (error) {
    if (error instanceof InputError) {
      console.error(`Invalid selection input: ${error.message}`);
      process.exitCode = 3;
      return;
    }
    throw error;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Selection failed: ${error.message}`);
    process.exitCode = 1;
  });
}
