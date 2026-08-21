export const SCORED_CASES = Object.freeze(Array.from({ length: 16 }, (_, index) => index + 5));
export const GUARD_CASES = Object.freeze([1, 2, 3, 4]);

function resultMap(evaluation) {
  return new Map((evaluation?.caseResults ?? []).map((result) => [result.number, result]));
}

export function promotionSafetyReason(evaluation) {
  const summary = evaluation?.summary;
  if (evaluation?.valid !== true || summary?.total !== 20) return "Candidate evidence is incomplete";
  if ((summary.runtimeErrors ?? 0) !== 0) return "Candidate has a runtime error";

  if (evaluation.schemaVersion === 1 || !Array.isArray(evaluation.caseResults)) {
    return summary.passed === 20 && summary.bankruptcies === 0
      ? null
      : "Legacy evidence must pass 20/20 with zero bankruptcies";
  }

  const cases = resultMap(evaluation);
  if (cases.size !== 20 || [...cases.keys()].some((number) => number < 1 || number > 20)) {
    return "Candidate does not contain twenty unique case results";
  }
  const failedGuard = GUARD_CASES.filter((number) => !cases.get(number)?.passed);
  if (failedGuard.length > 0) return `Guard cases did not pass: ${failedGuard.join(", ")}`;
  const invalidFailures = SCORED_CASES.filter((number) => {
    const result = cases.get(number);
    return !result?.passed && result?.bankrupt !== true;
  });
  if (invalidFailures.length > 0) {
    return `Scored cases failed without bankruptcy: ${invalidFailures.join(", ")}`;
  }
  return null;
}

export function promotionReason(evaluation, baselineSummary) {
  const safety = promotionSafetyReason(evaluation);
  if (safety !== null) return safety;
  if (evaluation.summary.scoredPointsHundredths <= baselineSummary.scoredPointsHundredths) {
    return "Candidate did not strictly exceed the baseline score";
  }
  return null;
}

export function promotionEligible(evaluation, baselineSummary) {
  return promotionReason(evaluation, baselineSummary) === null;
}

export function defaultObjective() {
  return {
    kind: "exploit",
    targetCases: [...SCORED_CASES],
    expectedGainHundredths: 1,
    collateralBudgetHundredths: 1600,
  };
}

function caseScore(result) {
  return Number.isSafeInteger(result?.scoreHundredths) ? result.scoreHundredths : 0;
}

function targetScore(evaluation, objective) {
  const cases = resultMap(evaluation);
  return objective.targetCases.reduce((total, number) => total + caseScore(cases.get(number)), 0);
}

function targetGap(evaluation, objective) {
  const cases = resultMap(evaluation);
  return objective.targetCases.reduce((total, number) => {
    const gap = cases.get(number)?.ranking?.gapToLeaderCents;
    return total + (Number.isSafeInteger(gap) ? gap : Number.MAX_SAFE_INTEGER / 100);
  }, 0);
}

function collateralLoss(evaluation, parent, objective) {
  const targets = new Set(objective.targetCases);
  const candidateCases = resultMap(evaluation);
  const parentCases = resultMap(parent);
  return SCORED_CASES.reduce((total, number) => {
    if (targets.has(number)) return total;
    return total + Math.max(0, caseScore(parentCases.get(number)) - caseScore(candidateCases.get(number)));
  }, 0);
}

export function objectiveOutcome(evaluation, parent, objective = defaultObjective()) {
  const hasCases = Array.isArray(evaluation?.caseResults) && Array.isArray(parent?.caseResults);
  if (!hasCases) {
    const gain = evaluation.summary.scoredPointsHundredths - parent.summary.scoredPointsHundredths;
    return {
      targetGainHundredths: gain,
      targetGapCents: null,
      collateralLossHundredths: 0,
      withinBudget: true,
      expectedMet: gain >= objective.expectedGainHundredths,
    };
  }
  const gain = targetScore(evaluation, objective) - targetScore(parent, objective);
  const loss = collateralLoss(evaluation, parent, objective);
  return {
    targetGainHundredths: gain,
    targetGapCents: targetGap(evaluation, objective),
    collateralLossHundredths: loss,
    withinBudget: loss <= objective.collateralBudgetHundredths,
    expectedMet: gain >= objective.expectedGainHundredths
      && loss <= objective.collateralBudgetHundredths,
  };
}

function compareQuality(first, second, objective, parent) {
  const firstSafe = promotionSafetyReason(first) === null;
  const secondSafe = promotionSafetyReason(second) === null;
  if (firstSafe !== secondSafe) return firstSafe ? -1 : 1;
  const firstOutcome = objectiveOutcome(first, parent, objective);
  const secondOutcome = objectiveOutcome(second, parent, objective);
  if (firstOutcome.withinBudget !== secondOutcome.withinBudget) {
    return firstOutcome.withinBudget ? -1 : 1;
  }
  if (firstOutcome.targetGainHundredths !== secondOutcome.targetGainHundredths) {
    return secondOutcome.targetGainHundredths - firstOutcome.targetGainHundredths;
  }
  if (
    firstOutcome.targetGapCents !== null
    && secondOutcome.targetGapCents !== null
    && firstOutcome.targetGapCents !== secondOutcome.targetGapCents
  ) {
    return firstOutcome.targetGapCents - secondOutcome.targetGapCents;
  }
  if (first.summary.scoredPointsHundredths !== second.summary.scoredPointsHundredths) {
    return second.summary.scoredPointsHundredths - first.summary.scoredPointsHundredths;
  }
  return 0;
}

export function compareObjective(first, second, objective = defaultObjective(), parent = second) {
  const quality = compareQuality(first, second, objective, parent);
  if (quality !== 0) return quality;
  const firstLines = first.modifiedLines ?? Number.MAX_SAFE_INTEGER;
  const secondLines = second.modifiedLines ?? Number.MAX_SAFE_INTEGER;
  if (firstLines !== secondLines) return firstLines - secondLines;
  return first.candidateId.localeCompare(second.candidateId);
}

export function improvesObjective(candidate, parent, objective = defaultObjective()) {
  return compareQuality(candidate, parent, objective, parent) < 0;
}
