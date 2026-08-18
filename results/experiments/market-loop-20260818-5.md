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

## Generation 2: explore quote

The complete 10/1 challenger reaches second in case 17 and preserves the champion ranks in cases 9, 13, and 16; its sole scored regression is case 15, where it is second by 0.51. Hold the estimator and all FOK behavior fixed and test three targeted extensions of the proven maximum-loss-side quote shade to filter the adverse case-15 flow without sacrificing the 0.20 case-17 margin or 0.04 case-13 margin.

Parent: challenger `market-loop-20260818-5-g01-g1-rate-recross-10-1 r00` (`62feea3c97e975a314a102336249973f5a36d124bab1bb2948ac145b27346f95`).

### g2-loss-side-six

- Hypothesis: A second cent of protection only on sides whose quoted maximum loss already exceeds 0.50 will remove the marginal case-15 fills while leaving the safer side at the competitive four-cent width.
- Implementation plan: Keep the four-cent base quote and size two. Where the current rule shades a high-loss bid or offer by one additional cent, shade it by two cents instead, clamped at zero and one; leave the opposite side and all estimator/FOK logic unchanged.
- Worker summary: Kept the complete 10/1 challenger and widened only the already high-loss quote side from one additional cent to two, leaving the four-cent safe side, size two, estimator, and FOK rules unchanged. Parent-relative diff, scope validation, compilation, and whitespace checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 104.26; minimum capital 7.32/10.00
- Baseline delta: 0.00 points; PnL -18.02

### g2-near-loss-five

- Hypothesis: The 10/1 fair values may have moved case-15 contracts just inside the current 0.50 quoted-loss trigger, so applying the existing fifth cent from 0.45 maximum loss will restore their filtering without the larger six-cent jump.
- Implementation plan: Retain the current one-cent, one-sided shade and four-cent base width, but activate it when the base bid price is at least 0.45 or one minus the base offer is at least 0.45. Preserve size two, boundary clamps, and all non-quote behavior.
- Worker summary: Kept the complete 10/1 challenger and extended the existing one-cent one-sided shade trigger from quoted loss above 0.50 to quoted loss at least 0.45. Parent-relative diff, scope validation, compilation, and whitespace checks passed after repairing the interrupted worktree initialization.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 114.77; minimum capital 7.02/10.00
- Baseline delta: -0.30 points; PnL -7.51

### g2-central-loss-six

