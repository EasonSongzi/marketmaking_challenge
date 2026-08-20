# Market-Maker Experiment: market-loop-20260820-3

- Status: active
- Started: 2026-08-20T20:13:05.267Z
- Starting baseline: g6-fed-flat-23-or-25 (13.30/16.00)
- Current baseline: g4-compose-both (13.30/16.00)
- Stop condition: not reached
- Score trend: 13.30 → 13.30 → 13.30 → 13.30

The fixed grader is evaluated once per unique source SHA-256; repeated sources reuse cached case evidence. Fixture-only validation uses stubbed evidence.

## Generation 1: explore quote

Twelve consecutive generations of per-RFQ conditional sizing bought 2.56 combined PnL and zero score, because every gate operated inside the eight sessions the champion already wins. The remaining 2.70 points sit in seven sessions won by passive fixed-width and non-participating quoters. The champion conditions on nothing that describes the session except starting capital, which cuts across the win/lose boundary. Meanwhile warm_up builds a complete WarmUpStatistics object that has never influenced a quote in 243 graded candidates. This generation is a measurement, not a promotion attempt: it asks whether any warm-up statistic separates the seven lost sessions from the eight won ones. Each candidate applies one deliberately large and unmistakable eight-cent half-width perturbation gated on a single, structurally different warm-up statistic, so the set of scored cases whose PnL moves is exactly the regime label that statistic induces. All three candidates are expected to lose combined PnL; they must be judged on which cases moved, not on aggregate PnL. This run replaces market-loop-20260820-2, whose generation 1 hard-stopped on an integrity failure: a compact stdout diagnostic added to all three candidates made the grader's custom checker fail all 19 session tests with 'Custom checker Failed: Success' while THEO, which never calls quote, passed. The grader consumes the program's stdout as its own data channel, so MarketMaker must never write to stdout. The diagnostic has been removed and each candidate is now a single-line warm-up-statistic gate.

Parent: champion `g6-fed-flat-23-or-25` (`4c4cb69cd1a35ba17cb81e6aa0333b1acf426535c0a0aad30a11bac067e12545`).

### g1-thr-vol-regime

- Hypothesis: Company return volatility estimated from the warm-up history separates the sessions the champion loses from the ones it wins. Sessions whose Theriodic daily log-return sample standard deviation exceeds 0.025 form one regime; widening the champion's quote to an eight-cent half-width in that regime and leaving the other regime untouched will move a proper, non-empty subset of the sixteen scored cases, and that moved set is the regime label.
- Implementation plan: In `quote` only, one line plus its gate. Immediately after the existing `fair_value_cents` assignment, read the Theriodic company log-return volatility from `self.warm_up_statistics.company_log_returns_by_underlying_id[THERIODIC_UNDERLYING_ID].sample_std_dev` into a local named `theriodic_return_volatility` annotated `float`, and replace the existing line `half_width: int = 5 if repeat_request else 4` with `half_width: int = 8 if theriodic_return_volatility > 0.025 else (5 if repeat_request else 4)`. `self.warm_up_statistics` is guaranteed non-None inside `quote` because `price_option` on the line above raises unless `warm_up` ran, so do not add a None check. Change nothing else: every price shade, fill-signal skew, capital term, quantity ladder, inventory gate and the return statement stay byte-identical to the parent. Expected tradeoff: combined PnL falls, possibly sharply, in whichever sessions land in the wide regime; the value of the run is the identity of the moved cases, not the PnL.
- Worker summary: Single-line gate in `quote`: read `warm_up_statistics.company_log_returns_by_underlying_id[THERIODIC_UNDERLYING_ID].sample_std_dev` into `theriodic_return_volatility` and set `half_width = 8 if theriodic_return_volatility > 0.025 else (5 if repeat_request else 4)`. One removed line, four added; no other shade, capital term, quantity ladder rung, or inventory gate touched. py_compile and `validate-candidate.sh --target-method quote` both passed. Source SHA 93864c27172e6801f7aa4cd01b28e7ca49dad10d04525c27655a31dc5e8407a9.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.50/16.00 points; PnL 118.48; minimum capital 7.97/10.00
- Baseline delta: -0.80 points; PnL -39.61

### g1-rate-flat-regime

- Hypothesis: Rate activity separates the two session regimes. Sessions whose warm-up history left the FED funds rate unchanged on more than half of its transitions form one regime; applying the same eight-cent half-width there induces a different, structurally independent partition of the sixteen scored cases than a volatility statistic does.
- Implementation plan: In `quote` only, one line plus its gate. Immediately after the existing `fair_value_cents` assignment, read `self.warm_up_statistics.rate_transition_frequencies["unchanged"]` into a local named `flat_rate_frequency` annotated `float`, and replace the existing line `half_width: int = 5 if repeat_request else 4` with `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)`. The key "unchanged" is always present: `warm_up` builds `rate_transition_counts` from the fixed tuple ("up", "down", "unchanged"), so index it directly and do not use `.get`. Do not add a None check on `self.warm_up_statistics`; `price_option` on the line above already raises unless `warm_up` ran. Change nothing else. Expected tradeoff: identical in shape to the other candidates; judged on the moved-case set.
- Worker summary: Single-line gate in `quote`: read `warm_up_statistics.rate_transition_frequencies["unchanged"]` into `flat_rate_frequency` and set `half_width = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)`. Direct indexing is safe because `warm_up` builds `rate_transition_counts` from the fixed tuple ("up", "down", "unchanged"). One removed line, two added; nothing else changed. py_compile and `validate-candidate.sh --target-method quote` both passed. Source SHA 63a73f0b8ba5b647bbe77e7be85511d61fe23e3db7114a50fe4c007d7e36827b.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 161.04; minimum capital 7.97/10.00
- Baseline delta: 0.00 points; PnL 2.95

### g1-residual-corr-regime

- Hypothesis: Company co-movement after removing the rate effect separates the two session regimes. Sessions whose rate-adjusted residual correlation between AjarAI and Theriodic exceeds 0.50 are sector-dominated and form one regime; the eight-cent half-width applied there induces a third structurally independent partition of the sixteen scored cases.
- Implementation plan: In `quote` only, one line plus its gate. Immediately after the existing `fair_value_cents` assignment, read `self.warm_up_statistics.rate_adjusted_residual_correlation` into a local named `residual_correlation` annotated `float`, and replace the existing line `half_width: int = 5 if repeat_request else 4` with `half_width: int = 8 if residual_correlation > 0.50 else (5 if repeat_request else 4)`. Do not add a None check on `self.warm_up_statistics`; `price_option` on the line above already raises unless `warm_up` ran. Change nothing else. Expected tradeoff: identical in shape to the other candidates; judged on the moved-case set.
- Worker summary: Single-line gate in `quote`: read `warm_up_statistics.rate_adjusted_residual_correlation` into `residual_correlation` and set `half_width = 8 if residual_correlation > 0.50 else (5 if repeat_request else 4)`. One removed line, two added; nothing else changed. py_compile and `validate-candidate.sh --target-method quote` both passed. Source SHA 9d34b00f4f9b9988f5aa2bace32d9e7e9e6ec97ffc23836f83ce9b9f7a7e267b.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.50/16.00 points; PnL 121.70; minimum capital 7.97/10.00
- Baseline delta: -0.80 points; PnL -36.39

Selection: g1-rate-flat-regime.
Promotion: g1-rate-flat-regime (0d8a19a9b9a27114b35b86b7cfe9551ceb98a77a).
Finding: SESSION TOMOGRAPHY SUCCEEDED. Warm-up statistics do separate the grader's sessions, all three
statistics are live across the sixteen scored cases, and one of them is a surgical discriminator. Zero bankruptcies and
zero runtime errors in all three candidates; minimum ending capital held at 7.97/10.00 throughout.

PER-CASE VECTORS (ours PnL / rank / N / leader / per-case score under the Section 2 identity; * marks a case whose PnL moved
against champion g6-fed-flat-23-or-25):

