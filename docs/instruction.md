# Score-Frontier Research After market-loop-20260821-5

## 1. Canonical State

```text
champion        g6-lowband-size-eight                     UNCHANGED
source SHA      a01930269b7599e2e2d68ba8f1fa92215547a4651baf7d9ae4a5eb056e1a4e40
score           14.70 / 16.00
combined PnL    245.82                    telemetry only
case 18         7.44, rank 2 of 4, gap 31.57

head challenger market-loop-20260821-5-g06-g6-label-unwind-extra-lot   revision 0
source SHA      bc7c9e616940ec822735220327747e6810a5943380ddb7d3a9945e2a33421a59
score           14.70, tied, not promotable
combined PnL    267.26
gap sum         47.93 across cases 6, 7, 18, 19        was 56.85
case 18         17.80, rank 2 of 4, GAP 1.58           repository best, was 8.85
thinnest margin 1.35 at case 13, then 1.90 at case 10, then 5.21 at case 14,
                then 5.49 at case 20
tuningAttempts  0

its parent      market-loop-20260821-5-g02-g2-label-expiry-depth   revision 1
source SHA      89d103c8072d97fdecc9a5f85ddd1e21d764261a22be3116ac91d4d8939f9747
score           14.70, case 18 gap 1.74, tuningAttempts 1
```

Run `market-loop-20260821-5` ran all six generations, graded twenty-three
sources, promoted nothing, and **cut the case-18 gap from 8.85 to 1.58 — an
82 percent reduction, and the closest this repository has come to a promotion
since the champion was set.** Two active challengers were created, one of them
tuned once.

The previous memo declared the board closed and said nothing inside the surface
was worth a generation. **That was wrong**, and Section 4 explains exactly which
measurement misled it. The surface was not exhausted; one dimension of it had
never been graded.

`market-loop-20260821-3` remains dormant at generation 3 of 6, status `active`.
Nothing depends on it.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is
not sign-aware. Use `candidate_pipeline/frontier.sh <repo>` in its default
`report` mode as a per-case evidence lookup only.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime
error, cases 1-4 PASS, every failed scored case an explicit bankruptcy, and
SCORED points strictly above the champion. PnL and minimum capital are telemetry
and never break a tie. Order score-equal candidates by target gain, target gap,
modified lines, then candidate ID.

**The per-case score map is `0.40 + 0.60 * (competitors beaten / (N - 1))`.**
Rank 1 of any N scores 1.00, rank 2 of 4 scores 0.80, rank 2 of 3 scores 0.70,
rank 2 of 2 scores 0.40. VERBOSE cases score 1.00 whenever neither bankrupt nor
erroring. Price every collateral budget from this formula, never from archived
prose.

**Case 18 is worth exactly 0.20 and it is 1.58 away.** Taking it puts the head
lineage at 14.90 and promotes. No other single case in the book is within
seven dollars. This is the whole dispatch queue.

## 3. Rank and Risk Ledger

Head challenger `market-loop-20260821-5-g06-g6-label-unwind-extra-lot` r00.

| Case | Cap | N | Our PnL | Rank | Gap / margin |
|---:|---:|---:|---:|---:|---:|
| 5 | 10 | 2 | 33.80 | 1 | +17.80 |
| 6 | 10 | 3 | 3.42 | 2 | -7.08 |
| 7 | 10 | 2 | 3.55 | 2 | -18.81 |
| 8 | 10 | 3 | 23.92 | 1 | +15.77 |
| 9 | 10 | 3 | 35.75 | 1 | +28.78 |
| 10 | 20 | 3 | 24.69 | 1 | **+1.90** |
| 11 | 20 | 3 | 17.81 | 1 | +17.64 |
| 12 | 20 | 2 | 6.83 | 1 | +16.59 |
| 13 | 20 | 4 | 9.72 | 1 | **+1.35** |
| 14 | 20 | 3 | 17.22 | 1 | +5.21 |
| 15 | 20 | 3 | 17.96 | 1 | +12.06 |
| 16 | 40 | 3 | 34.26 | 1 | +25.35 |
| 17 | 40 | 4 | 18.28 | 1 | +11.84 |
| 18 | 40 | 4 | 17.80 | 2 | **-1.58** |
| 19 | 40 | 4 | 2.99 | 2 | -20.46 |
| 20 | 40 | 4 | -0.74 | 1 | **+5.49** |

