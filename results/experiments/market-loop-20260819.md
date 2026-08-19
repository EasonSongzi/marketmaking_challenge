# Market-Maker Experiment: market-loop-20260819

- Status: active
- Started: 2026-08-19T14:53:19.420Z
- Starting baseline: g6-cap-bid-only (12.80/16.00)
- Current baseline: g5-central-offer (13.00/16.00)
- Stop condition: not reached
- Score trend: 12.80 → 13.00 → 13.00 → 13.00

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore quote

The post-loop-6 research memo identifies a causal side split: bid capacity preserves case 13, while offer capacity wins case 17 but globally loses case 13. Test three structurally distinct high-capital activation predicates for the existing offer-capacity rule while freezing prices, estimator, FOK logic, bid sizing, low-loss offers, and the 0.75 cash floor. The target is 13.00 by retaining case 13 second and moving case 17 first without losing case 18 second.

Parent: champion `g6-cap-bid-only` (`e1d8a428a921badb281cc2d6a314b9e0a2c4c1f23b1102914e930bfe6ffd1087`).

### g1-high-cap-offer

- Hypothesis: The harmful offer-capacity routing is confined to 20-capital sessions, so restoring the existing capacity-gated central offer unit only when starting cash is at least 40 will reproduce the case-17 win while preserving case 13.
- Implementation plan: Keep the champion quote path unchanged except for offer quantity. Preserve low-loss offer size three. Additionally allow offer size three when cash_balance is at least 40 and the existing active_exposure plus three-lot offer maximum-loss test fits within available_capacity. Keep bid sizing and every numeric constant unchanged. Add focused assertions for capital 20 versus 40, capacity below/at/above the boundary, and low-loss offers independent of the regime.
- Worker summary: Preserved every champion price, memory rule, bid-sizing rule, and low-loss offer rule, then restored the existing capacity-gated offer size three only when starting cash is at least 40. Scope validation, compilation, diff checks, and focused capital/capacity/low-loss quote assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 123.18; minimum capital 8.15/10.00
- Baseline delta: 0.20 points; PnL 0.83

### g1-central-offer

- Hypothesis: Only near-the-money high-capital offer capacity supplies the useful case-17 routing, while excluding wider fair-value regions protects the fragile case-18 boundary.
- Implementation plan: Keep the champion path unchanged except for offer quantity. Preserve low-loss offer size three. Additionally allow the existing capacity-gated offer unit only when cash_balance is at least 40 and fair_value_cents lies inclusively from 40 through 60. Keep bid sizing, prices, memory, and all existing constants unchanged. Test capital regimes, fair-value region boundaries, capacity boundaries, and low-loss independence.
- Worker summary: Preserved all champion behavior and restored capacity-gated offer size three only for starting cash at least 40 and fair values from 40 through 60 cents, while keeping low-loss offers independent of that gate. Scope validation, compilation, diff checks, and focused capital/fair-value/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 122.91; minimum capital 8.15/10.00
- Baseline delta: -0.20 points; PnL 0.56

### g1-exposure-offer

- Hypothesis: The case-17 benefit comes from early high-capital central offers, so a stricter exposure ceiling nested inside the existing capacity test can admit those units while withdrawing them before routing and inventory become harmful.
- Implementation plan: Keep the champion path unchanged except for offer quantity. Preserve low-loss offer size three. Additionally allow the existing capacity-gated offer unit only when cash_balance is at least 40 and active_exposure is no more than half of available_capacity. Keep the 0.75 floor, bid sizing, prices, memory, and all other behavior fixed. Test capital regimes, exposure below/at/above the ceiling, capacity boundaries, and low-loss independence.
- Worker summary: Preserved all champion behavior and restored capacity-gated offer size three only for starting cash at least 40 while active exposure remained no more than half of available capacity, with the low-loss offer rule unchanged. Scope validation, compilation, diff checks, and focused capital/exposure/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 123.89; minimum capital 8.15/10.00
- Baseline delta: 0.20 points; PnL 1.54

