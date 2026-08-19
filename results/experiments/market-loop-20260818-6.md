# Market-Maker Experiment: market-loop-20260818-6

- Status: active
- Started: 2026-08-19T01:47:53.800Z
- Starting baseline: g6-contract-rfq-wide (12.80/16.00)
- Current baseline: g4-fill-side-once (12.80/16.00)
- Stop condition: not reached
- Score trend: 12.80 → 12.80 → 12.80 → 12.80

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore quote

The 12.80 research note identifies selective third-unit RFQ participation as the only unevaluated structure with evidence of winning cases 13 and 14. Preserve every champion price, the 10/1 estimator, FOK behavior, and contract-repeat widening while testing three distinct size-allocation signals that keep quantity two as the default and avoid global size three.

Parent: champion `g6-contract-rfq-wide` (`353ad16d0004889c9ed825971d416fe543ec6b51e5dc9851a9e32d5bcf7be2fe`).

### g1-low-loss-third

- Hypothesis: Adding one unit only on quote sides whose incremental worst-case loss is at most 0.25 can recover the case-13/14 participation benefit without the case-7/12 bankruptcies caused by global size three.
- Implementation plan: Keep champion bid and offer prices byte-for-byte equivalent. Set bid quantity to three only when the final bid price is at most 0.25, and set offer quantity to three only when one minus the final offer price is at most 0.25; otherwise keep that side at two. Add focused synthetic assertions for central, tail, repeat-request, and boundary prices.
- Worker summary: Preserved champion pricing and made bid/offer quantities independently equal to three only when that side's final maximum loss per added contract was at most 0.25; otherwise retained size two. Scope validation, compilation, diff inspection, and focused central/tail/repeat/boundary assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 114.50; minimum capital 8.13/10.00
- Baseline delta: 0.00 points; PnL 8.62

### g1-reducing-third

- Hypothesis: Adding one unit only when a full three-lot fill is guaranteed to reduce an existing option position can increase useful participation without ever increasing directional inventory beyond the champion path.
- Implementation plan: Keep champion prices unchanged. Quote an offer quantity of three only for positions of at least +3 and a bid quantity of three only for positions of at most -3, so the entire possible fill stays position-reducing; keep every other side at two. Test flat, small, threshold, and larger long/short positions plus repeat-request pricing.
- Worker summary: Preserved champion pricing and made a full three-lot fill available only on the side guaranteed to reduce an existing position without crossing flat: bid at position <= -3 or offer at position >= 3. Scope validation, compilation, diff inspection, and focused position/repeat assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 105.80; minimum capital 7.38/10.00
- Baseline delta: 0.00 points; PnL -0.08

### g1-capital-third

- Hypothesis: A conservative live-portfolio capacity gate can allow the third unit early in safe sessions while withdrawing it as active net exposure approaches a fixed cash floor, avoiding the global-size bankruptcies without needing to reduce baseline liquidity.
- Implementation plan: Keep champion prices unchanged and quantity two as the default. Inside quote, compute conservative active-option exposure from current net positions and permit quantity three on a side only when that exposure plus the three-lot side maximum loss leaves at least 25 percent of starting cash uncommitted. Use only currently active option IDs so expired contracts release the proxy reserve. Add a short MarketMaker helper only if the calculation cannot stay readable inline, and test low/high cash, expired positions, and bid/offer maximum-loss asymmetry.
- Worker summary: Preserved champion pricing and added a quote-local active-position exposure proxy that admits size three independently by side only when the three-lot maximum loss leaves 25 percent of starting cash uncommitted; inactive option IDs release proxy exposure. Scope validation, compilation, diff inspection, and focused cash/expiry/asymmetry/repeat assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 126.90; minimum capital 7.45/10.00
- Baseline delta: -0.20 points; PnL 21.02

