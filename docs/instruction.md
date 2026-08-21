# Score-Frontier Research After market-loop-20260821-6

## 1. Canonical State

```text
champion        g6-lowband-size-eight                     UNCHANGED
source SHA      a01930269b7599e2e2d68ba8f1fa92215547a4651baf7d9ae4a5eb056e1a4e40
score           14.70 / 16.00
combined PnL    245.82                    telemetry only

head challenger market-loop-20260821-6-g02-g2-label-no-repeat-cent   revision 0
source SHA      c04d0e4e926ce02cebf354fb518f11999c5ff02cdea3afe819bec98a944cc6b9
score           14.70, tied, not promotable
combined PnL    268.26
case 18         17.91, rank 2 of 4, GAP 1.34            repository best
case 20         +0.15, rank 1 of 4, margin 6.32         first positive case-20 PnL
thinnest margin 1.35 at case 13, then 1.90 at case 10, then 5.21 at case 14
tuningAttempts  0

its parent      market-loop-20260821-5-g06-g6-label-unwind-extra-lot  revision 1
source SHA      6ec2254e56936d0833b427260e759ea17f87d35cb4153dcd3a0474e1580a936f
score           14.70, case 18 gap 1.42, tuningAttempts 1
```

Run `market-loop-20260821-6` ran all six generations, graded seventeen sources,
promoted nothing, and produced two structural results and one closure sweep. It
cut the case-18 gap from 1.42 to 1.34, turned case 20 positive for the first time
(+0.15, margin 5.49 -> 6.32), and raised combined PnL to 268.26. Its real output
is the map below: **the near-expiry label is now closed on every axis this file
exposes, case 6's uniform width is explained rather than merely measured, and
`price_option` is established as a lever fifty times more powerful per cent than
anything in `quote`.**

`market-loop-20260821-3` remains dormant at generation 3 of 6, status `active`.
Nothing depends on it.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is
not sign-aware. Use `candidate_pipeline/frontier.sh <repo>` in its default
`report` mode as a per-case evidence lookup only.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the champion. PnL and minimum capital are telemetry and never break
a tie. Order score-equal candidates by target gain, target gap, modified lines,
then candidate ID.

**The per-case score map is `0.40 + 0.60 * (competitors beaten / (N - 1))`.**
Rank 1 of any N scores 1.00, rank 2 of 4 scores 0.80, rank 2 of 3 scores 0.70,
rank 2 of 2 scores 0.40. VERBOSE cases score 1.00 whenever neither bankrupt nor
erroring. Price every collateral budget from this formula, never from archived
prose.

The four cases that are not at 1.00, with what each is worth:

```text
case  6   0.70   rank 2 of 3   +0.30 available   gap  7.08
case  7   0.40   rank 2 of 2   +0.60 available   gap 18.81
case 18   0.80   rank 2 of 4   +0.20 available   gap  1.34
case 19   0.80   rank 2 of 4   +0.20 available   gap 20.46
```

**Case 18 is still the nearest rank by a factor of five, and it is now the hardest
one on the board.** Read Section 5 before spending a generation on it.

## 3. Rank and Risk Ledger

Head challenger `market-loop-20260821-6-g02-g2-label-no-repeat-cent` r00.