Selection: g1-exposure-offer.
Promotion: g1-exposure-offer (fc593ae7b1c1e1a7cf248a38fd5e81233d17dca8).
Finding: All three candidates passed 20/20 with zero bankruptcies and runtime errors. The hard high-capital gate reached 13.00 with 123.18 combined PnL and 8.15/10.00 minimum capital: it preserved case 13 second by 1.05, won case 17 by 1.48, and kept case 18 second by 0.22. The exposure-gated variant also reached 13.00, led combined PnL at 123.89, and kept the same minimum capital; it preserved case 13 second, won case 17 by 0.09, and strengthened case 18 second to a 1.53 buffer. The 40-60-cent central restriction scored 12.60 despite 122.91 PnL because case 18 fell from second to third by 0.85; case 17 also remained second by 0.03. All candidates protected cases 9, 15, 16, and 20 first. This confirms the memo's capital-regime hypothesis and shows that an exposure ceiling filters the case-18-harmful offer units while retaining enough high-capital participation to cross the case-17 boundary.
Next-generation rationale: Archive and promote the fixed-selector exposure-gated winner. The immediate 13.00 milestone is achieved, so freeze the successful capital-regime structure and move toward the memo's next allocation objective: improve collateral sensitivity or isolate selective third-unit states that can recover cases 13 or 14 without weakening the protected rank set. Do not sweep the capital threshold or adjacent 0.25/0.75 constants.
Previous failure (runner): g1-high-cap-offer runner failure after retry
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: explore quote

Generation 1 reached 13.00, but the promoted exposure gate wins case 17 by only 0.09. Follow the memo's predicate-tomography step with three single-variable, economically interpretable replacements for the half-capacity exposure restriction. Preserve the successful cash-at-least-40 regime gate, existing capacity test, low-loss offers, bid sizing, prices, memory, estimator, and FOK logic. The target is a robust 13.00 protected rank set, especially cases 17 and 18.

Parent: champion `g1-exposure-offer` (`ebf1e3c5cb2212308449ec840670a6f02aad2ca6430206c7a8110dbaa336a1cd`).

### g2-long-offer

- Hypothesis: Useful high-capital central offers are inventory-neutral or inventory-reducing, so admitting capacity-based offers only when the current option position is nonnegative can preserve cases 17 and 18 without the aggregate exposure ceiling.
- Implementation plan: Replace only the active_exposure <= available_capacity / 2.0 condition in the high-capital offer-capacity branch with the current option position being at least zero. Keep the cash >= 40 regime, existing capacity inequality, unconditional low-loss offer rule, all bid behavior, prices, memory, and constants unchanged. Test negative/flat/positive inventory and capital/capacity boundaries.
- Worker summary: Replaced the promoted half-capacity exposure predicate with a nonnegative current-option-position condition while preserving the high-capital regime, existing capacity test, low-loss offers, bid sizing, prices, memory, estimator, and FOK behavior. Scope validation, compilation, diff checks, and focused inventory/capital/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 122.30; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL -1.59

### g2-short-expiry

- Hypothesis: The profitable case-17 offer units are concentrated in short-dated contracts whose collateral resolves quickly, so limiting high-capital capacity-based central offers to one-day options can strengthen the rank boundary while protecting case 18.
- Implementation plan: Replace only the half-capacity exposure restriction in the high-capital offer-capacity branch with option.steps_until_expiry <= 1. Preserve cash >= 40, the existing capacity inequality, unconditional low-loss offers, all bid behavior, prices, memory, and constants. Test 1-day versus 2-day contracts and capital/capacity boundaries.
- Worker summary: Replaced the promoted half-capacity exposure predicate with a one-day-expiry condition while preserving every other high-capital capacity, low-loss, pricing, sizing, memory, estimator, and FOK rule. Scope validation, compilation, diff checks, and focused expiry/capital/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 123.32; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL -0.57

### g2-first-offer

- Hypothesis: Additional central offer capacity is useful on first contact but repeat requests are more routing-sensitive, so restricting that branch to first RFQs can retain the case-17 win with less adverse flow.
- Implementation plan: Replace only the half-capacity exposure restriction in the high-capital offer-capacity branch with not repeat_request. Preserve cash >= 40, the existing capacity inequality, unconditional low-loss offers, all bid behavior, prices, fill memory, and constants. Test first versus repeat requests and capital/capacity boundaries.
- Worker summary: Replaced the promoted half-capacity exposure predicate with a first-request condition while preserving the high-capital regime, capacity test, low-loss offers, all bid behavior, prices, fill memory, estimator, and FOK behavior. Scope validation, compilation, diff checks, and focused repeat/capital/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 123.10; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL -0.79

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three predicate-tomography candidates passed 20/20 with zero bankruptcies and runtime errors and retained 13.00, but none strictly exceeded the promoted champion. Nonnegative-inventory offers produced 122.30 PnL; first-contact offers produced 123.10; both won case 17 by 1.40 but left case 18 second by only 0.22. The one-day-expiry gate produced 123.32 PnL, won case 17 by 0.13, and kept case 18 second by 0.92. Each preserved case 13 second and cases 9, 15, 16, and 20 first. The champion remains preferable at 123.89 PnL with case 17 first by 0.09 and the strongest case-18 buffer of 1.53. The three restrictions expose a direct robustness trade rather than score upside, and none affects capital-20 cases 13 or 14.
Next-generation rationale: Keep the 13.00 champion and stop high-capital offer tomography. Move to the memo's collateral-allocation objective using quote-local, signed maximum-loss proxies that can change third-unit participation in 20-capital sessions while preserving the successful high-capital offer branch. Test structurally distinct collateral approximations rather than sweeping the existing 0.75 or 0.25 constants.

