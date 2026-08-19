# Market-Maker Experiment: market-loop-20260819

- Status: active
- Started: 2026-08-19T14:53:19.420Z
- Starting baseline: g6-cap-bid-only (12.80/16.00)
- Current baseline: g1-exposure-offer (13.00/16.00)
- Stop condition: not reached
- Score trend: 12.80 → 13.00

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
