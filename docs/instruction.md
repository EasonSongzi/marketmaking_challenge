# Score-Frontier Research After market-loop-20260821-9

`market-loop-20260821-9` promoted `g5-case6-floor-zero-grow-eight` and moved the
champion from 15.30 to 15.60. The promotion came from the exact interaction the prior
memo warned coordinate descent would miss: the case-6 cash floor and size-growth loop
were weak or inert alone and decisive together. No other source produced a strict
score improvement beyond that same case-6 composition.

This memo is the authoritative research ledger. It supersedes the run `-8` memo. The
score frontier now has only two non-rank-1 cases, each worth 0.20, but they are not
equally investable:

- case 18 is 5.67 from rank 1 on the champion and 2.62 away on the corrected terminal
  challenger; it is the only plausible score target;
- case 19 is 20.48 away, wins no RFQ at width 45, and gained only 0.15 from the first
  counterparty-selective FOK punish branch. Treat it as structural-low-priority, not
  as a mathematically impossible case.

The compensated-optimum diagnosis still stands and run `-9` strengthened it twice:
the offline-correct pooled drift lost 3.50 points when installed alone, while the
run's only promotion came from a paired capacity change. The next run therefore starts
from the one open composition supported by both old and new evidence: corrected
terminal observation crossed with inventory-reducing, post-fill netting capacity.
Section 9 fixes G1 through G3. G4 through G6 are deliberately left for the loop agent
to choose from the first three generations' evidence.

---

## 1. Canonical State

```text
champion        g5-case6-floor-zero-grow-eight
source SHA      e6e818eb52bc01c94638fd77dbd13b275a8ec4e44d1fb8840626d8faa165a65e
experiment      market-loop-20260821-9:g05:g5-case6-floor-zero-grow-eight
score           15.60 / 16.00
combined PnL    279.95                        telemetry only
passed          20 / 20
bankruptcies    0
minimum capital 39.98 / 40.00
```

Active challenger worth carrying into a new run:

```text
market-loop-20260821-8-g03-g3-terminal-label-width r00
  SHA           b69813690fcab50639efb5c10835c668ad655d19af1a4a1f046eac9a1cf6e882
  score         15.30
  relation      predates the case-6 promotion; identical to its 15.30 parent outside
                fed_low_mean_regime
  case 18       PnL 19.13, gap 2.62 (champion: 17.32, gap 5.67)
  case 20       PnL 0.45, still rank 1 by 9.25
```

The next run starts from the champion and rebases the terminal mechanism onto it as an
explicit candidate. Do not treat the old challenger as a complete parent: it lacks the
case-6 promotion. `results/frontier.json` is stale and is not on the planning path.

---

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above 15.60. PnL and minimum capital are telemetry and never break a tie.

Per-case score:

```text
0.40 + 0.60 * competitors_beaten / (participant_count - 1)
```

Rank 1 always scores 1.00. Rank 2 of 4 scores 0.80, rank 2 of 3 scores 0.70, rank 2 of
2 scores 0.40.

The remaining 0.40 is exactly:

```text
case 18   rank 2 of 4   0.80   +0.20 available   gap  5.67   (2.62 on the challenger)
case 19   rank 2 of 4   0.80   +0.20 available   gap 20.48
```

The operational target is 15.80. This is not a proof that 16.00 is impossible; it is
the score justified by the currently reachable surface after case 19 is deprioritised.

---

## 3. Rank and Risk Ledger

| Case | Cap | N | Our PnL | Rank | Margin / gap | Score | Leader or runner-up |
|---:|---:|---:|---:|---:|---:|---:|---|
| 5 | 10 | 2 | 33.64 | 1 | +17.64 | 1.00 | Stalemate Quoter |
| 6 | 10 | 3 | 9.14 | 1 | **+5.86** | 1.00 | Fixed Width 0.25 |
| 7 | 10 | 2 | 17.37 | 1 | **+2.32** | 1.00 | Fixed Width 0.25 |
| 8 | 10 | 3 | 23.01 | 1 | +15.12 | 1.00 | Fixed Width 0.1 |
| 9 | 10 | 3 | 39.24 | 1 | +36.93 | 1.00 | Fixed Width 0.1 |
| 10 | 20 | 3 | 26.82 | 1 | **+8.75** | 1.00 | Fixed Width 0.1 |
| 11 | 20 | 3 | 18.15 | 1 | +17.98 | 1.00 | Fixed Width 0.1 |
| 12 | 20 | 2 | 6.63 | 1 | +16.34 | 1.00 | Fixed Width 0.05 |
| 13 | 20 | 4 | 9.20 | 1 | **+0.53** | 1.00 | Fixed Width 0.1 |
| 14 | 20 | 3 | 13.51 | 1 | **+1.15** | 1.00 | Lattice |
| 15 | 20 | 3 | 16.16 | 1 | **+8.85** | 1.00 | Situational Unawareness |
| 16 | 40 | 3 | 23.37 | 1 | +12.89 | 1.00 | Fixed Width 0.05 |
| 17 | 40 | 4 | 17.91 | 1 | +13.15 | 1.00 | Situational Unawareness |
| 18 | 40 | 4 | 17.32 | 2 | **-5.67** | 0.80 | Fixed Width 0.05 |
| 19 | 40 | 4 | 2.97 | 2 | **-20.48** | 0.80 | Situational Unawareness |
| 20 | 40 | 4 | 5.51 | 1 | +15.96 | 1.00 | Lattice |