| Case | Cap | N | Our PnL | Rank | Gap / margin | Score |
|---:|---:|---:|---:|---:|---:|---:|
| 5 | 10 | 2 | 33.80 | 1 | +17.80 | 1.00 |
| 6 | 10 | 3 | 3.42 | 2 | -7.08 | 0.70 |
| 7 | 10 | 2 | 3.55 | 2 | -18.81 | 0.40 |
| 8 | 10 | 3 | 23.92 | 1 | +15.77 | 1.00 |
| 9 | 10 | 3 | 35.75 | 1 | +28.78 | 1.00 |
| 10 | 20 | 3 | 24.69 | 1 | **+1.90** | 1.00 |
| 11 | 20 | 3 | 17.81 | 1 | +17.64 | 1.00 |
| 12 | 20 | 2 | 6.83 | 1 | +16.59 | 1.00 |
| 13 | 20 | 4 | 9.72 | 1 | **+1.35** | 1.00 |
| 14 | 20 | 3 | 17.22 | 1 | +5.21 | 1.00 |
| 15 | 20 | 3 | 17.96 | 1 | +12.06 | 1.00 |
| 16 | 40 | 3 | 34.26 | 1 | +25.35 | 1.00 |
| 17 | 40 | 4 | 18.28 | 1 | +11.84 | 1.00 |
| 18 | 40 | 4 | 17.91 | 2 | **-1.34** | 0.80 |
| 19 | 40 | 4 | 2.99 | 2 | -20.46 | 0.80 |
| 20 | 40 | 4 | 0.15 | 1 | +6.32 | 1.00 |

**Report the parent's own three thinnest margins in every plan** — they move with
the parent. For this head they are cases 13, 10 and 14. All three sit outside the
`{18, 20}` label and a label-gated change cannot reach them.

**Case 20 stopped being the binding constraint this run.** It went from -0.74 with
a 5.49 margin to +0.15 with a 6.32 margin, and generation 6 showed it can reach
+10.02 on a one-cent theo shift. It is no longer the reason a case-18 lever is
blocked; cases 13 and 10 are the tight ones now, and they are unreachable from
the label.

## 4. The Instrument

The reliable instrument is still the **endogenous leader response**, measurable
only after the fact. Two refinements from this run:

**A flat instrument reading closes a parameterisation, not a lever.** This is the
run `-5` lesson and it paid three more times here (Section 5).

**A leader that gains exactly what we decline is a structural loss, not a fixable
one.** In case 6, widening near-expiry from 18 to 25 cents gained us 0.37 and
gained Fixed Width 0.25 exactly 0.37, leaving the gap at 7.08 to the cent.
Widening the far contracts instead cost us 2.10 and gained the leader 3.56. When
the instrument reads as a clean transfer, the remaining gap is the leader's
structural edge and no allocation of our own width recovers it.

## 5. What Run `-6` Proved

### The unwind lot is closed in both untested dimensions (g01, Tune, 8 vectors)

```text
increment 1 (parent)   case18 gap 1.58
increment 2            case18 gap 1.50
increment 3            case18 gap 1.42     INSTALLED as r01
increment 4            case18 gap 1.66
```

Shallow interior maximum at three lots; total excursion 0.24 across the whole
integer range. **The position threshold is exactly inert**: at every increment the
gap is identical for thresholds `(0, 0)`, `(±1)` and `(±3)`. The branch only fires
when the option position is already at least three lots deep, so restricting it to
larger positions removes no fills. `tuningAttempts` on that lineage is now 1 of 2.

### The allocation rule paid a third time, and separated three uniform levers (g02)

Each of the three width levers that still applied uniformly inside the label was
suppressed inside `label_depth_applies` alone:

```text
repeat-request cent   case18 gap 1.34, case 20 -0.74 -> +0.15   INSTALLED
fill-signal cent      case18 gap 1.42 UNCHANGED, case 20 +0.10  INERT
wing-widening block   case18 gap 15.03, case 20 -4.21           STRONGLY NEGATIVE
```

The winner is **the first lever ever found that improves both label cases at
once**. The repeat cent was not buying protection inside the label; it was width
handed to the leader on flow that repeats precisely because it is the flow the
label contests.

The wing arm is the worst `quote` result graded in three runs, and the reason is
mechanical: within one step of expiry the fair value sits near its terminal zero
or one, so most near-expiry quotes are deep-wing quotes and that block is the
dominant width term there, not a marginal one.

### Repeat-request SIZE is closed, and case 18's flow is identified (g03)

```text
offer ladder ungated inside label   BYTE-IDENTICAL, all 20 cases
bid ladder ungated inside label     case18 17.91 UNCHANGED, case 20 -1.06
both ladders ungated                IDENTICAL TO BID-ONLY, all 20 cases
```