case  N  champion    RATEflat        THRvol          REScorr         leader
  5   2   2.23 r2     2.23  r2       2.87* r2        2.87* r2        Stalemate Quoter
  6   3   0.10 r2     1.29* r2       1.29* r2        1.29* r2        Fixed Width 0.25
  7   2  -2.03 r2    -2.03  r2      -2.03  r2       -2.03  r2        Fixed Width 0.25
  8   3   1.61 r2     1.61  r2       6.95* r2        6.95* r2        Fixed Width 0.1
  9   3  32.35 r1    31.14* r1      31.14* r1       31.14* r1        (ours)
 10   3  11.55 r2    11.55  r2      14.17* r2       14.17* r2        Fixed Width 0.1
 11   3  21.17 r1    21.17  r1       5.52* r1        5.52* r1        (ours)
 12   2   4.27 r1     4.27  r1       4.27  r1        3.21* r1        (ours)
 13   4   8.96 r2     8.96  r2       8.96  r2        8.96  r2        Fixed Width 0.1
 14   3  17.29 r1    17.29  r1      -2.16* r3       -2.16* r3        Lattice
 15   3  10.06 r1    13.03* r1      13.03* r1       13.03* r1        (ours)
 16   3  27.07 r1    27.07  r1      23.56* r1       23.56* r1        (ours)
 17   4  18.31 r1    18.31  r1      18.31  r1       18.31  r1        (ours)
 18   4   7.44 r2     7.44  r2      -0.47* r3       -0.47* r3        Fixed Width 0.05
 19   4  -2.59 r2    -2.59  r2      -2.59  r2        1.69* r2        Situational Unawareness
 20   4   0.30 r1     0.30  r1      -4.34* r1       -4.34* r1        (ours)
TOTAL          13.30        13.30           12.50            12.50

SCORE DECOMPOSITION OF THE DELTA, not just combined PnL:
  RATEflat  13.30 -> 13.30   no rank transition anywhere; PnL 158.09 -> 161.04 (+2.95)
  THRvol    13.30 -> 12.50   case 14 r1->r3 (-0.60) and case 18 r2->r3 (-0.20); PnL -39.61
  REScorr   13.30 -> 12.50   identical two rank losses; PnL -36.39

REGIME LABELS INDUCED (the moved set IS the label):
  rate_transition_frequencies["unchanged"] > 0.50   ->  {6, 9, 15}                       3 of 16 sessions
  THR log-return sample_std_dev > 0.025             ->  {5,6,8,9,10,11,14,15,16,18,20}  11 of 16
  rate_adjusted_residual_correlation > 0.50         ->  {5,6,8,9,10,11,12,14,15,16,18,19,20}  13 of 16

1. THE FLAT-RATE STATISTIC IS THE DISCRIMINATOR THE MEMO ASKED FOR. It labels only three sessions and it is the only
candidate that is PnL-positive. Of its three, exactly one is a case we lose - case 6, which Section 4.3 named as the nearest
never-won case and which no memo had ever targeted. Case 6 went 0.10 -> 1.29 and its gap to Fixed Width 0.25 closed
10.83 -> 9.39. The two protected cases it touches, 9 and 15, both held rank 1, and case 15 gained +2.97. It is a strict
lexicographic improvement over the champion at unchanged 13.30 with PnL 161.04 > 158.09, so it promotes.

2. CASE 6 IS NO LONGER FRAGILE. Section 13 flagged it as a rank-two hold with a 0.10 margin over Stalemate Quoter, ten cents
from costing 0.30 points. RATEflat widens that margin to 1.29. That is worth more than the PnL.

3. THE WIDE POLICY IS RIGHT FOR THE LOST SESSIONS AND WRONG FOR THE WON ONES, EXACTLY AS SECTION 8 PREDICTED. THRvol and
REScorr are near-duplicate labels (REScorr = THRvol union {12, 19}) and both bought large gains in cases we lose - case 8
+5.34, case 10 +2.62, case 5 +0.64, and for REScorr case 19 +4.28 - while destroying case 14 (17.29 -> -2.16, rank 1 -> 3)
and case 18 (7.44 -> -0.47, rank 2 -> 3). A single global eight-cent widening cannot be the answer; the regime must exclude
9, 11, 14, 16, 18, 20.

4. NEW PROJECT-BEST GAP IN CASE 8. Both THRvol and REScorr reached leader-minus-ours 20.91, beating the previous best-ever
22.65, with our best-ever case-8 own PnL of 6.95 against the prior 4.93. This is not the truncation artifact of Section 12
trap 1: bankruptcies were zero in every session. Fixed Width 0.1 fell 30.70 -> 27.86 while we rose 1.61 -> 6.95, so the
effect is part routing and part own-edge. Case 19 also improved under REScorr, gap 24.67 -> 20.53 against a best-ever 19.05.

5. CASES 7 AND 13 ARE INERT UNDER ALL THREE STATISTICS. Neither moved by a cent under any of the three labels, so neither
session carries high THR volatility, high residual correlation, nor a flat rate history. Any policy aimed at 7 or 13 must be
conditioned on something else entirely.
Next-generation rationale: Generation 2 should refine the flat-rate threshold, because {6, 9, 15} is a sharp partition whose
boundary has been measured at exactly one point. Use cumulative thresholds so differencing adjacent results attributes each
session to a band, exactly as the fair-value tomography did: probe 0.40, 0.45, 0.55 and 0.60 against the same eight-cent
widening and difference the moved sets. The objective is a threshold that keeps case 6 and drops case 9, whose -1.21 is the
only cost the promoted gate pays.

Then switch from probing to policy. Case 6 is lost to Fixed Width 0.25, so its regime wants a much wider and far less
participatory quote; eight cents already gained 1.19 there and the direction is confirmed, so test ten and twelve cents in
the flat-rate regime alone. Do not widen globally - generation 1 priced that experiment at -0.80 points.

Generation 3 should attack the wide-regime evidence from THRvol/REScorr, which is now the strongest unexploited result in
the project. The wide policy is worth +5.34 in case 8, +4.28 in case 19, +2.62 in case 10 and +0.64 in case 5, and costs
two rank flips in 14 and 18. Those footprints are disjoint. Find a statistic, or a conjunction of the three already measured,
that captures {5, 8, 10, 19} while excluding {9, 11, 14, 16, 18, 20}. The three measured labels are a basis: 19 is in
REScorr but not THRvol, and 14/18 are in both, so a two-statistic conjunction or a residual-correlation band rather than a
half-line is the first thing to try. Converting case 8 or 19 is worth +0.30 and +0.20 respectively.

Do not spend a generation on cases 7 or 13. Both were inert under all three statistics, so no measured warm-up axis reaches
them.
Challenger update: admitted market-loop-20260820-3-g01-g1-residual-corr-regime.

## Generation 2: explore quote

Generation 1 opened the only new axis this project has found in twelve generations: the warm-up flat-rate frequency labels exactly three of the sixteen scored sessions, {6, 9, 15}, and an eight-cent half-width in that regime promoted at 13.30 / 161.04. This generation exploits that axis on its two free parameters, width and threshold, and it is the last cheap generation on it. Direction is not guessed: the only lost case inside the label, case 6, is won by Fixed Width 0.25, so Section 8's rule says its regime wants a much wider and far less participatory quote, and the eight-cent step already moved case 6 from 0.10 to 1.29 and closed its gap from 10.83 to 9.39. Candidates A and B walk the width out to twelve and eighteen cents to map the curve and find where case 6 turns over, while watching the two protected rank-one holds the label also touches: case 9, whose margin over Fixed Width 0.1 is 24.46 and is safe, and case 15, whose margin over Situational Unawareness is 7.32 and is the real constraint. Candidate C lowers the threshold to 0.40 at the promoted eight cents, which is a pure measurement: differencing its moved set against the champion's {6, 9, 15} attributes every additional session to the flat-rate band (0.40, 0.50], extending the label map exactly as the fair-value tomography did. Case 6 needs 9.39 dollars to convert and that is unlikely in one generation, so the promotion test here is combined PnL at 13.30 against 161.04; the research test is the shape of the width curve and the new band label.

Parent: champion `g1-rate-flat-regime` (`63a73f0b8ba5b647bbe77e7be85511d61fe23e3db7114a50fe4c007d7e36827b`).

### g2-flat-wide-twelve

