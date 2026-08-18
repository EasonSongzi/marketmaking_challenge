# Rate Estimator × Trading Strategy Interaction Plan

**Status:** Research proposal  
**Date:** 2026-08-18  
**Current score:** 12.30 / 16.00 SCORED points

## Executive conclusion

The current strategy is at a local optimum for one-variable tuning. Further sweeps of ordinary quote width or FOK edge are unlikely to improve the score because the useful thresholds have already been mapped. The next promising search direction is not a better constant; it is the interaction between the warm-up rate estimator and the trading policy that consumes its fair values.

The immediate target is 12.50:

- keep first place in case 9;
- move from third to second in case 17;
- preserve the decisive FOK behavior that keeps first place in case 16.

The next target is 12.80 by also winning case 15. The most plausible route is a partially shrunk likelihood estimator combined with a policy that changes which marginal trades are executed, rather than continuing to optimize estimation and execution independently.

## Current evidence

The current source matches the recorded champion SHA-256. It passes 20/20 tests with zero THEO error, scores 12.30/16.00, earns 77.22 combined PnL, and has a minimum remaining-capital ratio of 5.98/10.00. See the [champion result](../results/champion/result.md) and [current strategy](../Market_making_binary_option.py).

The challenge objective is rank-based. RFQs are routed to the best quote, FOKs are split among accepting market makers, and SCORED points depend on final within-case PnL rank. See the [challenge rules](../challenge.md). This creates a discontinuous objective: an economically meaningful PnL improvement can be worth zero points until it crosses a competitor, while one lost fill can cross a rank boundary and sharply reduce the score.

The completed experiments establish the following boundaries:

| Change | Score | Combined PnL | Important effect |
| --- | ---: | ---: | --- |
| Current champion | 12.30 | 77.22 | Reference strategy |
| Quantity-tier FOK edge of 3.4 cents | 12.30 | 79.36 | Strictly better PnL with the same score and minimum-capital ratio |
| Quantity-tier FOK edge of at least 3.5 cents | 11.70 | about 57 | Loses the critical case 16 FOK and falls from first to third |
| Uniform 4-cent quote | 12.10 | 101.03 | Large economic gain, but case 17 falls from third to fourth |
| One-sided loss shading | 12.10 | 93.07 | Improves economics and capital, but also loses 0.20 points |
| Pure rate likelihood | 12.20 | 100.48 | Improves case 17 but loses case 9 |

The detailed evidence is recorded in the [latest experiment report](../results/experiments/market-loop-20260818-3.md).

## Why the plateau exists

The exact pricing function is not the bottleneck: THEO error is already zero when the true parameters are supplied. Live trading uses parameters estimated from a finite warm-up history, and small estimation changes can alter rounded penny prices and binary accept/reject decisions.

The causal chain is:

1. Warm-up data produces estimated rate parameters.
2. Estimated parameters produce live option probabilities.
3. Probabilities are rounded into penny quotes or compared with a hard FOK edge.
4. Penny-level changes alter RFQ routing and FOK participation.
5. Different fills alter final PnL.
6. PnL matters only when it crosses a competitor's rank boundary.

This explains why parameter accuracy, total PnL, and score do not move monotonically together. Pure likelihood contains useful information—the observed fair value can move materially, in one verbose example from roughly 0.53 to 0.20—but its finite-sample variance is large enough to change marginal trades in the wrong direction. The correct target is therefore not the statistically purest estimator in isolation. It is the estimator-policy pair that makes the best discrete trading decisions.

## Core research hypothesis

Let

- `theta_J` be the current moment/regression estimator with Jeffreys-smoothed rate-transition probabilities;
- `theta_L` be the bounded transition-likelihood estimator;
- `lambda` be the likelihood weight.

The first estimator family should use parameter-level shrinkage:

```text
theta(lambda) = (1 - lambda) * theta_J + lambda * theta_L
```

Test `lambda` values of 0.25, 0.50, and 0.75. The two endpoints remain useful controls: `lambda = 0` is the current smoothed estimator, and `lambda = 1` is pure likelihood.