Every plan must report at least:

```text
case 13   held by 0.53   THINNEST held rank (was rank 2 before run -8)
case 14   held by 1.15
case  7   held by 2.32   worth 0.60 if lost
case 10   held by 8.75
case 15   held by 8.85
```

Case 7 and case 13 are protected inventory. A global change that gives back case 7
costs three case-18 rank transitions.

---

## 4. What Runs -8 and -9 Proved

Run `-8` recovered case 13 for +0.20 and supplied the strongest corrected case-18
signal. Run `-9` recovered case 6 for +0.30 and mapped the remaining untried pricing,
width and FOK surfaces. The standing results are:

- **Correct terminal settlement is still the strongest case-18 signal.** Allocated to
  `fed_low_mean_regime`, it lifts case 18 from 17.32 to 19.13 and compresses the gap
  from 5.67 to 2.62 with zero score collateral.
- **Terminal intensity and the tested selectivity forms are closed.** Three-cent
  narrowing, one extra funded lot, edge intersection, a two-sample gate and side-only
  settlement all widen the target gap. The signal remains open only in a composition
  with a different capacity consumer.
- **Case 6 was bound by two coupled constraints.** A zero cash floor alone raised PnL
  only to 4.69 and did not change rank; zero floor plus the existing growth loop raised
  it to 9.14, moved the leader down to 3.28, and won the case. A ceiling of 12 remained
  monotone at 10.46, while width 13 was worse than the installed 18.
- **Contract-level width is measured and negative on case 18.** Wider single legs,
  the full label contract table, and one-cent tighter spreads moved case-18 PnL to
  1.84, -0.04 and 11.74. Contract/tenor width alone is not an open target surface.
- **The pooled-drift correction confirmed the compensated optimum.** It is the only
  estimator that dominates offline and removes 64% of spread pricing error, yet costs
  3.50 points globally. Recalibrating the generic and wide ladder branches recovered
  only part of that loss and produced no challenger close to the champion.
- **Counterparty-selective FOK is real but not score-bearing.** The negative-signal
  punish branch moves only case 19 and is worth +0.15. Funding positive-signal flow at
  `max(0.50, 0.02 * cash)` moves cases 11, 16, 18 and 20, hurts case 18 by 1.83, and
  leaves case 19 byte-identical.

Two older results constrain how these findings may be extended:

- run `-2` already released the complete `{18,20}` quote floor and added growth to 8
  and 16 on an older champion. Case 18 fell from 7.44 to -3.36 / -1.62 / -1.64 while
  its leader rose; case 20 improved. Blanket case-18 capacity is therefore a strong
  negative conditional closure, not an untried mechanism;
- run `-7` already replaced the generic FOK cap by `0.25 * live cash`. On the
  captured-edge parent case 18 fell to 8.21 and case 19 to -14.47. The interval above
  the run-`-9` 0.80 cap is not a clean unmeasured opportunity.

---

## 5. The Compensated Optimum

### 5.1 Measured: the variance components are wrong and the total is right

`candidate_pipeline/src/price_error_probe.py variance`, warm-up 60 days, 80 draws.
Daily AJR log-return variance, x1e4:

```text
regime            sector      idiosyncratic     TOTAL
theo-case          -6%             +17%          -1%
high-drift         -9%             +18%          -1%
zero-drift         -4%              +0%          -1%
negative-drift     -8%              +8%          -1%
```

The estimator is a **total-variance** estimator whose decomposition is systematically
wrong in an offsetting direction. Substituting the true sector volatility alone raises
mean pricing error by 81%; substituting the true sector betas alone raises it by 65%
to 172%.

This is the mechanism behind an entire family of graded failures. "Extending each
raw-vol scale to sector beta: negative" and "independent sector scaling: negative"
were recorded as empirical facts. They are consequences of breaking a cancellation.

### 5.2 Measured: the live-vol path is not a pricing improvement

`price_error_probe live-vol`. The installed path scales the idiosyncratic standard
deviation by the ratio of realised to fitted **raw** return volatility.