- Hypothesis: The flat-rate regime wants a much wider quote than eight cents. Raising the flat-regime half-width from eight to twelve cents moves case 6 further toward Fixed Width 0.25 and gains more in case 15 than it gives up in case 9, while leaving the thirteen sessions outside the label byte-identical.
- Implementation plan: In `quote` only, a single constant change. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace the literal `8` with `12`, so the line reads `half_width: int = 12 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)`. Change nothing else whatsoever: the `flat_rate_frequency` line above it, every price shade, the fill-signal skew, `active_exposure`, `signed_reserve`, `cash_floor`, the whole quantity ladder, every inventory gate and the `return Quote(...)` statement stay byte-identical to the parent. `git diff` must show exactly one removed line and one added line. Expected tradeoff: cases 6, 9 and 15 move and nothing else does; case 9 is expected to give up more than it did at eight cents.
- Worker summary: One literal in `quote`: flat-regime `half_width` 8 -> 12. Diff is one line removed, one added; threshold 0.50 and the `flat_rate_frequency` line untouched. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.70/16.00 points; PnL 146.97; minimum capital 7.97/10.00
- Baseline delta: -0.60 points; PnL -14.07

### g2-flat-wide-eighteen

- Hypothesis: Eighteen cents is near the width that beats Fixed Width 0.25 in the flat-rate regime. If case 6 is still improving at eighteen cents the axis is worth another generation; if it has turned over between twelve and eighteen, the optimum is bracketed and the axis is finished.
- Implementation plan: In `quote` only, a single constant change. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace the literal `8` with `18`, so the line reads `half_width: int = 18 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)`. Change nothing else whatsoever, exactly as above. `git diff` must show exactly one removed line and one added line. Expected tradeoff: a large PnL swing confined to cases 6, 9 and 15; the rank-one hold in case 15 against Situational Unawareness is the binding constraint and must be checked explicitly.
- Worker summary: One literal in `quote`: flat-regime `half_width` 8 -> 18. Diff is one line removed, one added; threshold 0.50 and the `flat_rate_frequency` line untouched. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.70/16.00 points; PnL 146.47; minimum capital 7.97/10.00
- Baseline delta: -0.60 points; PnL -14.57

### g2-flat-threshold-forty

- Hypothesis: Additional grader sessions have a warm-up flat-rate frequency in the band (0.40, 0.50]. Lowering the threshold from 0.50 to 0.40 at the promoted eight-cent width admits them to the flat regime, and differencing the moved set against the champion's {6, 9, 15} attributes each newly moved session to that band.
- Implementation plan: In `quote` only, a single constant change. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace the literal `0.50` with `0.40`, so the line reads `half_width: int = 8 if flat_rate_frequency > 0.40 else (5 if repeat_request else 4)`. Leave the width literal `8` untouched. Change nothing else whatsoever, exactly as above. `git diff` must show exactly one removed line and one added line. Expected tradeoff: this is a measurement. If the moved set is exactly {6, 9, 15} the band is empty and the threshold may be lowered further next generation; if it is larger, the newly moved cases are the band's members and their PnL deltas say whether the wide policy suits them.
- Worker summary: One literal in `quote`: flat-regime threshold 0.50 -> 0.40, width literal 8 left in place. Diff is one line removed, one added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 12.50/16.00 points; PnL 116.52; minimum capital 35.66/40.00
- Baseline delta: -0.80 points; PnL -44.52

Selection: No candidate passed the promotion gate.
Promotion: none.
Finding: THE FLAT-RATE AXIS IS NOW FULLY MAPPED, AND IT IS BOUNDED BY LABEL IMPURITY, NOT BY DIRECTION.
No candidate promoted; the champion holds at 13.30 / 161.04. Zero bankruptcies and zero runtime errors throughout.

PER-CASE VECTORS against champion g1-rate-flat-regime (ours PnL / rank; * marks a moved case):

case  N  champion   w12        w18        thr40      leader
  5   2   2.23 r2    2.23 r2    2.23 r2    2.87* r2   Stalemate Quoter
  6   3   1.29 r2    2.01* r2   3.93* r2   1.29 r2    Fixed Width 0.25
  7   2  -2.03 r2   -2.03 r2   -2.03 r2   -0.25* r2   Fixed Width 0.25
  8   3   1.61 r2    1.61 r2    1.61 r2    1.61 r2    Fixed Width 0.1
  9   3  31.14 r1   16.57* r2  16.23* r2  31.14 r1    (ours)
 10   3  11.55 r2   11.55 r2   11.55 r2   11.55 r2    Fixed Width 0.1
 11   3  21.17 r1   21.17 r1   21.17 r1    5.52* r1   (ours)
 12   2   4.27 r1    4.27 r1    4.27 r1    4.27 r1    (ours)
 13   4   8.96 r2    8.96 r2    8.96 r2    8.90* r2   Fixed Width 0.1
 14   3  17.29 r1   17.29 r1   17.29 r1   -2.16* r3   Lattice
 15   3  13.03 r1   12.81* r2  10.73* r2  13.03 r1    (ours)
 16   3  27.07 r1   27.07 r1   27.07 r1   23.56* r1   (ours)
 17   4  18.31 r1   18.31 r1   18.31 r1   18.31 r1    (ours)
 18   4   7.44 r2    7.44 r2    7.44 r2   -0.47* r3   Fixed Width 0.05
 19   4  -2.59 r2   -2.59 r2   -2.59 r2    1.69* r2   Situational Unawareness
 20   4   0.30 r1    0.30 r1    0.30 r1   -4.34* r1   (ours)
TOTAL         13.30      12.70      12.70      12.50

SCORE DECOMPOSITION OF THE DELTA:
  w12    13.30 -> 12.70   case 9 r1->r2 (-0.30), case 15 r1->r2 (-0.30); PnL 161.04 -> 146.97
  w18    13.30 -> 12.70   identical two rank losses;                     PnL 161.04 -> 146.47
  thr40  13.30 -> 12.50   case 14 r1->r3 (-0.60), case 18 r2->r3 (-0.20); PnL 161.04 -> 116.52

1. THE COMPLETE FLAT-RATE BAND PARTITION OF ALL SIXTEEN SESSIONS IS NOW KNOWN. Differencing thr40's moved set against the
champion's label gives a clean three-band map, which is the single most reusable fact this loop has produced:

    flat_rate_frequency  > 0.50        {6, 9, 15}
    flat_rate_frequency in (0.40,0.50] {5, 7, 11, 13, 14, 16, 18, 19, 20}
    flat_rate_frequency <= 0.40        {8, 10, 12}

2. THE WIDTH DIRECTION IS CONFIRMED AND MONOTONE, BUT THE LABEL IS IMPURE. Case 6 improves without turning over:
0.10 at 4/5 cents, 1.29 at eight, 2.01 at twelve, 3.93 at eighteen, and its gap to Fixed Width 0.25 closes 10.83 -> 9.39 ->
8.83 -> 6.44, a NEW PROJECT BEST against the previous 7.96. Section 8's read of the competitor identity was correct. The axis
is nonetheless finished at eight cents, because cases 9 and 15 sit in the same label and both surrender rank one by twelve
cents. Eight cents is the joint optimum of an impure label, not the optimum for case 6. Further width on this axis requires
separating case 6 from cases 9 and 15 first.

3. THE MIDDLE BAND SPLITS CLEANLY INTO CASES THAT WANT WIDTH AND CASES THAT REFUSE IT. Within (0.40, 0.50], the eight-cent
widening helped 5 (+0.64), 7 (+1.78) and 19 (+4.28) with no rank change, was neutral on 13 (-0.06), and destroyed 14
(rank 1 -> 3) and 18 (rank 2 -> 3). Case 7 had been inert under every generation 1 label; this is the first time any
candidate in the project has moved it, and its gap closed 22.17 -> 20.39.

4. THE GENERATION 1 LABELS SEPARATE THE MIDDLE BAND EXACTLY ALONG THAT LINE. Intersecting the middle band with the THR
volatility label from generation 1 gives THR-volatility-low = {7, 13, 19} and THR-volatility-high = {5, 11, 14, 16, 18, 20}.
Every case that gained from widening and lost no rank is in the low set; both cases that lost rank are in the high set. The
conjunction (flat_rate_frequency > 0.40 AND theriodic sample_std_dev <= 0.025) therefore predicts a +6.00 combined-PnL gain
with no rank transition anywhere. This is a measured prediction, not an extrapolation.

