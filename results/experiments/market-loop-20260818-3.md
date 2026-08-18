# Market-Maker Experiment: market-loop-20260818-3

- Status: active
- Started: 2026-08-18T19:49:43.378Z
- Starting baseline: g5-wide-three-two (12.30/16.00)
- Current baseline: g2-rate-smoothing (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30 → 12.30

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
Promotion: g2-rate-smoothing (c5f16eff28fa966cbfa5dc778ed851a082f45e5d).
Finding: All three warm-up estimators passed 20/20 without bankruptcy or runtime errors. Jeffreys-smoothed rate transitions tied the champion's 12.30 points, improved minimum capital from 5.92/10.00 to 5.98/10.00, and added 1.73 combined PnL, so it uniquely passed the promotion gate. Likelihood fitting improved combined PnL by 24.99 and minimum capital to 6.27/10.00 but lost 0.10 points; residual MLE scaling lost 0.20 points and reduced minimum capital to 5.87/10.00.
Next-generation rationale: Promote rate smoothing. The likelihood result shows that rate-estimator structure materially changes economics, but its current pure fit sacrifices rank and lacks a clean literal-only tuning axis. Continue with structural exploration from the new smoothed champion, testing confidence-aware trading policies that can exploit improved rate calibration while protecting the newly higher minimum capital.

## Generation 3: explore respond_to_fok

The promoted rate-smoothed estimator improved minimum capital, while the fixed two-cent FOK edge treats all contracts and order shapes as equally uncertain. Test three orthogonal confidence gates that retain the proven half-dollar worst-case-loss cap and alter only which marginal FOK flow is accepted.

### g3-rate-edge-one

- Hypothesis: The newly smoothed transition probabilities support accepting one-cent edges on pure FED options while preserving the two-cent edge for noisier company and spread contracts.
- Implementation plan: Detect a single-leg FED contract in respond_to_fok and use a one-cent favorable edge only for that contract type; retain the champion's two-cent edge for every other option and its side-specific half-dollar loss cap for all orders.
- Worker summary: Used a one-cent favorable edge only for pure single-leg FED FOKs and retained two cents elsewhere, with the half-dollar loss cap unchanged. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.22; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.00

### g3-long-edge-three

- Hypothesis: Longer-dated FOKs are more exposed to warm-up parameter error, so requiring three cents beyond three days will improve trade quality and minimum capital without reducing near-term participation.
- Implementation plan: Use the champion's two-cent favorable edge for expiries of three days or fewer and a three-cent edge for longer expiries, preserving the same symmetric BUY/SELL logic and half-dollar worst-case-loss cap.
- Worker summary: Required a three-cent favorable edge only beyond three days to expiry and retained the champion's two-cent edge for shorter contracts, preserving the half-dollar loss cap. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.69; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.47

### g3-large-edge-three

- Hypothesis: A stricter three-cent edge on larger FOK quantities will filter adverse selection that the dollar loss cap alone does not distinguish while preserving ordinary small-order flow.
- Implementation plan: Use the champion's two-cent favorable edge for quantity one and a three-cent edge for larger FOK orders, then apply the unchanged side-specific half-dollar loss cap. Keep the rule symmetric across BUY and SELL.
- Worker summary: Required a three-cent favorable edge for FOK quantities above one and retained two cents for single-contract orders, preserving the symmetric half-dollar loss cap. Compilation, scope validation, and diff checks passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.65; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.43

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three confidence gates passed 20/20 without bankruptcy or runtime errors and preserved the champion's 12.30 points and 5.98/10.00 minimum capital, so none qualified for promotion. A one-cent pure-rate edge exactly reproduced the champion. Requiring three cents beyond three days added 0.47 combined PnL, while requiring three cents on quantities above one led the batch with a 1.43 PnL gain.
Next-generation rationale: Admit the quantity-tier FOK gate as a challenger and tune its large-order edge plus activation threshold. It preserved every promotion-gate metric while improving economics, and both literals define bounded axes that can test whether stricter filtering on only genuinely large orders lifts minimum capital or score.
Challenger update: admitted market-loop-20260818-3-g03-g3-large-edge-three.

## Generation 4: tune respond_to_fok

The quantity-tier FOK challenger tied the smoothed champion's 12.30 points and 5.98 minimum capital while adding 1.43 combined PnL. Jointly tune only the stricter large-order edge and the quantity threshold that activates it, preserving the full smoothed warm-up revision, two-cent small-order edge, and half-dollar loss cap.

### q0-edge022-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":0,"largeOrderEdge":0.022}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.70; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.48

### q2-edge050-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.05}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 57.89; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -19.33

### q0-edge030-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":0,"largeOrderEdge":0.03}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.68; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.46

### q2-edge030-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.03}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.61; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.39

### q1-edge022-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":1,"largeOrderEdge":0.022}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.70; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.48

### q1-edge050-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":1,"largeOrderEdge":0.05}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 57.93; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -19.29

### q0-edge028-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":0,"largeOrderEdge":0.028}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.63; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.41

### q2-edge032-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.032}
- Worker summary: Designed eight immutable joint quantity-threshold and large-order-edge vectors spanning coarse, medium, and fine granularities. The AST materializer changed only the two bound literals, compiled and scope-validated every variant, and all eight completed 20/20 without bankruptcy; quantity above two at a 3.2-cent edge was the strongest tied-score result.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 78.99; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.77

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All eight variants passed 20/20 without bankruptcy or runtime errors. Six variants retained 12.30 points and 5.98/10.00 minimum capital. The best was a 3.2-cent strict edge only above quantity two, producing 78.99 combined PnL: 0.34 above the challenger parent and 1.77 above the champion. Applying three cents to all quantities reached 78.68, while either five-cent variant fell to 11.70 and roughly 57.9 PnL.
Next-generation rationale: Update the quantity-tier challenger to the quantity-above-two, 3.2-cent revision. The sharp loss at five cents and improvement at 3.2 cents leave explicit fine-grained upside between 3.2 and five cents and around activation thresholds two to three, suitable for the challenger's second and final tuning batch.
Challenger update: updated market-loop-20260818-3-g03-g3-large-edge-three to q2-edge032-fine.

## Generation 5: tune respond_to_fok

The first tuning batch improved the quantity-tier challenger to a 3.2-cent edge above quantity two, preserving 12.30 points and 5.98 minimum capital while raising PnL. Five cents lost 0.60 points, while three cents earned less, leaving a bounded transition region and nearby activation thresholds for the second and final batch.

### q0-edge049-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":0,"largeOrderEdge":0.049}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 58.23; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -18.99

### q5-edge033-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":5,"largeOrderEdge":0.033}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 79.10; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 1.88

### q1-edge035-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":1,"largeOrderEdge":0.035}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 57.84; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -19.38

### q4-edge045-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":4,"largeOrderEdge":0.045}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 59.19; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -18.03

### q3-edge048-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":3,"largeOrderEdge":0.048}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 59.28; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -17.94

### q2-edge034-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.034}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 79.36; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 2.14

### q2-edge036-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.036}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 56.80; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -20.42

### q2-edge038-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-3-g03-g3-large-edge-three
- Implementation plan: {"quantityThreshold":2,"largeOrderEdge":0.038}
- Worker summary: Designed eight immutable second-batch vectors spanning coarse, medium, and fine threshold/edge combinations while avoiding every prior exact combination. The materializer changed only the bound literals and passed compile/scope checks for all variants; every vector completed 20/20 without bankruptcy, and threshold two at 3.4 cents was best.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 56.80; minimum capital 5.98/10.00
- Baseline delta: -0.60 points; PnL -20.42

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All eight variants passed 20/20 without bankruptcy or runtime errors. Threshold two at a 3.4-cent edge retained 12.30 points and 5.98/10.00 minimum capital while producing 79.36 combined PnL, improving the parent by 0.37 and the champion by 2.14. Threshold five at 3.3 cents also tied at 79.10. Every vector at 3.5 cents or higher fell to 11.70, locating a sharp score boundary between 3.4 and 3.5 cents for the relevant order flow.
Next-generation rationale: Update the challenger to threshold two at 3.4 cents, then retire it after its configured second tuning batch. Use the sixth and final generation on structural quote-risk controls from the champion, since FOK tier tuning improved PnL but never improved score or minimum capital.
Challenger update: market-loop-20260818-3-g03-g3-large-edge-three retired after 2 tuning attempts.