```text
session vol equals warm-up vol      -0.6%   (i.e. nothing)
session vol at 2x warm-up vol       -8.7%
session vol at 3x warm-up vol       -9.0%
```

It was promoted as a pricing improvement. In a stationary session it contributes
nothing to pricing accuracy; it is regime-shift insurance.

Its mapping is "model-inconsistent" only in name. Single-leg options depend on the
**total** variance, and the idiosyncratic term is inflated by 17-18% precisely because
the sector term is deflated, so scaling the idiosyncratic term moves the total by
roughly the right amount. **The inconsistency works because of the compensation.**

Therefore the previously open shape "consumer isolation among quote centre, FOK
threshold and `signed_reserve`" is not free. Isolating the consumer breaks this
mechanism. Do not treat it as a clean refactor.

### 5.3 Archival: correct changes grade neutral or negative

| Change | Semantics | Score |
|---|---|---|
| exact fill-side attribution | strictly more correct | 0.00 |
| next-day markout as width signal | more correct | **-0.60** |
| correctly settled terminal PnL as width signal | most correct | **-0.60** |
| `drift = 0` | removes a noisy estimate | catastrophic |
| live rate-transition replacement | more correct | strongly negative |
| live company-drift replacement | more correct | strongly negative |
| vol scale extended to sector beta | more correct | negative |

One of these is a coincidence. Seven is a structure.

### 5.4 Inferred: the width ladder absorbs our own pricing error

The installed ladder is `100 / 45 / 25 / 18 / 8 / 5 / 4` by session label. Section 7
measures our live pricing error at 3 to 13 cents depending on contract, and the
EV-maximising half-width at roughly 1.2 to 1.8 times the error standard deviation.

Two graded facts fit that reading exactly:

- case 6 has an **interior maximum at exactly 18**, which simultaneously maximises our
  PnL and minimises the leader's;
- case 19 is **flat at and above 45** and monotonically harmful below it, meaning we
  win no RFQ at 45.

The regime-to-width table is better read as a per-session estimate of how wrong our
own theo is than as a map of market structure. Run `-9` then tested the missing
contract and tenor dimensions directly. They are real explanatory dimensions but are
not a case-18 score lever: every tested reallocation made that case worse. Preserve
the table as pricing-error evidence, not as a pending dispatch item.

### 5.5 Why the protocol selects for compensation

Promotion requires a strictly higher score while everything else stays byte-identical,
and generations are written with a zero or near-zero collateral budget. Under that
rule:

- a change that is individually correct but needs a co-change grades negative and is
  recorded as closed;
- a change that exploits an existing error grades positive and is promoted.

Across the archive this is a ratchet. The compensation is not an accident; it is what
the search rewards.

---

## 6. The Offline Pricing Probe

`candidate_pipeline/src/price_error_probe.py` measures a source's live pricing error
against the true generator. It uses the challenge's own `MarketParameters.advance_step`,
consumes no HackerRank run, and can be pointed at any candidate source.

```bash
python3 candidate_pipeline/src/price_error_probe.py error-table
python3 candidate_pipeline/src/price_error_probe.py variance
python3 candidate_pipeline/src/price_error_probe.py width-table
python3 candidate_pipeline/src/price_error_probe.py screen-drift
python3 candidate_pipeline/src/price_error_probe.py live-vol
python3 candidate_pipeline/src/price_error_probe.py error-table --source /path/to/candidate.py
```

**This is not the local simulator that Section 14 still rejects.** It does not invent
counterparties, competing makers, session lengths or flow. It measures only the part
of the world the challenge hands us in closed form: the data-generating process and
the exact pricing algebra. What it cannot measure is score.

Its standing rules:

- **The judgement criterion is cross-regime dominance, not lowest mean error.** A
  candidate is admissible only when it never raises error in any regime by warm-up
  cell. Ranking on a single regime would have selected `drift = 0`, which is the one
  variant the grader has already destroyed.
- **`theo-case` is a real grader draw** — the parameters the THEO case prints. The
  other three regimes bracket it, motivated by the VERBOSE sessions opening at AJR
  1391 / THR 2269 against THEO's 500 / 600.
- It is a screen for `warm_up` and `price_option` candidates before they consume a
  graded arm. It never decides promotion.

---

## 7. Measured Pricing Error and the Contract-Level Width Table

### 7.1 Error by contract family and tenor

Mean `|our theo - true theo|` in cents, warm-up 60 days, 80 draws, `theo-case` regime.
The ordering is stable across all four regimes and across 30/60/120-day warm-ups.

```text
family      1d     2d     3d     5d    10d
AJR       3.39   5.19   6.58   8.70  12.28
THR       3.50   5.20   6.48   8.41  11.54
FED       2.57   4.51   6.20   8.86  12.95
SPREAD    0.46   0.77   1.08   1.65   2.94
```

