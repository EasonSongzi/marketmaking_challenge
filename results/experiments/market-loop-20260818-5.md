# Market-Maker Experiment: market-loop-20260818-5

- Status: complete
- Started: 2026-08-18T22:47:46.574Z
- Starting baseline: g6-loss-side-five (12.60/16.00)
- Current baseline: g6-contract-rfq-wide (12.80/16.00)
- Stop condition: generation limit reached
- Score trend: 12.60 → 12.80 → 12.80

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

## Generation 3: explore quote

The derived parent is the first strategy to keep case 15 first and case 17 second, but its global sixth cent moves case 13 from second to third. The failed central-band-six candidate shows that the decisive case-15 and case-17 filtering occurs outside rounded fair values 25-75. Preserve the parent's 10/1 estimator, four-cent safe side, fifth high-loss cent, and all FOK behavior while gating only its second high-loss cent.

Parent: challenger `market-loop-20260818-5-g02-g2-loss-side-six r00` (`0781de8891bb8033edc128409269382e1edfb3f15ecdad3825a69b7622e4c72e`).

### g3-tail-loss-six

- Hypothesis: Keeping the sixth cent only outside the 25-75 fair-value band will preserve the tail filtering that repaired cases 15 and 17 while restoring the five-cent central quotes needed for case 13.
- Implementation plan: Retain the four-cent base and existing one-cent maximum-loss-side shade everywhere. Add the second high-loss-side cent only when rounded fair value is below 25 or above 75 cents. Preserve size two, clamps, estimator, and FOK rules.
- Worker summary: Retained the derived parent's four-cent base and fifth high-loss-side cent, then limited the sixth cent to rounded fair values below 25 or above 75. Parent-relative diff, scope validation, compilation, and whitespace checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 105.78; minimum capital 7.32/10.00
- Baseline delta: 0.20 points; PnL -16.50

### g3-extreme-loss-six

- Hypothesis: The sixth cent is useful only when quoted per-contract maximum loss is materially above the 0.50 boundary; requiring more than 0.60 loss may keep the case-15/17 protection without withdrawing from case-13 flow.
- Implementation plan: Retain the existing fifth cent when base quoted maximum loss exceeds 0.50. Add the second cent only when the unshaded base bid exceeds 0.60 or one minus the unshaded base offer exceeds 0.60. Keep the safe side at four cents and preserve all other behavior.
- Worker summary: Retained the fifth cent above 0.50 unshaded quoted loss and limited the sixth cent to unshaded quoted loss above 0.60, keeping the complete 10/1 estimator and FOK stack. Parent-relative diff, scope validation, compilation, and whitespace checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 105.68; minimum capital 7.32/10.00
- Baseline delta: 0.00 points; PnL -16.60

### g3-rate-loss-six

- Hypothesis: Because the 10/1 change acts through the rate estimator, applying the sixth cent only to direct FED contracts may retain the rank repairs attributable to rate-sensitive adverse flow while keeping company contracts competitive enough for case 13.
- Implementation plan: Retain the existing fifth high-loss-side cent for every option. Add the second cent only when the option has a FED underlying leg; leave company-only and company-comparison contracts at the parent's five-cent high-loss side. Preserve all non-quote behavior.
- Worker summary: Retained the fifth high-loss-side cent for all contracts and limited the sixth cent to options with a direct FED leg, leaving company-only and company-comparison contracts at five cents. Parent-relative diff, scope validation, compilation, and whitespace checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 117.24; minimum capital 7.02/10.00
- Baseline delta: -0.30 points; PnL -5.04

Selection: g3-tail-loss-six.
Promotion: g3-tail-loss-six (75c72b7b4e6ac963a903ae050d3fab6128393972).
Finding: All three second-cent gates passed 20/20 without bankruptcy or runtime errors. Tail-only six cents achieved the documented 12.80 milestone and passed the promotion gate: case 9 remained first by 0.81, case 13 returned to second by 0.26, case 15 remained first by 0.77, case 16 remained first, and case 17 remained second by 0.95. It scored 12.80 with 105.78 PnL and 7.32/10.00 minimum capital, improving the champion by 0.20 points. Extreme-loss-only six cents kept cases 15 and 17 but left case 13 third, scoring 12.60 with 105.68 PnL. Direct-FED-only six cents restored case 13 but lost cases 15 and 17, scoring 12.30 with 117.24 PnL. The complementary central/tail evidence is decisive: the sixth cent must remain on high-loss tail quotes, while central quotes need the fifth-cent behavior.
Next-generation rationale: Promote tail-only six cents. The 12.80 rank envelope identified by the research notes is now achieved, so use the remaining generations for post-milestone structural estimation ideas rather than adjacent quote-width constants: hold the complete execution stack fixed and explore joint or state-aware rate-transition estimation in warm_up.