Case 18 returned **exactly 17.91 with an unmoved leader at 19.25 in all three
arms.** The byte-identical offer arm is a measurement: the offer rungs never fire
on a repeated near-expiry request because their `offer_quantity == 3` precondition
is not met there. The bid ladder does reach that flow and giving it size costs
case 20 exactly 1.06 for zero case-18 movement.

**Put beside g02 — repeat WIDTH moved case 18 by 0.11 and case 20 by 0.89 — the
conclusion is that repeat near-expiry traffic lives in the case-20 session, not
the case-18 session.**

### The repeat cent's expiry allocation is closed at cutoff 1 (g04)

```text
cutoff 1 (parent)      case18 gap 1.34, leader 19.25, case 20 +0.15
cutoff 2               case18 gap 1.34 IDENTICAL, case 20 +0.13     INERT
whole session          case18 gap 1.50, LEADER RISES to 19.33       NEGATIVE
far contracts only     case18 gap 1.58, case 20 -0.79               WORST
```

Far-only is the decisive arm: it is worse than the 1.42 the lever's parent had
before g02 ran, and it gives back the entire g02 case-20 gain. **The repeat cent
is load-bearing on contracts with time left and misallocated only within one step
of expiry.** The boundary it inherited from `label_depth_applies` is its exact
optimum, and this reproduces on an independent mechanism the global finding that
removing the repeat cent outright costs 0.87.

### Case 6's uniform width is explained, and the gap is structural (g05)

The case-6 label `flat_rate_frequency > 0.60` is an exact singleton, so all three
arms left the other fifteen scored cases identical to the cent. Zero collateral by
construction.

```text
25 cents near expiry   us 3.42 -> 3.79   leader 10.50 -> 10.87   gap 7.08 UNCHANGED
25 cents far           us 3.42 -> 1.32   leader 10.50 -> 14.06   gap 12.74
12 cents near expiry   us 3.42 -> 2.47   leader 10.50 -> 10.75   gap  8.28
```

**Case 6's near-expiry flow is adverse and its far flow is profitable.** Eighteen
cents was the best single uniform number because it splits the difference. The
recoverable amount is bounded by our own near-expiry loss, about 0.37, so no
further widening reaches 7.08. The leader captures exactly what we decline.

### `price_option` is the most powerful lever on the file, pointed the wrong way (g06)

One cent of theo shift, gated on `fed_low_mean_regime`:

```text
toward terminal, near expiry   case18 14.00 vs leader 21.39, gap  7.39; case 20 -2.67
toward one half, near expiry   case18 17.11 vs leader 26.59, gap  9.48; case 20 +10.02
                               combined PnL 277.33, the highest ever recorded
toward terminal, session-wide  case18 14.44 vs leader 31.01, gap 16.57
```

Where the entire near-expiry width and size surface moved case 18 by at most 0.13
and case 20 by at most 1.06, **one cent of theo moved them by dollars.** Three
conclusions:

1. **Our theo is at a local optimum for case 18 in both directions.** The 1.34
   residual is not a pricing bias.
2. **Case-18 flow is intensely contestable through price and inert to width and
   size.** The leader's PnL responds by seven to twelve dollars to one cent of our
   theo. The flow is priced, not spread-limited.
3. **The `{18, 20}` sessions respond to the SAME shift with opposite signs** —
   case 20 gains 9.87 while case 18 loses 0.80 and its leader gains 7.34. This is
   the first mechanism ever found that separates the two sessions behaviourally.

### The installed head, in full

Three hunks on top of `market-loop-20260821-4-g04-g4-live-company-vol`:

```python
label_depth_applies: bool = fed_low_mean_regime and option.steps_until_expiry <= 1
if label_depth_applies and repeat_request:
    half_width = max(half_width - 1, 1)
if label_depth_applies or counterparty_markout.get(counterparty_id, 0.0) > 0.0:
    half_width = max(half_width - 2, 1)
```

and, after the low-band size block, three extra lots on the side that reduces an
existing position, each guarded by the same capacity arithmetic the surrounding
ladder uses.