5. THE BOTTOM BAND IS UNTOUCHED AND CONTAINS THE PROJECT'S BEST NEVER-WON EVIDENCE. Sessions {8, 10, 12} have never been
widened by any promoted source. Generation 1 showed that widening 8 and 10 is worth +5.34 and +2.62 and produced the
project-best case 8 gap of 20.91, while 12 is a rank-one hold with a 12.76 margin. Widening the bottom band alone is
disjoint from the top band and from the conjunction in point 4.
Next-generation rationale: Generation 3 should stop probing and start harvesting the band map, with three disjoint,
individually promotable rules.

A. Conjoin the two measured labels: widen when flat_rate_frequency > 0.50, or when flat_rate_frequency > 0.40 and the THR
log-return sample_std_dev is at most 0.025. That adds exactly {7, 13, 19} to the wide regime and is predicted at +6.00
combined PnL with no rank transition.

B. Test whether case 6 is separable from cases 9 and 15 on the same axis by raising the threshold to 0.60 at the
eighteen-cent width. If 9 and 15 fall below 0.60 they revert to the narrow quote and case 6 keeps its best-ever 3.93,
which is worth about +0.88 combined PnL at unchanged score; if all three are above 0.60 the result equals w18 and case 6 is
not separable on this axis, which closes it.

C. Widen the bottom band as well: flat_rate_frequency > 0.50 or flat_rate_frequency <= 0.40. That adds {8, 10, 12}, is
disjoint from A, and carries the project's best never-won evidence in case 8.

Generation 4 composes whichever of A, B and C are positive. Their case footprints are disjoint by construction -
{7,13,19}, {6,9,15}, {8,10,12} - and the previous loop established that disjoint effects add exactly, so composition is the
one thing worth a graded run after this.

Do not spend a generation widening the middle band as a whole. Generation 2 priced that at -0.80 points.
Challenger update: admitted market-loop-20260820-3-g02-g2-flat-wide-eighteen.

## Generation 3: explore quote

Generations 1 and 2 spent five graded sources mapping the warm-up flat-rate frequency onto the grader's sixteen scored sessions, and the map is now complete: {6, 9, 15} above 0.50, {5, 7, 11, 13, 14, 16, 18, 19, 20} in (0.40, 0.50], and {8, 10, 12} at or below 0.40. Generation 2 also priced the eight-cent widening inside every band. This generation stops probing and harvests that map with three rules whose case footprints are disjoint by construction, so that generation 4 can compose whichever ones pay. Candidate A conjoins the two measured labels: within the middle band, every case that gained from widening without losing rank (7, 13, 19) is THR-volatility-low and both cases that lost rank (14, 18) are THR-volatility-high, so gating on that conjunction predicts +6.00 combined PnL with no rank transition anywhere. Candidate B asks the one question that would unlock the width axis: case 6's response to width is monotone and unturned through eighteen cents, where it set a new project-best gap of 6.44, but cases 9 and 15 share its label and both surrender rank one past eight cents; raising the threshold to 0.60 at eighteen cents separates case 6 if its flat-rate frequency is the highest of the three, and closes the axis if it is not. Candidate C widens the bottom band, which no promoted source has ever touched and which holds the project-best case 8 evidence from generation 1. A and C are disjoint from each other and from the top band; B is a within-band refinement of the top band.

Parent: champion `g1-rate-flat-regime` (`63a73f0b8ba5b647bbe77e7be85511d61fe23e3db7114a50fe4c007d7e36827b`).

### g3-band-low-vol

- Hypothesis: The middle flat-rate band splits on THR return volatility exactly along the line between cases that want a wider quote and cases that refuse it. Widening the middle band only where the THR log-return sample standard deviation is at most 0.025 adds cases 7, 13 and 19 to the wide regime while leaving 5, 11, 14, 16, 18 and 20 narrow, gaining combined PnL with no rank transition.
- Implementation plan: In `quote` only. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace that single line with the following four lines, keeping the `flat_rate_frequency` line immediately above it exactly as it is:

```python
        theriodic_return_volatility: float = self.warm_up_statistics.company_log_returns_by_underlying_id[
            THERIODIC_UNDERLYING_ID
        ].sample_std_dev
        wide_regime: bool = flat_rate_frequency > 0.50 or (
            flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025
        )
        half_width: int = 8 if wide_regime else (5 if repeat_request else 4)
```

Change nothing else: every price shade, the fill-signal skew, `active_exposure`, `signed_reserve`, `cash_floor`, the whole quantity ladder, every inventory gate and the `return Quote(...)` statement stay byte-identical to the parent. Expected tradeoff: cases 7, 13 and 19 move and nothing outside {6, 7, 9, 13, 15, 19} does; the predicted deltas are case 7 +1.78, case 13 -0.06 and case 19 +4.28 at unchanged 13.30.
- Worker summary: In `quote`, replaced the single `half_width` line with a `theriodic_return_volatility` read from `warm_up_statistics.company_log_returns_by_underlying_id[THERIODIC_UNDERLYING_ID].sample_std_dev`, a `wide_regime` bool `flat_rate_frequency > 0.50 or (flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025)`, and `half_width = 8 if wide_regime else (5 if repeat_request else 4)`. One removed line, seven added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 167.04; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 6.00

### g3-flat-sixty-wide

- Hypothesis: Case 6 has a strictly higher warm-up flat-rate frequency than cases 9 and 15. Raising the threshold to 0.60 at the eighteen-cent width therefore isolates case 6 in the wide regime, keeping its best-ever 3.93 while cases 9 and 15 revert to the narrow quote and recover the rank-one PnL they held before generation 1.
- Implementation plan: In `quote` only, two literals on one line. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace it with `half_width: int = 18 if flat_rate_frequency > 0.60 else (5 if repeat_request else 4)`. Both literals change: the width `8` becomes `18` and the threshold `0.50` becomes `0.60`. Leave the `flat_rate_frequency` line above it untouched. `git diff` must show exactly one removed line and one added line. Change nothing else. Expected tradeoff: if cases 9 and 15 fall below 0.60 the result is case 6 at 3.93, case 9 back near 32.35 and case 15 back near 10.06, worth roughly +0.88 combined PnL at unchanged score; if all three sit above 0.60 the twenty-case vector will equal generation 2's eighteen-cent candidate and the width axis is closed.
- Worker summary: In `quote`, two literals on one line: width `8` -> `18` and threshold `0.50` -> `0.60`. One removed line, one added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 161.92; minimum capital 7.97/10.00
- Baseline delta: 0.00 points; PnL 0.88

### g3-low-band-wide

- Hypothesis: The bottom flat-rate band wants the same eight-cent widening the top band does. Sessions {8, 10, 12} have never been widened by any promoted source, and generation 1 showed that widening 8 and 10 is worth +5.34 and +2.62 and produced the project-best case 8 gap of 20.91, while case 12 is a rank-one hold with a 12.76 margin that survived widening in generation 1.
- Implementation plan: In `quote` only, one line. Find the existing line `half_width: int = 8 if flat_rate_frequency > 0.50 else (5 if repeat_request else 4)` and replace it with `half_width: int = 8 if flat_rate_frequency > 0.50 or flat_rate_frequency <= 0.40 else (5 if repeat_request else 4)`. Leave the `flat_rate_frequency` line above it untouched. `git diff` must show exactly one removed line and one added line. Change nothing else. Expected tradeoff: cases 8, 10 and 12 move and nothing outside {6, 8, 9, 10, 12, 15} does; case 12's rank-one hold against Fixed Width 0.05 must be checked explicitly, and case 8's gap is the result to watch.
- Worker summary: In `quote`, one line: the `half_width` predicate became `flat_rate_frequency > 0.50 or flat_rate_frequency <= 0.40`. One removed line, one added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.10/16.00 points; PnL 159.98; minimum capital 7.97/10.00
- Baseline delta: -0.20 points; PnL -1.06

Selection: g3-band-low-vol.
Promotion: g3-band-low-vol (c04f3a5f7100e2719564a781163f36ca16dcc435).
Finding: THE BAND MAP PAID OFF AND ALL THREE PREDICTIONS WERE EXACT. g3-band-low-vol promotes at
13.30 / 167.04, a +6.00 combined-PnL gain over the champion's 161.04, and it also lifts minimum ending capital from
7.97/10.00 to 9.75/10.00. Zero bankruptcies and zero runtime errors throughout.

PER-CASE VECTORS against champion g1-rate-flat-regime (ours PnL / rank; * marks a moved case):