## Generation 3: explore quote

The 13.00 high-capital offer branch is validated, while cases 13 and 14 still require better allocation of third units in 20-capital sessions. Replace the crude unit-count exposure proxy with three structurally distinct quote-local collateral approximations based on signed net positions and binary maximum loss. Preserve prices, memory, low-loss sizing, the 0.75 cash floor, estimator, and FOK logic; do not sweep constants. The target is a safe 13.20+ rank improvement or clear attribution of which reserve architecture supplies useful participation.

Parent: champion `g1-exposure-offer` (`ebf1e3c5cb2212308449ec840670a6f02aad2ca6430206c7a8110dbaa336a1cd`).

### g3-signed-reserve

- Hypothesis: Valuing active long and short net positions by their respective probability-weighted maximum-loss side will release capacity that the absolute-unit proxy falsely blocks, allowing useful third units in cases 13 or 14 without global size-three bankruptcy.
- Implementation plan: Inside quote, replace active_exposure with one signed reserve total over active options: positive quantity times that option's current theoretical value, and negative quantity magnitude times one minus theoretical value. Permit bid or offer size three when this reserve plus the side's full three-lot quote maximum loss fits available_capacity, or when the existing low-loss rule passes. Remove the capital-40-only offer restriction because collateral now gates both sides. Preserve the 0.75 floor and all non-size behavior. Keep the calculation inline unless a short helper materially improves clarity.
- Worker summary: Replaced absolute-unit exposure with a total signed probability-weighted reserve across active positions and used it to gate both bid and offer size three, preserving the 0.75 floor, low-loss exceptions, prices, memory, estimator, and FOK behavior. Scope validation, compilation, diff checks, and signed-position/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 129.73; minimum capital 8.15/10.00
- Baseline delta: -0.40 points; PnL 5.84

### g3-postfill-reserve

- Hypothesis: Capacity should be evaluated on the net position after a possible full fill, because a bid can cover a short and an offer can reduce a long; hypothetical post-fill reserve can admit inventory-reducing size while rejecting genuinely risk-increasing size.
- Implementation plan: Compute current probability-weighted signed reserve over active options, then compute separate bid and offer post-fill reserves by replacing the target option's current net quantity with quantity plus three or quantity minus three. Reserve positive net quantity at current theoretical value and negative net quantity at one minus that value. Set each side to size three only when its post-fill reserve fits available_capacity or its existing low-loss rule passes. Remove the capital-40-only offer restriction; preserve the 0.75 floor, prices, memory, estimator, FOK, and every unrelated rule.
- Worker summary: Computed probability-weighted reserve on hypothetical target positions after full bid or offer fills, allowing netting before testing each side against available capacity. Preserved the 0.75 floor, low-loss exceptions, prices, memory, estimator, and FOK behavior. Scope validation, compilation, diff checks, and post-fill/netting assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 127.60; minimum capital 8.15/10.00
- Baseline delta: -0.40 points; PnL 3.71

### g3-side-reserve