## Generation 4: explore warm_up

The promoted 12.80 champion reaches the full historical rank envelope, and the research notes explicitly place true joint rate likelihood/MAP after the low-penalty recross. The current helper still grids only reversion and derives up/down probabilities from moment equations. Hold the complete tail-six execution stack fixed and test three genuinely joint estimators that optimize or regularize all three transition parameters together.

Parent: champion `g3-tail-loss-six` (`8d61104514e06c4d5e213399e5f60033b19024f64370cd7a55a912f7019ee66a`).

### g4-joint-map

- Hypothesis: A bounded coarse-to-fine coordinate MAP fit over up probability, down probability, and reversion can improve penny decisions beyond the profiled moment fit while the 10/1 anchors preserve the newly won rank boundaries.
- Implementation plan: Replace the one-dimensional reversion grid with deterministic coordinate refinement of all three feasible rate parameters. Initialize from the existing smoothed/moment values, score the full clipped transition likelihood with the current 10/1 quadratic anchors, use coarse through fine step sizes, and project candidates to positive probabilities with sum at most one and reversion in [0,1]. Preserve company estimation and every execution method.
- Worker summary: Replaced the profiled reversion grid with deterministic coarse-to-fine coordinate refinement over feasible up/down/reversion vectors under the full 10/1 MAP objective. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.40/16.00 points; PnL 89.11; minimum capital 26.79/40.00
- Baseline delta: -0.40 points; PnL -16.67

### g4-joint-neighborhood

- Hypothesis: Joint neighborhood moves can escape coordinate-wise plateaus created by clipping tilted probabilities, finding a different stable MAP solution without weakening the 10/1 protection.
- Implementation plan: Use a bounded coarse-to-fine neighborhood search that evaluates feasible simultaneous up/down/reversion moves around the current best vector, retains the best 10/1 penalized full-likelihood vector, and shrinks the neighborhood across coarse, medium, and fine resolutions. Keep the search deterministic and preserve all non-warm_up behavior.
- Worker summary: Replaced the profiled fit with bounded joint 27-neighbor improvement over all three parameters at three resolutions, retaining the 10/1 full-likelihood objective. Scope validation, compilation, feasibility, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.40/16.00 points; PnL 87.88; minimum capital 26.79/40.00
- Baseline delta: -0.40 points; PnL -17.90

### g4-joint-ridge

- Hypothesis: A jointly regularized transition regression may be more stable than clipped likelihood on short histories, using both up and down equations together while retaining the moment anchors that protect cases 9 and 13.
- Implementation plan: Replace the profiled likelihood helper with a small deterministic alternating ridge fit of the two indicator equations: jointly update base up/down probabilities and their shared signed target-gap slope, shrink toward smoothed probabilities and moment reversion, then project to the MarketParameters feasibility region. Use fixed iterations with no nested high-dimensional grid and preserve all execution behavior.
- Worker summary: Replaced the likelihood profile with six alternating ridge updates for the two transition-indicator equations and shared reversion slope, followed by feasibility projection. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 107.12; minimum capital 7.07/10.00
- Baseline delta: -0.50 points; PnL 1.34

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three joint estimators passed 20/20 without bankruptcy or runtime errors, but none preserved the 12.80 rank envelope. Coordinate MAP scored 12.40 with 89.11 PnL and neighborhood MAP scored 12.40 with 87.88; both retained cases 9, 13, 15, and 16 at the champion ranks but moved case 17 from second to fourth with -13.21 PnL. Joint ridge scored 12.30 with 107.12 PnL, losing case 15 from first to second and case 17 from second to third. The current profiled 10/1 estimator is therefore materially better on the remaining discrete boundaries than these fully joint fits, even though ridge slightly raised aggregate PnL. No joint candidate has focused tuning upside sufficient to justify displacing or extending it in the remaining two generations.
Next-generation rationale: Keep the 12.80 champion unchanged. With adjacent estimator structure now tested and rejected, use generation 5 on the research notes' highest-priority unused feature: counterparty-aware adverse-selection control for FOK orders. Make only small online, ID-agnostic adjustments derived from prior orders from the same counterparty, preserving the fair-value inventory unwind and all quote behavior.

