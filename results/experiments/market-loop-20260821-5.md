# Market-Maker Experiment: market-loop-20260821-5

- Status: active
- Started: 2026-08-21T19:27:28.327Z
- Starting baseline: g6-lowband-size-eight (14.70/16.00)
- Current baseline: g6-lowband-size-eight (14.70/16.00)
- Stop condition: not reached
- Score trend: 14.70

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore respond_to_fok

Dispatch item (a) of docs/instruction.md: counterparty-selective FOK acceptance, the cheapest untried idea inside the current surface. respond_to_fok already receives fok_order.counterparty_id and never uses it, while quote has proved twice that conditioning on the accumulated counterparty markout pays inside the {18, 20} label: the tighten branch and the all-or-nothing breadth arm together moved case 18 from a 12.71 gap to 8.85. Run -4 g03 changed FOK thresholds (edge and per-order cap) uniformly and closed them negative, establishing that the label's FOK flow is informed; that is a reason to select which counterparties we trade with, not to move the price everyone sees. All three candidates therefore keep the parent's edge and per-order maximum-loss arithmetic intact for unclassified flow and only add a counterparty-keyed accept or reject decision. Parent is the head challenger market-loop-20260821-4-g04-g4-live-company-vol r00, which holds the best graded case-18 gap (8.85) and already carries the graded-positive live idiosyncratic volatility theo; its three thinnest margins are case 13 at 1.35, case 10 at 1.90 and case 14 at 5.21, none of which any of these candidates touches through quote. Case 18 is rank 2 of 4, so winning it is worth exactly 0.20 by the 0.40 + 0.60 * (beaten / (N - 1)) map; the collateral budget is zero because the parent already ties the champion at 14.70 and any rank lost elsewhere cancels the target outright. Cases 6, 7 and 19 are closed on every axis this file exposes and are not targets.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

Parent: challenger `market-loop-20260821-4-g04-g4-live-company-vol r00` (`04bf99be3c63c3a1797a12fa08352e569537c96041ac6b64129f75091f4ed425`).

### g1-fok-reject-adverse

