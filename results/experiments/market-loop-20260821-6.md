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

## Generation 2: explore quote

The head challenger revision 1 scores 14.70 and is 1.42 dollars from rank 1 in case 18, worth exactly 0.20 under the 0.40 + 0.60 * (beaten / (N - 1)) map and the only rank in the book within seven dollars. Generation 1 of this run closed the last sizing dimension of the near-expiry label: the unwind lot's increment has a shallow interior maximum at three lots and its position threshold is exactly inert, because the branch only fires when the option position is already at least three lots deep. Sizing on the near-expiry label is finished. What remains is allocation, which is the one question that has paid this surface: run market-loop-20260821-5 generation 2 found 7.27 dollars of case-18 gap by asking not how much width to spend but on which contracts to spend it, after fifteen graded sources had swept the level of the same lever and read flat. The general rule it established is that a closed LEVEL says nothing about an untested ALLOCATION. Three width levers in quote still spend width uniformly on every contract, including the near-expiry label contracts the installed rule is deliberately tightening: the repeat-request cent, which raises the base half width from four to five whenever a counterparty asks twice for the same option; the fill-signal cent, which backs the just-filled side away by one cent on the next request; and the wing-widening block, which adds one or two cents whenever a price sits deep in a wing. Each of these partially undoes the two-cent near-expiry tightening on exactly the contracts where the endogenous leader has been shown to respond, and each has only ever been graded as a global presence-or-absence question - removing the repeat-request cent outright costs 0.87 - never as an allocation. This generation asks the allocation question of all three at once by suppressing each inside label_depth_applies alone, leaving its behaviour identical everywhere else in the book. The three arms are structurally disjoint: they touch different lines, different mechanisms and different quote fields, so a positive result attributes to one lever. The parent's three thinnest held margins are case 13 at 1.35, case 10 at 1.90 and case 14 at 5.21; all three sit outside the exclusive {18, 20} session label and a label-gated change cannot reach them. Case 20 is the binding collateral check at 5.49 with a negative PnL of -0.74 and is the only other case inside the label, so the collateral budget is zero: any arm that costs case 20 more than 5.49 flips it to rank 2 and gives back precisely the 0.20 that case 18 would win.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

Parent: challenger `market-loop-20260821-5-g06-g6-label-unwind-extra-lot r01` (`6ec2254e56936d0833b427260e759ea17f87d35cb4153dcd3a0474e1580a936f`).

### g2-label-no-repeat-cent

- Hypothesis: The repeat-request cent is load-bearing globally but misallocated inside the near-expiry label: on a contract with at most one step to expiry the second request from the same counterparty is not additional adverse-selection risk worth a cent, it is the flow the label is trying to win, so paying the cent there hands the endogenous leader the width it needs to stay ahead in case 18.
- Implementation plan: In quote, keep the existing half_width conditional chain and the existing label_depth_applies computation exactly as they are. After label_depth_applies is computed and before the existing two-cent narrowing branch that reads it, add a single guarded statement that removes the repeat-request cent when the label applies: when label_depth_applies is true and repeat_request is true, reduce half_width by one, floored so it can never fall below one. Do not change the half_width chain literals, do not change the repeat_request bookkeeping, and do not touch the counterparty-markout arm of the narrowing branch. The base half width inside the label becomes four regardless of whether the request repeats, so a repeated near-expiry request quotes two cents wide after the existing narrowing instead of three. Expected tradeoff: tighter near-expiry quotes win more of the contested case-18 flow at a lower edge per fill; the risk is that case 20, the only other session in the label, pays the same tightening and loses more than its 5.49 margin.
- Worker summary: Inserted two lines between the label_depth_applies assignment and the existing narrowing branch: when the label applies and the request repeats, half_width drops by one with the same max(..., 1) floor the surrounding line uses. The half_width chain literals, the repeat_request bookkeeping, the counterparty-markout arm, the wing block, the fill-signal block and every quantity path are untouched, so behaviour outside the near-expiry label is byte-for-byte identical. Compiled and passed scope validation against the r01 parent.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 268.26; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 22.44
- Objective outcome: target 0.00; gap 1.34; collateral loss 0.00; expected not met

### g2-label-no-fill-signal-cent

- Hypothesis: The fill-signal back-off cent is correctly allocated on contracts with time left, where a fill genuinely predicts more of the same flow, but is misallocated within one step of expiry: the position it is protecting against will settle before the signal can pay, so the cent is pure width given away on exactly the near-expiry contracts the label is contesting in case 18.
- Implementation plan: In quote, locate the existing fill-signal block that pops fill_signals for the current request key and then subtracts one cent from bid_price when the signal is positive or adds one cent to offer_price when it is negative. Keep the pop unconditional so the per-key signal state machine is byte-for-byte unchanged and no stale signal can survive into a later request. Guard only the two price adjustments so that they are skipped when label_depth_applies is true; when the label does not apply, both adjustments must behave exactly as they do today. Do not change the fill_signals bookkeeping written earlier in quote from the prior-quote snapshot, and do not touch the wing-widening block or the half_width chain. Expected tradeoff: near-expiry quotes stop retreating from the side that just traded, which keeps the tighter side available for the rest of the day; the risk is repeated same-side fills accumulating a near-expiry position that settles against us, which would show as a case-18 or case-20 PnL loss rather than a rank change elsewhere.
- Worker summary: Wrapped only the two fill-signal price adjustments in a not-label_depth_applies guard, leaving fill_signals.pop(request_key, 0) unconditional immediately above it so the per-key signal state machine is unchanged and no stale signal survives into a later request. The wing block, half_width chain, narrowing branch and all quantity logic are untouched. Compiled and passed scope validation against the r01 parent.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.42; minimum capital 39.36/40.00
- Baseline delta: 0.00 points; PnL 21.60
- Objective outcome: target 0.00; gap 1.42; collateral loss 0.00; expected not met