## Generation 5: explore respond_to_fok

The 12.80 champion has exhausted the historical static rank envelope, and generation 4 rejected fully joint rate estimators. Counterparty ID remains the highest-priority unused feature in the research notes. Test three small ID-agnostic online FOK controls based only on prior orders from the same counterparty, preserving position-bounded fair-value unwinds, quote behavior, the 10/1 estimator, the quantity tier, and the half-dollar loss cap.

Parent: champion `g3-tail-loss-six` (`8d61104514e06c4d5e213399e5f60033b19024f64370cd7a55a912f7019ee66a`).

### g5-repeat-fok-edge

- Hypothesis: Repeated FOK requests from the same counterparty are more likely to reflect a persistent informed strategy, so one additional cent of edge after its first new-risk order may remove adverse repeat flow without reducing first-contact liquidity.
- Implementation plan: Lazily track the number of new-risk FOK requests per counterparty inside respond_to_fok. Preserve the inventory-unwind exception. For later new-risk orders from an already seen counterparty, add one cent to the existing two-cent/3.4-cent edge; update the request count deterministically and retain both loss caps.
- Worker summary: Added lazy per-counterparty new-risk FOK request counts and one cent of extra edge after the first request, bypassing the existing fair-value inventory unwind. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 105.19; minimum capital 7.32/10.00
- Baseline delta: 0.00 points; PnL -0.59

### g5-flow-fok-edge

- Hypothesis: A counterparty that repeatedly trades in the same direction carries more directional adverse-selection risk than one whose flow reverses, so only continuation orders should pay an extra cent.
- Implementation plan: Lazily maintain a signed BUY-minus-SELL request imbalance per counterparty. Preserve fair-value inventory unwinds. On a new-risk FOK whose side continues the sign of its prior imbalance, add one cent to the current quantity-tier edge; then update the imbalance by one signed request and retain the half-dollar loss cap.
- Worker summary: Added lazy signed BUY-minus-SELL request imbalance per counterparty and one cent of extra edge only when new-risk flow continued the prior direction, preserving unwind and loss caps. Scope validation, focused behavior, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 104.30; minimum capital 7.32/10.00
- Baseline delta: 0.00 points; PnL -1.48

### g5-quality-fok-edge

- Hypothesis: Counterparties whose prior new-risk FOK prices offered below-threshold average edge should face stricter acceptance, while historically generous counterparties can retain the champion threshold.
- Implementation plan: For each counterparty, lazily track count and cumulative signed favorable edge of prior new-risk FOK requests relative to theoretical value. Preserve fair-value inventory unwinds. If the prior average offered edge is below the current order's base quantity-tier edge, require one additional cent; record the current offered edge and retain the existing loss cap.
- Worker summary: Added lazy per-counterparty cumulative offered-edge statistics and one cent of extra edge when prior average new-risk FOK quality was below the base quantity-tier threshold, preserving unwind and loss caps. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 104.95; minimum capital 7.32/10.00
- Baseline delta: 0.00 points; PnL -0.83

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three counterparty-aware FOK policies passed 20/20 without bankruptcy or runtime errors and preserved the champion's 12.80 score and 7.32/10.00 minimum capital, confirming repeated counterparty state exists during sessions. None improved economics: repeat gating produced 105.19 PnL, 0.59 below the champion; historical-quality gating produced 104.95, down 0.83; directional-flow gating produced 104.30, down 1.48. A uniform extra cent based on FOK request history filters profitable flow without changing any rank boundary, so these policies have no focused tuning upside for the final generation.
Next-generation rationale: Keep the champion unchanged. Use the sixth and final generation to complete the counterparty-information test on RFQs, where routing competition differs from fill-or-kill acceptance: test bilateral widening for repeated requesters, concentration-aware widening only when the same counterparty repeats the same contract, and size reduction for repeated requesters. Preserve the proven tail-six price structure for first contacts.

