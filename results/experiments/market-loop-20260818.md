# Market-Maker Experiment: market-loop-20260818

- Status: active
- Started: 2026-08-18T05:29:44.743Z
- Starting baseline: rfq-only-v1 (9.00/16.00)
- Current baseline: g3-half-cap (12.00/16.00)
- Stop condition: not reached
- Score trend: 9.00 → 11.40 → 11.70 → 12.00

A normal promoted candidate is based on one HackerRank run; stochastic score risk remains. Fixture-only validation uses stubbed evidence.

## Generation 1: quote

The 9.00-point baseline uses a one-cent spread and size one. An archived unpromoted run scored 11.40 with a two-cent spread and size two, so this generation fresh-tests that combination and isolates whether spread or size produced the apparent gain.

### g1-wide-two

- Hypothesis: Quoting two cents from rounded theoretical value at size two will improve ranking by earning more per fill while retaining acceptable solvency.
- Implementation plan: Change quote prices to theoretical value plus or minus two cents and both quantities to two. This pursues the strongest historical signal but increases fill exposure and tail loss risk.
- Worker summary: Changed quote prices to rounded theoretical value plus or minus two cents and set both bid and offer quantities to two. Scope validation, Python compilation, centered and boundary quote assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.40/16.00 points; PnL 30.35; minimum capital 5.50/10.00
- Baseline delta: 2.40 points; PnL 33.08

### g1-wide-one

- Hypothesis: Quoting two cents from rounded theoretical value at size one will retain the spread benefit without the additional capital exposure of larger orders.
- Implementation plan: Change only the quote width from one cent to two cents while keeping both quantities at one. This isolates spread capture and preserves baseline sizing.
- Worker summary: Changed quote prices to rounded theoretical value plus or minus two cents while preserving both quantities at one. Scope validation, Python compilation, and centered and boundary quote assertions passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 9.50/16.00 points; PnL 12.47; minimum capital 7.93/10.00
- Baseline delta: 0.50 points; PnL 15.20

### g1-tight-two

- Hypothesis: Keeping the one-cent quote width while increasing both quantities to two will improve PnL through greater participation without sacrificing competitiveness.
- Implementation plan: Keep prices one cent from rounded theoretical value and change both quantities to two. This isolates size, with higher inventory and capital risk than the baseline.
- Worker summary: Changed both bid and offer quantities to two while preserving the one-cent quote width. Scope validation, Python compilation, focused centered and boundary quote assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 10.00/16.00 points; PnL -1.91; minimum capital 5.04/10.00
- Baseline delta: 1.00 points; PnL 0.82

Selection: g1-wide-two.
Promotion: g1-wide-two (0dbcc7053c999f11739e56609a26d4b5b28cac87).
Finding: All three quote variants passed 20/20 without bankruptcy and strictly improved the 9.00 baseline. Widening alone reached 9.50, size two alone reached 10.00, and combining both reached 11.40 with +33.08 combined PnL, showing a strong interaction while reducing the minimum-capital ratio to 0.55.
Next-generation rationale: After promoting the 11.40 winner, FOK remains entirely unused. A risk-limited respond_to_fok generation can seek additional edge while preserving the now-proven quote settings and explicitly compare acceptance margins and quantity caps.
Previous failure (setup): git -C /Users/easonhao/Documents/dev/Akuna_challenge worktree add --detach /tmp/akuna-market-maker/market-loop-20260818/g01/g1-wide-two 2b20e2da4f7f16113c81835387080107ebb8b763 failed: Preparing worktree (detached HEAD 2b20e2d)
fatal: could not create leading directories of '.git/worktrees/g1-wide-two': Operation not permitted
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 2: respond_to_fok

The promoted 11.40 baseline still rejects every FOK, while verbose evidence contains selectively favorable orders. This generation compares two worst-case-loss caps at the current two-cent quote edge and a wider five-cent edge to seek incremental PnL without exposing the strategy to large binary-option liabilities.

### g2-cross-one