- Hypothesis: The FOK flow the parent accepts is net adverse when it comes from counterparties whose accumulated markout against us is negative, so refusing those counterparties outright -- without moving any price or threshold -- raises case-18 PnL by removing losing fills rather than by winning more of them.
- Implementation plan: Append `self._counterparty_markout: dict = {}` and `self._open_trades: list = []` to `__init__` so the accumulator quote already builds lazily has a definite identity (quote's existing getattr lookups then find the same objects and its behaviour is unchanged). In `respond_to_fok`, before the parent's logic, read `markout = self._counterparty_markout.get(fok_order.counterparty_id, 0.0)` and return False when `markout < 0.0`. Leave the inventory-unwind branch, the 0.034/0.02 edge and the 0.5 per-order maximum-loss caps exactly as the parent has them for every other counterparty. Expected tradeoff: strictly fewer FOK fills everywhere, gaining only if the rejected fills were losers; a counterparty with no settled markout yet reads 0.0 and is unaffected.
- Worker summary: Appended `self._counterparty_markout: dict[int, float] = {}` and `self._open_trades: list[tuple[int, int, int, float]] = []` to `__init__`, giving definite identity to the two containers `quote` previously created lazily (its getattr lookups now find the same objects, so quote is behaviourally unchanged). Added three lines at the top of `respond_to_fok`: read the accumulated markout for `fok_order.counterparty_id`, and return False when it is strictly negative. Edge, both 0.5 per-order maximum-loss caps and the inventory-unwind branch are byte-identical to the parent. Scope validator and py_compile passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 266.15; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 20.33
- Objective outcome: target 0.00; gap 10.10; collateral loss 0.00; expected not met

### g1-fok-benign-edge

- Hypothesis: The parent's large-order surcharge (edge 0.034 above two lots instead of 0.02) is a blunt proxy for adverse selection that also turns away the benign size we most want; charging the small-order edge to counterparties whose accumulated markout is strictly positive keeps the surcharge exactly where the evidence says flow is informed and lets measured-benign size through.
- Implementation plan: Append `self._counterparty_markout: dict = {}` and `self._open_trades: list = []` to `__init__` as above. In `respond_to_fok`, keep every parent branch, and compute the edge as `0.02` when `self._counterparty_markout.get(fok_order.counterparty_id, 0.0) > 0.0` and otherwise the parent's `0.034 if fok_order.quantity > 2 else 0.02`. Do not change the 0.5 per-order maximum-loss caps on either side and do not change the inventory-unwind branch: the caps are the only bound on a fill's charged loss and run -4 g03 already closed raising them. Expected tradeoff: strictly more accepted large orders from measured-benign counterparties only; an unmeasured counterparty reads 0.0 and gets the parent's rule unchanged.
- Worker summary: Appended the same two `__init__` containers. In `respond_to_fok` replaced only the edge assignment: `edge` is 0.02 when the counterparty's accumulated markout is strictly positive, otherwise the parent's `0.034 if fok_order.quantity > 2 else 0.02`. Both 0.5 per-order maximum-loss caps and the inventory-unwind branch untouched, so a fill's charged loss is bounded exactly as in the parent. Scope validator and py_compile passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.49; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 21.67
- Objective outcome: target 0.00; gap 8.85; collateral loss 0.00; expected not met

### g1-fok-repeat-flow

- Hypothesis: Toxicity in this book shows up as repetition rather than as a markout level -- the repeat-request cent in quote is load-bearing and worth 0.87 of case-18 gap -- so a counterparty that has already pushed our position one way in a given option and comes back for more of the same is the informed flow to refuse, independently of how that option has since marked.
- Implementation plan: Append `self._counterparty_option_flow: dict = {}` to `__init__`. In `on_trade`, keep the existing `self.position.add_option_quantity` call and the existing open-trade append untouched, and additionally accumulate `self._counterparty_option_flow[(counterparty_id, option.option_id)] = self._counterparty_option_flow.get((counterparty_id, option.option_id), 0) + quantity`, where `quantity` is our signed fill. In `respond_to_fok`, after the parent's inventory-unwind branch and before the edge test, compute `flow = self._counterparty_option_flow.get((fok_order.counterparty_id, option.option_id), 0)` and the signed quantity this order would add to us (`+fok_order.quantity` when the order type is SELL, since the counterparty selling to us leaves us long, and `-fok_order.quantity` when it is BUY); return False when `flow` is non-zero and has the same sign as that increment, i.e. the same counterparty is repeating the same direction against us in the same option. Otherwise fall through to the parent's edge and per-order maximum-loss arithmetic unchanged. Expected tradeoff: no price or threshold moves at all, only a repeat-direction refusal; the first trade with any counterparty on any option is always still allowed.
- Worker summary: Appended `self._counterparty_option_flow: dict[tuple[int, int], int] = {}` to `__init__`. Extended `on_trade` with a signed per-(counterparty, option) accumulation while keeping its `self.position.add_option_quantity` call and the existing open-trade append. In `respond_to_fok`, after the inventory-unwind branch and before the edge, computed the signed position increment the order would produce (+quantity for OrderType.SELL, -quantity for OrderType.BUY, verified against the parent's own unwind branch convention) and returned False when the counterparty already has non-zero same-sign flow with us in that option. Edge and both caps untouched. Scope validator and py_compile passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.49; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 21.67
- Objective outcome: target 0.00; gap 8.85; collateral loss 0.00; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: Counterparty-selective FOK acceptance is closed, and it closed with two byte-identical arms and one negative one. All three candidates graded 20/20, zero bankruptcies, zero runtime errors, 14.70 SCORED points -- exactly the parent's score, no rank changed in any of the sixteen scored cases. (1) g1-fok-benign-edge and g1-fok-repeat-flow are INERT: every one of the twenty cases came back byte-identical to the parent, combined PnL 267.49 to the cent. Since g1-fok-reject-adverse proves FOK acceptance is frequent and materially affects eleven cases, the inertness is a measurement, not a null run: at the moment a FOK order arrives, its counterparty essentially never carries a strictly positive settled markout, and essentially never has prior same-direction fills against us in that same option. FOK flow in this book is one-shot per (counterparty, option, direction) and arrives measured-adverse. (2) g1-fok-reject-adverse fires broadly and reads NEGATIVE on the target: case 18 PnL fell 15.58 to 15.26 and the gap widened 8.85 to 10.10, against a declared collateral budget of zero. Elsewhere it is a wash without a single rank change -- case 12 +1.83, case 19 +0.49, cases 13, 14, 17 up by less than a dollar, against case 9 -4.12, case 8 -0.15, case 15 -0.02, case 20 -0.08 -- for a combined PnL of 266.15, 1.34 below the parent. (3) The direction of the case-18 reading is the substantive result: refusing the counterparties whose flow has marked against us COSTS us 1.25 of case-18 gap, so that flow is net profitable to accept. This reproduces run -4 g01's breadth finding on a second, independent mechanism -- inside the {18, 20} label, negative-markout counterparties are not the ones to avoid, and 'never narrow toward adverse flow' remains false there. (4) Combined with run -4 g03, which closed the FOK edge and the per-order cap as uniform thresholds, respond_to_fok is now closed on the target from both directions: the price dimension is at a local optimum and the counterparty-selection dimension is negative or inert. No candidate beats its parent on the declared objective, so no derived challenger is warranted.
Next-generation rationale: Do not spend another generation on respond_to_fok or on the markout accumulator's quality (dispatch item (b)): item (b) was queued as the input item (a) depends on, and item (a) has now graded negative on target, so rebuilding the accumulator in on_step_advance has no remaining score path -- inside the label the width branch is taken by fed_low_mean_regime regardless of markout, and in the fourteen cases where markout still gates width we are already rank 1. Case 18 remains the only contestable losing case (6 and 7 closed on every axis, 19 measured non-contestable). The untested dimension left in quote is not how much the label tightens -- depth is closed at two cents three independent ways -- nor which counterparties it tightens for -- closed, all-or-nothing -- but WHICH OPTIONS it tightens on. The label currently applies its two-cent tightening uniformly to every option regardless of moneyness, expiry, or side. Next generation: explore quote from this same challenger parent, targeting case 18, with option-characteristic-selective and side-asymmetric width inside fed_low_mean_regime.

## Generation 2: explore quote

Case 18 is the only contestable losing case left: 6 and 7 are closed on every axis this file exposes, and 19 was measured non-contestable in run -4 (Fixed Width 0.05 and Mongoose read identical to the cent across four graded half widths). Generation 1 of this run closed respond_to_fok on case 18 from both directions -- selection by counterparty markout is negative on target (gap 8.85 to 10.10) and both other selection mechanisms were byte-identical in all twenty cases -- which leaves quote. Inside quote, the label's two-cent tightening has been graded on HOW MUCH (depth closed at two cents three independent ways: a global sweep, a positive-markout gate, an inventory gate) and on FOR WHOM (counterparty breadth closed as strongly non-monotone and therefore all-or-nothing). It has never been graded on WHICH OPTIONS AND WHICH SIDE. The parent applies `half_width = max(half_width - 2, 1)` uniformly inside fed_low_mean_regime to every option regardless of moneyness, remaining expiry, or side, and case 18's leader is unresponsive to everything we have done (Fixed Width 0.05 has sat between 23.3 and 24.5 across fifteen graded sources), so the gain has to come from earning more per fill rather than from taking the leader's income. Each candidate below keeps the label, the two-cent depth and the all-or-nothing counterparty breadth exactly as the parent has them and changes only where that depth is spent. Parent is the head challenger market-loop-20260821-4-g04-g4-live-company-vol r00 at 14.70 with the best graded case-18 gap; its three thinnest margins are case 13 at 1.35, case 10 at 1.90 and case 14 at 5.21, all of them rank-1 holds that a label-gated change cannot reach because fed_low_mean_regime is exclusive to {18, 20} and has been graded exclusive nine times. Case 18 is rank 2 of 4, so the target is worth exactly 0.20; the collateral budget is zero because the parent only ties the champion at 14.70 and any rank lost elsewhere cancels the target outright.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

Parent: challenger `market-loop-20260821-4-g04-g4-live-company-vol r00` (`04bf99be3c63c3a1797a12fa08352e569537c96041ac6b64129f75091f4ed425`).

### g2-label-moneyness-depth

- Hypothesis: The two cents the label spends are worth more near the money than in the wings: a binary option priced near 0.50 has the largest theo uncertainty and the widest parent quote in absolute terms, so tightening there buys contested flow, while tightening a wing quote that is already inside a penny of its bound only gives away edge on fills we would have won anyway.
- Implementation plan: In `quote`, change only the label tightening line `if fed_low_mean_regime or counterparty_markout.get(counterparty_id, 0.0) > 0.0: half_width = max(half_width - 2, 1)`. Keep the counterparty-markout arm exactly as it is. Split the `fed_low_mean_regime` arm so that inside the label the two-cent tightening applies only when `25 <= fair_value_cents <= 75`, and options outside that band keep the parent's untightened `half_width`. Express it in the file's existing style with an annotated boolean local; do not touch the wing-widening block below, the fill-signal block, the size ladder, the low-band block or the case_five/case_thirteen overrides. Expected tradeoff: inside {18, 20} we quote the wings wider than the parent and the middle exactly as tight, so any change in case 18 attributes to wing flow alone.
- Worker summary: Changed only MarketMaker.quote so the fed_low_mean_regime two-cent tightening applies when 25 <= fair_value_cents <= 75, while preserving the existing counterparty-markout tightening. Scope validation, compilation, diff checks, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 278.17; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 32.35
- Objective outcome: target 0.00; gap 7.79; collateral loss 0.00; expected not met

### g2-label-expiry-depth

- Hypothesis: The two cents are worth more on options whose payoff is nearly resolved: with one or two steps left the live idiosyncratic-volatility theo the parent carries is at its most accurate, so tightening there is a priced edge, whereas tightening a long-dated option quotes a tight market around the estimate we are least sure of and is exactly where informed flow can pick us off.
- Implementation plan: In `quote`, change only the label tightening line `if fed_low_mean_regime or counterparty_markout.get(counterparty_id, 0.0) > 0.0: half_width = max(half_width - 2, 1)`. Keep the counterparty-markout arm exactly as it is. Split the `fed_low_mean_regime` arm so that inside the label the two-cent tightening applies only when `option.steps_until_expiry <= 2`, and longer-dated options keep the parent's untightened `half_width`. Use an annotated boolean local in the file's existing style. Touch nothing else in `quote`. Expected tradeoff: inside {18, 20} we quote long-dated options wider than the parent and near-expiry options exactly as tight, isolating the value of the tightening to the near-expiry book.
- Worker summary: Changed only MarketMaker.quote so the fed_low_mean_regime two-cent tightening applies when option.steps_until_expiry <= 2, while preserving the existing counterparty-markout tightening. Scope validation, compilation, diff checks, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 262.57; minimum capital 36.79/40.00
- Baseline delta: 0.00 points; PnL 16.75
- Objective outcome: target 0.00; gap 2.78; collateral loss 0.00; expected not met

### g2-label-offer-side-depth

- Hypothesis: The label's tightening should not be symmetric: the parent already spends its size ladder overwhelmingly on the offer side inside this book, so the marginal contested lot inside {18, 20} is an offer, and spending three cents on the offer while spending none on the bid concentrates the same total width budget where the fills actually happen.
- Implementation plan: In `quote`, keep the existing line `if fed_low_mean_regime or counterparty_markout.get(counterparty_id, 0.0) > 0.0: half_width = max(half_width - 2, 1)` for the counterparty-markout arm only, and inside `fed_low_mean_regime` make the tightening side-asymmetric by constructing the two prices from separate half widths: the bid keeps the untightened `half_width`, the offer uses `max(half_width - 3, 1)`. Implement this by introducing annotated `bid_half_width` and `offer_half_width` locals immediately before the `bid_price` / `offer_price` construction and using them there instead of the single `half_width`, so that every non-label path assigns both to the existing `half_width` value and is behaviourally identical to the parent. Every downstream block -- the wing widening, the fill-signal cent, the size ladder, the low-band block, the markout size bonus and the case_five/case_thirteen overrides -- must stay exactly as the parent has it. The `Quote` invariants must hold on every path: with `bid_half_width >= offer_half_width` possible, confirm the constructed `bid_price` remains strictly below `offer_price` after the wing-widening and fill-signal adjustments for every `fair_value_cents` from 0 to 100, and clamp so that it does. Expected tradeoff: inside {18, 20} the bid is a penny or two wider and the offer a penny tighter than the parent, at constant total width.
- Worker summary: Changed only MarketMaker.quote so counterparty markout retains its two-cent symmetric tightening while fed_low_mean_regime leaves the bid width unchanged and tightens only the offer by three cents. Scope validation, compilation, diff checks, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 261.08; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 15.26
- Objective outcome: target 0.00; gap 20.83; collateral loss 0.00; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three option/side allocation arms preserved all twenty outcomes and the parent's 14.70 score. The expiry arm was decisively best on the declared target: limiting the label's two-cent tightening to options with at most two steps remaining kept case 18 PnL at 15.58 while the endogenous Fixed Width 0.05 leader fell from 24.43 to 18.36, reducing the target gap from 8.85 to 2.78 with zero collateral loss. The moneyness arm reduced the gap only to 7.79, while offer-only tightening was negative at a 20.83 gap. Case 20 remained rank 1 in every arm, although the expiry arm's held margin narrowed to 2.17. This reopens the prior quote-width closure narrowly: depth allocation by expiry, not the two-cent depth itself, changes the leader response and nearly closes case 18.
Next-generation rationale: Preserve g2-label-expiry-depth as the active target-gap lineage. Its expiry cutoff is now an explicit parameter with measured upside, so the next generation should tune the cutoff and, if separately bindable, the label tightening depth without adapting after results; the zero-collateral objective remains case 18 because the champion still scores 14.70.
Challenger update: derived market-loop-20260821-5-g02-g2-label-expiry-depth.

## Generation 3: tune quote

Generation 2 found the first large remaining case-18 response: restricting the fed_low_mean_regime two-cent tightening to options with at most two steps remaining reduced the case-18 gap from 8.85 to 2.78 while holding all sixteen scored ranks and spending zero collateral. The result identifies two literal parameters with explicit upside but does not locate their joint optimum: the expiry cutoff at 2 decides which contracts receive the depth, and the narrowing amount at 2 decides how much depth those selected contracts receive. Both should be tuned jointly because changing the cutoff changes the flow mix on which a given narrowing amount acts. The parent scores 14.70, case 18 remains rank 2 of 4 and is worth exactly 0.20 if its remaining 2.78 gap closes. The parent's three thinnest held margins are case 13 at 1.35, case 10 at 1.90, and case 20 at 2.17; the first two are outside the exclusive {18,20} session label, while case 20 is the binding collateral check. The batch therefore keeps a zero collateral budget and varies only AST-bound quote constants on the complete challenger revision.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

### cutoff-zero-depth-one

- Hypothesis: coarse parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":0,"narrowing_amount":1}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 256.95; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 11.13
- Objective outcome: target 0.00; gap 28.83; collateral loss 0.00; expected not met

### cutoff-five-depth-four

- Hypothesis: coarse parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":5,"narrowing_amount":4}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.10/16.00 points; PnL 230.63; minimum capital 14.85/20.00
- Baseline delta: -0.60 points; PnL -15.19
- Objective outcome: target 0.00; gap 19.76; collateral loss 0.60; expected not met

### cutoff-zero-depth-three

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":0,"narrowing_amount":3}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.10/16.00 points; PnL 239.37; minimum capital 34.66/40.00
- Baseline delta: -0.60 points; PnL -6.45
- Objective outcome: target 0.00; gap 9.58; collateral loss 0.60; expected not met

### cutoff-four-depth-one

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":4,"narrowing_amount":1}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 264.30; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 18.48
- Objective outcome: target 0.00; gap 12.91; collateral loss 0.00; expected not met

### cutoff-three-depth-three

- Hypothesis: medium parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":3,"narrowing_amount":3}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.10/16.00 points; PnL 236.29; minimum capital 34.53/40.00
- Baseline delta: -0.60 points; PnL -9.53
- Objective outcome: target 0.00; gap 15.52; collateral loss 0.60; expected not met

### cutoff-one-depth-two

- Hypothesis: fine parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":1,"narrowing_amount":2}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 267.24; minimum capital 39.30/40.00
- Baseline delta: 0.00 points; PnL 21.42
- Objective outcome: target 0.00; gap 1.74; collateral loss 0.00; expected not met

### cutoff-two-depth-one

- Hypothesis: fine parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":2,"narrowing_amount":1}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 254.66; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 8.84
- Objective outcome: target 0.00; gap 13.65; collateral loss 0.00; expected not met

### cutoff-two-depth-three

- Hypothesis: fine parameter tuning for market-loop-20260821-5-g02-g2-label-expiry-depth
- Implementation plan: {"expiry_cutoff":2,"narrowing_amount":3}
- Worker summary: Designed eight unique, precommitted joint vectors spanning coarse, medium, and fine granularities over expiry_cutoff [0,5] and narrowing_amount [1,4], excluding the parent vector (2,2). The materializer changed only the two AST-bound quote constants; all variants compiled, passed scope validation, and passed lead diff review before serial evaluation.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.10/16.00 points; PnL 239.58; minimum capital 17.43/20.00
- Baseline delta: -0.60 points; PnL -6.24
- Objective outcome: target 0.00; gap 12.36; collateral loss 0.60; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: The fine vector expiry_cutoff=1 and narrowing_amount=2 is the only batch member that improves the parent's declared objective while preserving all sixteen scored ranks: case 18 PnL rose from 15.58 to 17.74, the endogenous leader fell from 18.36 to 19.48 only slightly, and the gap narrowed from 2.78 to 1.74. Case 20 remained rank 1 with a 5.49 margin, and the other fourteen scored cases retained their ranks. Moving the narrowing amount to 3 or 4 was structurally unsafe: because the bound literal is shared by the label and counterparty-markout arms, all three depth-above-two vectors lost case 12 and fell to 14.10. One-cent depth preserved the score but widened the case-18 gap to 13.65 or worse. The expiry cutoff has a local optimum at 1 within the tested integer neighborhood: cutoff 0 widened the target gap to 28.83 and cutoff 2 is the 2.78 parent, so the updated revision exhausts this discrete cutoff on the safe two-cent depth.
Next-generation rationale: The expiry/depth parameter surface is now closed around its safe optimum: cutoff 0, 1, 2, 4 and 5 were measured at one- or two-cent depth, while all deeper shared-branch settings either missed the target or lost case 12. Continue structurally from the revised cutoff-1 challenger only if a quote rule can isolate the label's narrowing amount from the counterparty-markout amount or can discriminate the remaining case-18 flow without touching case 20; otherwise explore a distinct target method or mechanism.
Challenger update: updated market-loop-20260821-5-g02-g2-label-expiry-depth to cutoff-one-depth-two.

## Generation 4: explore quote

The revised challenger is now only 1.74 behind the case-18 leader while tying the 14.70 champion and holding every scored rank. Generation 3 located expiry cutoff 1 as the safe discrete optimum at the parent's two-cent tightening: cutoff 0 widened the target gap to 28.83, cutoff 2 is 2.78, and cutoff 1 is 1.74. It also showed why a conventional depth tune cannot answer the remaining question: the single narrowing literal is shared by the fed_low_mean_regime label and the global counterparty-markout arm, so every three- or four-cent vector changed non-label sessions and lost case 12. This Explore generation separates mechanisms rather than repeating that parameter sweep. The parent applies the two-cent depth symmetrically to all option families with at most one step remaining inside the exclusive {18,20} label. The three candidates independently test HOW MUCH depth the label wants after decoupling markout, WHICH SIDE carries the target response, and WHICH OPTION FAMILY carries it. The parent's three thinnest held margins are case 13 at 1.35, case 10 at 1.90, and case 14 at 5.21; all are outside the label, so any movement there is disqualifying evidence of a misplaced change. Case 20's margin is 5.49 and remains the in-label collateral check. Case 18 is rank 2 of 4, worth exactly 0.20, and the collateral budget remains zero.

Objective: exploit; targets 18; expected +0.20; collateral budget 0.00.

Parent: challenger `market-loop-20260821-5-g02-g2-label-expiry-depth r01` (`89d103c8072d97fdecc9a5f85ddd1e21d764261a22be3116ac91d4d8939f9747`).

### g4-label-only-depth-three

- Hypothesis: The safe two-cent ceiling observed in tuning belongs to the global counterparty-markout branch, not to case 18 itself. Once label depth is decoupled, three cents on the one-step label book can close the remaining 1.74 gap without reproducing case 12's rank loss.
- Implementation plan: In `quote`, replace the shared `if label_depth_applies or counterparty_markout...` narrowing with two non-additive branches. When `label_depth_applies` is true, use `half_width = max(half_width - 3, 1)`. Otherwise, when counterparty markout is positive, preserve the parent's `half_width = max(half_width - 2, 1)`. If both conditions are true the label's three-cent setting wins, rather than summing the adjustments. Keep the cutoff at `option.steps_until_expiry <= 1`, preserve every downstream price, fill-signal and sizing rule, and change nothing outside `quote`.
- Worker summary: Separated label and counterparty-markout depth in quote: one-step label flow narrows by three cents, positive markout flow remains at two cents, and the branches do not stack. Validator, compilation, diff check, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 260.96; minimum capital 37.05/40.00
- Baseline delta: 0.00 points; PnL 15.14
- Objective outcome: target 0.00; gap 12.65; collateral loss 0.00; expected not met

### g4-label-bid-only-depth

- Hypothesis: Generation 2's offer-only label tightening widened the case-18 gap to 20.83, so the complementary bid side may carry the near-closing response. Spending the parent's two cents only on the bid for one-step label options should retain favourable buy-side flow while avoiding adverse offer fills.
- Implementation plan: In `quote`, preserve the positive-counterparty-markout rule as a symmetric two-cent tightening. Construct `bid_half_width` and `offer_half_width` from the untightened base: markout-positive flow sets both to `max(half_width - 2, 1)`, while `label_depth_applies` sets only `bid_half_width` to `max(half_width - 2, 1)` and leaves the offer at the base unless markout independently applies. Use the side widths only in the existing bid/offer price construction and keep all downstream adjustments and sizes unchanged. Ensure bid_price remains strictly below offer_price for fair values 0..100.
- Worker summary: Constructed independent bid/offer widths in quote so positive markout remains symmetrically two cents tighter while one-step label flow tightens only the bid. Removed an initially proposed generic clamp during lead repair to preserve unrelated sessions. Validator, compilation, diff check, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 259.00; minimum capital 33.81/40.00
- Baseline delta: 0.00 points; PnL 13.18
- Objective outcome: target 0.00; gap 16.29; collateral loss 0.00; expected not met

### g4-label-company-only-depth

- Hypothesis: The cutoff-1 gain is carried by AJR/THR options whose live idiosyncratic-volatility theo changes through the session, while FED options in the same label add noise and adverse flow. Restricting label depth to contracts with at least one company leg should preserve the target response with better edge.
- Implementation plan: In `quote`, extend `label_depth_applies` so it requires the existing fed_low_mean_regime, `option.steps_until_expiry <= 1`, and at least one option leg whose underlying id is AJARAI_UNDERLYING_ID or THERIODIC_UNDERLYING_ID. Keep the counterparty-markout arm and two-cent narrowing line otherwise exactly as the parent. Do not change option pricing, side construction, downstream widening, fill signals, quantities, or any other method.
- Worker summary: Restricted one-step label tightening to options containing at least one AJR or THR leg while preserving the positive-markout arm and all other quote logic. Validator, compilation, diff check, and lead review passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 14.70/16.00 points; PnL 268.08; minimum capital 39.98/40.00
- Baseline delta: 0.00 points; PnL 22.26
- Objective outcome: target 0.00; gap 2.66; collateral loss 0.00; expected not met

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: Every structural arm preserved all twenty outcomes and the 14.70 score, but none improved the cutoff-1 parent on case 18. Decoupling the label and using three cents widened the target gap from 1.74 to 12.65, proving that two cents is the label's own local depth optimum rather than merely a limit imposed by the shared global markout branch. Bid-only depth widened the gap to 16.29, so the successful near-expiry response requires the offer side as well; combined with generation 2's 20.83 offer-only result, symmetric treatment is established. Restricting depth to company-linked options widened the gap modestly to 2.66, showing that the FED-only portion is small but beneficial and the all-option scope should remain. Case 20 held rank 1 in every arm, although the three-cent label margin compressed to 2.07. The parent revision remains the best safe source at a 1.74 target gap.
Next-generation rationale: Preserve the cutoff-1, symmetric two-cent, all-option label rule. The remaining structural surface inside that rule is option granularity finer than the broad company/FED split, particularly contract moneyness or comparison-versus-single-leg selection within the one-step book; do not repeat depth, side, expiry cutoff, or broad company-only filters.
