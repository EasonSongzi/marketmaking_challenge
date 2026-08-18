# Market-Maker Experiment: market-loop-20260818-2

- Status: active
- Started: 2026-08-18T17:11:09.865Z
- Starting baseline: g5-wide-three-two (12.30/16.00)
- Current baseline: g5-wide-three-two (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore quote

The 3-cent width at size two is the strongest fixed quote policy, while size three caused bankruptcies. Test structural policies that preserve the safe maximum size but adapt price or size to inventory and contract risk.

### g1-inventory-skew

- Hypothesis: A bounded one-cent quote-center skew toward unwinding existing option inventory will reduce directional accumulation while preserving the champion's spread and size.
- Implementation plan: Read the signed position for the option and shift the rounded theoretical center down one cent when long or up one cent when short, keeping the champion's three-cent half-width and quantity two. Clamp prices to valid penny bounds and preserve a strict two-sided quote.
- Worker summary: Shifted the quote center down one cent when long and up one cent when short, preserving the champion's three-cent half-width and size two. Compilation, scope validation, focused flat/long/short boundary assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 76.69; minimum capital 5.90/10.00
- Baseline delta: 0.00 points; PnL 1.20

### g1-loss-budget-size

- Hypothesis: Sizing each quote side by its own maximum-loss cost will retain size two for safer fills while limiting expensive directional fills to one contract, improving capital efficiency without abandoning RFQ participation.
- Implementation plan: Keep the champion's three-cent prices. Set bid and offer quantities independently to two only when that side's total maximum loss is at most one dollar; otherwise quote one. Use bid price as buy-side loss and one minus offer price as sell-side loss.
- Worker summary: Preserved three-cent prices and sized each side at two only when its total worst-case loss was at most one dollar, otherwise one. Compilation, scope validation, asymmetric sizing assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 10.70/16.00 points; PnL 60.63; minimum capital 7.99/10.00
- Baseline delta: -1.60 points; PnL -14.86

### g1-tail-tighten

- Hypothesis: Near-certain contracts can support a tighter quote because one side has low payoff uncertainty, so a two-cent half-width in the tails may win more safe flow while retaining the champion's three-cent width elsewhere.
- Implementation plan: Use a two-cent half-width when rounded theoretical value is at most ten cents or at least ninety cents, otherwise retain the champion's three-cent half-width. Keep both quantities at two and preserve valid penny-clamped quotes.
- Worker summary: Used a two-cent half-width at theoretical values of ten cents or less and ninety cents or more, retaining three cents elsewhere and size two throughout. Compilation, scope validation, tail and boundary assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.50/16.00 points; PnL 58.41; minimum capital 5.64/10.00
- Baseline delta: -0.80 points; PnL -17.08

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All three structural quote policies passed 20/20 without bankruptcy. One-cent inventory skew tied the 12.30 champion while improving combined PnL by 1.20, with only a two-cent reduction in minimum ending capital. Side-specific loss-budget sizing sacrificed too much RFQ participation and fell 1.60 points; tighter tail quotes fell 0.80 points and reduced PnL, so both are rejected.
Next-generation rationale: Admit inventory skew as a challenger because it preserved the full score and improved PnL. Tune the bounded skew magnitude and activation threshold around its one-cent, any-nonzero-position policy before returning to unrelated structural exploration.
Challenger update: admitted market-loop-20260818-2-g01-g1-inventory-skew.
Previous failure (setup): git -C /Users/easonhao/Documents/dev/Akuna_challenge worktree add --detach /tmp/akuna-market-maker/market-loop-20260818-2/g01/g1-inventory-skew ba6bd315a89417b051e28a0d3c42b00989e72ee9 failed: Preparing worktree (detached HEAD ba6bd31)
fatal: could not create leading directories of '.git/worktrees/g1-inventory-skew': Operation not permitted
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: tune quote

The one-cent inventory skew matched the 12.30 champion and improved combined PnL. Tune only its symmetric center-shift magnitude while preserving the challenger's full source, fixed three-cent width, size two, and immediate nonzero-position activation.

### skew-zero-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":0}
- Worker summary: Designed five immutable skew-magnitude vectors spanning fine, medium, and coarse granularity, excluding the one-cent parent. The materializer changed only the paired quote literals, compiled every variant, and passed scope validation; the resumed dispatcher reused all completed evidence and evaluated only the two remaining sources.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.49; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 0.00

### skew-two-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":2}
- Worker summary: Designed five immutable skew-magnitude vectors spanning fine, medium, and coarse granularity, excluding the one-cent parent. The materializer changed only the paired quote literals, compiled every variant, and passed scope validation; the resumed dispatcher reused all completed evidence and evaluated only the two remaining sources.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.64; minimum capital 5.88/10.00
- Baseline delta: 0.00 points; PnL 0.15

### skew-three-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":3}
- Worker summary: Designed five immutable skew-magnitude vectors spanning fine, medium, and coarse granularity, excluding the one-cent parent. The materializer changed only the paired quote literals, compiled every variant, and passed scope validation; the resumed dispatcher reused all completed evidence and evaluated only the two remaining sources.
- Status: archived
- Result: 5/20 passed; n/a bankruptcies; 0.70/16.00 points; PnL n/a; minimum capital n/a; 15 runtime errors
- Baseline delta: -11.60 points; PnL n/a

### skew-four-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":4}
- Worker summary: Designed five immutable skew-magnitude vectors spanning fine, medium, and coarse granularity, excluding the one-cent parent. The materializer changed only the paired quote literals, compiled every variant, and passed scope validation; the resumed dispatcher reused all completed evidence and evaluated only the two remaining sources.
- Status: archived
- Result: 5/20 passed; n/a bankruptcies; 0.70/16.00 points; PnL n/a; minimum capital n/a; 15 runtime errors
- Baseline delta: -11.60 points; PnL n/a

### skew-six-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":6}
- Worker summary: Designed five immutable skew-magnitude vectors spanning fine, medium, and coarse granularity, excluding the one-cent parent. The materializer changed only the paired quote literals, compiled every variant, and passed scope validation; the resumed dispatcher reused all completed evidence and evaluated only the two remaining sources.
- Status: archived
- Result: 5/20 passed; n/a bankruptcies; 0.70/16.00 points; PnL n/a; minimum capital n/a; 15 runtime errors
- Baseline delta: -11.60 points; PnL n/a

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: Zero- and two-cent skew both passed 20/20 at 12.30 points. The zero-skew control exactly reproduced the champion's 75.49 combined PnL and 5.92/10.00 minimum capital, improving the parent challenger's minimum capital from 5.90/10.00; two cents reduced both PnL and minimum capital versus the one-cent parent. Skews of three, four, and six cents produced explicit quote-boundary runtime failures, so the useful magnitude region ends below three cents for this unclamped structure.
Next-generation rationale: Archive zero skew as the challenger's best revision, but do not spend the second tuning batch on magnitudes already evaluated or cached. Return to Explore and test structurally safe inventory controls, including center clamping for larger skews and asymmetric risk-reducing quote behavior.
Challenger update: updated market-loop-20260818-2-g01-g1-inventory-skew to skew-zero-fine.
Previous failure (integrity): skew-three-medium integrity failure
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 3: explore quote

Unclamped inventory skews below three cents preserved 12.30 points, while larger skews failed only at quote boundaries. Test three structurally safe ways to discourage inventory accumulation without exceeding the champion's size-two exposure.

### g3-clamped-skew-three

- Hypothesis: A three-cent inventory center skew can improve unwinding and spread capture once the shifted center is clamped before quote construction, eliminating the boundary failures seen in tuning.
- Implementation plan: Shift rounded theoretical center down three cents when long and up three cents when short, clamp the shifted center to zero through one hundred cents, then apply the champion's three-cent half-width and size two.
- Worker summary: Added a signed three-cent inventory center shift, clamped the shifted center to zero through one hundred cents, and preserved the champion's three-cent half-width and size two. Compilation, scope validation, boundary assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 79.24; minimum capital 5.94/10.00
- Baseline delta: -0.20 points; PnL 3.75

### g3-risk-side-size

- Hypothesis: Reducing only the quote quantity that would increase absolute inventory will preserve full size for unwinding fills while lowering directional accumulation and capital risk.
- Implementation plan: Keep champion prices. When long, quote bid size one and offer size two; when short, bid size two and offer size one; when flat, keep both at two.
- Worker summary: Preserved champion prices while reducing only the inventory-increasing quote quantity to one and keeping the unwinding side at two. Compilation, scope validation, position-state assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.30/16.00 points; PnL 69.62; minimum capital 6.03/10.00
- Baseline delta: -1.00 points; PnL -5.87

### g3-risk-side-shade

- Hypothesis: Widening only the inventory-increasing side by two additional cents will deter risk accumulation without sacrificing competitiveness on the inventory-reducing side.
- Implementation plan: Start from champion three-cent prices. When long, move only the bid two cents farther from fair; when short, move only the offer two cents farther from fair; leave the opposite side and both quantities at champion settings.
- Worker summary: Preserved the champion's unwinding-side price and widened only the inventory-increasing side by two additional cents, with size two on both sides. Compilation, scope validation, boundary assertions, and diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.90/16.00 points; PnL 81.15; minimum capital 6.00/10.00
- Baseline delta: -0.40 points; PnL 5.66

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All candidates passed 20/20 without bankruptcy or runtime errors. Clamped three-cent skew reached 12.10, losing 0.20 points but adding 3.75 combined PnL and improving minimum capital to 5.94/10.00. Risk-side quantity reduction over-filtered flow and fell to 11.30; risk-side-only shading added 5.66 PnL and improved minimum capital to 6.00/10.00 but fell to 11.90. Safe inventory controls improve PnL and capital yet need magnitude tuning to recover rank points.
Next-generation rationale: Admit clamped three-cent skew because the structural clamp removed all boundary failures and its magnitude has explicit upside on both sides of the parent value. Tune the safe center shift across zero, smaller, and larger magnitudes without changing the structure.
Challenger update: admitted market-loop-20260818-2-g03-g3-clamped-skew-three.

## Generation 4: tune quote

The clamped three-cent skew passed 20/20 and improved PnL and minimum capital while losing only 0.20 points. Tune only the symmetric clamped center-shift magnitude, preserving the full challenger revision, clamp, three-cent half-width, and size two.

### skew-zero-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":0}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.49; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 0.00

### skew-one-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":1}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 77.64; minimum capital 5.92/10.00
- Baseline delta: -0.20 points; PnL 2.15

### skew-two-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":2}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 78.79; minimum capital 5.92/10.00
- Baseline delta: -0.20 points; PnL 3.30

### skew-four-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":4}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 72.52; minimum capital 5.94/10.00
- Baseline delta: -0.30 points; PnL -2.97

### skew-six-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":6}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 64.05; minimum capital 5.94/10.00
- Baseline delta: -0.30 points; PnL -11.44

### skew-eight-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g03-g3-clamped-skew-three
- Implementation plan: {"skewCents":8}
- Worker summary: Designed six immutable clamped-skew magnitudes spanning fine, medium, and coarse granularity. The materializer changed only the paired magnitude literals, compiled and scope-validated every variant, and the serial dispatcher evaluated each unique source exactly once.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.40/16.00 points; PnL 49.68; minimum capital 5.94/10.00
- Baseline delta: -0.90 points; PnL -25.81

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All six clamped-skew variants passed 20/20 without bankruptcy or runtime errors. Zero skew recovered the champion's 12.30 score and 5.92/10.00 minimum capital. One and two cents scored 12.10 while adding 2.15 and 3.30 combined PnL; four and six cents scored 12.00, and eight cents fell to 11.40. The monotonically weaker score at larger magnitudes makes zero the best revision despite the parent's higher PnL and minimum capital.
Next-generation rationale: Update the clamped-skew challenger to zero, but do not repeat magnitude tuning. With only two generations remaining and quote inventory controls unable to exceed 12.30, explore structurally inventory-aware FOK acceptance as an orthogonal source of rank improvement.
Challenger update: updated market-loop-20260818-2-g03-g3-clamped-skew-three to skew-zero-fine.