**Report the parent's own three thinnest margins in every plan** — they move
with the parent. For this head they are cases 13, 10 and 14. Cases 13, 10 and 14
sit outside the `{18, 20}` label and a label-gated change cannot reach them.

**Case 20 is now the binding collateral constraint, and it changed character
this run.** Our case-20 PnL fell from +1.71 to -0.74 as the near-expiry rule went
in, and the held margin halved from 11.55 to 5.49. We still hold rank 1 only
because the entire field is underwater there: Lattice -6.23, Mongoose -32.67,
Fixed Width 0.05 -105.36. Any further label change that costs case 20 more than
5.49 flips it to rank 2 and gives back 0.20 — exactly what case 18 would win.

## 4. The Instrument, and the Measurement That Misled the Last Memo

The reliable instrument is still the **endogenous leader response**, measurable
only after the fact.

The previous memo recorded that in case 18 the instrument reads flat: Fixed
Width 0.05 "has sat between 23.3 and 24.5 across fifteen graded sources
regardless of width, size, FOK policy or theo." That reading was accurate and
the conclusion drawn from it was not.

```text
case-18 leader (Fixed Width 0.05) across this run
  parent, uniform two-cent label tightening        24.43
  tightening restricted to steps_until_expiry <= 2 18.36    fell 6.07
  tightening restricted to steps_until_expiry <= 1 19.48
  plus the inventory-unwind extra lot              19.38
```

**The leader is strongly responsive — to WHERE the width is spent, not to HOW
MUCH of it there is.** Fifteen sources had swept the level of a lever while
holding its allocation uniform, and a flat instrument reading was generalised
into "case 18 is closed." A flat response to one parameterisation of a lever is
evidence about that parameterisation only.

**The general rule this establishes: when a lever's LEVEL is closed, its
ALLOCATION has not been tested.** Depth, size, side, breadth and threshold
sweeps all answer "how much"; none of them answer "on which contracts". That
question was worth 7.27 of case-18 gap in a single generation.

## 5. What Run `-5` Proved

### respond_to_fok is closed from both directions (g01)

```text
reject counterparties with negative markout   case18 gap 8.85 -> 10.10
relax the edge for positive-markout parties   BYTE-IDENTICAL, all 20 cases
refuse repeat same-direction flow             BYTE-IDENTICAL, all 20 cases
```

Two byte-identical arms are a measurement, not a null run: the reject arm proves
FOK acceptance is frequent and moves eleven cases, so the inertness says that
**at the moment a FOK order arrives its counterparty essentially never carries a
positive settled markout and never has prior same-direction fills against us in
that option.** FOK flow here is one-shot per (counterparty, option, direction)
and arrives measured-adverse.

The reject arm's direction is the substantive result: refusing the flow that has
marked against us **costs** 1.25 of case-18 gap, so that flow is net profitable
to accept. This reproduces run `-4` g01's breadth finding on an independent
mechanism. Combined with run `-4` g03, which closed the FOK edge and per-order
cap as uniform thresholds, `respond_to_fok` is closed on the target from both
the price side and the selection side.

This also retired dispatch item (b) of the previous memo. Rebuilding the markout
accumulator in `on_step_advance` was queued only as the quality input for item
(a); item (a) graded negative, and inside the label the width branch fires on
`fed_low_mean_regime` regardless of markout, so it has no remaining score path.

### The near-expiry allocation, and its tuning (g02, g03)