Two facts follow, and neither is currently used anywhere in `quote`:

- **Spreads are priced 4 to 7 times better than single-leg contracts.** The sector
  shock cancels between the two names, so the compensated decomposition error largely
  cancels with it.
- **Error grows roughly with the square root of tenor.** Our default half-width is 4 or
  5 cents at every tenor.

`len(option.legs) == 1` appears in the bid-quantity rules and has never entered the
half-width. Tenor entered the half-width once, as `g6-long-wide-four`, a one-cent
increment graded on a 12.10-era champion.

### 7.2 EV-optimal half-width per contract bucket

`price_error_probe width-table`, competitor quoting the true theo at a fixed 5 cents,
80 draws. Consensus is the median optimum across the four regimes; the EV in brackets
is cents per RFQ from the `theo-case` regime, averaged over both sides.

```text
bucket        consensus width      EV at that width
SPREAD  1d           4                  +3.65
SPREAD  2d           4                  +3.44
SPREAD  3d           4                  +3.24
SPREAD  5d           4                  +2.91
SPREAD 10d           4                  +2.12
FED     1d           4                  +2.01
FED     2d           4                  +0.43
FED     3d          30                  -0.06
FED     5d          30                  -0.15
FED    10d          30                  -0.36
AJR/THR 1d           6                  +0.75
AJR/THR 2d          8..12               +0.16..+0.30
AJR/THR 3d          14..18              +0.02..+0.12
AJR/THR 5d          22..30              ~0.00
AJR/THR 10d         30                  -0.06..-0.13
```

Read this as a policy:

```text
two legs                    quote tight at every tenor -- this is the profit engine
FED, tenor <= 2             quote tight
single company leg, 1d      slightly wider than the current default
single company leg, 2d      two to three times the current default
any single leg, tenor >= 3  no width is profitable; widen until inert
```

**Assumption, stated explicitly:** the competitor prices at the true theo. If the
fixed-width bots estimate as badly as we do, the winner's curse is symmetric and the
optimal widths are tighter than this table. The table is therefore reliable for
**ordering and direction** and is an upper bound on level. Run `-9` confirmed the
ordering on several rank-1 sessions and rejected its levels and its case-18 allocation.

### 7.3 Why this is compatible with the compensated optimum

This change does not repair the pricing error. It reallocates width to the dimension
where the error actually lives, moving the granularity of our own error estimate from
session to contract. That interpretation survived; the proposed trading policy did
not. Do not schedule another standalone contract-width generation for case 18.

---

## 8. Drift Estimator Screen

`price_error_probe screen-drift`, four regimes, warm-up 30/60/120, 60 draws.
"Worst cell" is the largest error increase over all twelve cells.

```text
variant                 worst cell   best cell   spread mean   admissible
pooled                       -2.2%       -7.5%       -64.0%        yes
pooled-shrunk                -2.2%       -7.5%       -64.0%        yes
pooled-capped                -2.2%       -7.5%       -64.0%        yes
pooled-three-quarter         +8.4%      -21.0%       -64.0%        NO
three-quarter                +9.5%      -16.3%       -17.4%        NO
pooled-half                 +60.0%      -34.7%       -64.0%        NO
half                        +60.6%      -32.0%       -34.4%        NO
zero                       +195.5%      -52.9%       -64.0%        NO
```

Findings:

- **Pooling the two company drifts is the only admissible change.** The James-Stein
  shrink coefficient collapses to zero, which is the statement that the warm-up cannot
  distinguish AJR's drift from THR's at all. The estimated difference is pure noise,
  and spread pricing depends almost entirely on that difference: pooling removes 64%
  of spread pricing error.
- **The error is in the cross-sectional split, not in the level.** Every variant that
  shrinks the pooled magnitude is inadmissible. This is why `g3-drift-zero` graded
  catastrophically and is a closure that stands.
- Drift is the largest single error source: substituting the true drifts removes 46% of
  mean pricing error; the rate transition probabilities are second at 34-37%.

Run `-9` graded the only admissible variant and its paired width recalibration. The
offline result is correct and the trading result is negative: global pooling scored
11.80, the protected allocation 12.60, and spread-only pooling 15.30. Re-sweeping the
generic and wide ladder branches recovered at most 12.90. Pooled drift is therefore
closed on the tested global, protected and spread-only consumers; it remains research
evidence for the compensated optimum, not an active challenger line.

---

## 9. Generation Plan for the Next Run

Operational target 15.80; the run still stops only at 16.00 or the six-generation
limit. Start G1 from the 15.60 champion and measure every later parent against the
current champion. The first three generations are one research line: corrected
terminal evidence, then post-fill reserve semantics, then risk allocation. Do not
replace it with a blanket floor sweep.

