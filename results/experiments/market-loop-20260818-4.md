# Market-Maker Experiment: market-loop-20260818-4

- Status: active
- Started: 2026-08-18T21:49:07.026Z
- Starting baseline: g2-rate-smoothing (12.30/16.00)
- Current baseline: g4-full-unwind (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30 → 12.30 → 12.30 → 12.30 → 12.30

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore respond_to_fok

Establish the documentation's stronger equal-score baseline by rebinding the cached 3.4-cent quantity-tier policy under the updated lexicographic promotion gate, while testing two structurally distinct capital-aware FOK controls from the deferred research direction. Keep the champion estimator and quote fixed, preserve the known two-cent ordinary edge, and avoid the harmful 3.5-cent large-order boundary.

Parent: champion `g2-rate-smoothing` (`f4d4f21e12b5d011db36f4b8585a88b887497eb068e7a14ea526ecd99d44cd3a`).

### g1-q2-edge034

- Hypothesis: Requiring a 3.4-cent edge only when FOK quantity exceeds two will preserve the champion's 12.30 score and minimum capital while recovering the cached 2.14 combined-PnL improvement, making it the stronger baseline under lexicographic selection.
- Implementation plan: In respond_to_fok, select a 0.034 favorable edge when quantity is greater than two and retain 0.02 otherwise; keep the champion's symmetric BUY/SELL comparisons and fixed 0.50 side-specific worst-case-loss cap exactly unchanged. Match the archived q2-edge034-fine behavior so the dispatcher can rebind its cached evidence rather than rerun it.
- Worker summary: Implemented the archived quantity-tier FOK policy exactly: require a 3.4-cent favorable edge only above quantity two, retain two cents otherwise, and preserve the symmetric half-dollar total-loss cap. Compilation, scope validation, diff checks, and source-hash verification passed; cached 20/20 evidence was rebound to the current champion.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 79.36; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 2.14

### g1-capital-scaled-risk

- Hypothesis: Scaling the FOK worst-case-loss allowance to five percent of starting cash will preserve the proven half-dollar cap in low-capital cases while participating more aggressively where the grader supplies larger capital, potentially lifting rank without increasing low-capital bankruptcy risk.
- Implementation plan: In respond_to_fok, retain the two-cent favorable edge and replace the fixed 0.50 loss ceiling with 5% of self.cash_balance for both order sides. Keep the rule symmetric and calculate worst-case loss exactly as the champion does.
- Worker summary: Replaced the fixed half-dollar FOK loss cap with five percent of starting cash while preserving the two-cent favorable edge and symmetric side-specific loss calculation. Compilation and scope validation passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 73.90; minimum capital 5.98/10.00
- Baseline delta: -0.20 points; PnL -3.32

### g1-loss-weighted-edge

- Hypothesis: A continuous edge premium tied to the order's per-contract maximum loss will filter the most capital-intensive marginal FOKs while avoiding the discontinuous quantity threshold that becomes harmful at 3.5 cents.
- Implementation plan: In respond_to_fok, compute per-contract maximum loss from the order side, require a favorable edge of 0.02 plus 0.014 times that loss, and retain the fixed 0.50 total worst-case-loss cap. Apply the same formula symmetrically to BUY and SELL orders.
- Worker summary: Added a continuous edge premium of 1.4 cents times per-contract maximum loss on top of the champion's two-cent edge, preserving the fixed half-dollar total-loss cap and BUY/SELL symmetry. Compilation and scope validation passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.27; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.05

Selection: g1-q2-edge034.
Promotion: g1-q2-edge034 (0a7935e70ce3edfad5256b6303189593857970ed).
Finding: All three FOK policies passed 20/20 without bankruptcy or runtime errors. The cached 3.4-cent edge above quantity two preserved 12.30 points and 5.98/10.00 minimum capital while lifting combined PnL from 77.22 to 79.36, so it led the lexicographic promotion gate. The continuous loss-weighted edge also retained 12.30 but reached only 77.27 PnL. Scaling loss allowance to five percent of cash lost 0.20 points and 3.32 PnL, showing that larger-capital FOK participation added adverse flow rather than useful rank upside.
Next-generation rationale: Promote the quantity-tier source as the stronger baseline described in the research plan. Next explore partial shrinkage between the champion's Jeffreys-smoothed transition estimator and the bounded transition-likelihood estimator at 0.25, 0.50, and 0.75 likelihood weights, holding the newly promoted quote and FOK policy fixed.
Previous failure (runner): g1-capital-scaled-risk runner failure after retry
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: explore warm_up

The stronger 3.4-cent quantity-tier baseline is now champion. The research notes identify finite-sample rate-estimator variance as the remaining pricing bottleneck, so test three structurally different ways to inject the useful bounded-likelihood signal while shrinking it toward the champion's Jeffreys-smoothed moment estimator. Hold quote and FOK execution fixed to isolate estimator-policy interaction and protect the known case-16 quantity boundary.

Parent: champion `g1-q2-edge034` (`bf6c5a80f9e7756d3306df338c4bcf46c47d7ab27a5b6ef9f60f3dfb66f0f6a0`).

### g2-rate-hybrid025

- Hypothesis: A conservative 25% parameter-level likelihood blend will inject enough transition-shape signal to improve cases 15 or 17 while the 75% Jeffreys-smoothed anchor protects the champion's case-9 rank.
- Implementation plan: Preserve the champion's Jeffreys-smoothed moment estimates as one endpoint and reproduce the archived bounded transition-likelihood fit as a separate MarketMaker helper. In warm_up, convexly blend rate up probability, down probability, and reversion strength with fixed likelihood weight 0.25 before constructing MarketParameters. Leave company estimation, quote, and FOK logic unchanged.
- Worker summary: Added a separate bounded transition-likelihood fit and blended its up probability, down probability, and reversion strength at 25% weight into the champion's Jeffreys-smoothed endpoint. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 81.89; minimum capital 6.09/10.00
- Baseline delta: 0.00 points; PnL 2.53

### g2-rate-adaptive

- Hypothesis: A sample-size-adaptive likelihood weight will rely on the stable smoothed estimator for short burn-ins and move toward likelihood only when transition evidence is abundant, reducing the fixed blend's finite-sample risk.
- Implementation plan: Compute the same Jeffreys-smoothed moment and bounded-likelihood endpoints, then set likelihood weight to n / (n + 50), where n is the number of observed rate transitions. Blend all three rate parameters at that weight in warm_up. Preserve every non-rate estimator and all trading methods.
- Worker summary: Added the same bounded likelihood endpoint and blended all three rate parameters with sample-size weight n/(n+50), preserving the stable estimator on shorter histories and increasing likelihood influence with evidence. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 85.66; minimum capital 6.09/10.00
- Baseline delta: 0.00 points; PnL 6.30

### g2-rate-penalized

- Hypothesis: A likelihood fit with a weak quadratic pull toward the Jeffreys-smoothed endpoint will retain likelihood's useful state-transition information without the abrupt rank loss of the unconstrained optimum.
- Implementation plan: Fit rate parameters by the archived bounded grid likelihood, but maximize log likelihood minus quadratic penalties centered on the Jeffreys-smoothed up/down probabilities and moment reversion estimate. Use penalty weights 25 for each base probability and 2 for reversion strength, then use the penalized optimum directly in warm_up. Keep the existing probability constraints, non-rate estimates, quote, and FOK behavior unchanged.
- Worker summary: Added a bounded grid-likelihood fit penalized toward the Jeffreys-smoothed up/down probabilities and moment reversion strength with weights 25, 25, and 2. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 100.64; minimum capital 6.18/10.00
- Baseline delta: -0.30 points; PnL 21.28

Selection: g2-rate-adaptive.
Promotion: g2-rate-adaptive (2370db038a25598277d4c52e6a37e460e290a899).
Finding: All three shrinkage estimators passed 20/20 without bankruptcy or runtime errors. Fixed 25% blending retained 12.30 points, raised PnL to 81.89, and lifted minimum capital to 6.09/10.00. Sample-size-adaptive blending led the promotion gate at the same 12.30 points and capital with 85.66 PnL, 6.30 above the quantity-tier parent; it kept cases 9 and 16 first while improving case 17 from -14.10 to -9.42. Penalized likelihood reached 100.64 PnL and 6.18/10.00 minimum capital, improving case 17 to +9.98, but case 9 fell from first to second by 0.79 and total score fell to 12.00.
Next-generation rationale: Promote the sample-size-adaptive estimator. Preserve penalized likelihood as an active challenger because its explicit probability and reversion penalties expose a direct shrinkage path between the 12.00 high-PnL endpoint and the 12.30 adaptive champion; tune those weights before adding another trading-policy interaction.
Challenger update: admitted market-loop-20260818-4-g02-g2-rate-penalized.

## Generation 3: tune warm_up

The penalized estimator is a high-PnL near miss: 12.00 points, 100.64 PnL, and 6.18/10.00 minimum capital. It improves case 17 from -14.10 to +9.98 but loses case 9 first place by only 0.79. Increase the two shrinkage penalties jointly to pull the fit toward the stable endpoint until case 9 recovers, seeking an intermediate revision that retains enough case-17 economics to exceed the adaptive champion's 85.66 PnL at 12.30 points.

### coarse-100-16

- Hypothesis: coarse parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":100,"reversionPenalty":16}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 96.86; minimum capital 6.06/10.00
- Baseline delta: -0.30 points; PnL 11.20

### coarse-250-40

- Hypothesis: coarse parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":250,"reversionPenalty":40}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 95.78; minimum capital 6.04/10.00
- Baseline delta: 0.00 points; PnL 10.12

### coarse-400-64

- Hypothesis: coarse parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":400,"reversionPenalty":64}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 96.10; minimum capital 6.01/10.00
- Baseline delta: 0.00 points; PnL 10.44

### medium-50-4

- Hypothesis: medium parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":50,"reversionPenalty":4}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 97.63; minimum capital 6.13/10.00
- Baseline delta: -0.30 points; PnL 11.97

### medium-75-8

- Hypothesis: medium parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":75,"reversionPenalty":8}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 97.64; minimum capital 6.11/10.00
- Baseline delta: -0.30 points; PnL 11.98

### medium-150-24

- Hypothesis: medium parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":150,"reversionPenalty":24}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 96.03; minimum capital 6.06/10.00
- Baseline delta: 0.00 points; PnL 10.37

### fine-30-2-5

- Hypothesis: fine parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":30,"reversionPenalty":2.5}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 98.91; minimum capital 6.18/10.00
- Baseline delta: -0.30 points; PnL 13.25

### fine-40-3-5

- Hypothesis: fine parameter tuning for market-loop-20260818-4-g02-g2-rate-penalized
- Implementation plan: {"probabilityPenalty":40,"reversionPenalty":3.5}
- Worker summary: Designed eight immutable joint probability/reversion penalty vectors spanning coarse, medium, and fine granularities, with no parent vector or post-result adaptation. The AST materializer changed only the three bound penalty literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 96.69; minimum capital 6.15/10.00
- Baseline delta: -0.30 points; PnL 11.03

Selection: coarse-400-64.
Promotion: coarse-400-64 (32cf387b7b7756a450cdfb5937216c782d497dfb).
Finding: All eight penalty variants passed 20/20 without bankruptcy or runtime errors. Light and medium shrinkage through probability/reversion penalties of 100/16 remained at 12.00 points, with PnL from 96.69 to 98.91. Stronger pairs 150/24, 250/40, and 400/64 recovered 12.30 points and passed the promotion gate. The 400/64 vector led at 96.10 PnL, 10.44 above the adaptive champion and 16.74 above the quantity-tier baseline, with 6.01/10.00 minimum capital.
Next-generation rationale: Promote the 400/64 penalized estimator. It preserves the critical score while retaining most of the high-likelihood economics. Next follow the research plan's highest-priority cross-method interaction by exploring targeted inventory-unwind and other marginal FOK controls from this full promoted source, holding the estimator and quote fixed.

## Generation 4: explore respond_to_fok

The tuned penalized estimator preserves 12.30 points while raising PnL to 96.10, and the research notes rank inventory unwind as the highest-priority compensating execution interaction. Test three structurally distinct ways to relax the FOK edge only when an order reduces an existing option position, while preserving the 3.4-cent quantity tier for new risk and leaving quote and estimator logic fixed.

Parent: champion `coarse-400-64` (`44b91f8acec677de3a6eb56eedcfd0b9497e2e77c22933311e06a6f261328e5d`).

### g4-full-unwind

- Hypothesis: Accepting position-bounded FOK unwinds at fair value will monetize or neutralize inventory created by the improved estimator without changing entry discipline for new risk.
- Implementation plan: Detect whether the counterparty BUY reduces a long position or the counterparty SELL reduces a short position. When quantity does not exceed absolute inventory, accept at theoretical value with no favorable-edge requirement, matching the proven historical unwind structure. Otherwise retain the champion's two-cent/3.4-cent quantity-tier edge and half-dollar loss cap exactly.
- Worker summary: Added position-aware fair-value FOK exits when the order direction reduces inventory and quantity does not exceed the position, preserving the champion's quantity-tier edge and loss cap for new risk. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 98.80; minimum capital 6.01/10.00
- Baseline delta: 0.00 points; PnL 2.70

### g4-expiry-unwind

- Hypothesis: Restricting fair-value inventory unwinds to options with at most one step remaining will remove near-expiry concentration while avoiding premature exits from positions that still have time to realize estimator edge.
- Implementation plan: Use the same position-direction and quantity-bounded fair-value unwind as g4-full-unwind, but activate it only when steps_until_expiry is one or zero. Retain the champion's quantity-tier edge and half-dollar cap for every other FOK.
- Worker summary: Added the same position-bounded fair-value exit only at one step or less to expiry, retaining the champion policy elsewhere. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 96.68; minimum capital 6.01/10.00
- Baseline delta: 0.00 points; PnL 0.58

### g4-scaled-unwind

- Hypothesis: Continuously reducing the required edge according to the fraction of inventory removed will favor more complete risk reduction without turning every small partial unwind into a zero-edge trade.
- Implementation plan: Start with the champion's two-cent/3.4-cent quantity-tier edge. For a directionally position-reducing FOK whose quantity does not exceed absolute inventory, multiply that edge by one minus quantity divided by absolute inventory. Apply the resulting edge through the champion's symmetric BUY/SELL comparisons and retain the half-dollar total-loss cap.
- Worker summary: Reduced the required FOK edge continuously by the fraction of inventory removed while retaining the fixed loss cap and quantity-tier entry edge. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 96.10; minimum capital 6.01/10.00
- Baseline delta: 0.00 points; PnL 0.00

Selection: g4-full-unwind.
Promotion: g4-full-unwind (bf8a68eaad6d03c5e45da14cb3624b5496486b26).
Finding: All three inventory-aware FOK policies passed 20/20 without bankruptcy or runtime errors and preserved 12.30 points with 6.01/10.00 minimum capital. Full position-bounded fair-value unwind led at 98.80 PnL, 2.70 above the tuned-estimator parent. Near-expiry-only unwind added 0.58 PnL, while proportional edge scaling exactly reproduced the parent at 96.10.
Next-generation rationale: Promote full fair-value unwind. Next test the research plan's RFQ-risk interactions on this complete estimator-plus-unwind source: proven one-sided loss shading, aggressive uniform four-cent quotes, and a targeted central-probability uncertainty width, holding warm_up and FOK logic fixed.

## Generation 5: explore quote

The complete tuned-estimator plus fair-unwind strategy reaches 98.80 PnL at 12.30 points. The research notes next prioritize pairing improved fair values with RFQ risk controls that previously increased economics but lost case-17 rank. Test the proven one-sided maximum-loss shade, the aggressive uniform four-cent width, and a targeted four-cent width only for central-probability contracts, holding the estimator, FOK entry tier, and unwind fixed.

Parent: champion `g4-full-unwind` (`ae87114fbbc3b8680533db3b609bd16fcb6b9410dbbc41b077b7594919747548`).

### g5-loss-side-shade

- Hypothesis: The tuned estimator can restore the prior one-sided loss shade's case-17 routing while its extra cent on only the capital-intensive side preserves the structure's large PnL and capital gains.
- Implementation plan: Start from the champion's three-cent bid and offer at size two. Move the bid one additional cent down when bid price exceeds 0.50, and move the offer one additional cent up when 1.0 minus offer price exceeds 0.50. Clamp both sides to valid boundaries exactly as the archived g6-loss-side-shade source does.
- Worker summary: Added the proven one-cent shade only to the quote side whose per-contract maximum loss exceeds fifty cents, on top of the full tuned-estimator and unwind source. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 116.92; minimum capital 6.33/10.00
- Baseline delta: 0.00 points; PnL 18.12

### g5-uniform-four

- Hypothesis: Uniform four-cent quotes may retain their previously large economic gain while the tuned rate estimator and unwind repair the single lost rank boundary.
- Implementation plan: Change the quote half-width uniformly from three cents to four cents, retain size two on both sides, and preserve valid boundary-clamped penny prices and a strict two-sided quote.
- Worker summary: Changed the quote half-width uniformly from three cents to four cents at size two while preserving strict boundary-clamped penny quotes and all estimator/FOK behavior. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 122.37; minimum capital 6.45/10.00
- Baseline delta: 0.00 points; PnL 23.57

### g5-central-four

- Hypothesis: Adding a fourth cent only for fair values from 0.25 through 0.75 will filter the contracts most exposed to estimator uncertainty while preserving competitive three-cent quotes for high-confidence tail events.
- Implementation plan: Round fair value to cents, use half-width four when the rounded value is between 25 and 75 inclusive and half-width three otherwise, retain size two, and clamp to valid strict penny quotes at zero and one.
- Worker summary: Used a four-cent half-width only for rounded fair values from 25 through 75 cents and retained three cents in the tails, with focused band and endpoint assertions. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 113.33; minimum capital 6.05/10.00
- Baseline delta: 0.00 points; PnL 14.53

Selection: g5-uniform-four.
Promotion: none.
Finding: All three RFQ-risk interactions passed 20/20 without bankruptcy or runtime errors and preserved 12.30 points. Uniform four-cent quotes led at 122.37 PnL and 6.45/10.00 minimum capital, improving the estimator-plus-unwind parent by 23.57 PnL and the run's starting champion by 45.15. One-sided loss shading reached 116.92 PnL and 6.33/10.00 capital; central-only widening reached 113.33 and 6.05/10.00. Uniform width kept cases 9 and 16 first and improved case 17 to +6.32, still 4.53 behind second.
Next-generation rationale: Promote uniform four-cent quotes. Use the sixth and final generation to target the remaining case-17 RFQ boundary with three structural refinements from the complete promoted source: uniform five cents, a fifth cent only on the capital-intensive side, and a fifth cent only in the central-probability band.