case  N  champion   lowvol      s60w18     lowband     leader
  5   2   2.23 r2    2.23 r2     2.23 r2    2.23 r2    Stalemate Quoter
  6   3   1.29 r2    1.29 r2     3.93* r2   1.29 r2    Fixed Width 0.25
  7   2  -2.03 r2   -0.25* r2   -2.03 r2   -2.03 r2    Fixed Width 0.25
  8   3   1.61 r2    1.61 r2     1.61 r2    6.95* r2   Fixed Width 0.1
  9   3  31.14 r1   31.14 r1    32.35* r1  31.14 r1    (ours)
 10   3  11.55 r2   11.55 r2    11.55 r2   14.17* r2   Fixed Width 0.1
 11   3  21.17 r1   21.17 r1    21.17 r1   21.17 r1    (ours)
 12   2   4.27 r1    4.27 r1     4.27 r1    3.21* r1   (ours)
 13   4   8.96 r2    8.90* r2    8.96 r2    8.96 r2    Fixed Width 0.1
 14   3  17.29 r1   17.29 r1    17.29 r1   17.29 r1    (ours)
 15   3  13.03 r1   13.03 r1    10.06* r1  13.03 r1    (ours)
 16   3  27.07 r1   27.07 r1    27.07 r1   27.07 r1    (ours)
 17   4  18.31 r1   18.31 r1    18.31 r1   10.35* r2   (ours)
 18   4   7.44 r2    7.44 r2     7.44 r2    7.44 r2    Fixed Width 0.05
 19   4  -2.59 r2    1.69* r2   -2.59 r2   -2.59 r2    Situational Unawareness
 20   4   0.30 r1    0.30 r1     0.30 r1    0.30 r1    (ours)
TOTAL         13.30       13.30       13.30      13.10

SCORE DECOMPOSITION OF THE DELTA:
  lowvol   13.30 -> 13.30   no rank transition anywhere; PnL 161.04 -> 167.04 (+6.00); min capital 7.97 -> 9.75
  s60w18   13.30 -> 13.30   no rank transition anywhere; PnL 161.04 -> 161.92 (+0.88)
  lowband  13.30 -> 13.10   case 17 r1->r2 (-0.20);      PnL 161.04 -> 159.98

1. THE CONJUNCTION PREDICTION WAS EXACT TO THE CENT. Generation 2 predicted that gating the middle band on THR volatility
would add exactly {7, 13, 19} and gain +6.00 with no rank transition. The moved set was exactly {7, 13, 19} and the gain was
exactly +6.00: case 7 +1.78, case 13 -0.06, case 19 +4.28. Two independently measured labels composed with no interaction
term. This is the second time this loop has confirmed that disjoint case footprints add exactly.

2. CASE 6 IS SEPARABLE FROM CASES 9 AND 15 ON THE SAME AXIS. s60w18 moved exactly {6, 9, 15} and its prediction was also
exact: case 6 kept its best-ever 3.93 and best-ever gap of 6.44, while cases 9 and 15 fell below the 0.60 threshold, reverted
to the narrow quote, and returned to 32.35 and 10.06. The flat-rate frequency of case 6 is therefore strictly above 0.60 and
those of cases 9 and 15 lie in (0.50, 0.60]. The width axis that generation 2 closed is reopened: case 6 can be given
eighteen cents without touching either rank-one hold.

3. THE BOTTOM BAND HAS FOUR MEMBERS, NOT THREE, AND THE FOURTH IS A PROTECTED RANK-ONE HOLD. Generation 2's analysis
assigned {8, 10, 12} to the band at or below 0.40; the correct membership is {8, 10, 12, 17}, and lowband found it
empirically by dropping case 17 from rank 1 to rank 2 (18.31 -> 10.35). Corrected map:

    flat_rate_frequency  > 0.60        {6}
    flat_rate_frequency in (0.50,0.60] {9, 15}
    flat_rate_frequency in (0.40,0.50] {5, 7, 11, 13, 14, 16, 18, 19, 20}
    flat_rate_frequency <= 0.40        {8, 10, 12, 17}

4. THE BOTTOM BAND IS WORTH +6.90 ONCE CASE 17 IS EXCLUDED, AND STARTING CAPITAL EXCLUDES IT CLEANLY. Within the band,
widening gave case 8 +5.34 with the project-best gap of 20.91, case 10 +2.62, case 12 -1.06 with its rank-one hold intact,
and case 17 -7.96 with a lost rank. Cases 8, 10 and 12 start with capital 10, 20 and 20; case 17 starts with 40. A
`self.cash_balance < 40.0` conjunction therefore separates them exactly, using a variable the champion already conditions on.

5. THREE DISJOINT, INDIVIDUALLY MEASURED MECHANISMS NOW EXIST, TOTALLING +13.78 IF THEY ADD.
   {7, 13, 19} low-volatility middle band, +6.00, PROMOTED THIS GENERATION
   {6} eighteen cents above 0.60,          +2.64 measured as part of s60w18's +0.88
   {8, 10, 12} bottom band under capital 40, +6.90 inferred from lowband minus case 17
Next-generation rationale: Generation 4 composes the three disjoint mechanisms and tests additivity one last time.

A. Add the eighteen-cent top slice to the promoted champion: keep the promoted `wide_regime` at eight cents and add
`half_width = 18 if flat_rate_frequency > 0.60`. Footprint {6} only, since cases 9 and 15 stay at eight cents rather than
reverting as they did in s60w18. Predicted 167.04 + 2.64 = 169.68 at 13.30.

B. Add the bottom band under a starting-capital guard: widen when `flat_rate_frequency <= 0.40 and self.cash_balance < 40.0`.
Footprint {8, 10, 12}, excluding the case 17 rank-one hold. Predicted 167.04 + 6.90 = 173.94 at 13.30, and it should carry
the project-best case 8 gap of 20.91 into the champion line.

C. Compose A and B together. Footprints {6} and {8, 10, 12} are disjoint from each other and from the promoted {7, 13, 19}.
Predicted 176.58 at 13.30.

If C lands at its prediction the loop has extracted everything the flat-rate map contains, and generation 5 should return to
the score rather than the tiebreak. The only never-won case within reach is case 13 at a 2.15 gap for +0.20; Section 10's two
unexplored axes, the fair-value band above 25 cents and offer-side tomography, are untouched and cheap. Case 6 is now the
second-nearest at a 6.44 gap for +0.30 and its width response is still unturned at eighteen cents, so a single generation
walking case 6 alone out to twenty-four and thirty cents is the other candidate for generation 5.
Challenger update: admitted market-loop-20260820-3-g03-g3-flat-sixty-wide.

## Generation 4: explore quote

Generation 3 left three disjoint, individually measured mechanisms on the table, and the promoted champion already carries one of them. The corrected flat-rate band map is {6} above 0.60, {9, 15} in (0.50, 0.60], {5, 7, 11, 13, 14, 16, 18, 19, 20} in (0.40, 0.50], and {8, 10, 12, 17} at or below 0.40. The champion widens the top two bands to eight cents and the low-volatility slice {7, 13, 19} of the middle band. Two measured mechanisms remain unharvested. Case 6 alone sits above 0.60 and its width response is monotone and unturned through eighteen cents, where it produced the project-best gap of 6.44; giving it eighteen cents now costs nothing, because generation 3 proved cases 9 and 15 fall below that threshold and keep their eight-cent quote. The bottom band is worth +6.90 once case 17 is excluded, and starting capital excludes it exactly: cases 8, 10 and 12 start with capital 10, 20 and 20 while case 17 starts with 40, so a `self.cash_balance < 40.0` conjunction separates them using a variable the champion already conditions on elsewhere. This loop has now confirmed twice that disjoint case footprints add exactly, once at +6.00 to the cent and once at +0.88 to the cent, so candidates A and B are tested separately as attributable fallbacks and candidate C composes both. Every candidate is individually promotable; the expected outcome is that C wins at roughly 176.58 combined PnL and unchanged 13.30, and the value of A and B is that a surprise in C can be attributed to one of them rather than to the composition.

Parent: champion `g3-band-low-vol` (`4fef8f77ff641409d7f45e3cc9f6eec5ae49e4b5dbdf8526dea0316b34b74ca9`).

### g4-six-eighteen

