# Market-Maker Experiment: market-loop-20260818-2

- Status: failed
- Started: 2026-08-18T17:11:09.865Z
- Starting baseline: g5-wide-three-two (12.30/16.00)
- Current baseline: g5-wide-three-two (12.30/16.00)
- Stop condition: integrity failure
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
- Worker summary: Materialized fine tuning vector.
- Status: evaluated
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.49; minimum capital 5.92/10.00
- Baseline delta: 0.00 points; PnL 0.00

### skew-two-fine

- Hypothesis: fine parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":2}
- Worker summary: Materialized fine tuning vector.
- Status: evaluated
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.64; minimum capital 5.88/10.00
- Baseline delta: 0.00 points; PnL 0.15

### skew-three-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":3}
- Worker summary: Materialized medium tuning vector.
- Status: evaluated
- Result: 5/20 passed; 0 bankruptcies; 0.70/16.00 points; PnL 0.40; minimum capital 20.00/20.00
- Baseline delta: -11.60 points; PnL -75.09

### skew-four-medium

- Hypothesis: medium parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":4}
- Worker summary: Materialized medium tuning vector.
- Status: prepared
- Result: not evaluated
- Baseline delta: n/a

### skew-six-coarse

- Hypothesis: coarse parameter tuning for market-loop-20260818-2-g01-g1-inventory-skew
- Implementation plan: {"skewCents":6}
- Worker summary: Materialized coarse tuning vector.
- Status: prepared
- Result: not evaluated
- Baseline delta: n/a


Failure (integrity): skew-three-medium integrity failure after retry

## Recovery

Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