## Generation 6: explore quote

Generation 5 confirmed repeated counterparty state but found no benefit from stricter FOK gates. RFQ routing is different because quotes compete before the side is known. Use the final generation to test three ID-agnostic RFQ responses to repeat activity while preserving the champion's four-cent base, fifth high-loss cent, tail-only sixth cent, estimator, and FOK behavior for first contacts.

Parent: champion `g3-tail-loss-six` (`8d61104514e06c4d5e213399e5f60033b19024f64370cd7a55a912f7019ee66a`).

### g6-repeat-rfq-wide

- Hypothesis: A counterparty returning for later RFQs may be more selectively informed, so widening both sides by one cent after its first request can reduce adverse repeat fills while keeping first-contact competitiveness.
- Implementation plan: Lazily count quote requests per counterparty inside quote. Use the champion quote unchanged for the first request. On later requests, increase the base half-width from four to five cents on both sides, then apply the existing one-cent high-loss shade and tail-only second shade; retain size two and clamps.
- Worker summary: Added lazy per-counterparty RFQ counts and widened the base half-width from four to five cents after first contact, retaining the champion's high-loss and tail shades at size two. Scope validation, focused behavior, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.40/16.00 points; PnL 105.44; minimum capital 7.68/10.00
- Baseline delta: -0.40 points; PnL -0.34

### g6-contract-rfq-wide

- Hypothesis: Repeated requests for the same option are a stronger adverse-selection signal than unrelated activity from the same counterparty, so only contract-specific concentration should trigger wider prices.
- Implementation plan: Lazily count quote requests by counterparty and option ID. Use the champion quote on the first request for each pair. On repeats of the same pair, widen the base by one cent on both sides before applying the unchanged high-loss and tail shades; preserve size two and all non-quote behavior.
- Worker summary: Added lazy request counts keyed by counterparty and option ID, widening the base from four to five cents only after the same pair repeats while preserving champion prices on first contact and all existing shades. Scope validation, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 105.88; minimum capital 7.38/10.00
- Baseline delta: 0.00 points; PnL 0.10

### g6-repeat-rfq-small

- Hypothesis: Reducing exposure rather than price competitiveness may control repeat-counterparty risk without disturbing the penny routing boundaries that produce 12.80.
- Implementation plan: Lazily count quote requests per counterparty. Preserve every champion price exactly. Quote size two on first contact and size one on subsequent requests from that counterparty, on both bid and offer; preserve all estimator and FOK behavior.
- Worker summary: Preserved every champion price and added lazy per-counterparty counts that reduce both quote quantities from two to one after first contact. Scope validation, focused behavior, compilation, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 10.40/16.00 points; PnL 71.56; minimum capital 7.97/10.00
- Baseline delta: -2.40 points; PnL -34.22

Selection: g6-contract-rfq-wide.
Promotion: g6-contract-rfq-wide (1f65d9479c742933b16b0d2c286b6f2d9278dd89).
Finding: All three RFQ-memory policies passed 20/20 without bankruptcy or runtime errors. Contract-specific repeat widening uniquely passed the promotion gate: it preserved 12.80 points, raised PnL from 105.78 to 105.88, and improved minimum capital from 7.32 to 7.38. It kept cases 9, 15, and 16 first, case 13 second by 0.30, and case 17 second by 0.73. Widening every later RFQ from a counterparty scored only 12.40 because cases 13 and 17 fell to third, despite lifting minimum capital to 7.68. Reducing repeat sizes was strongly harmful, falling to 10.40 points and 71.56 PnL by losing rank in cases 9, 13, 15, and 17. The useful counterparty signal is therefore narrow contract-specific repetition, not broad identity-level defensiveness.
Next-generation rationale: Promote contract-specific repeat widening. The configured six-generation limit is reached; finish the run with the 12.80 champion and retain the verified evidence that only same-counterparty, same-option repetition supports a small RFQ adjustment.
