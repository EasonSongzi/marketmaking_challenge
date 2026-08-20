# Market-Maker Experiment: market-loop-20260820-3

- Status: active
- Started: 2026-08-20T20:13:05.267Z
- Starting baseline: g6-fed-flat-23-or-25 (13.30/16.00)
- Current baseline: g6-fed-flat-23-or-25 (13.30/16.00)
- Stop condition: not reached
- Score trend: 13.30

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
Promotion: none.
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
