# Market-Maker Experiment: market-loop-20260818-4

- Status: active
- Started: 2026-08-18T21:49:07.026Z
- Starting baseline: g2-rate-smoothing (12.30/16.00)
- Current baseline: g1-q2-edge034 (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30 → 12.30

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
Promotion: none.
Finding: All three shrinkage estimators passed 20/20 without bankruptcy or runtime errors. Fixed 25% blending retained 12.30 points, raised PnL to 81.89, and lifted minimum capital to 6.09/10.00. Sample-size-adaptive blending led the promotion gate at the same 12.30 points and capital with 85.66 PnL, 6.30 above the quantity-tier parent; it kept cases 9 and 16 first while improving case 17 from -14.10 to -9.42. Penalized likelihood reached 100.64 PnL and 6.18/10.00 minimum capital, improving case 17 to +9.98, but case 9 fell from first to second by 0.79 and total score fell to 12.00.
Next-generation rationale: Promote the sample-size-adaptive estimator. Preserve penalized likelihood as an active challenger because its explicit probability and reversion penalties expose a direct shrinkage path between the 12.00 high-PnL endpoint and the 12.30 adaptive champion; tune those weights before adding another trading-policy interaction.
Challenger update: admitted market-loop-20260818-4-g02-g2-rate-penalized.