### g2-label-no-wing-widening

- Hypothesis: The wing-widening block spends one or two cents whenever a quote price sits deep in a wing, which is sound protection against settlement risk on contracts with several steps left, but within one step of expiry the fair value is already close to its terminal zero or one and the extra wing cents are the largest single block of width the label gives back, so suppressing them inside the label is the biggest allocation change available in quote.
- Implementation plan: In quote, locate the existing wing-widening block that runs immediately after bid_price and offer_price are derived from fair_value_cents and half_width: it subtracts one cent from bid_price when bid_price exceeds 0.50 and a second cent when fair_value_cents exceeds 75, and symmetrically adds one cent to offer_price when 1.0 minus offer_price exceeds 0.50 and a second cent when fair_value_cents is below 25. Guard the entire block so it is skipped when label_depth_applies is true, leaving it byte-for-byte unchanged on every other contract. Preserve the existing max and min clamps on the untouched path. Verify that the Quote invariants still hold on the suppressed path: bid_price and offer_price are derived symmetrically from fair_value_cents with a half width of at least one, so bid_price stays strictly below offer_price and both stay inside [0, 1] without the wing adjustments. Do not touch the half_width chain, the narrowing branch, the fill-signal block or any quantity logic. Expected tradeoff: near-expiry wing quotes are symmetric and tight, which is where the leader's edge in case 18 has been shown to live; the risk is a cheap-side or rich-side near-expiry fill settling adversely and costing case 20 more than its 5.49 margin.
- Worker summary: Wrapped the entire wing-widening block in a not-label_depth_applies guard, preserving every literal, the nesting and both clamps on the untouched path. Inside the label bid_price and offer_price keep their raw symmetric values from the half_width derivation. Compiled and passed scope validation against the r01 parent.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 258.57; minimum capital 35.79/40.00
- Baseline delta: 0.00 points; PnL 12.75
- Objective outcome: target 0.00; gap 15.03; collateral loss 0.00; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: The allocation rule paid a third time, and it separated the three uniform width levers completely. Removing the repeat-request cent inside the near-expiry label is the batch winner and the first lever this run to improve BOTH label cases at once: the case-18 gap fell from 1.42 to 1.34, case 20 rose from -0.74 to +0.15 and its held margin widened from 5.49 to 6.32, combined PnL rose from 267.32 to 268.26, and all sixteen scored ranks held at 14.70 with 20/20 structurally complete and zero bankruptcies. That case 20 improves rather than pays is the important part: every previous label lever bought case-18 gap out of case-20 margin, and this one does not, which says the repeat-request cent was not buying protection inside the label at all - it was pure width handed to the endogenous leader on flow that arrives twice precisely because it is the flow the label contests. Suppressing the fill-signal cent inside the label is INERT on the target: the case-18 gap stays at exactly 1.42 while case 20 moves only +0.10 and PnL only +0.10, so within one step of expiry the post-fill back-off changes no fill outcome and the lever is closed on this allocation. Suppressing the wing-widening block inside the label is the worst arm graded on this surface in three runs: the case-18 gap blew out from 1.42 to 15.03, case 20 fell from -0.74 to -4.21 and its margin collapsed from 5.49 to 0.40, one bad session away from surrendering the rank. The wing cents are strongly load-bearing exactly where the label operates, and the reason is mechanical: within one step of expiry the fair value sits near its terminal zero or one, so a large share of near-expiry quotes are deep-wing quotes and the block is the dominant width term there, not a marginal one. The three levers therefore rank load-bearing, inert and misallocated respectively, and only the misallocated one had upside.
Next-generation rationale: The repeat-request cent removal is preserved as a derived challenger and leaves case 18 at 1.34, still 0.20 and one rank away. Its own allocation is now the open question and it carries explicit parameter upside: the removal is currently exactly one cent floored at one, and neither the removal amount nor whether it should also apply on the second and later repeats of a contract outside the near-expiry window has been swept. More importantly the arm produced the run's first free case-20 gain, widening the binding collateral margin from 5.49 to 6.32, which buys room that every previously blocked case-18 lever was denied. Spend the next generation either tuning the removal amount on the new challenger, or reopening a case-18 lever that was rejected purely on case-20 cost now that 0.83 more margin exists.
Challenger update: derived market-loop-20260821-6-g02-g2-label-no-repeat-cent.