Parameter-level blending is preferable for the first experiment because it preserves one coherent rate process for all expiries. Since both endpoint estimates are feasible, convex interpolation also preserves the basic probability constraints. If clipping makes the response unexpectedly nonlinear, price-level probability blending can be retained as a separate fallback rather than silently mixed into the same experiment.

The alternative estimator family is penalized likelihood or MAP. A Jeffreys prior can regularize the three transition outcomes, while a weak prior centered on the current reversion estimate can prevent the likelihood optimum from overreacting to a short history. This should be tested only after the simple three-point blend identifies whether the useful region is closer to the current estimator or pure likelihood.

The hypothesis is falsified if every partially shrunk estimator either loses case 9 without improving case 17 or preserves the current ranks without moving case 15 closer to first.

## Experimental program

### Phase 0: establish the stronger baseline

Before spending another live evaluation, finish and verify the pipeline change that compares candidates lexicographically by:

1. SCORED points;
2. combined PnL;
3. minimum-capital ratio.

Then rebind the cached `q2-edge034-fine` result to the current champion. Its 3.4-cent FOK edge for quantities above two has the same 12.30 score and 5.98/10.00 minimum capital as the champion, but improves combined PnL from 77.22 to 79.36. Under the updated comparison it should become the experiment baseline without consuming a duplicate HackerRank run. The relevant comparison code is in [case-result.mjs](../candidate_pipeline/src/case-result.mjs) and [evaluate.mjs](../candidate_pipeline/src/evaluate.mjs).

This baseline also encodes a hard boundary: keep the large-order edge at 3.4 cents. Do not cross the observed 3.5-cent threshold during estimator experiments, because that removes the case 16 trade responsible for 0.60 points.

### Phase 1: estimator shrinkage on the stronger baseline

Run the following candidates from the 3.4-cent quantity-tier baseline while holding quote and FOK logic fixed:

| Candidate | Likelihood weight | Purpose |
| --- | ---: | --- |
| `rate-hybrid-025` | 0.25 | Conservative signal injection; best chance to protect case 9 |
| `rate-hybrid-050` | 0.50 | Balanced bias-variance trade-off |
| `rate-hybrid-075` | 0.75 | Strong likelihood signal; best chance to reproduce the case 17 gain |
| `rate-likelihood-q2` | 1.00 | Interaction control: pure likelihood plus the protected large-order FOK rule |

The pure likelihood control matters even though pure likelihood has already been tested. Its interaction with the 3.4-cent quantity tier has not been measured, and that gate may suppress exactly the marginal large fills that caused a rank loss.

Select candidates by per-case behavior, not combined PnL alone. A candidate is an immediate success if it keeps case 9 first, moves case 17 to second, preserves case 16 first, and reaches at least 12.50. A 12.20-12.40 candidate may still be saved as a near-miss parent if it clearly improves case 15 or 17 and exposes a specific trading-policy repair for the lost points.

### Phase 2: cross-method interaction experiments

Do not require an estimator candidate to beat the champion before using it as a parent. The previous loop could not discover compensating interactions because a 12.20 estimator was rejected before a quote or unwind method could be added. Preserve full-source near-miss challengers and branch from them.

Test these combinations in priority order:

#### 1. Rate hybrid + inventory unwind

This is the highest-priority interaction. Historical unwind variants improved PnL in cases 9, 15, and 17, while an unwind path is less likely than a global quote change to recreate the case 17 RFQ-routing externality. The working hypothesis is that the estimator improves trade direction and the unwind rule repairs positions created by estimation noise.

Use the best one or two Phase 1 estimators. Preserve the 3.4-cent large-order boundary and change only the narrow unwind behavior needed to test the interaction.

#### 2. Rate hybrid + one-sided loss shading

Loss-side shading materially improved PnL and capital but lost case 17 when used with the current estimator. A hybrid estimator may restore case 17 through better fair values while the shade filters adverse or capital-intensive RFQ fills. This combination is especially relevant to case 15, where the champion is only 4.53 behind first and pure likelihood reduced the gap to roughly 1.03.

Start with the proven one-cent shade beyond a 0.50 per-contract maximum-loss threshold. Do not tune both the estimator and shade constants simultaneously in the first interaction run.