- Hypothesis: Profitable third-unit routing is side-specific, so separately budgeting long and short reserve can prevent unrelated opposite-side inventory from suppressing a safe quote side while still capping its own maximum loss.
- Implementation plan: Compute separate active long reserve as positive quantity times current theoretical value and active short reserve as negative quantity magnitude times one minus theoretical value. Permit bid size three when long reserve plus three-lot bid loss fits available_capacity or bid is low-loss; permit offer size three when short reserve plus three-lot offer loss fits available_capacity or offer is low-loss. Remove the capital-40-only offer restriction. Preserve the 0.75 floor, quote prices, memory, estimator, FOK, and all unrelated behavior.
- Worker summary: Computed separate long and short probability-weighted reserves and budgeted bid and offer size independently, preserving the 0.75 floor, low-loss exceptions, prices, memory, estimator, and FOK behavior. Scope validation, compilation, diff checks, and mixed-portfolio/side-isolation assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.60/16.00 points; PnL 130.26; minimum capital 7.68/10.00
- Baseline delta: -0.40 points; PnL 6.37

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three collateral-proxy candidates passed 20/20 with zero bankruptcies and runtime errors, but each scored 12.60 after losing cases 13 and 18 from second to third. Signed total reserve produced 129.73 PnL and lifted case 14 from 9.72 to 12.99; post-fill reserve produced 127.60 and case-14 PnL 12.49; side-separated reserve led PnL at 130.26 and lifted case 14 to 14.10. All preserved cases 9, 15, 16, 17, and 20 first, with case-17 leads from 1.74 to 1.82, but case 13 fell 2.07 to 2.70 behind second and case 18 fell 0.98 to 1.26 behind second. Because every architecture shared the removal of the champion's offer regime restriction, the common rank regression attributes the failure primarily to broad collateral-gated offer participation; the reserve models still show a useful case-14 and aggregate-PnL signal worth isolating on bids.
Next-generation rationale: Keep the 13.00 champion. Restore its offer sizing byte-for-byte and test the same three reserve architectures only on bid capacity. This side isolation follows the established evidence that bid allocation protects case 13 while avoiding the broad offer path that lost case 18. Do not tune the 0.75 floor.

## Generation 4: explore quote

Generation 3 showed that all three collateral proxies improve case 14 and total PnL but broad offer activation loses cases 13 and 18. Isolate each proxy to bid capacity while preserving the full 13.00 champion offer path byte-for-byte. This tests whether additional maker-buy allocation carries the case-14 signal without importing the harmful offer routing, consistent with the prior evidence that bid capacity protects case 13.

Parent: champion `g1-exposure-offer` (`ebf1e3c5cb2212308449ec840670a6f02aad2ca6430206c7a8110dbaa336a1cd`).

### g4-signed-bid

- Hypothesis: Signed total reserve can safely release additional bid capacity in 20-capital sessions while the unchanged champion offer gate preserves cases 17 and 18.
- Implementation plan: Keep the champion active_exposure calculation for its offer branch. Additionally compute signed probability-weighted total reserve over active net positions. Use signed reserve plus three-lot bid loss for bid capacity, retaining the low-loss bid exception. Leave the champion offer_quantity code exactly equivalent, including low-loss offers, cash >= 40, half-available-capacity exposure ceiling, and the unit-count capacity inequality. Preserve prices, memory, 0.75 floor, estimator, and FOK.
- Worker summary: Kept the champion unit-count exposure and offer-sizing path unchanged, added signed probability-weighted reserve over active net positions, and used it only for bid capacity plus the existing low-loss bid rule. An independent review caught and repaired the short-reserve sign before evaluation. Scope validation, compilation, diff checks, and signed-portfolio/bid/unchanged-offer assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 127.33; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 3.44

### g4-postfill-bid

- Hypothesis: A hypothetical post-bid net reserve will selectively add inventory-reducing maker buys and may improve cases 13 or 14 more safely than a pre-fill total reserve.
- Implementation plan: Keep the champion active_exposure and offer_quantity path exactly equivalent. For bid sizing only, compute probability-weighted reserve after replacing the target option position with position plus three, including netting against a current short. Quote bid size three when that post-fill reserve fits available_capacity or bid is low-loss. Preserve champion offers, prices, memory, 0.75 floor, estimator, FOK, and all unrelated behavior.
- Worker summary: Kept the complete champion offer path unchanged and used probability-weighted reserve after a hypothetical full bid fill, including target-position netting, only for bid capacity. Scope validation, compilation, diff checks, and post-fill/short-covering/unchanged-offer assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 126.34; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 2.45

### g4-long-bid