Selection: g1-low-loss-third.
Promotion: g1-low-loss-third (7c07e04b1661c77c785f7593deffa67a358506ff).
Finding: All three selective-size candidates passed 20/20 with zero bankruptcies and runtime errors. Low-loss-side size three preserved 12.80 points, raised combined PnL from 105.88 to 114.50, and improved minimum capital from 7.38/10.00 to 8.13/10.00. It protected case 9 first by 8.81, case 13 second by 0.40, case 15 first by 1.08, and case 16 first by 13.70; it also narrowed case 17's upward gap from 1.57 to 0.63 while increasing its third-place buffer to 0.92. Case 14 remained second but rose from 8.97 to 9.70 PnL. Position-reducing size three was nearly inactive economically: it held 12.80 but reduced PnL by 0.08 and left the critical boundaries essentially unchanged. The 25-percent cash-floor proxy scored 12.60 with 126.90 PnL and 7.45/10.00 minimum capital: it won case 17 by 1.85 and lifted case 14 PnL to 12.08, while losing case 13 from second to third by 3.01. Thus low-loss activation is the safe broad signal, while the cash-floor activation has explicit parameter upside toward a 13.00 rank set if a stricter floor can restore case 13 without surrendering its new case-17 win.
Next-generation rationale: Archive the low-loss winner under the fixed selector and retain the capital-gated non-winner as the single focused challenger. Next tune only its 25-percent cash-floor constant with predeclared coarse, medium, and fine samples; the target is to recover case 13 to second while keeping case 17 first and cases 9, 15, and 16 first.
Challenger update: admitted market-loop-20260818-6-g01-g1-capital-third.
Previous failure (setup): git -C /Users/easonhao/Documents/dev/Akuna_challenge worktree add --detach /tmp/akuna-market-maker/market-loop-20260818-6/g01/g1-low-loss-third bb95d64c3528198f500bec8730a1c7580a270422 failed: Preparing worktree (detached HEAD bb95d64)
fatal: could not create leading directories of '.git/worktrees/g1-low-loss-third': Operation not permitted
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: tune quote

The capital-gated challenger passed 20/20, won case 17 by 1.85, raised case-14 PnL from 8.97 to 12.08, and kept cases 9, 15, and 16 first, but its permissive 25-percent cash floor moved case 13 from second to third. Tune only the cash-floor fraction upward so progressively fewer third units are admitted, seeking the boundary that restores case 13 while retaining the new case-17 win.

### cash-floor-coarse-040

- Hypothesis: coarse parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.4}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 126.63; minimum capital 7.46/10.00
- Baseline delta: -0.20 points; PnL 12.13

### cash-floor-coarse-055

- Hypothesis: coarse parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.55}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 122.29; minimum capital 8.44/10.00
- Baseline delta: -0.20 points; PnL 7.79

### cash-floor-coarse-075

- Hypothesis: coarse parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.75}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 116.54; minimum capital 8.38/10.00
- Baseline delta: 0.00 points; PnL 2.04

### cash-floor-medium-030

- Hypothesis: medium parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.3}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 127.36; minimum capital 7.27/10.00
- Baseline delta: -0.20 points; PnL 12.86

### cash-floor-medium-035

- Hypothesis: medium parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.35}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 127.29; minimum capital 6.99/10.00
- Baseline delta: -0.20 points; PnL 12.79

### cash-floor-medium-045

- Hypothesis: medium parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.45}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 127.97; minimum capital 7.58/10.00
- Baseline delta: -0.20 points; PnL 13.47

### cash-floor-fine-026

- Hypothesis: fine parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.26}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 126.90; minimum capital 7.45/10.00
- Baseline delta: -0.20 points; PnL 12.40

### cash-floor-fine-028

- Hypothesis: fine parameter tuning for market-loop-20260818-6-g01-g1-capital-third
- Implementation plan: {"cashFloorFraction":0.28}
- Worker summary: Designed eight unique, frozen cashFloorFraction samples spanning 0.26 to 0.75 with coarse, medium, and fine coverage and no parent vector. The lead materialized them as AST-only replacements of MarketMaker.quote constant ordinal 23; all variants compiled and passed scope validation before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 126.52; minimum capital 7.33/10.00
- Baseline delta: -0.20 points; PnL 12.02

Selection: cash-floor-coarse-075.
Promotion: cash-floor-coarse-075 (fc64e451f1fdb8fc22a8e2b43ada92df053bca31).
Finding: All eight cash-floor variants passed 20/20 with zero bankruptcies and runtime errors. Fractions 0.26 through 0.55 all scored 12.60: each preserved cases 9, 15, and 16 first and kept the challenger's new case-17 win, but case 13 remained third. The 0.75 coarse sample restored 12.80 points, produced 116.54 combined PnL, and improved minimum capital to 8.38/10.00. Relative to the 12.80 low-loss champion it swaps the two target boundaries rather than reaching 13.00: case 13 falls from second to third by 4.71 behind second, while case 17 moves from second to first by 0.96. It keeps case 9 first by 8.32, case 15 first by 0.25, case 16 first by 14.40, and case 14 second with 10.69 PnL. The fixed selector nevertheless ranks 0.75 above the current champion because it ties at 12.80 and adds 2.04 combined PnL while also improving minimum capital by 0.25. No sampled floor recovered case 13 while retaining the case-17 win, so the one-dimensional cash-floor family did not meet the research note's 13.00 no-rank-regression target.
Next-generation rationale: Archive the tuned 0.75 revision and follow the pipeline's fixed promotion decision. Stop further cash-floor sweeps: the entire predeclared range showed a discrete case-13/case-17 rank trade rather than a 13.00 overlap. Move to the next structural family from the docs, using estimator-execution crosses or trade-confirmed side-specific RFQ information instead of another adjacent cash-floor constant.