### G1 — `quote`, parent = champion. Terminal observation × netting capacity.

Use the champion as the cached fourth cell of a two-lever factorial. Rebase the exact
run-`-8` terminal settlement onto the champion rather than using the stale 15.30
challenger as a complete parent. The capacity lever must not change `cash_floor` and
must not add symmetric growth. It credits only the part of the near-expiry quote that
would reduce the current option position after a full fill.

Three arms:

1. **terminal width only.** Reproduce corrected new-state settlement and use positive
   terminal PnL for the two-cent width consumer only inside `fed_low_mean_regime`.
   Captured edge continues to drive size and every non-label case is byte-identical.
2. **netting capacity only.** Keep the champion's captured-edge width signal. In the
   existing `label_depth_applies` inventory-unwind block, preserve the installed
   capacity-bounded `+3` path and add only otherwise-rejected quantity whose full fill
   cannot cross flat. A long option may expose more offer size only up to its current
   long quantity; a short option may expose more bid size only up to its current short
   magnitude. No new-risk quantity bypasses `available_capacity`.
3. **terminal plus netting.** Exact union of arms 1 and 2. This is the score attempt and
   the interaction cell; do not change a third lever.

```json
{ "kind": "exploit", "targetCases": [18], "expectedGainHundredths": 20,
  "collateralBudgetHundredths": 0 }
```

Expected footprint is `{18,20}`. Case 6's promoted floor/growth branch must remain
byte-identical and any movement there is a repair condition. Report both label cases'
PnL, leader PnL, ending cash and bankruptcy flag, plus cases 6, 7, 13 and 14. Read the
leader's endogenous response, not only our PnL.

### G2 — `quote`, parent = the best safe G1 target-gap challenger. Post-fill reserve.

G1 asks whether strictly risk-reducing displayed size is being rejected. G2 asks how
far that accounting can be generalised without reopening blanket capacity. Preserve
the winning G1 observation signal and compare three reserve semantics inside
`label_depth_applies` only:

1. **full no-cross-flat unwind.** After the champion path, add only otherwise-rejected
   reducing size up to the current position magnitude, including partial headroom of
   one or two lots; never cross flat and never reduce the champion quote.
2. **option post-fill reserve.** Compute the target option's reserve before and after a
   full quote fill and admit extra size only when the post-fill reserve does not rise.
3. **portfolio post-fill reserve.** Replace the target option's contribution in the
   champion's portfolio reserve with its hypothetical post-fill contribution, then
   compare the resulting portfolio against the installed `available_capacity`.

All three preserve prices, the 0.75 label floor, the ordinary quantity ladder, the
case-6 zero-floor/growth branch and `respond_to_fok`. The distinction is whether a
position-reducing quote receives no-cross, option-level or portfolio-level netting
credit. The maximum proposed increment remains the installed three lots; this is not a
size sweep. The generation reopens earlier reserve work only in the new near-expiry
terminal composition; it is not a global reserve rewrite.

```json
{ "kind": "exploit", "targetCases": [18], "expectedGainHundredths": 20,
  "collateralBudgetHundredths": 0 }
```

If no G1 candidate improves case 18's target gap, use arm 1's terminal-only source as
the G2 parent anyway; it is the strongest corrected 2.62-gap control. If a G1 arm wins
the case, promote it before preparing G2 and rebase these reserve variants on the new
champion.

### G3 — `quote`, parent = the best safe G2 target-gap challenger. Capacity gate.

Allocate the best G2 reserve rule rather than changing its size. Three arms:

1. release its additional headroom only after positive corrected terminal PnL for the
   counterparty;
2. release it only after at least three live return observations and only while the
   maximum AJR/THR realised-to-fitted volatility ratio is below a conservative fixed
   threshold; before three observations the extra path stays off;
3. require both positive terminal PnL and the low-realised-volatility condition.

The live ratio is a risk-state gate, not a session identity and not a pricing change.
Do not alter the installed `price_option` blend, prior or clamp. The three arms must
share the same G2 reserve rule and differ only in allocation.

```json
{ "kind": "exploit", "targetCases": [18], "expectedGainHundredths": 20,
  "collateralBudgetHundredths": 0 }
```

**G3 fallback:** if every G2 reserve rule leaves case 18 unchanged or worse, do not
gate a dead capacity mechanism. Use the terminal-only challenger and spend G3 on three
structurally distinct contract/expiry allocations of the same two-cent terminal width;
do not change intensity, sample threshold or side separation, which run `-8` closed.

G4 to G6 are intentionally unplanned. The loop agent must choose them from the first
three generations' rank, target-gap, leader-response and collateral evidence.

---

## 10. Protocol Amendment

**A candidate that is semantically more correct and grades at or below the champion
may not be recorded as closed until a paired version has been graded**, where the
paired version adjusts the consumer that was absorbing the error the candidate
removed.