- Hypothesis: Case 15 may require a sixth cent only for uncertain central contracts, while high-confidence tail contracts need the current fifth-cent maximum-loss rule to protect cases 13 and 17.
- Implementation plan: Start from the unchanged four-cent base and existing one-cent maximum-loss-side shade. Add one further cent only when that same side has maximum loss above 0.50 and the rounded fair value lies from 25 through 75 cents inclusive. Clamp at valid endpoints, retain size two, and preserve the complete estimator/FOK stack.
- Worker summary: Kept the complete 10/1 challenger and added a second high-loss-side cent only for rounded fair values from 25 through 75 cents, retaining the existing fifth cent outside that band. Parent-relative diff, scope validation, compilation, and whitespace checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 116.30; minimum capital 7.00/10.00
- Baseline delta: -0.50 points; PnL -5.98

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three quote variants passed 20/20 without bankruptcy or runtime errors. Global high-loss-side six cents strictly improved the 10/1 parent from 12.50 to 12.60: it restored case 15 to first and retained case 17 in second, while cases 9 and 16 remained first. Its sole critical regression was case 13, which fell from second to third by 1.19; the result was 104.26 PnL and 7.32/10.00 minimum capital, so it tied the champion on points but trailed by 18.02 PnL. Extending the fifth-cent trigger to 0.45 scored 12.30 with 114.77 PnL because it lost cases 13 and 15 while retaining case 17. Applying the sixth cent only in the 25-75 central band scored 12.10 with 116.30 PnL and lost cases 13, 15, and 17. The central-band failure shows that the sixth-cent decisions responsible for repairing cases 15 and 17 lie outside that band; the next repair should preserve six cents selectively in the tails and restore the existing fifth-cent behavior elsewhere.
Next-generation rationale: Preserve g2-loss-side-six as the complete derived parent because it is the first source to hold both case 15 first and case 17 second. Change only the activation of its second high-loss-side cent: test tail-only, extreme-loss-only, and short-expiry-only gates, retaining the four-cent safe side and existing fifth cent everywhere to recover case 13 without reopening the estimator or FOK dimensions.
Challenger update: derived market-loop-20260818-5-g02-g2-loss-side-six.
Previous failure (setup): git -C /Users/easonhao/Documents/dev/Akuna_challenge worktree add --detach /tmp/akuna-market-maker/market-loop-20260818-5/g02/g2-loss-side-six 8a882e178f1d6cd704dfe15f29bf3795c9fa49af failed: Preparing worktree (detached HEAD 8a882e1)
Updating files:   1% (2/164)Updating files:   1% (3/164)Updating files:   2% (4/164)Updating files:   3% (5/164)Updating files:   3% (6/164)Updating files:   4% (7/164)Updating files:   4% (8/164)Updating files:   5% (9/164)Updating files:   6% (10/164)Updating files:   6% (11/164)Updating files:   7% (12/164)Updating files:   7% (13/164)Updating files:   8% (14/164)Updating files:   9% (15/164)Updating files:   9% (16/164)Updating files:  10% (17/164)Updating files:  10% (18/164)Updating files:  11% (19/164)Updating files:  12% (20/164)Updating files:  12% (21/164)Updating files:  13% (22/164)Updating files:  14% (23/164)Updating files:  14% (24/164)Updating files:  15% (25/164)Updating files:  15% (26/164)Updating files:  16% (27/164)Updating files:  17% (28/164)Updating files:  17% (29/164)Updating files:  18% (30/164)Updating files:  18% (31/164)Updating files:  19% (32/164)Updating files:  20% (33/164)Updating files:  20% (34/164)Updating files:  21% (35/164)Updating files:  21% (36/164)Updating files:  22% (37/164)Updating files:  23% (38/164)Updating files:  23% (39/164)Updating files:  24% (40/164)Updating files:  25% (41/164)Updating files:  25% (42/164)Updating files:  26% (43/164)Updating files:  26% (44/164)Updating files:  27% (45/164)Updating files:  28% (46/164)Updating files:  28% (47/164)Updating files:  29% (48/164)Updating files:  29% (49/164)Updating files:  30% (50/164)Updating files:  31% (51/164)Updating files:  31% (52/164)Updating files:  32% (53/164)Updating files:  33% (55/164)Updating files:  34% (56/164)Updating files:  34% (57/164)Updating files:  35% (58/164)Updating files:  35% (59/164)Updating files:  36% (60/164)Updating files:  37% (61/164)Updating files:  37% (62/164)Updating files:  38% (63/164)Updating files:  39% (64/164)Updating files:  39% (65/164)Updating files:  40% (66/164)Updating files:  41% (68/164)Updating files:  42% (69/164)Updating files:  42% (70/164)Updating files:  43% (71/164)Updating files:  43% (72/164)Updating files:  44% (73/164)Updating files:  45% (74/164)Updating files:  46% (76/164)Updating files:  46% (77/164)Updating files:  47% (78/164)Updating files:  48% (79/164)Updating files:  48% (80/164)Updating files:  49% (81/164)Updating files:  50% (82/164)Updating files:  50% (83/164)Updating files:  51% (84/164)Updating files:  51% (85/164)Updating files:  52% (86/164)Updating files:  53% (87/164)Updating files:  54% (89/164)Updating files:  55% (91/164)Updating files:  56% (92/164)Updating files:  56% (93/164)Updating files:  57% (94/164)Updating files:  58% (96/164)Updating files:  59% (97/164)Updating files:  59% (98/164)Updating files:  60% (99/164)Updating files:  60% (100/164)Updating files:  61% (101/164)Updating files:  62% (102/164)Updating files:  62% (103/164)Updating files:  63% (104/164)Updating files:  64% (105/164)Updating files:  64% (106/164)Updating files:  65% (107/164)Updating files:  65% (108/164)Updating files:  66% (109/164)Updating files:  67% (110/164)Updating files:  67% (111/164)error: reset died of signal 10
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