## Generation 3: explore warm_up

The selective-size family produced only a case-13/case-17 rank trade, so follow the docs' next priority. Use the active full-source 12.80 contract-RFQ challenger, which preserves the exact tail-only sixth-cent execution stack, to test the two unmeasured rate-estimator crosses and one structurally separate company-shrinkage estimator while holding every execution method fixed.

Parent: challenger `market-loop-20260818-6-g01-champion-g6-contract-rfq-wide r00` (`353ad16d0004889c9ed825971d416fe543ec6b51e5dc9851a9e32d5bcf7be2fe`).

### g3-tail-pure-rate

- Hypothesis: Pure profiled transition likelihood combined with the exact tail-only sixth-cent execution stack can retain the 12.80 rank set while improving the case-17 boundary beyond the 10/1 estimator.
- Implementation plan: Keep the existing bounded reversion grid, moment-profiled up/down probabilities, probability feasibility handling, and all company estimates, but score candidates using transition log likelihood alone with no probability or reversion penalties. Preserve quote, FOK, and pricing behavior exactly.
- Worker summary: Replaced the 10/1 objective in the profiled rate-fit helper with pure transition log likelihood while preserving the complete parent execution stack. Scope validation, compilation, diff inspection, and an independent deterministic grid-fit check passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 102.35; minimum capital 7.41/10.00
- Baseline delta: -0.20 points; PnL -14.19

### g3-tail-rate-25-2

- Hypothesis: The 25/2 penalized rate fit may provide more case-13 and case-9 boundary protection than pure likelihood while retaining enough likelihood signal to win or tighten case 17 under the tail-only quote structure.
- Implementation plan: Keep the current profiled grid and feasibility logic, but use coefficient 25 on each squared up/down anchor deviation and coefficient 2 on the squared reversion anchor deviation. Preserve all company estimation and every execution rule exactly.
- Worker summary: Changed only the profiled rate-fit penalties to 25 on both probability-anchor deviations and 2 on reversion deviation, preserving all other estimation and execution behavior. Scope validation, compilation, diff inspection, and a deterministic fit check passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 109.94; minimum capital 7.32/10.00
- Baseline delta: -0.20 points; PnL -6.60

### g3-company-shrink

- Hypothesis: Finite-sample shrinkage of company drift, rate beta, and residual covariance can improve penny decisions on company contracts without disturbing the proven 10/1 rate process or any execution boundary.
- Implementation plan: Retain the current 10/1 rate estimator. After the two company regressions, shrink each drift and rate beta by 25 percent toward the cross-company mean, and shrink residual covariance by 25 percent toward zero before covariance decomposition while leaving residual variances unchanged. Preserve the exact pricer, quote, and FOK logic.
- Worker summary: Kept the 10/1 rate fit, shrank each company drift and rate beta 25 percent toward the pairwise mean, and multiplied residual covariance by 0.75 before decomposition and diagnostics. Scope validation, compilation, diff inspection, and synthetic shrinkage arithmetic checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.50/16.00 points; PnL 72.76; minimum capital 7.70/10.00
- Baseline delta: -1.30 points; PnL -43.78

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three estimator candidates passed 20/20 with zero bankruptcies and runtime errors, but none beat either the 12.80 research parent or current champion. Pure likelihood scored 12.60 with 102.35 PnL and moved case 17 from the parent's second place to third, 1.72 behind second; case 9 remained first by only 0.78. The 25/2 fit also scored 12.60 with 109.94 PnL and left case 17 third, 0.55 behind second, while cases 9, 13, 15, and 16 retained the parent ranks. These two exact tail-six crosses therefore fail the docs' strict gate and exhaust further rate-estimator work. Company shrinkage was decisively harmful at 11.50 points and 72.76 PnL: case 14 fell from second to third, case 16 from first to third, and case 17 remained third, despite cases 9, 13, and 15 holding. None strictly improved the selected parent, so no derived challenger has tuning upside.
Next-generation rationale: Keep the current champion unchanged and stop both rate-estimator and simple company-shrinkage work. Use the next generation on the docs' remaining structural counterparty hypothesis: infer actual same-contract fill direction from position changes across quote calls and apply only a side-specific repeat adjustment, preserving all first-contact prices, size policy, estimator, and FOK behavior.