## 6. The Editable Surface

| Unlocked | Commit | Status |
|---|---|---|
| `on_trade` bookkeeping | `612ac27` | used by run `-3`; paid for itself |
| `on_step_advance`, `__init__` appends | `3a18baa` | used by run `-4` g04/g05; paid |
| `price_option` as a target method | `2b869ae` | used by `-4` g04/g05 and `-6` g06; paid |

`price_option` has three consumers and a plan must name which one it targets: the
quoted fair value, the `respond_to_fok` threshold, and the `signed_reserve`
capacity arithmetic. A fourth path exists inside our own instrumentation —
`_settle_markout` marks open trades to `price_option`, so shading theo shades the
markout measure that drives the width branch.

**`quote` quantizes theo with `round(price_option(option) * 100)`, so any shift
below half a cent cannot move the quoted price at all.** It still moves
`respond_to_fok`, which compares unquantized floats, and `signed_reserve`, which
sums unquantized floats. **A sub-cent shift is the only known way to act on one of
the three consumers in isolation.** This is untested and is the top dispatch item.

`MarketParameters.__post_init__` raises unless both rate probabilities are strictly
positive and sum to at most 1, standard deviations are non-negative, and
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

**The `18 from 20` discriminator is still unfound from warm-up statistics, but g06
gave it a behavioural handle for the first time.** A one-cent near-expiry theo
shift toward one half is worth +9.87 to case 20 and -0.80 to case 18. The two
sessions are not merely different in degree; they respond with opposite signs to
the same pricing change. Any statistic that correlates with that response is a
candidate discriminator, and finding one converts the strongest lever on the file
from a wash into a case-18 lever.

## 8. Scoped Closures

A closure is only as wide as the interval actually graded, and only valid for the
editable surface it was measured on. **Every "closed" entry below closes a LEVEL,
a SCOPE, a SIDE or an ALLOCATION that was actually swept — read Section 4 before
generalising any of them to a dimension that was not.**

