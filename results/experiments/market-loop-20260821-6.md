# Market-Maker Experiment: market-loop-20260821-6

- Status: active
- Started: 2026-08-21T20:19:21.714Z
- Starting baseline: g6-lowband-size-eight (14.70/16.00)
- Current baseline: g6-lowband-size-eight (14.70/16.00)
- Stop condition: not reached
- Score trend: 14.70

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: tune quote

The head challenger scores 14.70 and sits 1.58 dollars from rank 1 in case 18, the only case in the book within seven dollars of a rank change and worth exactly 0.20 under the 0.40 + 0.60 * (beaten / (N - 1)) map. Taking it promotes. Generation 6 of run market-loop-20260821-5 installed the last positive lever inside the fed_low_mean_regime near-expiry label: one extra lot on whichever side reduces an existing position, cutting the case-18 gap from 2.34 to 1.58. That generation graded the DIRECTION of the lever only. Its magnitude - the single lot added - and its position threshold - any non-zero position qualifies - have never been swept, and the indiscriminate and flat-book-entry variants that were graded are closed negative, so the surviving branch is exactly the inventory-reducing one whose two literals this batch varies. The lineage has tuningAttempts 0 and both attempts available. The lot increment appears as four separate literals - the offer-side capacity guard, the offer-side assignment, the bid-side capacity guard and the bid-side assignment - and all four are bound to ONE parameter so the guard can never authorise fewer lots than the assignment adds; that coupling is the whole safety argument for raising the increment, because each added lot is still checked against the same active_exposure / signed_reserve capacity arithmetic the surrounding ladder uses. The two position thresholds are bound separately and are constrained away from zero-crossing: the long threshold may only rise and the short threshold may only fall, so no vector can reopen the flat-book-entry arm that graded 2.49. The parent's three thinnest held margins are case 13 at 1.35, case 10 at 1.90 and case 14 at 5.21; all three lie outside the exclusive {18, 20} label and a label-gated change cannot reach them. Case 20 is the binding collateral check at 5.49 with a negative PnL, so the collateral budget is zero and any vector that spends more than 5.49 there gives back exactly what case 18 would win.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

### increment-2-thresh-0-0

- Hypothesis: coarse parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":2,"unwind_long_threshold":0,"unwind_short_threshold":0}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.29; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.47
- Objective outcome: target 0.00; gap 1.50; collateral loss 0.00; expected not met

### increment-4-thresh-0-0

- Hypothesis: coarse parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":4,"unwind_long_threshold":0,"unwind_short_threshold":0}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.23; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.41
- Objective outcome: target 0.00; gap 1.66; collateral loss 0.00; expected not met

### increment-1-thresh-3-neg3

- Hypothesis: coarse parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":1,"unwind_long_threshold":3,"unwind_short_threshold":-3}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.33; minimum capital 39.33/40.00
- Baseline delta: 0.00 points; PnL 21.51
- Objective outcome: target 0.00; gap 1.58; collateral loss 0.00; expected not met

### increment-3-thresh-0-0

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":3,"unwind_long_threshold":0,"unwind_short_threshold":0}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.32; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.50
- Objective outcome: target 0.00; gap 1.42; collateral loss 0.00; expected not met

### increment-2-thresh-1-neg1

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":2,"unwind_long_threshold":1,"unwind_short_threshold":-1}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.29; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.47
- Objective outcome: target 0.00; gap 1.50; collateral loss 0.00; expected not met

### increment-3-thresh-2-neg2

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":3,"unwind_long_threshold":2,"unwind_short_threshold":-2}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.32; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.50
- Objective outcome: target 0.00; gap 1.42; collateral loss 0.00; expected not met

### increment-1-thresh-1-neg1

- Hypothesis: fine parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":1,"unwind_long_threshold":1,"unwind_short_threshold":-1}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.26; minimum capital 39.26/40.00
- Baseline delta: 0.00 points; PnL 21.44
- Objective outcome: target 0.00; gap 1.58; collateral loss 0.00; expected not met

### increment-2-thresh-3-neg3

- Hypothesis: fine parameter tuning for market-loop-20260821-5-g06-g6-label-unwind-extra-lot
- Implementation plan: {"unwind_lot_increment":2,"unwind_long_threshold":3,"unwind_short_threshold":-3}
- Worker summary: Verified all six plan-declared ordinals against MarketMaker.quote and designed eight unique precommitted joint vectors spanning coarse, medium and fine granularities over unwind_lot_increment [1,4], unwind_long_threshold [0,3] and unwind_short_threshold [-3,0], excluding the parent vector (1, 0, 0). The lot increment was bound to all four literals of the near-expiry unwind block at once - both capacity guards and both assignments - so no vector could authorise fewer lots than it added. The materializer changed only AST-bound quote constants; every variant compiled, passed scope validation, and was diff-reviewed by the lead before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.36; minimum capital 39.33/40.00
- Baseline delta: 0.00 points; PnL 21.54
- Objective outcome: target 0.00; gap 1.50; collateral loss 0.00; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: The inventory-reducing unwind lot is a near-inert lever in both of its untested dimensions, and this batch closes both. All eight vectors scored 14.70 with 20/20 structurally complete, zero bankruptcies and zero runtime errors, and all sixteen scored ranks were identical to the parent's in every vector. The lot increment traces a shallow interior maximum on the case-18 gap: 1.58 at the parent increment of 1, 1.50 at 2, 1.42 at 3 and back out to 1.66 at 4, a total excursion of 0.24 across the whole integer range. Increment 3 is therefore the local optimum and improves the target gap by 0.16 with combined PnL 267.32 against the parent's 267.26, while leaving case 20 untouched at -0.74 and rank 1 by 5.49. The position-threshold axis is exactly inert on the target: at increment 1 the case-18 gap is 1.58 whether the thresholds are (0, 0), (1, -1) or (3, -3); at increment 2 it is 1.50 for (0, 0), (1, -1) and (3, -3); at increment 3 it is 1.42 for both (0, 0) and (2, -2). The thresholds move nothing but case 20, and only by +0.07 at the (3, -3) extreme. The mechanism this implies is that whenever the branch fires the option position is already at or beyond three lots, so restricting it to larger positions removes no fills. Both dimensions of dispatch item (a) are now graded, and the lever's total remaining headroom of 0.16 out of 1.58 says the case-18 gap will not be closed by resizing this branch.
Next-generation rationale: Item (a) of the dispatch queue is spent and returns at most 0.16 of the 1.58 needed. The batch also produces a new structural fact worth spending the next generation on: the unwind branch is position-saturated, meaning the near-expiry label's flow arrives against a book that is already three or more lots deep in the same option, so size on the unwinding side is not the binding constraint. That points the remaining case-18 search away from sizing and back to allocation, which is the one lesson that has paid this surface twice: apply the allocation question to a lever whose level is closed but whose allocation has never been graded - the repeat-request cent, the fill-signal cent, or the wing-widening block, each of which currently applies uniformly to every contract inside the label. Alternatively, hunt the 18-from-20 discriminator, which is now worth finding because case 20 holds by only 5.49 with a negative PnL and every remaining label lever helps 18 at 20's expense.
Challenger update: updated market-loop-20260821-5-g06-g6-label-unwind-extra-lot to increment-3-thresh-0-0.