## Generation 4: explore quote

Rate and company estimation are exhausted. Test the docs' final counterparty hypothesis on the current 12.80 champion: infer a completed prior RFQ fill from the option-position change observed after the last quote, attribute its direction to that recorded counterparty/contract pair, and adjust only the side matching the prior execution. Preserve first-contact behavior, the 0.75 capital-size gate, pricing, estimator, and FOK rules.

Parent: champion `cash-floor-coarse-075` (`115b5a6ad6c2cb921318b6cc0ac47696a2eae331b6095422065e81b582665ca7`).

### g4-fill-side-wide

- Hypothesis: A persistent one-cent widening only on the side previously executed by the same counterparty in the same contract will filter repeat adverse flow without weakening the untraded side or unrelated RFQs.
- Implementation plan: Lazily record the last quote's counterparty and position snapshot per option. On the next quote call, infer a prior maker buy when position increased or maker sell when it decreased, persist that signed direction for the prior counterparty/option pair, and widen only its matching bid or offer by one cent on later quotes from that pair. Apply this after the champion price logic, clamp prices, retain the 0.75 quantity gate, and update the snapshot for the current request.
- Worker summary: Added per-option last-quote snapshots, inferred the prior counterparty's maker fill from the next observed position delta, persisted its signed direction per counterparty/contract pair, and widened only that side by one cent on later matching RFQs. After one repair pass, champion repeat pricing and all quantity logic were preserved; scope, compilation, isolation, clamp, and persistence checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 117.59; minimum capital 8.40/10.00
- Baseline delta: 0.00 points; PnL 1.05

### g4-fill-side-once

- Hypothesis: The adverse-selection signal may be short-lived, so widening only the next same-pair quote on the previously executed side can protect immediate repeat flow without permanently sacrificing routing competitiveness.
- Implementation plan: Infer prior fill direction from the last per-option quote snapshot and current position as above, but store a one-shot signed signal for that counterparty/option pair. Widen only the matching side by one cent on the next quote from that pair and consume the signal. Preserve all other champion price and quantity behavior and refresh the last-quote snapshot.
- Worker summary: Added per-option last-quote snapshots and a one-shot signed signal attributed to the prior counterparty/contract when the next position delta confirmed a fill. The next matching RFQ widened only that executed side by one cent and consumed the signal. Scope, compilation, pair isolation, one-shot, clamp, and quantity checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 117.59; minimum capital 8.40/10.00
- Baseline delta: 0.00 points; PnL 1.05

### g4-fill-side-two

- Hypothesis: Requiring two inferred same-direction fills before side-specific widening will distinguish persistent informed behavior from one benign execution and preserve fragile case-13/15 routing.
- Implementation plan: Infer each prior fill from the last quote snapshot, keep a signed consecutive-fill count per counterparty/option pair, reset it on direction reversal, and widen only the matching side by one cent after the count reaches two. Preserve first and single-fill quotes, all champion price/quantity logic, and update the current snapshot.
- Worker summary: Added per-option last-quote snapshots and signed consecutive fill streaks per counterparty/contract, widening only the matching side after two same-direction inferred fills. A repair pass restored the champion's request-count repeat widening and cross-counterparty attribution. Scope, compilation, streak/reversal/isolation, and quantity checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 116.54; minimum capital 8.38/10.00
- Baseline delta: 0.00 points; PnL 0.00

Selection: g4-fill-side-once.
Promotion: g4-fill-side-once (19bdccda68a93e3ccb6b560c289c9242e4e87a66).
Finding: All three inferred fill-direction policies passed 20/20 with zero bankruptcies and runtime errors and preserved 12.80 points. Persistent and one-shot side-specific widening produced identical complete results: 117.59 combined PnL and 8.40/10.00 minimum capital, improving the champion by 1.05 PnL and 0.02 capital. They kept case 9 first by 8.34, case 15 first by 0.29, case 16 first by 16.97, and case 17 first by 0.99, but case 13 remained third, 4.69 behind second; case 14 remained second at 10.71. The two-fill gate exactly reproduced the parent metrics, showing it did not activate on score-relevant flow. Identical persistent/one-shot evidence implies the useful inferred fill signal is consumed immediately or does not recur later; the simpler one-shot source wins the fixed selector's modified-line tiebreak. This family improves economics but does not meet the 13.00 no-rank-regression target and has no justified constant-tuning upside.
Next-generation rationale: Promote the simpler one-shot fill-side rule under the fixed selector. With estimator and memory structures exhausted, combine the two independently safe size signals structurally: retain the 0.75 active-exposure gate that wins case 17, then add unconditional third units only on low-loss sides, testing both-sided and bid/offer-attributed unions. The target is to restore case 13 to second without surrendering case 17 first.