- Hypothesis: Budgeting bids only against current long reserve can prevent unrelated short inventory from suppressing useful maker-buy participation while the champion offer gate contains sell-side routing risk.
- Implementation plan: Keep the champion active_exposure and offer_quantity path exactly equivalent. Compute current long reserve as positive active quantity times current theoretical value and use long reserve plus three-lot bid loss for bid capacity, retaining the low-loss exception. Preserve champion offers, prices, memory, 0.75 floor, estimator, FOK, and all other behavior.
- Worker summary: Kept the complete champion offer path unchanged and budgeted bids against probability-weighted active long reserve only, retaining the existing low-loss bid exception. Scope validation, compilation, diff checks, and mixed-portfolio/side-isolation/unchanged-offer assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 127.28; minimum capital 7.68/10.00
- Baseline delta: 0.00 points; PnL 3.39

Selection: g4-signed-bid.
Promotion: g4-signed-bid (a4aa1a82dc69e410d0c59523ad59e6ef5b7c2ec7).
Finding: All three bid-only reserve candidates passed 20/20 with zero bankruptcies and runtime errors, retained 13.00, and strictly improved the champion by PnL. Signed total reserve led at 127.33 with unchanged 8.15/10.00 minimum capital; it raised case 13 from 8.78 to 8.96, case 14 from 9.72 to 10.51, and case 15 from 9.07 to 10.02 while preserving their ranks. Post-fill bid reserve produced 126.34 and the strongest case-13 PnL at 9.03 but slightly reduced case 14 to 9.60. Long-only reserve produced 127.28 and matched signed reserve on case-14 and case-15 PnL, but minimum capital fell to 7.68/10.00. All three protected cases 9, 16, 17, and 20 first, moved case 17 to a 0.36 lead, and strengthened case 18 second to a 1.90 buffer. This decisively attributes the Generation-3 regressions to broad offer activation and validates probability-weighted reserve as a safe bid-allocation improvement.
Next-generation rationale: Archive and promote the fixed-selector signed-bid winner. With the protected 13.00 rank set stronger, use Generation 5 to test mutually exclusive capital-20 offer predicates on top of this bid reserve, targeting the remaining cases 13 and 14. Keep the successful high-capital offer branch intact and activate any new offer unit under one interpretable condition at a time.

## Generation 5: explore quote

The promoted signed-bid reserve safely improves 20-capital PnL and strengthens the 13.00 protected rank set. The remaining historical case-13/14 upside requires selective offer participation without repeating the broad-offer regressions. Keep the signed-bid rule and existing high-capital offer branch unchanged, and test one interpretable capital-20 offer activation family per candidate under the existing unit-count capacity gate.

Parent: champion `g4-signed-bid` (`970a7fa0950b84b94a7ea6d50d87954027432d6cf0c3f283ea2f72ddc6f98adf`).

### g5-reducing-offer

- Hypothesis: Additional capital-20 central offers are safe and useful only when a full three-lot maker sell is guaranteed to reduce an existing long position without crossing flat.
- Implementation plan: Preserve the champion offer_quantity logic, then add one alternative for 20 <= cash_balance < 40: active_exposure plus three-lot offer loss must fit available_capacity and the current target position must be at least +3. Keep low-loss offers, the high-capital exposure branch, signed-bid reserve, prices, memory, 0.75 floor, estimator, and FOK unchanged.
- Worker summary: Preserved signed-bid reserve and the full champion offer path, then allowed a capital-20 capacity-gated central offer only when the current target position was at least three, guaranteeing a full fill reduced inventory. Scope validation, compilation, diff checks, and capital/position/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 127.39; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 0.06

### g5-one-day-offer

- Hypothesis: The profitable capital-20 third offer units are concentrated in one-day contracts whose collateral resolves at the next settlement, limiting persistent inventory risk.
- Implementation plan: Preserve the champion offer_quantity logic, then add one alternative for 20 <= cash_balance < 40: active_exposure plus three-lot offer loss must fit available_capacity and option.steps_until_expiry must be at most 1. Keep low-loss offers, the high-capital exposure branch, signed-bid reserve, prices, memory, 0.75 floor, estimator, and FOK unchanged.
- Worker summary: Preserved signed-bid reserve and the full champion offer path, then allowed a capital-20 capacity-gated central offer only for one-day options. Scope validation, compilation, diff checks, and capital/expiry/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 126.50; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL -0.83

### g5-central-offer

