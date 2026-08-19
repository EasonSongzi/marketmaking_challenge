# Market-Maker Experiment: market-loop-20260818-6

- Status: active
- Started: 2026-08-19T01:47:53.800Z
- Starting baseline: g6-contract-rfq-wide (12.80/16.00)
- Current baseline: g6-contract-rfq-wide (12.80/16.00)
- Stop condition: not reached
- Score trend: 12.80

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
Promotion: none.
Finding: All three selective-size candidates passed 20/20 with zero bankruptcies and runtime errors. Low-loss-side size three preserved 12.80 points, raised combined PnL from 105.88 to 114.50, and improved minimum capital from 7.38/10.00 to 8.13/10.00. It protected case 9 first by 8.81, case 13 second by 0.40, case 15 first by 1.08, and case 16 first by 13.70; it also narrowed case 17's upward gap from 1.57 to 0.63 while increasing its third-place buffer to 0.92. Case 14 remained second but rose from 8.97 to 9.70 PnL. Position-reducing size three was nearly inactive economically: it held 12.80 but reduced PnL by 0.08 and left the critical boundaries essentially unchanged. The 25-percent cash-floor proxy scored 12.60 with 126.90 PnL and 7.45/10.00 minimum capital: it won case 17 by 1.85 and lifted case 14 PnL to 12.08, while losing case 13 from second to third by 3.01. Thus low-loss activation is the safe broad signal, while the cash-floor activation has explicit parameter upside toward a 13.00 rank set if a stricter floor can restore case 13 without surrendering its new case-17 win.
Next-generation rationale: Archive the low-loss winner under the fixed selector and retain the capital-gated non-winner as the single focused challenger. Next tune only its 25-percent cash-floor constant with predeclared coarse, medium, and fine samples; the target is to recover case 13 to second while keeping case 17 first and cases 9, 15, and 16 first.
Challenger update: admitted market-loop-20260818-6-g01-g1-capital-third.
Previous failure (setup): git -C /Users/easonhao/Documents/dev/Akuna_challenge worktree add --detach /tmp/akuna-market-maker/market-loop-20260818-6/g01/g1-low-loss-third bb95d64c3528198f500bec8730a1c7580a270422 failed: Preparing worktree (detached HEAD bb95d64)
fatal: could not create leading directories of '.git/worktrees/g1-low-loss-third': Operation not permitted
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