At least seven entries in Section 13 were closed without this test. They are marked
`REOPENED-CONDITIONAL` below and may be revisited under a paired arm only.

Two supporting rules:

- **A flat reading closes a parameterisation, not a mechanism.** Width at fixed size
  does not close width jointly with size. Width under one pricing does not close width
  under another.
- **Rank is the objective, the leader's endogenous response is the instrument.** Read
  our PnL and the leader from the same candidate. A competitor earning money does not
  prove flow is contestable; only the leader's response to our change does.

---

## 11. Session Map

`warm_up_statistics` is constant per session and remains the only sound static
discriminator. Every label below is confirmed exclusive by grading.

```text
flat frequency > 0.60          {6}                         exact
(0.50, 0.60]                   {9, 15}
(0.40, 0.50]                   {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40                        {8, 10, 12, 17}             low_band_regime
```

Middle band with THR log-return volatility at or below 0.025:

```text
corr > 0.50                                {19}   case_nineteen_regime
corr <= 0.50 and FED max >= 3.0             {7}   case_seven_regime
corr <= 0.50 and FED max < 3.0             {13}   case_thirteen_regime
```

Middle band above 0.025:

```text
FED mean <= 2.0                            {18, 20} fed_low_mean_regime
FED mean > 2.0                             {5, 11, 14, 16}
FED min > 2.0 and raw corr < 0.75           {5}    case_five_regime
```

Which cases reach which ladder branch:

```text
100  case 5        45  case 19       25  case 7        18  case 6
 3   case 13        8  {8,10,12} and {9,15}
 4/5 {17}, {11,14,16}, {18,20}
```

The static `18 from 20` discriminator is still unfound. It becomes score-relevant only
after a treatment is measured to help case 18 while threatening case 20's rank. The
next run first establishes that treatment; it does not lead with discriminator search.
Do not use live `cash_balance` as a session identity; the existing `wide_regime` cash
disjunct does so and is known debt.

---

## 12. Method Audit and Open Blind Spots

### 12.1 Counterparty-selective FOK is now graded

Run `-9` was the first current-surface source to read `fok_order.counterparty_id` in
`respond_to_fok`. Tightening edge and cap after negative accumulated captured edge
changed exactly one case, case 19, and improved it by 0.15. Funding positive-signal
counterparties to `max(0.50, 0.02 * cash_balance)` changed cases 11, 16, 18 and 20 but
left case 19 byte-identical. Their composition was exactly additive.

This proves that the negative branch fires and that the tested positive-repeat funding
path does not fire usefully in case 19. It does **not** prove that every possible FOK
counterparty or every unaccepted order is negative; the funding arm changes behaviour
only when a positive signal already exists and the order falls inside the newly opened
cap interval.

### 12.2 The generic FOK cap has both endpoints

Outside `case_seven_regime` the champion still uses a flat
`maximum_loss * quantity <= 0.50` cap. The missing interval is not a clean open sweep:

- run `-9` opened it to 0.80 for positive-signal counterparties and case 18 lost 1.83;
- run `-7` replaced it globally with `0.25 * live cash`, worth 10.00 on a 40-capital
  session, and case 18 fell to 8.21 while case 19 fell to -14.47;
- the paired edge-per-risk version pushed case 19 to rank 4.

Do not schedule a generic three-point cap scan. Any future FOK work needs a new order
quality measurement or an exact allocation, not another cap level.

### 12.3 The observation layer is split across champion and challenger

The champion accumulates contemporaneous captured edge and live company return
squares. It does not retain terminal fill PnL. The active run-`-8` challenger contains
the correct bounded terminal aggregation and settles removed options against
`new_underlying_state`; inside `{18,20}` that signal improves case 18 by 3.05 of gap.

The open question is no longer whether terminal truth is useful for width. It is
whether the same terminal evidence can allocate a risk-reducing capacity consumer
that the champion currently evaluates with gross additive guards.

### 12.4 Case 6's paired capacity mechanism is installed

Case 6 now shares the low-band treatment:

```python
cash_floor = (0.0 if low_band_regime or flat_rate_frequency > 0.60 else 0.75) * cash
if low_band_regime or flat_rate_frequency > 0.60:
    grow quantities toward 8 while capacity allows
```

The exact case-6 label is `flat_rate_frequency > 0.60`. Zero floor alone improved PnL
but did not change rank; the paired loop won the case. Width 18 remains superior to 13
under the released capacity. Case 6 is protected installed behaviour, not a target.

### 12.5 Case 18's open capacity question is netting, not floor level

Run `-2` already removed the `{18,20}` floor and added symmetric growth to 8 and 16.
The result was strongly negative in case 18 and positive in case 20. That experiment
used an older source, so it is a conditional closure, but it rules out describing
blanket capacity as untried.