- Hypothesis: Accepting FOKs that cross the current two-cent quote only when total worst-case loss is at most one dollar will add low-risk profitable flow.
- Implementation plan: Compute theoretical value and side-specific worst-case loss. Accept counterparty buys at least two cents above theoretical value or sells at least two cents below it, only when order quantity times per-contract maximum loss is at most 1.00.
- Worker summary: Implemented side-aware two-cent FOK acceptance with a one-dollar total worst-case-loss cap. Scope validation, Python compilation, focused BUY/SELL edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 81.32; minimum capital 16.49/20.00
- Baseline delta: 0.30 points; PnL 50.97

### g2-cross-two

- Hypothesis: A two-dollar worst-case-loss cap at the current two-cent edge will capture more favorable FOK volume and outperform the stricter one-dollar cap without bankruptcy.
- Implementation plan: Use the same side-aware two-cent favorable-price test as the live quote and accept only when total worst-case loss is at most 2.00. This increases fill opportunity and capital risk relative to g2-cross-one.
- Worker summary: Implemented side-aware two-cent FOK acceptance with a two-dollar total worst-case-loss cap. Scope validation, Python compilation, focused BUY/SELL edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.00/16.00 points; PnL 84.63; minimum capital 6.92/10.00
- Baseline delta: -0.40 points; PnL 54.28

### g2-edge-five

- Hypothesis: Requiring a five-cent theoretical edge while allowing up to two dollars of worst-case loss will trade less often but improve adverse-selection resistance.
- Implementation plan: Accept only side-aware FOK prices at least five cents favorable to theoretical value and only when total worst-case loss is at most 2.00. This sacrifices marginal trades for stronger expected edge.
- Worker summary: Implemented side-aware five-cent FOK acceptance with a two-dollar total worst-case-loss cap. Scope validation, Python compilation, focused BUY/SELL edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 19/20 passed; 1 bankruptcies; 11.30/16.00 points; PnL 55.93; minimum capital -2.55/10.00
- Baseline delta: -0.10 points; PnL 25.58

Selection: g2-cross-one.
Promotion: g2-cross-one (59021c63145187a9df6be2270911c9a4a8906dbe).
Finding: The one-dollar cap at a two-cent edge passed 20/20 and improved the baseline from 11.40 to 11.70 with +50.97 combined PnL. Raising the cap to two dollars fell to 11.00 despite higher combined PnL, while the five-cent edge with that larger cap caused bankruptcy in case 7. The tighter capital cap, not simply a wider price edge, controlled rank and solvency best.
Next-generation rationale: Promote the one-dollar-cap winner, then refine respond_to_fok around that risk boundary by testing a lower cap and slightly narrower or wider price margins. This preserves the proven quote strategy while isolating participation versus adverse-selection effects.
Previous failure (integrity): Generation 2 dispatcher returned integrity code 3: g2-edge-five passed 19/20 and reported bankruptcy in case 7; selection and promotion were intentionally skipped.
Recovery instruction: Inspect the archived/state evidence and source hashes, correct the integrity problem, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 3: respond_to_fok

The two-cent edge with a one-dollar cap improved the baseline to 11.70, while a two-dollar cap reduced points and a wider edge did not offset its bankruptcy risk. This generation holds the proven logic constant while independently tightening the loss cap and moving the acceptance margin one cent in either direction.

### g3-half-cap

- Hypothesis: Keeping the two-cent edge but lowering total worst-case loss to fifty cents will improve solvency-adjusted ranking by excluding the riskiest accepted FOKs.
- Implementation plan: Preserve the side-aware two-cent favorable-price test and reduce the total worst-case-loss cap from 1.00 to 0.50. This lowers participation and capital usage.
- Worker summary: Reduced both side-aware FOK worst-case-loss caps from one dollar to fifty cents while preserving the two-cent favorable edge. Scope validation, Python compilation, focused edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 55.84; minimum capital 5.48/10.00
- Baseline delta: 0.30 points; PnL -25.48

### g3-edge-one

