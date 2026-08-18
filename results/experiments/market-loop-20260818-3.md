# Market-Maker Experiment: market-loop-20260818-3

- Status: active
- Started: 2026-08-18T19:49:43.378Z
- Starting baseline: g5-wide-three-two (12.30/16.00)
- Current baseline: g5-wide-three-two (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: tune respond_to_fok

The inventory-unwind challenger currently ties the 12.30 champion while adding 4.12 combined PnL at a 2.5-cent ordinary-order edge. Earlier tuning showed that one cent also ties but earns less, while four cents loses 0.60 points, leaving an untested transition band around 2.5 to 4 cents where a slightly stricter edge may improve trade selection without sacrificing rank. Tune only the paired ordinary-edge literals and preserve the full challenger revision, unwind exception, and half-dollar loss cap.

### coarse-low-edge

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.015}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.22; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 2.73

### coarse-high-edge

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.039}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 58.15; minimum capital 5.92/10.00
- Baseline delta: -0.60 points; PnL -17.34

### medium-lower-edge

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.019}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.97; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 3.48

### medium-upper-edge

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.033}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 80.03; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 4.54

### fine-below-parent

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.023}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 79.45; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 3.96

### fine-above-parent

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g05-g5-inventory-unwind
- Implementation plan: {"ordinaryEdge":0.027}
- Worker summary: Designed and materialized six immutable ordinary-edge vectors across coarse, medium, and fine granularities while preserving the full inventory-unwind challenger and fixed half-dollar loss cap. All variants compiled, passed scope validation, and completed 20/20 without bankruptcy; the 2.7-cent fine-above-parent vector was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 80.08; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 4.59

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All six ordinary-edge variants passed 20/20 without bankruptcy or runtime errors. Edges from 1.5 through 3.3 cents retained 12.30 points and identical 5.92/10.00 minimum capital. The 2.7-cent vector led that group at 80.08 combined PnL, improving the 2.5-cent parent by 0.47 and the champion by 4.59; 3.3 cents was close at 80.03. At 3.9 cents the score fell sharply to 11.70 and PnL to 58.15, confirming a narrow upper transition boundary.
Next-generation rationale: Update the inventory-unwind challenger to the 2.7-cent revision. Its second tuning batch found a real but small PnL gain without promotion because score and minimum capital still tie the champion. Return to structural Explore for a change capable of improving score or minimum capital rather than spending more evaluations on this now-mapped edge axis.
Challenger update: market-loop-20260818-2-g05-g5-inventory-unwind retired after 2 tuning attempts.
Previous failure (runner): coarse-low-edge runner failure after retry
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: explore warm_up

The champion's quote and FOK controls have been extensively explored and tuned to a 12.30 plateau, while every live fair value still depends on one untouched finite-sample warm-up estimator. Test three statistically distinct estimator changes that preserve the exact THEO pricer and all proven trading controls.

### g2-rate-likelihood

- Hypothesis: Selecting rate reversion by transition likelihood will estimate the clipped mean-reverting rate process more faithfully than the current unconstrained moment regression and improve rate-sensitive fair values.
- Implementation plan: Replace only the warm-up rate-parameter fit with a bounded one-dimensional likelihood search over reversion strength. For each candidate strength, derive feasible base up/down probabilities from the observed transition moments, score the actual up/down/stay transitions using MarketParameters-equivalent tilted and clipped probabilities, and keep the maximum-likelihood triple. Add at most one short helper below the core challenge methods; preserve pricing and trading logic.
- Worker summary: Replaced the moment-based rate reversion estimate with a bounded likelihood grid using the model's exact tilt and clipping rules. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.20/16.00 points; PnL 100.48; minimum capital 6.27/10.00
- Baseline delta: -0.10 points; PnL 24.99

### g2-rate-smoothing

- Hypothesis: Weak Jeffreys-style smoothing of the fitted base transition probabilities will reduce finite-history overconfidence and improve binary rate probabilities without changing the estimated reversion structure.
- Implementation plan: Keep the current reversion and regression estimator, then in warm_up shrink the fitted base up/down transition probabilities with symmetric half-count pseudocounts using the observed transition count. Renormalize only if required by MarketParameters, and leave company estimates, pricing, quotes, and FOK logic unchanged.
- Worker summary: Applied symmetric three-category Jeffreys half-count smoothing to the fitted base up/down probabilities while preserving reversion and all trading logic. After one lead repair for the correct three-outcome denominator, compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy and cleared the promotion gate.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.22; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.73

### g2-residual-mle

- Hypothesis: Using the Gaussian maximum-likelihood residual covariance scale will avoid the current degrees-of-freedom inflation and sharpen company and spread fair values estimated from the fixed warm-up sample.
- Implementation plan: In warm_up, scale company residual variances and covariance by the number of observations rather than n-minus-two, while preserving the existing regressions and covariance decomposition. Do not change rate estimation, the exact THEO pricer, quotes, or FOK behavior.
- Worker summary: Changed the residual variance and covariance scale from n-minus-two to the Gaussian MLE observation count, leaving all other estimation and trading logic unchanged. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 76.87; minimum capital 5.87/10.00
- Baseline delta: -0.20 points; PnL 1.38

Selection: g2-rate-smoothing.
Promotion: none.
Finding: All three warm-up estimators passed 20/20 without bankruptcy or runtime errors. Jeffreys-smoothed rate transitions tied the champion's 12.30 points, improved minimum capital from 5.92/10.00 to 5.98/10.00, and added 1.73 combined PnL, so it uniquely passed the promotion gate. Likelihood fitting improved combined PnL by 24.99 and minimum capital to 6.27/10.00 but lost 0.10 points; residual MLE scaling lost 0.20 points and reduced minimum capital to 5.87/10.00.
Next-generation rationale: Promote rate smoothing. The likelihood result shows that rate-estimator structure materially changes economics, but its current pure fit sacrifices rank and lacks a clean literal-only tuning axis. Continue with structural exploration from the new smoothed champion, testing confidence-aware trading policies that can exploit improved rate calibration while protecting the newly higher minimum capital.