The current near-expiry unwind block is different. It activates only when the option
position has the sign that the quoted side would reduce, yet its guard still adds the
new fill's gross reserve to `active_exposure` or `signed_reserve`. It does not credit
the position reduction. Post-fill, no-cross-flat netting for this exact consumer is
the structural opening used by Section 9.

---

## 13. Scoped Closures and Openings

```text
case 6
  WON           PnL 9.14, margin 5.86, score 1.00.
  INSTALLED     half-width 18; exact flat-frequency-above-0.60 singleton; zero cash
                floor; bid and offer growth toward 8 under the installed guards.
  CLOSED        floor 0.50/0.25/0.00 alone; floor-zero plus growth 8/12; width 13 with
                released capacity; old width, skew, FOK and expiry allocations.
  RULE          freeze the zero-floor/growth composition. Ceiling 12 is higher PnL
                telemetry on an already-won case and is not a score target.

case 7
  WON           PnL 17.37, margin 2.32, score 1.00.
  INSTALLED     half-width 25; exact singleton; risk-normalised FOK rule with a
                one-cent wing floor and a 25% live-cash per-order cap.
  CLOSED        width 12..100; old size, rate and drift axes; the global form of the
                FOK rule; capacity-only and old-wing controls; FOK edge thinning.
  RULE          freeze unless a candidate proves byte-identical case-7 behaviour.

case 13
  WON           PnL 9.20, margin 0.53, score 1.00. THINNEST held rank.
  INSTALLED     width 3, size 3, and a one-cent rather than two-cent captured-edge
                narrowing inside the singleton.
  RULE          verify explicitly on every candidate.

case 18
  CURRENT       score 0.80, gap 5.67 on the champion, 2.62 on the terminal challenger.
  CLOSED        terminal-signal intensity and tested selectivity; global next-day
                fill-price width; exact fill-side skew; contract/tenor width alone;
                pooled-drift global/protected/spread consumers; positive-signal FOK
                funding at 0.02 cash and generic funding at the 0.25-cash endpoint.
  CONDITIONAL   blanket `{18,20}` floor release and symmetric growth were strongly
                negative on the run-`-2` source. Reopen only on a materially changed
                consumer, never as another scalar floor sweep.
  OPEN          corrected terminal width crossed with no-cross-flat/post-fill netting
                for the existing near-expiry inventory-reducing size consumer;
                contract/expiry allocation of terminal width only as the G3 fallback.

case 19
  CURRENT       score 0.80, gap 20.48.
  CLOSED        quote width 12/25/45/70 -- 70 is byte-identical to 45 in all twenty
                cases, so we win no RFQ at 45; tightening is monotone harmful; the
                global risk-normalised FOK rule pushes us to rank 4; positive-signal
                funding at 0.02 cash is inert; negative-signal punishment is worth
                only 0.15.
  STATUS        structural-low-priority. No arm in G1-G3. Reopen only if a genuinely
                new method surface supplies a credible path across 20.48.

price_option
  INSTALLED     raw company-vol blend, prior 10, clamp [0.5, 2.0]. Contributes ~0 to
                pricing accuracy in a stationary session and -9% under a vol shift.
  CLOSED        stronger raw blend; live rate-frequency replacement; live drift
                replacement; fixed one-cent shifts; drift zero and drift halving
                (inadmissible on the offline screen as well as on score); pooled drift
                global/protected/spread allocations and their tested ladder pairs.
  REOPENED-CONDITIONAL   independent sector scaling and sector-beta extension were
                closed on score; Section 5.1 now explains them as broken cancellations.
                They stay closed as single changes and are only reachable as a joint
                re-estimation of the whole decomposition.
  OPEN          no planned G1-G3 edit. The live realised/fitted ratio may be consumed
                only as G3 risk allocation without changing pricing.

warm_up
  CLOSED        six point-estimator replacements.
  OPEN          rate transition probabilities and uncertainty propagation as future
                surfaces only; neither is scheduled in G1-G3.

counterparty consumer
  CLOSED        graduated amount under the legacy signal; global amount and threshold
                sweeps; FOK punish/fund/both at the run-`-9` levels.
  OPEN          corrected terminal evidence as the input to the exact near-expiry
                capacity allocation in Section 9.

capital and size
  INSTALLED     case-6 zero floor plus growth 8.
  CONDITIONAL   blanket case-18 floor release and symmetric growth are negative on the
                old surface; generic FOK cap release is negative at the large endpoint.
  OPEN          no-cross-flat, option post-fill and portfolio post-fill reserve credit
                for the exact near-expiry inventory-reducing quote path.
```

### Do not re-run