- Hypothesis: The capital-20 size-three signal lies in near-the-money offers, while the existing low-loss rule already covers tail offers and central restriction avoids broad routing changes.
- Implementation plan: Preserve the champion offer_quantity logic, then add one alternative for 20 <= cash_balance < 40: active_exposure plus three-lot offer loss must fit available_capacity and fair_value_cents must lie inclusively from 40 through 60. Keep low-loss offers, the high-capital exposure branch, signed-bid reserve, prices, memory, 0.75 floor, estimator, and FOK unchanged.
- Worker summary: Preserved signed-bid reserve and the full champion offer path, then allowed a capital-20 capacity-gated central offer only when fair value was between 40 and 60 cents inclusive. Scope validation, compilation, diff checks, and capital/fair-value/capacity assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 128.49; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 1.16

Selection: g5-central-offer.
Promotion: g5-central-offer (66893cbadfbdd04099af634a9dd97d9e1134c074).
Finding: All three selective capital-20 offer candidates passed 20/20 with zero bankruptcies and runtime errors and preserved 13.00. The 40-60-cent central gate led at 128.49 PnL, 1.16 above the champion, with unchanged 8.15/10.00 minimum capital. It kept case 13 second at 8.96, lifted case 14 from 10.51 to 11.19 while remaining second, and kept case 15 first at 8.56 with a 1.14 lead. Guaranteed-reducing offers were nearly inactive, adding 0.06 PnL and only 0.06 to case 15. One-day offers reduced PnL by 0.83 and did not change cases 13 or 14. All candidates preserved cases 9, 16, 17, and 20 first and case 18 second. Central fair value is therefore the only capital-20 offer predicate with a material positive allocation signal, though it does not yet cross the case-13 or case-14 first-place boundary.
Next-generation rationale: Archive and promote the fixed-selector central-offer winner. For the final generation, combine only independently validated structures: union the central gate with the safe reducing-offer rule, and cross the central gate with the already validated post-fill-bid and long-only-bid reserve architectures. Do not introduce new predicates or tune constants.

## Generation 6: explore quote

Five generations of capital-20 predicate tomography held 13.00 and lifted PnL from 122.35 to 128.49 without moving a rank. The only reachable boundary left is case 13, second at 8.96 against 11.96, and every capital-20 case shares the same allocation machinery. Per the Generation 5 analysis, combine only independently validated structures rather than introducing new predicates or sweeping constants: recross the validated post-fill bid reserve with the promoted central offer gate, union the two validated capital-20 offer predicates, and lift the promoted central branch from the crude unit-count proxy onto the already validated signed reserve. Prices, memory, the 0.75 floor, the high-capital offer branch, estimator, and FOK stay unchanged in all three.

Parent: champion `g5-central-offer` (`7cf6418c949258d9a1b31b483c3689f04ffdfda57b0175ee8e1debc086f7038b`).

### g6-postfill-central

- Hypothesis: Post-fill bid reserve produced the best observed case-13 PnL at 9.03 under the previous offer path, so pairing it with the promoted central capital-20 offer gate can add its case-13 allocation to the current 8.96 without touching the offer routing that already protects cases 17 and 18.
- Implementation plan: Keep the champion offer_quantity path byte-for-byte equivalent, including the low-loss rule, the cash >= 40 exposure branch, and the 20 <= cash_balance < 40 central 40-60 branch on active_exposure. Replace only the bid capacity test: instead of the pre-fill signed reserve, compute the probability-weighted signed reserve over active options after replacing the target option's net quantity with quantity plus three, reserving positive net quantity at that option's current theoretical value and negative net quantity magnitude at one minus that value, so a bid netting against a short is credited. Quote bid size three when that post-fill reserve fits available_capacity or the existing bid_price <= 0.25 low-loss exception passes. Preserve prices, fill memory, the 0.75 cash floor, estimator, and FOK exactly.
- Worker summary: Kept the complete champion offer path byte-for-byte, including the low-loss rule, the cash >= 40 exposure branch, and the capital-20 central 40-60 branch on active_exposure, then replaced the bid capacity test with a probability-weighted reserve computed after adding the three-lot bid to the target option's net quantity, so a bid netting against a short is credited rather than charged. Two MarketMaker helpers factor the shared per-option reserve rule. Scope validation, compilation, diff checks, short-netting and long-adding bid assertions, the low-loss exception, and a 36-combination check that offer quantity is identical to the parent all passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 127.59; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL -0.90

### g6-union-reducing