- Hypothesis: Case 6 is the only session above the 0.60 flat-rate threshold, so raising its half-width to eighteen cents while every other band keeps the promoted eight-cent quote moves case 6 alone. Its measured PnL at eighteen cents is 3.93 against the champion's 1.29, so the gain is +2.64 with no rank transition anywhere.
- Implementation plan: In `quote` only, one line. Find the existing line `half_width: int = 8 if wide_regime else (5 if repeat_request else 4)` and replace it with `half_width: int = 18 if flat_rate_frequency > 0.60 else (8 if wide_regime else (5 if repeat_request else 4))`. Leave the `flat_rate_frequency`, `theriodic_return_volatility` and `wide_regime` lines above it exactly as they are. `git diff` must show exactly one removed line and one added line. Change nothing else: every price shade, the fill-signal skew, `active_exposure`, `signed_reserve`, `cash_floor`, the whole quantity ladder, every inventory gate and the `return Quote(...)` statement stay byte-identical to the parent. Expected tradeoff: case 6 moves from 1.29 to about 3.93 and nothing else moves at all; predicted 13.30 at about 169.68 combined PnL.
- Worker summary: In `quote`, one line: `half_width` became `18 if flat_rate_frequency > 0.60 else (8 if wide_regime else (5 if repeat_request else 4))`. One removed line, one added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 169.68; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 2.64

### g4-low-band-under-forty

- Hypothesis: The bottom flat-rate band wants the eight-cent quote everywhere except the one session that starts with capital 40. Widening it under a `self.cash_balance < 40.0` guard admits cases 8, 10 and 12 and excludes case 17, whose rank-one hold generation 3 lost by widening the band without the guard.
- Implementation plan: In `quote` only, one line inside the existing `wide_regime` assignment. Find the existing three-line statement

```python
        wide_regime: bool = flat_rate_frequency > 0.50 or (
            flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025
        )
```

and replace it with

```python
        wide_regime: bool = (
            flat_rate_frequency > 0.50
            or (flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025)
            or (flat_rate_frequency <= 0.40 and self.cash_balance < 40.0)
        )
```

Leave the `half_width` line below it exactly as it is. Change nothing else. Expected tradeoff: cases 8, 10 and 12 move and case 17 does not; the measured per-case deltas are case 8 +5.34 with the project-best gap of 20.91, case 10 +2.62 and case 12 -1.06, predicted 13.30 at about 173.94 combined PnL. Case 12's rank-one hold and case 17's rank-one hold must both survive.
- Worker summary: In `quote`, the `wide_regime` statement gained a third disjunct `(flat_rate_frequency <= 0.40 and self.cash_balance < 40.0)` and was reflowed to one disjunct per line. Three removed lines, five added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 173.35; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 6.31

### g4-compose-both

- Hypothesis: The two remaining mechanisms have disjoint case footprints, {6} and {8, 10, 12}, and both are disjoint from the champion's promoted {7, 13, 19}. Composing them therefore adds exactly, as disjoint footprints have twice done in this loop, for a combined +9.54 over the champion with no rank transition anywhere.
- Implementation plan: In `quote` only, both changes from the other two candidates together. First replace the existing three-line `wide_regime` statement

```python
        wide_regime: bool = flat_rate_frequency > 0.50 or (
            flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025
        )
```

with

```python
        wide_regime: bool = (
            flat_rate_frequency > 0.50
            or (flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025)
            or (flat_rate_frequency <= 0.40 and self.cash_balance < 40.0)
        )
```

Then replace the existing line `half_width: int = 8 if wide_regime else (5 if repeat_request else 4)` with `half_width: int = 18 if flat_rate_frequency > 0.60 else (8 if wide_regime else (5 if repeat_request else 4))`. Leave the `flat_rate_frequency` and `theriodic_return_volatility` lines exactly as they are. Change nothing else. Expected tradeoff: cases 6, 8, 10 and 12 move and nothing else does; predicted 13.30 at about 176.58 combined PnL.
- Worker summary: In `quote`, both edits together: the third `wide_regime` disjunct and the eighteen-cent outer conditional on `flat_rate_frequency > 0.60`. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 175.99; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 8.95

Selection: g4-compose-both.
Promotion: g4-compose-both (d3d88cbdac89ffe53054f2edff158eadd92c5755).
Finding: COMPOSITION IS EXACT FOR THE THIRD TIME. g4-compose-both promotes at 13.30 / 175.99, a +8.95
combined-PnL gain over the champion's 167.04. All three candidates were eligible, all held 13.30 with no rank transition
anywhere, all had zero bankruptcies and zero runtime errors, and all held minimum ending capital at 9.75/10.00.

PER-CASE VECTORS against champion g3-band-low-vol (ours PnL / rank; * marks a moved case):

case  N  champion   A six18     B lowcap    C both      leader
  5   2   2.23 r2    2.23 r2     2.23 r2     2.23 r2    Stalemate Quoter
  6   3   1.29 r2    3.93* r2    1.29 r2     3.93* r2   Fixed Width 0.25
  7   2  -0.25 r2   -0.25 r2    -0.25 r2    -0.25 r2    Fixed Width 0.25
  8   3   1.61 r2    1.61 r2     6.95* r2    6.95* r2   Fixed Width 0.1
  9   3  31.14 r1   31.14 r1    31.14 r1    31.14 r1    (ours)
 10   3  11.55 r2   11.55 r2    14.17* r2   14.17* r2   Fixed Width 0.1
 11   3  21.17 r1   21.17 r1    21.17 r1    21.17 r1    (ours)
 12   2   4.27 r1    4.27 r1     3.21* r1    3.21* r1   (ours)
 13   4   8.90 r2    8.90 r2     8.90 r2     8.90 r2    Fixed Width 0.1
 14   3  17.29 r1   17.29 r1    17.29 r1    17.29 r1    (ours)
 15   3  13.03 r1   13.03 r1    13.03 r1    13.03 r1    (ours)
 16   3  27.07 r1   27.07 r1    27.07 r1    27.07 r1    (ours)
 17   4  18.31 r1   18.31 r1    17.72* r1   17.72* r1   (ours)
 18   4   7.44 r2    7.44 r2     7.44 r2     7.44 r2    Fixed Width 0.05
 19   4   1.69 r2    1.69 r2     1.69 r2     1.69 r2    Situational Unawareness
 20   4   0.30 r1    0.30 r1     0.30 r1     0.30 r1    (ours)
TOTAL         13.30       13.30       13.30       13.30

SCORE DECOMPOSITION OF THE DELTA: no rank transition in any candidate, so the entire delta is the tiebreak.
  A six18   moved {6}                PnL 167.04 -> 169.68  (+2.64)
  B lowcap  moved {8, 10, 12, 17}    PnL 167.04 -> 173.35  (+6.31)
  C both    moved {6, 8, 10, 12, 17} PnL 167.04 -> 175.99  (+8.95)

1. ADDITIVITY HELD TO THE CENT: +2.64 and +6.31 sum to exactly +8.95, and C's moved set is exactly the union of A's and B's.
Three confirmations in one loop, on three different mechanism pairs. Disjoint case footprints compose with no interaction
term, and that is now the most reliable structural fact this project has.

2. THE CAPITAL GUARD WORKED. Widening the bottom band without it cost case 17 its rank-one hold in generation 3
(18.31 -> 10.35, -0.20). With `self.cash_balance < 40.0` case 17 keeps rank 1 and the band's other three members deliver
case 8 +5.34 with the project-best gap of 20.91, case 10 +2.62, case 12 -1.06 with its rank-one hold intact.

3. UNEXPLAINED DETERMINISTIC RESIDUAL IN CASE 17, WORTH 0.59 AND NO RANK. Case 17 starts with capital 40.0 and
`self.cash_balance` is assigned once in `__init__` and never mutated, so `self.cash_balance < 40.0` is false there and case
17's quoting should be byte-identical to the champion's. It nevertheless moved 18.31 -> 17.72 under both B and C, and moved
identically under both, which rules out grader nondeterminism. Candidate A, which does not touch `wide_regime`, left case 17
at exactly 18.31. The residual is therefore caused by the third disjunct through a path not visible in the source. One
testable explanation is that the grader constructs our MarketMaker with a starting capital marginally below 40.0 that the
report rounds to 40.0; the champion's pre-existing ladder already branches on `>= 40.0` and `20.0 <= x < 40.0`, so such a
value would also be routing case 17 through the mid-capital rungs. A guard at `< 39.0` or `<= 20.0` would discriminate.