#### 3. Rate hybrid + uniform 4-cent quotes

This is the most aggressive candidate. Uniform 4-cent quotes produced 101.03 PnL but lost 0.20 points because case 17 fell in rank. Pairing them with the estimator signal may restore case 17, protect case 9, and cross the case 15 leader. Because this policy changes RFQ routing globally, run it only after the more targeted unwind and one-sided-shade combinations.

### Phase 3: MAP refinement

If Phase 1 identifies a useful interval—for example, 0.25 protects case 9 while 0.50 improves case 17—replace the arbitrary interpolation with a regularized likelihood fit centered in that region. Keep the initial refinement small:

- one Jeffreys/Dirichlet transition prior;
- one weak reversion-strength penalty;
- no simultaneous quote or FOK constant sweep.

The purpose is to replace a useful empirical blend with a more stable estimator, not to open another large hyperparameter search.

## Required diagnostics

Aggregate score is insufficient for this program. Record the following for every candidate:

| Level | Required measurements |
| --- | --- |
| Overall | pass count, bankruptcies, SCORED points, combined PnL, minimum-capital ratio |
| Cases 9, 15, 16, 17 | rank, strategy PnL, leader PnL, gap to the next rank boundary, points |
| Estimation | fitted up/down probabilities, reversion strength, and delta from both endpoint estimators |
| Pricing | largest live fair-value changes, especially changes that cross a penny quote or FOK threshold |
| Execution | RFQ fills by side, accepted FOKs, quantities, prices, and worst-case capital used |
| Attribution | which changed pricing decision produced each changed fill and each final rank change |

The key diagnostic artifact should be a decision-diff report between a candidate and its parent. It should answer three questions:

1. Which option probabilities changed enough to alter a discrete decision?
2. Which fills were added or removed as a result?
3. Which of those fills moved the final rank?

Without this attribution, a large PnL change can lead to another unproductive constant sweep.

## Promotion and retention rules

Use the following hierarchy:

1. A valid score improvement always has priority.
2. At equal score, prefer higher combined PnL, then the higher minimum-capital ratio.
3. Never promote a candidate with a failing test, bankruptcy, or malformed evidence.
4. Retain a lower-scoring near-miss only as an experimental parent when it improves a named target case and has a concrete compensating interaction to test.
5. Do not rerun an identical source SHA; rebind cached evidence to the current champion and reevaluate eligibility locally.

The research milestones are:

| Milestone | Required outcome |
| --- | --- |
| 12.50 | Case 9 remains first and case 17 becomes second, with case 16 protected |
| 12.80 | The 12.50 conditions remain true and case 15 becomes first |
| Structural follow-up | Capital-aware risk control improves score or creates a clear new near-boundary case |

## Deferred structural direction

Dynamic risk management has higher potential upside than another constant sweep, but it should follow the estimator interactions. The current FOK rule uses a fixed 0.50 worst-case-loss limit regardless of whether starting capital is 10, 20, or 40, and the strategy's internal cash balance is not updated as trades occur and options expire.

A later design can:

- scale FOK risk by initial or remaining capital;
- track actual collateral committed by each option and release it at expiry;
- expand participation only in high-capital cases;
- condition the required edge on counterparty history and realized profitability.

This direction changes state management and risk allocation, so it should not be mixed into the estimator experiment until the simpler interaction hypotheses have been resolved.

## Experiments to stop running

Do not spend additional evaluations on:

- ordinary FOK edges from 1.5 to 3.4 cents without another structural change;
- any large-order edge at or above 3.5 cents;
- a standalone global quote change from 3 to 4 cents;
- quote size three;
- simple inventory-center skew;
- Gaussian MLE residual-variance scaling.

These axes have either reached a score plateau or already crossed a known harmful rank boundary.

## Final decision principle

The strategy should optimize rank transitions, not theoretical elegance or total PnL in isolation. The next breakthrough is most likely to come from a mildly biased but stable estimator whose errors are matched by a trading policy that avoids the wrong marginal fills. The search should therefore move from one-dimensional constants to controlled estimator-policy interactions, with cases 9, 15, 16, and 17 serving as the explicit acceptance tests.