```text
g02  depth only when steps_until_expiry <= 2   case18 gap 2.78   PnL 278.17
g02  depth only when 25 <= fair_value <= 75    case18 gap 7.79
g02  offer-side-only three-cent depth          case18 gap 20.83
g03  cutoff 1, depth 2                         case18 gap 1.74   INSTALLED
g03  cutoff 0, depth 1                         case18 gap 28.83
g03  depth 3 or 4, any cutoff                  LOST CASE 12, score 14.10
```

The tuning batch found the joint optimum at cutoff 1 with the two-cent depth
intact. Two structural facts came out of it:

1. **The depth literal is SHARED** by the label arm and the counterparty-markout
   arm, so every attempt to deepen the label past two cents also deepened the
   global markout branch and lost case 12 outright.
2. Generation 4 then decoupled them and graded a label-only three-cent depth:
   **gap 12.65.** Two cents is the label's own local optimum, not an artifact of
   the shared literal. The constraint is real, not a coding accident.

### Everything else inside the cutoff-1 rule is closed (g04, g05, g06)

```text
g04  label-only depth three (decoupled)        case18 gap 12.65
g04  bid-side-only depth                       case18 gap 16.29
g04  depth on company-linked options only      case18 gap  2.66
g05  depth on central (near-the-money) only    case18 gap  5.12
g05  depth on single-leg options only          case18 gap  2.47
g05  fair-value-aware cheap-side allocation    case18 gap 19.18
g06  indiscriminate guarded extra lot          case18 gap  2.34
g06  extra lot on flat-book entry only         case18 gap  2.49
g06  extra lot only when it REDUCES inventory  case18 gap  1.58   INSTALLED
```

Side asymmetry is closed in both directions: offer-only 20.83 and bid-only 16.29
against 1.74 symmetric. Option-scope narrowing is closed in every direction
tried — company-only, central-only and single-leg-only each widened the gap, so
**the full one-step book is the right scope and each selected contract wants
symmetric treatment.**

The size closure was correctly reopened under the new rule: it predated the
cutoff-1 discovery. Only the inventory-reducing lot pays. Indiscriminate and
flat-entry size are closed negative under this condition, as they were before it.

### The installed rule, in full

Two hunks on top of `market-loop-20260821-4-g04-g4-live-company-vol`:

```python
label_depth_applies: bool = fed_low_mean_regime and option.steps_until_expiry <= 1
if label_depth_applies or counterparty_markout.get(counterparty_id, 0.0) > 0.0:
    half_width = max(half_width - 2, 1)
```

and, after the low-band size block, one extra lot on the side that reduces an
existing position, each guarded by the same capacity arithmetic the surrounding
ladder uses.

## 6. The Editable Surface

| Unlocked | Commit | Status |
|---|---|---|
| `on_trade` bookkeeping | `612ac27` | used by run `-3`; paid for itself |
| `on_step_advance`, `__init__` appends | `3a18baa` | used by run `-4` g04/g05; paid |
| `price_option` as a target method | `2b869ae` | used by run `-4` g04/g05; paid |

`price_option` has three consumers and a plan must name which one it targets: the
quoted fair value, the `respond_to_fok` threshold, and the `signed_reserve`
capacity arithmetic. A fourth path exists inside our own instrumentation —
`_settle_markout` marks open trades to `price_option`, so shading theo shades the
markout measure that drives the width branch.

`MarketParameters.__post_init__` raises unless both rate probabilities are
strictly positive and sum to at most 1, standard deviations are non-negative, and
`rate_reversion_strength` is in [0, 1]. **Any `replace()` must clamp so a raise is
impossible**; a raise is a runtime error and permanent ineligibility.

Still frozen: `name`, `price_option_from_parameters`, and every method signature.

## 7. Session Map

`self.warm_up_statistics` is constant per session and is the only sound
discriminator. **Never gate on `self.cash_balance`** — the grader mutates it live.