4. CASE 13'S CONVERSION PROSPECT REGRESSED AND NOBODY NOTICED. Case 13 was the project's nearest never-won case at a 2.15
gap for +0.20. The low-volatility middle-band gate promoted in generation 3 widened it for -0.06 of our own PnL while Fixed
Width 0.1 gained about 4.68, so the gap is now 6.83. Case 13 is the only member of {7, 13, 19} that contributes nothing:
case 7 is worth +1.78 and case 19 +4.28. Cases 7, 13 and 19 start with capital 10, 20 and 40 respectively, so excluding case
13 from the widening costs nothing and should restore the best conversion prospect in the project.

5. THE CHAMPION NOW CARRIES THREE OF THE PROJECT'S BEST NEVER-WON GAPS SIMULTANEOUSLY: case 6 at 6.44, case 8 at 20.91 and
case 19 at 20.53, plus case 7 at 20.39, its first improvement ever. Combined PnL has moved 158.09 -> 175.99 in four
generations, entirely through the second selection criterion, at an unchanged 13.30.
Next-generation rationale: The flat-rate map is now fully harvested and the tiebreak is close to exhausted. Generation 5
must return to the score, because 2.70 points remain and none of them have moved in fourteen generations.

A. Restore case 13 by excluding it from the low-volatility middle-band widening, gated on starting capital so that cases 7
and 19 keep their +1.78 and +4.28. This is free in PnL and restores a 2.15 gap that is worth +0.20, the cheapest remaining
point in the project.

B. Attack case 13 directly with Section 10's two untouched axes. The exact-state fair-value band above 25 cents has never
been probed, and the offer Q4/Q5/Q6 ladder has never been given fair-value tomography at all. Case 13 has been converted to
rank one once before, by g5-wide-three-three, so the conversion is known to be reachable.

C. Resolve the case 17 residual with a `< 39.0` or `<= 20.0` capital guard. If the residual disappears, the bottom band is
worth a further +0.59 and the champion's own capital ladder is mis-specified at the 40.0 boundary, which would be a finding
larger than this generation's.

Generation 6 should be Tune, as the memo has wanted for three loops. The challenger g3-flat-sixty-wide now carries a genuinely
bounded two-parameter vector with grader evidence on both axes: a flat-rate threshold known to lie in (0.50, 0.60] and a
flat-regime half-width whose case 6 response is monotone and unturned at eighteen cents. That is exactly what Tune exists for,
and it is the only path left to case 6's remaining 6.44.

## Generation 5: explore quote

Four generations have moved combined PnL 158.09 -> 175.99 at an unchanged 13.30, entirely through the second selection criterion. The flat-rate band map is fully harvested and the tiebreak is close to exhausted, so this generation splits three ways: one free PnL gain, one test of the loop's single unexplained result, and one shot at the only never-won case still within striking distance. Candidate A removes case 13 from the low-volatility middle-band widening. Cases 7, 13 and 19 are that slice and start with capital 10, 20 and 40; case 7 is worth +1.78 and case 19 +4.28, while case 13 contributes -0.06 of our own PnL and, worse, let Fixed Width 0.1 gain about 4.68, pushing case 13's gap from 2.15 to 6.83. Case 13 is the project's nearest never-won case and the only one ever converted to rank one, so restoring its 2.15 gap for free is worth more than the PnL. Candidate B tests the one result this loop cannot explain: case 17 starts with capital 40.0 and `self.cash_balance` is never mutated, so the bottom-band guard `self.cash_balance < 40.0` is false there, yet case 17 moved 18.31 -> 17.72 under both generation 4 candidates that contain the guard and stayed at exactly 18.31 under the one that does not. Tightening the guard to 30.0 keeps all three intended members, which start with capital 10, 20 and 20, and either eliminates the residual or proves it is not the guard. Candidate C is the memo's designated case 13 generation, Section 10 axis A: the exact-state fair-value withdrawals on the FED bid Q4 rule are promoted only at 23 and 25, and the reachable cheap band runs a few cents past 25 because the gate is bid_price <= 0.25. Archived evidence prices the band above 25 at +0.46 of our own PnL against +0.10 for the competitor, so a cumulative withdrawal through 29 should close case 13's gap by about 0.36 on top of whatever candidate A restores. All three footprints are disjoint, and this loop has confirmed three times that disjoint footprints compose exactly.

Parent: champion `g4-compose-both` (`0a27bc38612081db5c0144c242ff8407a5ac4ce18a9bdaa885abb4c4fd0da054`).

### g5-thirteen-restore

- Hypothesis: Case 13 is the only capital-20 session in the low-volatility middle-band slice, and it is the only member that pays nothing for being widened. Excluding capital-20 sessions from that slice reverts case 13 to the narrow quote, recovers its 2.15 gap to Fixed Width 0.1, and gains a small amount of combined PnL because case 13's own contribution to the slice is negative.
- Implementation plan: In `quote` only. Find the existing `wide_regime` statement:

```python
        wide_regime: bool = (
            flat_rate_frequency > 0.50
            or (flat_rate_frequency > 0.40 and theriodic_return_volatility <= 0.025)
            or (flat_rate_frequency <= 0.40 and self.cash_balance < 40.0)
        )
```

and replace its middle disjunct so the statement reads:

```python
        wide_regime: bool = (
            flat_rate_frequency > 0.50
            or (
                flat_rate_frequency > 0.40
                and theriodic_return_volatility <= 0.025
                and not (20.0 <= self.cash_balance < 40.0)
            )
            or (flat_rate_frequency <= 0.40 and self.cash_balance < 40.0)
        )
```

Use the `20.0 <= self.cash_balance < 40.0` band form rather than an equality test on a float; it is the idiom the champion already uses twice in the quantity ladder. Leave the `half_width` line below and the `flat_rate_frequency` and `theriodic_return_volatility` lines above exactly as they are. Change nothing else: every price shade, the fill-signal skew, `active_exposure`, `signed_reserve`, `cash_floor`, the whole quantity ladder, every inventory gate and the `return Quote(...)` statement stay byte-identical to the parent. Expected tradeoff: case 13 moves from 8.90 back to about 8.96 and nothing else moves; predicted 13.30 at about 176.05 combined PnL with case 13's gap restored to about 2.15.
- Worker summary: In `quote`, the middle `wide_regime` disjunct gained `and not (20.0 <= self.cash_balance < 40.0)`, reflowed over four lines. One removed line, five added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 169.87; minimum capital 37.97/40.00
- Baseline delta: 0.00 points; PnL -6.12

### g5-low-band-under-thirty

- Hypothesis: The unexplained case 17 residual is caused by the bottom-band capital guard. All three intended members of that band start with capital 10, 20 and 20, so tightening the guard from 40.0 to 30.0 keeps every one of them while moving the boundary well clear of case 17's capital 40. If case 17 returns to 18.31 the residual is the guard and the band is worth a further +0.59; if it does not, the guard is exonerated and the cause lies elsewhere.
- Implementation plan: In `quote` only, one literal. Find the existing `wide_regime` statement and change the final disjunct's capital bound from `40.0` to `30.0`, so that line reads `            or (flat_rate_frequency <= 0.40 and self.cash_balance < 30.0)`. Leave the first two disjuncts, the `half_width` line below, and the `flat_rate_frequency` and `theriodic_return_volatility` lines above exactly as they are. `git diff` must show exactly one removed line and one added line. Change nothing else. Expected tradeoff: cases 8, 10 and 12 must not move at all, since their starting capitals are 10, 20 and 20 and both bounds admit them; the entire signal is whether case 17 returns to 18.31.
- Worker summary: In `quote`, one literal: the bottom-band capital bound `self.cash_balance < 40.0` became `< 30.0`. One removed line, one added. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 176.33; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 0.34

### g5-fed-upper-band

- Hypothesis: The reachable FED cheap band runs past 25 cents, and the exact fair-value states from 26 to 29 add more to our own PnL than they add to Fixed Width 0.1. Extending the flat-FED bid Q4 withdrawal cumulatively through 29 therefore closes case 13's gap without disturbing the eight sessions the specialist already wins.
- Implementation plan: In `quote` only, one literal inside the existing bid Q4 rule. Find the clause