- Hypothesis: The central 40-60 gate and the guaranteed-reducing gate were each validated safe and non-overlapping in effect, so their union should retain the promoted central allocation while adding the reducing-offer units that acted only outside the central band.
- Implementation plan: Keep the signed-reserve bid rule and the cash >= 40 exposure offer branch unchanged. In the 20 <= cash_balance < 40 offer branch, keep the existing active_exposure plus three-lot offer loss within available_capacity requirement, and widen its companion condition from fair_value_cents between 40 and 60 inclusive to that condition or the current target option position being at least positive three. Keep the low-loss offer rule, prices, fill memory, the 0.75 cash floor, estimator, and FOK unchanged.
- Worker summary: Preserved the signed-reserve bid rule, the low-loss offer rule, and the cash >= 40 exposure branch, then widened only the capital-20 central branch's companion condition from fair value 40 through 60 inclusive to that condition or a current target position of at least positive three, keeping its capacity inequality unchanged. Scope validation, compilation, a two-line diff, and assertions covering the union arm, the position boundary, the retained central gate, the binding capacity guard, and unchanged capital-10 and capital-40 behavior all passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 128.55; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 0.06

### g6-signed-central

- Hypothesis: The promoted capital-20 central branch still gates on the crude absolute unit count while the bid side already uses probability-weighted reserve; substituting the accurate collateral model inside that narrow central band should release the capital-20 offers the unit count falsely blocks without reopening the broad offer activation that lost cases 13 and 18.
- Implementation plan: Keep the signed-reserve bid rule, the low-loss offer rule, and the cash >= 40 exposure offer branch unchanged on active_exposure. In the 20 <= cash_balance < 40 central branch only, keep the fair_value_cents 40 through 60 inclusive restriction and replace active_exposure in its capacity inequality with the signed probability-weighted reserve already computed for bids, so the test becomes signed reserve plus three-lot offer loss within available_capacity. Preserve prices, fill memory, the 0.75 cash floor, estimator, and FOK exactly.
- Worker summary: Preserved the signed-reserve bid rule, the low-loss offer rule, and the cash >= 40 high-capital branch with both of its active_exposure conditions intact, then replaced active_exposure with the already-computed signed reserve inside the capital-20 central branch's capacity inequality only, keeping the 40 through 60 fair-value restriction. Scope validation, compilation, a one-line diff, and assertions covering net-short release, a genuinely over-capacity long portfolio, out-of-band fair values, unchanged capital-10 and capital-40 quotes, and an unchanged bid sweep all passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.00/16.00 points; PnL 129.76; minimum capital 8.15/10.00
- Baseline delta: 0.00 points; PnL 1.27

Selection: g6-signed-central.
Promotion: none.
Finding: All three recombination candidates passed 20/20 with zero bankruptcies and runtime errors, held 13.00, and kept minimum capital at 8.15/10.00. Substituting the probability-weighted signed reserve for the crude unit count inside the capital-20 central offer branch led at 129.76 combined PnL, 1.27 above the champion, and produced the best case-14 result of the entire run at 11.76 while holding case 15 first at 8.68. Unioning the central gate with the guaranteed-reducing predicate added only 0.06 PnL and left cases 13 and 14 at the champion's 8.96 and 11.19, confirming the Generation 5 observation that the reducing arm is nearly inactive and does not compose additively. Post-fill bid reserve was the only candidate to move case 13, raising it from 8.96 to 9.03, but it cost 0.90 PnL overall by reducing case 14 to 10.69 and case 15 to 8.93, and it failed the promotion gate at 127.59. Every candidate preserved cases 16, 17, and 20 first and cases 18 and 19 second at unchanged values, so the offer-side recombination is rank-neutral outside the capital-20 group. No candidate crossed a rank boundary: case 13 still needs 3.00 against Fixed Width 0.1 and case 14 still needs 11.50 against Lattice, so the accurate collateral model buys PnL inside the existing rank set rather than new points.
Next-generation rationale: Promote the signed-reserve central offer winner and finish the run at the six-generation limit. The run establishes that probability-weighted reserve strictly dominates the absolute unit count wherever it has been substituted, on bids in Generation 4 and now on the capital-20 central offer branch, and that further capital-20 predicate recombination is exhausted: six generations moved combined PnL from 122.35 to 129.76 without moving a single rank. Any future loop should stop refining quantity predicates and attack the one remaining reachable boundary, case 13's 3.00 gap, with a structurally different lever, since case 14 at 11.50 and cases 18 and 19 at 40.90 and 20.86 are out of range of allocation changes of this magnitude.
Challenger update: admitted market-loop-20260819-g06-g6-postfill-central.