```text
> 0.60          {6}                     exact; installed
(0.50, 0.60]    {9, 15}
(0.40, 0.50]    {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40         {8, 10, 12, 17}         exact; installed as low_band_regime
```

Middle band with THR log-return `sample_std_dev <= 0.025` gives {7, 13, 19}:

```text
corr > 0.50                             {19}    installed
corr <= 0.50 and FEDmax >= 3.0          {7}     installed as case_seven_regime
corr <= 0.50 and FEDmax < 3.0           {13}    installed as case_thirteen_regime
```

Middle band above 0.025 is {5, 11, 14, 16, 18, 20}; FEDmean > 2.0 narrows it to
{5, 11, 14, 16}, so **FEDmean <= 2.0 is exactly {18, 20}**, installed as
`fed_low_mean_regime`. Inside {5,11,14,16}, FEDmin > 2.0 gives {5, 11} and raw
corr < 0.75 gives {5}, installed as `case_five_regime`.

The `18 from 20` threshold remains unfound. It is **no longer score-worthless**:
the previous memo dismissed it because everything it would unlock benefited case
20, which was rank 1 by 11.55. Case 20 now holds by 5.49 with a negative PnL, and
the label's remaining case-18 levers all cost it. **A discriminator separating 18
from 20 is now the cleanest way to spend case-20 margin on case 18 without
risking the rank**, and it is worth looking for again.

## 8. Scoped Closures

A closure is only as wide as the interval actually graded, and only valid for the
editable surface it was measured on. **Every "closed" entry below closes a LEVEL,
a SCOPE or a SIDE that was actually swept — read Section 4 before generalising
any of them to an allocation that was not.**

```text
case 6                    CLOSED ON EVERY AXIS THE FILE EXPOSES.
                          Width interior maximum at 18; size, skew, rate, FOK,
                          counterparty and live theo all closed or inert.
case 7                    CLOSED. Width graded 12..100; flat plateau at >=25
                          where we win no RFQ. Size, FOK, rate, drift closed.
case 18                   OPEN AT 1.58 and 0.20 from a promotion.
  label depth level       CLOSED at two cents, now four independent ways,
                          including a decoupled label-only three-cent arm.
  label depth by expiry   CLOSED at cutoff 1 across the integer neighborhood
                          0, 1, 2, 4, 5 at one- and two-cent depth.
  label depth by side     CLOSED both directions. Offer-only 20.83, bid-only
                          16.29, symmetric 1.74.
  label depth by scope    CLOSED. Company-only 2.66, central-only 5.12,
                          single-leg-only 2.47, cheap-side 19.18; all-option
                          scope wins.
  label size              Indiscriminate 2.34 and flat-entry 2.49 CLOSED;
                          inventory-reducing extra lot POSITIVE, installed,
                          magnitude and threshold NOT yet swept.
  quote width breadth     closed; non-monotone, must be all-or-nothing.
  repeat-request cent     LOAD-BEARING; removing it costs 0.87.
  respond_to_fok          CLOSED BOTH DIRECTIONS. Thresholds closed in run -4
                          g03; counterparty selection negative or inert in g01.
  price_option            volatility strength, sector scope, drift, rate: closed.
case 19                   CLOSED. Width graded 12/25/45/70: FLAT at and above 45
                          and monotone harmful below it. Our 2.99 is not RFQ
                          income. Rate, withdrawal, counterparty all closed.
                          The instrument read it NEGATIVE in run -4: Fixed Width
                          0.05 and Mongoose are identical to the cent across four
                          graded half widths. Not contestable.
counterparty widening     CLOSED twice, two independent measures.
counterparty amount       CLOSED at 2, globally and inside the label.
counterparty threshold    CLOSED at 0.0, monotone.
graduated markout         CLOSED NEGATIVE. Binary is correct.
markout accumulator work  NO SCORE PATH. Retired with dispatch item (b).
live rate probabilities   CLOSED NEGATIVE. 13.40, the convergence rule.
live sector loadings      CLOSED NEGATIVE. Corrupts cross-company correlation.
live company drift        CLOSED NEGATIVE. 12.70, worst arm of run -4.
live idio volatility      OPEN AND POSITIVE, at prior 10 and clamp [0.5, 2.0].
warm_up (all estimators)  CLOSED across six estimators.
global PnL and capital    Closed as objectives. Telemetry only.
```

