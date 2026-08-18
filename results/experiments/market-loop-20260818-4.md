# Market-Maker Experiment: market-loop-20260818-4

- Status: active
- Started: 2026-08-18T21:49:07.026Z
- Starting baseline: g2-rate-smoothing (12.30/16.00)
- Current baseline: g2-rate-smoothing (12.30/16.00)
- Stop condition: not reached
- Score trend: 12.30

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore respond_to_fok

Establish the documentation's stronger equal-score baseline by rebinding the cached 3.4-cent quantity-tier policy under the updated lexicographic promotion gate, while testing two structurally distinct capital-aware FOK controls from the deferred research direction. Keep the champion estimator and quote fixed, preserve the known two-cent ordinary edge, and avoid the harmful 3.5-cent large-order boundary.

Parent: champion `g2-rate-smoothing` (`f4d4f21e12b5d011db36f4b8585a88b887497eb068e7a14ea526ecd99d44cd3a`).

### g1-q2-edge034

- Hypothesis: Requiring a 3.4-cent edge only when FOK quantity exceeds two will preserve the champion's 12.30 score and minimum capital while recovering the cached 2.14 combined-PnL improvement, making it the stronger baseline under lexicographic selection.
- Implementation plan: In respond_to_fok, select a 0.034 favorable edge when quantity is greater than two and retain 0.02 otherwise; keep the champion's symmetric BUY/SELL comparisons and fixed 0.50 side-specific worst-case-loss cap exactly unchanged. Match the archived q2-edge034-fine behavior so the dispatcher can rebind its cached evidence rather than rerun it.
- Worker summary: Implemented the archived quantity-tier FOK policy exactly: require a 3.4-cent favorable edge only above quantity two, retain two cents otherwise, and preserve the symmetric half-dollar total-loss cap. Compilation, scope validation, diff checks, and source-hash verification passed; cached 20/20 evidence was rebound to the current champion.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 79.36; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 2.14

### g1-capital-scaled-risk

- Hypothesis: Scaling the FOK worst-case-loss allowance to five percent of starting cash will preserve the proven half-dollar cap in low-capital cases while participating more aggressively where the grader supplies larger capital, potentially lifting rank without increasing low-capital bankruptcy risk.
- Implementation plan: In respond_to_fok, retain the two-cent favorable edge and replace the fixed 0.50 loss ceiling with 5% of self.cash_balance for both order sides. Keep the rule symmetric and calculate worst-case loss exactly as the champion does.
- Worker summary: Replaced the fixed half-dollar FOK loss cap with five percent of starting cash while preserving the two-cent favorable edge and symmetric side-specific loss calculation. Compilation and scope validation passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.10/16.00 points; PnL 73.90; minimum capital 5.98/10.00
- Baseline delta: -0.20 points; PnL -3.32

### g1-loss-weighted-edge

- Hypothesis: A continuous edge premium tied to the order's per-contract maximum loss will filter the most capital-intensive marginal FOKs while avoiding the discontinuous quantity threshold that becomes harmful at 3.5 cents.
- Implementation plan: In respond_to_fok, compute per-contract maximum loss from the order side, require a favorable edge of 0.02 plus 0.014 times that loss, and retain the fixed 0.50 total worst-case-loss cap. Apply the same formula symmetrically to BUY and SELL orders.
- Worker summary: Added a continuous edge premium of 1.4 cents times per-contract maximum loss on top of the champion's two-cent edge, preserving the fixed half-dollar total-loss cap and BUY/SELL symmetry. Compilation and scope validation passed; the candidate completed 20/20 without bankruptcy.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 77.27; minimum capital 5.98/10.00
- Baseline delta: 0.00 points; PnL 0.05

Selection: g1-q2-edge034.
Promotion: none.
Finding: All three FOK policies passed 20/20 without bankruptcy or runtime errors. The cached 3.4-cent edge above quantity two preserved 12.30 points and 5.98/10.00 minimum capital while lifting combined PnL from 77.22 to 79.36, so it led the lexicographic promotion gate. The continuous loss-weighted edge also retained 12.30 but reached only 77.27 PnL. Scaling loss allowance to five percent of cash lost 0.20 points and 3.32 PnL, showing that larger-capital FOK participation added adverse flow rather than useful rank upside.
Next-generation rationale: Promote the quantity-tier source as the stronger baseline described in the research plan. Next explore partial shrinkage between the champion's Jeffreys-smoothed transition estimator and the bounded transition-likelihood estimator at 0.25, 0.50, and 0.75 likelihood weights, holding the newly promoted quote and FOK policy fixed.
Previous failure (runner): g1-capital-scaled-risk runner failure after retry
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.
