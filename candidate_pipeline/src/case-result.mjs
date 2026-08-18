const RESULT_LINE = /^Result:[^\r\n]*$/gm;
const BANKRUPTCY_LINE = /^Mola mola bankrupt:[^\r\n]*$/gm;
const RUNTIME_ERROR_LINE = /^Testcase\s+\d+\s+failed with (?:an unhandled|a runtime) error and is scored 0\.[^\r\n]*$/gim;

function caseType(number) {
  if (number === 1) {
    return "THEO";
  }
  if (number >= 2 && number <= 4) {
    return "VERBOSE";
  }
  if (number >= 5 && number <= 20) {
    return "SCORED";
  }
  throw new Error(`Unsupported case number: ${number}`);
}

function parseHundredths(value, field) {
  const match = value.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (match === null) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  const fraction = match[3] ?? "";
  if (fraction.length > 2 && /[^0]/.test(fraction.slice(2))) {
    throw new Error(`${field} has more than two decimal places: ${value}`);
  }
  const magnitude = (BigInt(match[2]) * 100n) + BigInt((fraction.slice(0, 2) + "00").slice(0, 2));
  const signed = match[1] === "-" ? -magnitude : magnitude;
  const parsed = Number(signed);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${field} is outside the supported range: ${value}`);
  }
  return parsed;
}

function onlyMatch(text, expression, field) {
  const matches = [...text.matchAll(expression)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${field}, found ${matches.length}`);
  }
  return matches[0][0];
}

function runtimeMessage(text, runtimeLine) {
  const remainder = text.slice(text.indexOf(runtimeLine) + runtimeLine.length);
  return remainder
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /(?:Error|Exception):\s*\S/.test(line)) ?? runtimeLine;
}

export function parseCaseResult(rawCase) {
  if (!Number.isInteger(rawCase?.number) || typeof rawCase?.text !== "string") {
    throw new Error("Case must contain an integer number and text");
  }

  const type = caseType(rawCase.number);
  const resultLines = [...rawCase.text.matchAll(RESULT_LINE)].map(([line]) => line);
  const runtimeLines = [...rawCase.text.matchAll(RUNTIME_ERROR_LINE)].map(([line]) => line);
  if (resultLines.length > 1) {
    throw new Error(`Expected exactly one Result field, found ${resultLines.length}`);
  }
  if (runtimeLines.length > 1) {
    throw new Error(`Expected exactly one runtime-error field, found ${runtimeLines.length}`);
  }
  if (resultLines.length + runtimeLines.length !== 1) {
    throw new Error(`Expected exactly one case outcome, found ${resultLines.length + runtimeLines.length}`);
  }
  if (runtimeLines.length === 1) {
    return {
      number: rawCase.number,
      type,
      passed: false,
      scoreHundredths: 0,
      runtimeError: runtimeMessage(rawCase.text, runtimeLines[0]),
    };
  }

  const resultLine = resultLines[0];
  const result = resultLine.match(/^Result:\s*(PASS|FAIL)\b/);
  if (result === null) {
    throw new Error(`Malformed Result field in case ${rawCase.number}`);
  }

  const scoreMatches = [...resultLine.matchAll(/\bscore=([+-]?\d+(?:\.\d+)?)/g)];
  if (scoreMatches.length > 1) {
    throw new Error(`Duplicate score field in case ${rawCase.number}`);
  }
  if (type !== "THEO" && scoreMatches.length !== 1) {
    throw new Error(`Missing score field in case ${rawCase.number}`);
  }

  const parsed = {
    number: rawCase.number,
    type,
    passed: result[1] === "PASS",
  };
  if (scoreMatches.length === 1) {
    parsed.scoreHundredths = parseHundredths(scoreMatches[0][1], "score");
  }

  if (type === "THEO") {
    return parsed;
  }

  const bankruptcyLine = onlyMatch(rawCase.text, BANKRUPTCY_LINE, "bankruptcy field");
  const bankruptcy = bankruptcyLine.match(
    /^Mola mola bankrupt:\s*(True|False)\s*\(cash balance:\s*([+-]?\d+(?:\.\d+)?),\s*starting capital:\s*([+-]?\d+(?:\.\d+)?)\)\s*$/,
  );
  if (bankruptcy === null) {
    throw new Error(`Malformed bankruptcy field in case ${rawCase.number}`);
  }

  parsed.bankrupt = bankruptcy[1] === "True";
  parsed.endingCashCents = parseHundredths(bankruptcy[2], "cash balance");
  parsed.startingCapitalCents = parseHundredths(bankruptcy[3], "starting capital");
  parsed.pnlCents = parsed.endingCashCents - parsed.startingCapitalCents;
  return parsed;
}

export function compareCapital(first, second) {
  const left = BigInt(first.endingCashCents) * BigInt(second.startingCapitalCents);
  const right = BigInt(second.endingCashCents) * BigInt(first.startingCapitalCents);
  return left === right ? 0 : left > right ? 1 : -1;
}