**THE CONVERGENCE RULE, graded twice and unchanged:** live adaptation is decided
per parameter by how fast its estimator converges, not by how important the
parameter is. Only the per-company idiosyncratic variance survives.

## 9. Dispatch Queue

**Case 18 at 1.58 is the entire queue.** It is 0.20, it promotes, and it is the
only case in the book within seven dollars. Start every generation from
`market-loop-20260821-5-g06-g6-label-unwind-extra-lot` r00.

**a. Tune the unwind lot.** The single highest-value action available and the
only queued item with measured positive evidence behind it. The installed branch
adds exactly one lot, gated on a non-zero position, guarded by the surrounding
capacity arithmetic. Its magnitude and its position threshold have never been
swept — g06 graded the direction, not the size. Bind the lot increment and the
position threshold as quote constants and run a Tune batch. `tuningAttempts` is 0,
so the lineage has both attempts available. Collateral budget stays at zero and
case 20's 5.49 margin is the check that matters.

**b. Hunt the `18 from 20` discriminator again.** See Section 7. It was dismissed
as score-worthless under a case-20 margin of 11.55 that no longer exists. Every
remaining label lever helps 18 and costs 20; a discriminator converts that
tradeoff into a free gain. Worth a probe objective with an explicit unlock.

**c. Apply the allocation lesson to a second lever.** Section 4's rule is
general and has been paid once. The levers whose LEVEL is closed but whose
ALLOCATION has never been graded are the repeat-request cent, the fill-signal
cent, and the wing-widening block — each currently applies uniformly to every
contract in the label. Ask of each: which contracts should get it.

**d. Ask for a surface widening.** Unchanged in priority and still true:
unlocking `on_trade`, then `on_step_advance` and `__init__`, then `price_option`
produced the forward steps of runs `-3` and `-4`. Anything exposing per-day fill
outcomes rather than inferred ones is worth more than a generation of search.

Do not re-run: any FOK change of any kind; the markout accumulator; the label
depth level, expiry cutoff, side, or option scope; indiscriminate or flat-entry
label size; the counterparty amount, threshold or breadth; a graduated markout;
any `warm_up` estimator; live rate probabilities, sector loadings, company drift,
or the volatility blend strength; case 19 width; case 6 or case 7 on any axis.

## 10. Hard Invariants

Preserve core method signatures and repository scope rules; compile and pass the
method-level validator before a live run; emit no stdout from `MarketMaker`; never
rerun a completed source SHA; runtime errors are always ineligible; cases 1-4 must
pass; ranking, cash, result, source SHA and raw evidence must parse consistently;
one browser session and one Git lifecycle mutation at a time.

The challenge charges cash equal to a trade's **maximum loss**. A 0.00 buy and a
1.00 sell each charge nothing. Any override that bypasses the file's
`signed_reserve` and `available_capacity` guards must bound its own per-fill
charge, and that applies with full force to `respond_to_fok`.

`self.cash_balance` is the **live** balance the grader mutates, not starting
capital. Never gate a session label on it.

`price_option` is a hot path — once per quote, once per FOK, and once per open
position inside `signed_reserve`. No loops over history inside it; accumulate in
the hooks.

A shared numeric literal is a coupling. Before binding any constant for a Tune
batch, check every branch that reads it: run `-5` g03 lost case 12 three times
over because the label arm and the counterparty-markout arm share one depth
literal.