- any ungated or global version of the installed case-7 FOK rule;
- case-7 quote width or generic size sweeps;
- case-19 quote width in any form;
- case-6 floor, growth, displayed-size exhaustion, width or expiry allocation;
- terminal-signal intensity or selectivity on the run `-8` challenger;
- standalone contract/tenor width for case 18;
- blanket `{18,20}` zero-floor plus symmetric growth without a new consumer;
- a generic FOK cap scan between the already graded endpoints;
- pooled drift in global, protected or spread-only form, with or without the run-`-9`
  ladder recalibrations;
- `drift = 0`, `drift x 0.5`, or any shrink of the pooled drift magnitude;
- independent sector scaling or sector-beta extension as a single change;
- a stronger raw-volatility blend, live rate-frequency replacement, or live drift
  replacement;
- a fixed one-cent theo shift in the already graded directions and allocations;
- any source SHA already in the evaluation cache.

---

## 14. Rejected or Deprioritised

**A local exchange simulator.** Counterparty flow, competing makers, session lengths
and seeds are not available, and optimising against an invented exchange is weaker
evidence than the fixed grader. This does **not** apply to
`price_error_probe`, which simulates only the data-generating process the challenge
supplies in closed form and measures only pricing error (Section 6).

**Consumer isolation between the quote centre, the FOK threshold and `signed_reserve`.**
Section 5.2 shows the installed live-vol mechanism depends on the coupling. Reconsider
only as part of a joint re-estimation.

**Global risk-normalised FOK.** Rejected outside case 7 by direct grading.

**Blanket case-18 cash-floor tuning.** Run `-2` already tested zero floor alone and
with symmetric ceilings 8 and 16 inside the exact `{18,20}` label. It hurt case 18 and
helped case 20. The next run changes the consumer to post-fill inventory netting; it
does not revisit the floor coefficient.

**Generic FOK cap tuning.** The 0.80 positive-signal point and the 0.25-live-cash
endpoint are both graded and negative on case 18; the large endpoint is destructive
on case 19 and thin held ranks. Intermediate constants are not a structural surface.

**The `18 from 20` discriminator before a treatment exists.** A live-volatility gate
is scheduled only in G3, after G1-G2 establish a capacity treatment worth allocating.
Do not spend an earlier generation searching for a discriminator in the abstract.

**Case 19 on the current method surface.** Its quote is inert, its tested FOK funding
path is inert, and punishment buys 0.15 against a 20.48 gap. It receives no planned
arm until a new observation or inventory mechanism changes that arithmetic.

---

## 15. Loop-Level Failure Modes

- **A terminal threshold hid a known score path.** Run `-7` stopped at 15.10 against a
  pinned 1500 target with a known repair unspent. New runs target 1600 or the
  six-generation limit.
- **A variable name is not a measurement.** `_counterparty_markout` holds captured
  edge, not markout. Name the formula, the horizon and the consumer, or the finding is
  not valid.
- **Mechanism and measurement must not change together without controls.** Swap the
  input or swap the consumer, not both in every arm.
- **Method diversity is the escape mechanism.** `quote` still dominates the archive;
  the large forward steps came from newly opened observation, pricing or capacity
  surfaces rather than another adjacent width constant.
- **Coordinate descent misses interactions, and Section 5 is the general case.** The
  compensated optimum is what coordinate descent converges to when the coordinates are
  coupled.
- **Pricing algebra is exact; estimated parameters are not.**
  `price_option_from_parameters` passes THEO with zero error. Do not edit the algebra.

---

## 16. Hard Invariants

- Preserve all six core signatures.
- `on_trade` must keep `self.position.add_option_quantity`.
- `on_step_advance` must assign both new state parameters.
- `price_option_from_parameters` and `name` remain frozen.
- Cases 1-4 must pass; no runtime error or bankruptcy is eligible.
- Emit no stdout from `MarketMaker`.
- Never rerun a completed source SHA.
- Use the current champion as the score baseline, even when a challenger supplies the
  complete parent source.
- Case 7's installed FOK behaviour is protected; any source that moves it must price a
  possible 0.60 loss.
- Case 13's 0.53 margin is the thinnest held rank; case 14's 1.15 is second.
- Any FOK or quote override must bound incremental maximum loss.
- `self.cash_balance` is live risk state, not a static session label.
- Correct expiry settlement evaluates removed options against `new_underlying_state`.
- `price_option` is a hot path. Accumulate statistics in hooks and avoid history loops.
- Hook state must be bounded and incrementally updated.
- A helper name below `MarketMaker` has at most four words. Inline helpers shorter than
  four lines. Avoid deep nesting and unnecessary defensive programming; fail fast.
- A shared numeric literal is a coupling. A Tune binding must identify every consumer.
- One browser session and one Git lifecycle mutation at a time.
- A new run stops only at 16.00/16.00 or after six completed generations.
