# Market-Maker Experiment: market-loop-20260818-5

- Status: active
- Started: 2026-08-18T22:47:46.574Z
- Starting baseline: g6-loss-side-five (12.60/16.00)
- Current baseline: g6-loss-side-five (12.60/16.00)
- Stop condition: not reached
- Score trend: 12.60

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore warm_up

The 12.60 champion already matches the historical best rank in 15 of 16 scored cases; case 17 is the only verified remaining gap. Historical pure likelihood reached second in case 17, while the champion's later four-cent, maximum-loss-side shade, large-FOK tier, and inventory unwind created buffers in cases 9 and 15. Re-cross the documented low-penalty region on this complete execution stack while holding quote and FOK behavior fixed.

Parent: champion `g6-loss-side-five` (`dba7b8040efb4f1e71a2ef19245f9573d2a7b46570726ff7f869a964eb09847b`).

### g1-rate-recross-zero

- Hypothesis: An unregularized transition likelihood will restore the only historical estimator that reached second place in case 17, and the champion's stronger execution stack will preserve cases 9, 13, 15, and 16.
- Implementation plan: Change the rate-fit objective to pure transition log likelihood by removing both probability-anchor and reversion-anchor penalties. Preserve the existing bounded grid search, probability feasibility handling, all company estimation, quote logic, and FOK logic exactly.
- Worker summary: Replaced the champion's penalized transition fit with a bounded pure-likelihood grid search, removing moment smoothing inputs and both regularization terms while preserving company estimation and the complete quote/FOK stack. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 112.30; minimum capital 7.03/10.00
- Baseline delta: -0.30 points; PnL -9.98

### g1-rate-recross-10-1

- Hypothesis: A light probability penalty of 10 and reversion penalty of 1 will retain most of the case-17 likelihood signal while adding enough moment anchoring to protect the narrow case-13 and case-9 rank boundaries.
- Implementation plan: Use a lightly regularized objective with coefficient 10 on each squared up/down probability deviation and coefficient 1 on squared reversion deviation. Keep the current grid, feasibility clamps, estimator inputs, quote policy, and FOK policy unchanged.
- Worker summary: Changed only the two probability-anchor coefficients from 400 to 10 and the reversion-anchor coefficient from 64 to 1 in the existing bounded penalized-likelihood helper. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.50/16.00 points; PnL 117.16; minimum capital 7.00/10.00
- Baseline delta: -0.10 points; PnL -5.12

### g1-rate-recross-25-2

- Hypothesis: The archived 25/2 penalized-likelihood near miss may cross case 17 when combined with the champion's complete execution stack while providing more boundary protection than the lighter alternatives.
- Implementation plan: Use coefficient 25 on each squared up/down probability deviation and coefficient 2 on squared reversion deviation in the current penalized likelihood helper. Preserve all other warm-up estimation and every execution rule exactly.
- Worker summary: Changed only the two probability-anchor coefficients from 400 to 25 and the reversion-anchor coefficient from 64 to 2 in the existing bounded penalized-likelihood helper. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 121.31; minimum capital 6.94/10.00
- Baseline delta: 0.00 points; PnL -0.97

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three low-penalty estimators passed 20/20 without bankruptcy or runtime errors. Pure likelihood scored 12.30 with 112.30 PnL and 7.03/10.00 minimum capital: case 9 remained first by only 0.09, case 13 remained second, but case 15 fell to second and case 17 stayed third. The 10/1 objective reached the intended case-17 transition, finishing second by 0.20, while protecting cases 9, 13, and 16; however, it lost case 15 by 0.51 and therefore scored 12.50 with 117.16 PnL and 7.00 minimum capital. The 25/2 objective restored case 15 and matched the champion's 12.60 score, but case 17 returned to third by 1.12 and PnL was 0.97 below the champion at 121.31. This isolates a sharp estimator boundary: 10/1 supplies the needed case-17 signal, and its only scored-rank regression versus the champion is case 15.
Next-generation rationale: Preserve the complete 10/1 source as the near-miss parent and change only quote behavior to recover case 15 while holding the estimator, inventory unwind, quantity-tier FOK edge, and loss cap fixed. Target the specific maximum-loss-side fifth-cent interaction rather than returning to broad estimator or uniform-width searches.
Challenger update: admitted market-loop-20260818-5-g01-g1-rate-recross-10-1.
Previous failure (runner): g1-rate-recross-zero runner failure; automatic retry requested
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