## Generation 5: explore quote

The 0.75 active-exposure gate wins case 17 but leaves case 13 third, while the independently safe low-loss-side rule kept case 13 second and moved case 17 closer to first. Combine these two non-global size signals without changing prices or memory: test the union on both sides and isolate bid-side versus offer-side low-loss participation to identify whether one direction can restore case 13 while preserving the case-17 win.

Parent: champion `g4-fill-side-once` (`bdb36cb25de46bbd30c9c349742aef0ced17527e40969e35a361c36347833949`).

### g5-union-both-third

- Hypothesis: Allowing a third unit whenever either the 0.75 portfolio-capacity gate passes or that quote side's incremental maximum loss is at most 0.25 can combine the case-17 capital signal with the safe case-13/14 tail participation signal.
- Implementation plan: Preserve all champion prices, request/fill memory, and calculations. Set each side independently to quantity three when its existing capital-capacity condition passes OR its final per-contract maximum loss is at most 0.25; otherwise keep size two. Do not change the 0.75 floor or any other behavior.
- Worker summary: Preserved all champion prices, fill/request memory, and the 0.75 capacity gate, then admitted quantity three independently on either side when the capacity gate passed or final per-contract maximum loss was at most 0.25. Scope, compilation, diff, price/memory, and central/tail/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 122.05; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 4.46

### g5-union-bid-third

- Hypothesis: Case 13 may need only additional low-loss maker-buy participation, so adding the low-loss union on bids while retaining the pure 0.75 capacity gate on offers can restore its rank without adding harmful sell-side units.
- Implementation plan: Preserve champion prices and memory. Keep offer quantity exactly on the existing capital-capacity rule. Set bid quantity to three when the capital rule passes OR final bid price is at most 0.25; otherwise two. Preserve every constant and non-size rule.
- Worker summary: Preserved the offer capacity rule and all champion behavior, adding only a bid-side OR condition for final bid price at most 0.25. Scope, compilation, one-line diff, price/memory, and side-isolation assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.50/16.00 points; PnL 121.50; minimum capital 8.14/10.00
- Baseline delta: -0.30 points; PnL 3.91

### g5-union-offer-third

- Hypothesis: Case 13 may instead need only additional low-loss maker-sell participation, so adding the low-loss union on offers while retaining the pure 0.75 capacity gate on bids can restore its rank with less routing disturbance.
- Implementation plan: Preserve champion prices and memory. Keep bid quantity exactly on the existing capital-capacity rule. Set offer quantity to three when the capital rule passes OR one minus final offer price is at most 0.25; otherwise two. Preserve every constant and non-size rule.
- Worker summary: Preserved the bid capacity rule and all champion behavior, adding only an offer-side OR condition for final sell maximum loss at most 0.25. Scope, compilation, diff, price/memory, and side-isolation assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.80/16.00 points; PnL 120.24; minimum capital 8.41/10.00
- Baseline delta: 0.00 points; PnL 2.65

Selection: g5-union-both-third.
Promotion: none.
Finding: All three hybrid size candidates completed 20/20 with zero bankruptcies and runtime errors; the bid-only source required one successful automatic retry after a browser navigation timeout. Both-sided union preserved 12.80, raised combined PnL from 117.59 to 122.05, and held minimum capital at 8.15/10.00. It kept cases 9, 15, 16, and 17 first, with case-17 lead increased to 1.48, but case 13 remained third by 4.36 behind second; case 14 stayed second at 10.81. Offer-only union also held 12.80 with 120.24 PnL and the strongest 8.41/10.00 minimum capital, but case 13 remained third. Bid-only union scored 12.50 because case 15 fell from first to second by 0.09, while case 13 still stayed third. Adding the low-loss rule therefore does not counteract the case-13 routing effect of capital-gated units, and extra bid-side low-loss participation is specifically risky to case 15. The fixed selector chooses the both-sided union on PnL.
Next-generation rationale: Promote the both-sided union, then use the final generation to isolate which capital-gated side creates the case-17 win and case-13 loss. Keep low-loss quantity three on both sides, but enable additional capacity-gated central units on bid only, offer only, or only when a full three-lot fill is position-reducing. A successful split must restore case 13 to second while keeping case 17 first and protecting cases 9, 15, and 16.
Previous failure (runner): g5-union-bid-third runner failure; automatic retry requested
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