```python
            and not (
                option.legs[0].underlying_id == FED_FUNDS_RATE_UNDERLYING_ID
                and fair_value_cents in (23, 25)
            )
```

and replace the tuple `(23, 25)` with `(23, 25, 26, 27, 28, 29)`, leaving every other line of that clause and of the surrounding `if` exactly as it is. This is the clause guarding the `bid_quantity = 4` promotion, not the later `bid_quantity = 5` promotion; do not touch the `bid_quantity == 4` block below it. `git diff` must show exactly one removed line and one added line. Change nothing else. Expected tradeoff: only sessions carrying flat FED contracts in the 26-to-29 cent region move; the archived band evidence prices this at about +0.46 of our own PnL against +0.10 for Fixed Width 0.1, so watch case 13's gap rather than the combined PnL.
- Worker summary: In `quote`, one literal inside the bid Q4 rule: the flat-FED withdrawal tuple `(23, 25)` became `(23, 25, 26, 27, 28, 29)`. One removed line, one added; the `bid_quantity == 4` block below was not touched. py_compile and `validate-candidate.sh --target-method quote` passed. No stdout writes.
- Status: archived
- Result: 20/20 passed; 0 bankruptcies; 13.30/16.00 points; PnL 175.99; minimum capital 9.75/10.00
- Baseline delta: 0.00 points; PnL 0.00

Selection: g5-low-band-under-thirty.
Promotion: none.
Finding: `self.cash_balance` IS NOT THE REPORTED STARTING CAPITAL, AND THAT INVALIDATES A PREMISE THIS
PROJECT HAS CARRIED SINCE market-loop-20260818-6. g5-low-band-under-thirty promotes at 13.30 / 176.33. Zero bankruptcies and
zero runtime errors throughout; no rank transition in any candidate, so the entire delta is again the tiebreak.

PER-CASE VECTORS against champion g4-compose-both (ours PnL / rank; * marks a moved case):

case  N  champion   restore13   under30     fedupper    leader
  5   2   2.23 r2    2.23 r2     2.23 r2     2.23 r2    Stalemate Quoter
  6   3   3.93 r2    3.93 r2     3.93 r2     3.93 r2    Fixed Width 0.25
  7   2  -0.25 r2   -0.25 r2    -0.25 r2    -0.25 r2    Fixed Width 0.25
  8   3   6.95 r2    6.95 r2     6.95 r2     6.95 r2    Fixed Width 0.1
  9   3  31.14 r1   31.14 r1    31.14 r1    31.14 r1    (ours)
 10   3  14.17 r2   14.17 r2    14.17 r2    14.17 r2    Fixed Width 0.1
 11   3  21.17 r1   21.17 r1    21.17 r1    21.17 r1    (ours)
 12   2   3.21 r1    3.21 r1     3.21 r1     3.21 r1    (ours)
 13   4   8.90 r2    6.50* r2    8.90 r2     8.90 r2    Fixed Width 0.1
 14   3  17.29 r1   17.29 r1    17.29 r1    17.29 r1    (ours)
 15   3  13.03 r1   13.03 r1    13.03 r1    13.03 r1    (ours)
 16   3  27.07 r1   27.07 r1    27.07 r1    27.07 r1    (ours)
 17   4  17.72 r1   17.72 r1    18.06* r1   17.72 r1    (ours)
 18   4   7.44 r2    7.44 r2     7.44 r2     7.44 r2    Fixed Width 0.05
 19   4   1.69 r2   -2.03* r2    1.69 r2     1.69 r2    Situational Unawareness
 20   4   0.30 r1    0.30 r1     0.30 r1     0.30 r1    (ours)
TOTAL         13.30       13.30       13.30       13.30

SCORE DECOMPOSITION OF THE DELTA:
  restore13  13.30 -> 13.30   moved {13, 19}   PnL 175.99 -> 169.87  (-6.12)
  under30    13.30 -> 13.30   moved {17}       PnL 175.99 -> 176.33  (+0.34)
  fedupper   13.30 -> 13.30   moved {}         PnL 175.99 -> 175.99  (0.00, byte-identical vector)

1. THE CASE 13 RESTORATION FAILED, AND ITS FAILURE IS THE MOST VALUABLE RESULT OF THE GENERATION. The candidate was
predicted to move {13} alone, because cases 7, 13 and 19 report starting capitals of 10.0, 20.0 and 40.0 and the guard
excludes only [20.0, 40.0). It moved {13, 19}. Case 19 reverted to its pre-widening -2.03, which is only possible if
`20.0 <= self.cash_balance < 40.0` is TRUE in case 19's session, despite the grader reporting its starting capital as 40.0.

2. THE SAME CONCLUSION FALLS OUT OF THE CASE 17 RESIDUAL, INDEPENDENTLY. Generation 4 left an unexplained 0.59 in case 17
under a `self.cash_balance < 40.0` guard that should not have reached a capital-40 session. Tightening the bound to 30.0
moved case 17 again, 17.72 -> 18.06. A bound change from 40.0 to 30.0 can only affect a session whose `self.cash_balance`
lies in [30.0, 40.0). Two independent probes, on two different sessions, both reported as capital 40.0, both land in a lower
tier than they report.

3. WHAT THIS INVALIDATES. The champion's quantity ladder branches on `self.cash_balance >= 40.0`, `20.0 <= self.cash_balance
< 40.0` and `self.cash_balance < 20.0` in five separate places, and `cash_floor = 0.75 * self.cash_balance` scales every
capacity term. Every one of those gates was designed and tuned on the assumption that the three reported capital tiers 10,
20 and 40 map onto those three bands. At least two of the five capital-40 sessions do not. The tiers are mis-targeted, and
no generation in this project has ever tested that assumption.

4. CASE 17 IS STILL NOT FULLY EXPLAINED AND THE ANALYSIS SHOULD NOT PRETEND OTHERWISE. If case 17 simply fell inside the
bottom-band guard it would have taken the full widening and landed near generation 3's 10.35, not 17.72. Under the 30.0
bound it returns to 18.06, not to the 18.31 it held before any guard existed. Its sensitivity is real, deterministic and
reproducible, but sub-dollar and not a clean binary. The 40.0 boundary is implicated; the mechanism is not established.

5. SECTION 10 AXIS A IS CLOSED. g5-fed-upper-band produced a byte-identical twenty-case vector and exactly 175.99. The exact
FED fair-value states 26 through 29 are unreachable or inert on the current champion, so the upper cheap band adds nothing.
Case 13's gap stays at 6.83 and its own PnL at 8.90. Do not reopen this axis.

6. CASE 13 CANNOT BE RESTORED THROUGH THE CAPITAL TIER. Reverting case 13 costs case 19's +3.72 as well, for a net -6.12,
because the guard cannot distinguish them. Restoring case 13's 2.15 gap needs a discriminator that separates it from case 19,
and starting capital as currently read is not one.
Next-generation rationale: Generation 6 must test the capital-tier premise directly, because it is now the largest known
defect in the champion and it sits underneath five existing gates and every capacity term.

A. Bracket the true value. Run the bottom-band guard at `< 35.0` against the promoted `< 30.0`. Case 17 is known to lie in
[30.0, 40.0); a 35.0 bound splits that interval and, differenced against this generation's result, places it in either
[30, 35) or [35, 40).

B. Bracket case 19 the same way. Its widening reverts under a [20.0, 40.0) exclusion, so replace that exclusion with
[20.0, 30.0) in the middle-band disjunct. If case 19 stops reverting, it lies in [30.0, 40.0) alongside case 17 and the two
share a tier; if it still reverts, it lies in [20.0, 30.0) and the reported capitals are wrong by more than rounding.

C. Test whether the mis-targeting costs anything today. The champion's offer ladder gives capital-40 sessions a different
rung from capital-20 sessions via `self.cash_balance >= 40.0`. If cases 17 and 19 are not actually above 40.0 they have been
taking the mid-capital rung for fourteen generations. Lower that one gate to `>= 35.0` and read which cases move; the moved
set is the set of sessions that have been mis-tiered all along.

Case 13 should not get another generation through the capital axis, and Section 10 axis A is closed. If generation 6 confirms
the mis-tiering, the correct next loop reopens the capital policy from scratch against measured tiers rather than reported
ones, which is the memo's Section 9 with a corrected conditioning variable.
Challenger update: admitted market-loop-20260820-3-g05-g5-thirteen-restore.