- Hypothesis: A one-cent favorable-price margin with the proven one-dollar cap will capture additional positive-edge FOK flow and raise PnL enough to improve rank.
- Implementation plan: Preserve the one-dollar loss cap and reduce the side-aware acceptance margin from two cents to one cent. This increases participation and adverse-selection sensitivity.
- Worker summary: Reduced the side-aware FOK acceptance margin from two cents to one cent while preserving the one-dollar cap. Scope validation, Python compilation, focused edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.10/16.00 points; PnL 77.08; minimum capital 15.69/20.00
- Baseline delta: -0.60 points; PnL -4.24

### g3-edge-three

- Hypothesis: A three-cent favorable-price margin with the proven one-dollar cap will improve trade quality while retaining enough FOK participation to beat the baseline.
- Implementation plan: Preserve the one-dollar loss cap and increase the side-aware acceptance margin from two cents to three cents. This trades less often for stronger estimated edge.
- Worker summary: Raised the side-aware FOK acceptance margin from two cents to three cents while preserving the one-dollar cap. Scope validation, Python compilation, focused edge and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.40/16.00 points; PnL 75.25; minimum capital 16.77/20.00
- Baseline delta: -0.30 points; PnL -6.07

Selection: g3-half-cap.
Promotion: g3-half-cap (36931514b971968e1fc708cf29d1a09aa0d86de5).
Finding: All candidates passed 20/20 without bankruptcy. Lowering the FOK worst-case-loss cap to fifty cents improved points from 11.70 to 12.00, despite reducing combined PnL by 25.48 and producing a lower observed minimum-capital ratio. Moving the price edge to one or three cents with the one-dollar cap reduced points to 11.10 and 11.40, confirming the two-cent margin is the stronger center.
Next-generation rationale: Promote the fifty-cent-cap winner and refine risk around that new boundary. Test quarter-dollar and seventy-five-cent caps at the proven two-cent edge, plus a three-cent edge under the fifty-cent cap to check whether stronger filtering interacts differently at lower exposure.
Previous failure (runner): Generation 3 runner failed before any candidate completed: browser automation reported Unexpected end of JSON input; queued siblings were cancelled.
Recovery instruction: Repair the HackerRank browser profile with `auto_extract_result/login.sh`, then run `candidate_pipeline/loop.sh resume --run-id <run-id>`. Existing worktrees and completed evaluations are preserved.

## Generation 4: respond_to_fok

The fifty-cent cap at a two-cent edge improved the baseline to 12.00, while one-dollar edge variants underperformed. This generation brackets the new risk boundary with quarter-dollar and seventy-five-cent caps and tests whether a three-cent margin works better when paired with the lower fifty-cent exposure.

### g4-quarter-cap

- Hypothesis: A twenty-five-cent worst-case-loss cap at the proven two-cent edge will further improve rank by accepting only the safest favorable FOKs.
- Implementation plan: Preserve the side-aware two-cent edge and lower both total worst-case-loss caps from 0.50 to 0.25. This sharply reduces participation and capital usage.
- Worker summary: Reduced both side-aware FOK worst-case-loss caps from fifty cents to twenty-five cents while preserving the two-cent edge. Scope validation, Python compilation, focused acceptance and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.40/16.00 points; PnL 36.68; minimum capital 5.48/10.00
- Baseline delta: -0.60 points; PnL -19.16

### g4-threequarter-cap

- Hypothesis: A seventy-five-cent cap at the proven two-cent edge will recover useful FOK volume while remaining materially safer than the underperforming one-dollar cap.
- Implementation plan: Preserve the side-aware two-cent edge and raise both total worst-case-loss caps from 0.50 to 0.75. This increases participation moderately.
- Worker summary: Raised both side-aware FOK worst-case-loss caps from fifty cents to seventy-five cents while preserving the two-cent edge. Scope validation, Python compilation, focused acceptance and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 11.70/16.00 points; PnL 66.02; minimum capital 24.04/40.00
- Baseline delta: -0.30 points; PnL 10.18

### g4-half-edge-three