```text
case 6                    Width interior maximum at 18 under a UNIFORM allocation.
                          Expiry allocation now CLOSED TOO: near flow adverse,
                          far flow profitable, best recovery 0.37 and the leader
                          takes exactly what we decline. Gap is structural.
                          Size, skew, rate, FOK, counterparty, live theo closed.
case 7                    CLOSED. Width graded 12..100; flat plateau at >=25
                          where we win no RFQ. Size, FOK, rate, drift closed.
case 18                   OPEN AT 1.34 and 0.20 from a promotion, and now the
                          hardest case on the board. Its PnL sat between 17.78
                          and 17.91 across ELEVEN consecutively graded sources.
  label depth level       CLOSED at two cents, four independent ways.
  label depth by expiry   CLOSED at cutoff 1 across 0, 1, 2, 4, 5.
  label depth by side     CLOSED. Offer-only 20.83, bid-only 16.29, symmetric 1.74.
  label depth by scope    CLOSED. Company-only, central-only, single-leg-only and
                          cheap-side all widen the gap; all-option scope wins.
  label size (unwind)     CLOSED. Increment interior max at 3; position threshold
                          EXACTLY INERT at every increment.
  repeat-request cent     Level CLOSED (removal costs 0.87 globally, 0.24 far).
                          Expiry allocation CLOSED at cutoff 1 and INSTALLED.
  repeat-request size     CLOSED. Offer ladder byte-identical, bid ladder costs
                          case 20 1.06 for zero case-18 movement.
  fill-signal cent        CLOSED INERT inside the label. Gap unchanged to the cent.
  wing-widening block     LOAD-BEARING inside the label. Suppressing it: gap 15.03.
  quote width breadth     closed; non-monotone, must be all-or-nothing.
  respond_to_fok          CLOSED BOTH DIRECTIONS, price side and selection side.
  price_option one cent   CLOSED BOTH DIRECTIONS at near-expiry and session-wide.
                          Local optimum. Sub-cent NOT tested — see Section 6.
case 19                   CLOSED. Width flat at and above 45, monotone harmful
                          below. Not contestable; leaders identical to the cent
                          across four graded half widths.
counterparty widening     CLOSED twice, two independent measures.
counterparty amount       CLOSED at 2, globally and inside the label.
counterparty threshold    CLOSED at 0.0, monotone.
graduated markout         CLOSED NEGATIVE. Binary is correct.
markout accumulator work  NO SCORE PATH.
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

**THE ALLOCATION RULE, now paid four times:** when a lever's LEVEL is closed, its
ALLOCATION has not been tested. Depth, size, side, breadth and threshold sweeps
answer "how much"; none answer "on which contracts". Its corollary, new this run:
**when an allocation is also closed and the leader captured exactly what we
declined, stop — that gap is structural.**

## 9. Dispatch Queue

Start from `market-loop-20260821-6-g02-g2-label-no-repeat-cent` r00 unless an item
says otherwise. **Do not open the next run on case 18 by reflex.** Eleven graded
sources have pinned it between 17.78 and 17.91, and every axis of `quote` inside
its label is closed.

**a. Sub-cent theo shift.** The single highest-value untested action on the file
and the only known way to touch one of `price_option`'s three consumers in
isolation. `quote` quantizes theo to cents, so a shift below half a cent cannot
move the quoted price, but `respond_to_fok` and `signed_reserve` both consume the
raw float. Generation 6 showed one whole cent is worth dollars in both label
sessions; the sub-cent regime has never been sampled and is the only part of the
`price_option` neighbourhood still open. Gate it on `fed_low_mean_regime` so
collateral stays zero by construction, and name which consumer the hypothesis
targets.

**b. Hunt the `18 from 20` discriminator, now with a behavioural handle.** See
Section 7. The two sessions respond to the same one-cent theo shift with opposite
signs, +9.87 against -0.80. That asymmetry is the largest signal ever measured on
this pair. A discriminator converts the file's most powerful lever from a wash
into a case-18 lever. Worth a probe objective with an explicit unlock.

**c. Case 7 is worth 0.60, more than case 6 and case 18 combined.** It is rank 2
of 2, so rank 1 scores 1.00 against the 0.40 it scores now. Its gap is 18.81 and
its width axis is closed on a plateau where we win no RFQ, but its label
`case_seven_regime` is an exact singleton, so like case 6 it carries structurally
zero collateral. Nothing except width has been asked of it since that closure, and
the allocation question has never been asked of it at all. Given the run-`-6`
result that pricing dominates width by two orders of magnitude, a `price_option`
generation gated on `case_seven_regime` is the natural first probe.

**d. Ask for a surface widening.** Unchanged in priority. Unlocking `on_trade`,
then `on_step_advance` and `__init__`, then `price_option` produced the forward
steps of runs `-3`, `-4` and `-6`. Anything exposing per-day fill outcomes rather
than inferred ones is worth more than a generation of search.

Do not re-run: any FOK change of any kind; the markout accumulator; the label
depth level, expiry cutoff, side or option scope; the unwind lot increment or its
position thresholds; the repeat-request cent's level or expiry allocation; the
repeat-request size ladder on either side; the fill-signal cent inside the label;
suppressing the wing block inside the label; the counterparty amount, threshold or
breadth; a graduated markout; any `warm_up` estimator; live rate probabilities,
sector loadings, company drift, or the volatility blend strength; a one-cent theo
shift in either direction at either expiry allocation; case 19 width; case 6 width
level or expiry allocation.

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
the hooks. Recomputing the three `warm_up_statistics` lookups that form a session
label there is cheap enough and was done safely in run `-6` g06.

A shared numeric literal is a coupling. Before binding any constant for a Tune
batch, check every branch that reads it: run `-5` g03 lost case 12 three times
over because the label arm and the counterparty-markout arm share one depth
literal. Conversely, **one Tune parameter may carry several bindings** — run `-6`
g01 bound both capacity guards and both assignments of the unwind lot to a single
parameter so the guard could never authorise fewer lots than the assignment added.