- Hypothesis: A three-cent favorable edge paired with the fifty-cent cap will improve trade quality without the larger exposure that hurt the earlier three-cent test.
- Implementation plan: Keep the fifty-cent loss cap and raise the side-aware acceptance margin from two cents to three cents. This isolates the margin interaction under lower exposure.
- Worker summary: Raised the side-aware FOK acceptance margin from two cents to three cents while preserving the fifty-cent cap. Scope validation, Python compilation, focused acceptance and cap assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.00/16.00 points; PnL 57.00; minimum capital 5.48/10.00
- Baseline delta: 0.00 points; PnL 1.16

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: All candidates passed 20/20 without bankruptcy, but none qualified. The quarter-dollar cap fell to 11.40, the seventy-five-cent cap reached 11.70, and the three-cent edge with the fifty-cent cap tied the 12.00 baseline with the same minimum-capital ratio, so its slightly higher combined PnL could not pass the promotion gate. The fifty-cent cap and two-cent edge remain the measured center.
Next-generation rationale: Use the fifth and final generation on quote, an orthogonal lever that produced the largest earlier improvement. Starting from the FOK-enhanced 12.00 baseline, compare a three-cent width at size two, size three at the current two-cent width, and their combination to test spread-versus-participation interaction.

## Generation 5: quote

Generation 4 found no FOK improvement around the 12.00 baseline. Quote width and size produced the largest earlier gain, so the final generation tests the next wider and larger settings while preserving the successful two-cent-edge, fifty-cent-cap FOK policy.

### g5-wide-three-two

- Hypothesis: Widening quotes from two cents to three cents at size two will increase spread capture enough to improve rank without added inventory size.
- Implementation plan: Change bid and offer prices to rounded theoretical value plus or minus three cents while keeping both quantities at two. This sacrifices competitiveness for per-fill edge.
- Worker summary: Widened quote prices from two cents to three cents while preserving bid and offer quantities at two and leaving FOK logic unchanged. Scope validation, Python compilation, centered and boundary quote assertions, and git diff checks passed.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.30/16.00 points; PnL 75.49; minimum capital 5.92/10.00
- Baseline delta: 0.30 points; PnL 19.65

### g5-wide-two-three

- Hypothesis: Keeping the two-cent quote width while increasing both quantities from two to three will improve participation and PnL enough to beat the baseline.
- Implementation plan: Keep prices two cents from rounded theoretical value and raise bid and offer quantities to three. This increases inventory and capital exposure.
- Worker summary: Raised bid and offer quantities from two to three while preserving the two-cent quote width and FOK logic. Scope validation, Python compilation, centered and boundary quote assertions, and git diff checks passed.
- Status: archived
- Result: 18/20 passed; 2 bankruptcies; 11.20/16.00 points; PnL 51.84; minimum capital -1.98/10.00
- Baseline delta: -0.80 points; PnL -4.00

### g5-wide-three-three

- Hypothesis: Combining a three-cent quote width with size three will reproduce the earlier positive spread-size interaction at a higher scale.
- Implementation plan: Set prices three cents from rounded theoretical value and both quantities to three. This maximizes per-fill spread and participation among the candidates, with the highest capital risk.
- Worker summary: Combined a three-cent quote width with bid and offer quantities of three while leaving FOK logic unchanged. Scope validation, Python compilation, centered and boundary quote assertions, and git diff checks passed.
- Status: archived
- Result: 18/20 passed; 2 bankruptcies; 11.70/16.00 points; PnL 74.22; minimum capital -1.69/10.00
- Baseline delta: -0.30 points; PnL 18.38

Selection: g5-wide-three-two.
Promotion: none.
Finding: Widening quotes to three cents while keeping size two passed 20/20, avoided bankruptcy, and improved the 12.00 baseline to 12.30 with +19.65 combined PnL and a higher observed minimum-capital ratio. Both size-three variants went bankrupt in cases 7 and 12, showing that larger quote quantity exceeded safe capital capacity regardless of the two- or three-cent width.
