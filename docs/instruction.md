# Score-Frontier Research After market-loop-20260821-4

## 1. Canonical State

```text
champion        g6-lowband-size-eight
source SHA      a01930269b7599e2e2d68ba8f1fa92215547a4651baf7d9ae4a5eb056e1a4e40
score           14.70 / 16.00
combined PnL    245.82                    telemetry only
gap sum         78.60 across cases 6, 7, 18, 19
thinnest margin 0.96 at case 10

head challenger market-loop-20260821-4-g04-g4-live-company-vol   revision 0
source SHA      04bf99be3c63c3a1797a12fa08352e569537c96041ac6b64129f75091f4ed425
score           14.70, tied, not promotable
combined PnL    267.49
gap sum         56.85 across cases 6, 7, 18, 19
thinnest margin 1.35 at case 13, then 1.90 at case 10, then 5.21 at case 14
tuningAttempts  0

second source   market-loop-20260821-4-g01-g1-label-breadth-all   revision 0
source SHA      6b6a8ebc92e5c50841e10c77e061ead22f6fe33158b02f35542757aff159e520
score           14.70, PnL 271.36 -- the repository PnL record, telemetry only
```

Run `market-loop-20260821-4` ran all six generations, graded eighteen sources,
promoted nothing, and **closed the board**. Unlike the previous memo, which
reopened it, this one has to report that every axis the current editable surface
exposes is now graded.

The run is `complete`. `market-loop-20260821-3` remains dormant at generation 3
of 6, status `active`, and may be resumed or left alone; nothing depends on it.

**Two archived reports are known-wrong and cannot be edited.** The
`market-loop-20260821` g06 analysis names the twelve-lot rung as generation
winner when selection actually took the eight-lot rung on a candidate-ID tie.
The `market-loop-20260821-3` g01 analysis claims the counterparty branch narrows
case 10 to 0.55; that is an endogeneity error and the true figure is 1.54.
A third correction is added in Section 2 below.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is
not sign-aware. Use `candidate_pipeline/frontier.sh <repo>` in its default
`report` mode as a per-case evidence lookup only.

## 2. Objective Model, and a Correction to the Previous Memo

Promotion is score-only: twenty structurally complete outcomes, no runtime
error, cases 1-4 PASS, every failed scored case an explicit bankruptcy, and
SCORED points strictly above the champion. PnL and minimum capital are telemetry
and never break a tie. Order score-equal candidates by target gain, target gap,
modified lines, then candidate ID.

**The per-case score map is `0.40 + 0.60 * (competitors beaten / (N - 1))`**,
measured across all archived evidence: rank 1 of any N scores 1.00, rank 2 of 4
scores 0.80, rank 2 of 3 scores 0.70, rank 2 of 2 scores 0.40. VERBOSE cases
score 1.00 whenever neither bankrupt nor erroring.

The previous memo's Section 9(a) states that losing case 20 costs "a full point"
against case 18's 0.20. **That is wrong by a factor of five.** Both cases have
four participants, so one rank is 0.20 either way. Price every collateral budget
from the formula, never from archived prose.

## 3. Rank and Risk Ledger

Head challenger. Champion figures in Section 1 of the previous memo if needed.

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
| 18 | 40 | 4 | 15.58 | 2 | **-8.85** |
| 19 | 40 | 4 | 2.99 | 2 | -20.46 |
| 20 | 40 | 4 | 1.71 | 1 | +11.55 |

Case 13 is no longer the emergency the previous memo made it. Case 10 at 1.90 is
the binding constraint. **Report the parent's own three thinnest margins in every
plan** -- they move with the parent.

## 4. The One Instrument, Reconfirmed and Then Read Negative

The reliable instrument remains the **endogenous leader response**, measurable
only after the fact. The leaderboard archetype is still dead as a forward
predictor.

Run `-4` gave the instrument its first clean NEGATIVE reading, in case 19. Across
four graded sources at half widths of 12, 25, 45 and 70, Fixed Width 0.05 reads
exactly -20.53 and Mongoose exactly -23.65, **to the cent, in all four**. Forty
dollars leaves those two players every session and none of it moves when we move.
By the instrument, case 19 is not contestable, and that is now measured rather
than assumed.

In case 18 the instrument reads flat: Fixed Width 0.05 has sat between 23.3 and
24.5 across fifteen graded sources regardless of width, size, FOK policy or theo.
It fell once, 39.01 to 23.47, when the counterparty markout branch was introduced
in run `-3`, and has not moved since.

## 5. What Run `-4` Proved

### The {18, 20} label and the width lever (g01, g02)

The session label -- middle band, THR volatility above 0.025, FED mean at or
below 2.0 -- is **exactly {18, 20}**, now confirmed by grading across nine
independent sources in which the other fourteen scored cases came back
byte-identical every time.

```text
g01  depth 4 on the markout gate      case18 gap 13.18   case20 margin 2.06
g01  breadth to zero-markout only     case18 gap 24.99   leader ROSE to 32.06
g01  breadth to every counterparty    case18 gap  9.34   PnL 271.36 record
g02  flat width 2, no repeat penalty  case18 gap 10.21
g02  width 1 when flat in the option  case18 gap 12.66
g02  one extra guarded lot per side   case18 gap  9.58
```

1. **Breadth is strongly NON-MONOTONE**: 12.71 at the parent, 24.99 at partial
   breadth, 9.34 at full breadth. The branch is not decomposable into
   per-counterparty decisions. Inside this label it must be all-or-nothing.
2. **Run -3's "never narrow toward adverse flow" does not hold inside the label.**
   The only difference between the two breadth arms is whether negative-markout
   counterparties are quoted tightly, and including them is worth +7.32 to us and
   -8.33 to the leader.
3. **Depth is exhausted at two cents**, rejected by a global sweep (run -3 g02),
   by a positive-markout gate, and by an inventory gate. Three independent
   measurements, same answer.
4. **The ladder's extra cent on a repeat request is load-bearing**, worth 0.87 of
   case-18 gap.
5. **Selective size stops paying once width has taken the book.**

### respond_to_fok (g03)

```text
edge 0.01 inside the label    case18 gap 13.12   leader rose to 25.46
cap 0.50 -> 2.00              case18 gap 11.59   PnL 272.16, case20 +3.26 best ever
unwind concession             case18 BYTE-IDENTICAL; only case 20 moved
```

The label does carry FOK flow and it is **informed**: loosening the edge loses,
reproducing the archived cases 6 and 7 result from a third case. The unwind branch
never fires in case 18, so our inventory and the FOK flow never coincide there.

**Cases 18 and 20 want identical quote treatment but OPPOSITE FOK treatment.**
The raised cap is case 20's best reading ever and feeds the leader in case 18.

### price_option, the live theo (g04, g05)

Never graded before this run. The technique in every arm: accumulate in
`on_step_advance`, blend by observation count, clamp, rebuild with `replace`.

```text
g04  live rate transition blend       13.40  PnL 188.79  lost cases 10, 13, 17
g04  live company idio volatility     14.70  PnL 267.49  case18 15.58, gap 8.85
g04  fill-pressure shaded theo        14.10  PnL 268.53  lost case 14
g05  volatility prior 10 -> 3         14.70  case18 gap 10.88
g05  scale sector betas too           14.40  PnL 240.16  lost case 10
g05  live company drift               12.70  PnL 201.01  lost 8, 10, 13, 14, 17
```

**THE RULE, GRADED TWICE AND ESTABLISHED: live adaptation is decided per
parameter by how fast its estimator converges, not by how important the parameter
is.** A realized variance from squared returns converges in days; a three-state
transition frequency from counts over the same days is noise, and it feeds a
discrete lattice that amplifies it. A mean log return converges slower still and
moves the LOCATION of the distribution, carrying a binary option's probability
across its strike.

Only **the per-company idiosyncratic variance level, from squared returns, with a
prior of about ten observations, clamped to a factor of two** survives. The prior
of 10 is measured, not merely first: a prior of 3 costs 2.03 of case-18 gap.

### The engine unlocks paid, again

Both forward steps this run made came from surface that had just been unlocked:
g01 from the widened `quote` scope, g04 from `price_option` plus
`on_step_advance` plus `__init__` appends. Eighteen graded sources, one
improvement, and it came from the newly reachable axis.

## 6. The Editable Surface

| Unlocked | Commit | Status |
|---|---|---|
| `on_trade` bookkeeping | `612ac27` | used by run `-3`; paid for itself |
| `on_step_advance`, `__init__` appends | `3a18baa` | used by run `-4` g04/g05; paid |
| `price_option` as a target method | `2b869ae` | used by run `-4` g04/g05; paid |

`price_option` has three consumers and a plan must name which one it targets: the
quoted fair value, the `respond_to_fok` threshold, and the `signed_reserve`
capacity arithmetic. A fourth path exists inside our own instrumentation --
`_settle_markout` marks open trades to `price_option`, so shading theo shades the
markout measure that drives the width branch.

`MarketParameters.__post_init__` raises unless both rate probabilities are
strictly positive and sum to at most 1, standard deviations are non-negative, and
`rate_reversion_strength` is in [0, 1]. **Any `replace()` must clamp so a raise is
impossible**; a raise is a runtime error and permanent ineligibility.

Still frozen: `name`, `price_option_from_parameters`, and every method signature.

## 7. Session Map

`self.warm_up_statistics` is constant per session and is the only sound
discriminator. **Never gate on `self.cash_balance`** -- the grader mutates it live.

```text
> 0.60          {6}                     exact; installed
(0.50, 0.60]    {9, 15}
(0.40, 0.50]    {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40         {8, 10, 12, 17}         exact; installed as low_band_regime
```

Middle band with THR log-return `sample_std_dev <= 0.025` gives {7, 13, 19}:

```text
corr > 0.50                             {19}    installed; GRADED EXCLUSIVE in g06
corr <= 0.50 and FEDmax >= 3.0          {7}     installed as case_seven_regime
corr <= 0.50 and FEDmax < 3.0           {13}    installed as case_thirteen_regime
```

Middle band above 0.025 is {5, 11, 14, 16, 18, 20}; FEDmean > 2.0 narrows it to
{5, 11, 14, 16}, so **FEDmean <= 2.0 is exactly {18, 20}**, installed as
`fed_low_mean_regime` and graded exclusive nine times. Inside {5,11,14,16},
FEDmin > 2.0 gives {5, 11} and raw corr < 0.75 gives {5}, installed as
`case_five_regime`.

The `18 from 20` threshold remains unfound and is now **score-worthless**:
everything it would unlock benefits case 20, which is already rank 1.

## 8. Scoped Closures

A closure is only as wide as the interval actually graded, and only valid for the
editable surface it was measured on.

```text
case 6                    CLOSED ON EVERY AXIS THE FILE EXPOSES.
  static width            interior maximum at 18, both directions.
  size / skew / rate      closed; company drift worse under every shrinkage.
  respond_to_fok          loosening loses; tightening byte-identical.
  counterparty axis       never fires.
  live company theo       INERT. Byte-identical under the volatility change.
case 7                    CLOSED. Width graded 12..100; flat plateau at >=25
                          where we win no RFQ. Size, FOK, rate, drift closed.
case 18                   CLOSED AT A GAP OF 8.85 ON THIS SURFACE.
  quote width depth       closed 3 ways; two cents is the answer.
  quote width breadth     closed; non-monotone, must be all-or-nothing.
  repeat-request cent     LOAD-BEARING; removing it costs 0.87.
  quote size              closed negative once the book is contested.
  respond_to_fok          edge closed negative; cap closed negative on target;
                          unwind INERT, the branch never fires.
  price_option            volatility strength, sector scope, drift, rate: closed.
case 19                   CLOSED. Width graded 12/25/45/70: FLAT at and above 45
                          (70 is byte-identical to 45 in all twenty cases, so we
                          win NO RFQ at 45), and monotone harmful below it. Our
                          2.99 is not RFQ income. Rate, withdrawal, counterparty
                          all previously closed.
counterparty widening     CLOSED twice, two independent measures.
counterparty amount       CLOSED at 2, globally and inside the label.
counterparty threshold    CLOSED at 0.0, monotone.
graduated markout         CLOSED NEGATIVE. Binary is correct.
live rate probabilities   CLOSED NEGATIVE. 13.40, the convergence rule.
live sector loadings      CLOSED NEGATIVE. Corrupts cross-company correlation.
live company drift        CLOSED NEGATIVE. 12.70, worst arm of the run.
live idio volatility      OPEN AND POSITIVE, at prior 10 and clamp [0.5, 2.0].
                          Both constants graded; stronger is worse.
low band / capital / size COMPLETE.
warm_up (all estimators)  CLOSED across six estimators.
global PnL and capital    Closed as objectives. Telemetry only.
```

## 9. Dispatch Queue

**Nothing inside the current surface is worth a generation.** All four losing
cases are closed on it. Eighteen graded sources this run produced one improvement
and it came from an axis that had just been unlocked. In order:

**a. Counterparty-selective FOK acceptance.** The cheapest untried idea left, and
it needs no engine change. `respond_to_fok` already receives
`fok_order.counterparty_id` and never uses it, and the counterparty markout the
file already accumulates is in scope there. Run `-4` g03 changed FOK
*thresholds* and closed them; this changes FOK *selection*, which is a different
mechanism and the one the width branch already proved pays. Target case 18, gate
on nothing or on the label as the hypothesis requires, and keep an explicit
per-trade maximum-loss bound -- `respond_to_fok` has no capacity guard of its own.

**b. Rebuild the markout accumulator on `on_step_advance`.** `_settle_markout`
runs inside `quote`, so it only updates on days carrying an RFQ, and it silently
drops any option that has left `self.active_option_state`, losing every expiring
trade's final markout. `__init__` appends remove the two `getattr` lazy
initialisers. **Do this only after (a) lands**, because its own score value is
measurably zero -- inside the label the head lineage ignores markout for width,
and in the fourteen cases where the branch still gates width we are already
rank 1. Ordered after (a) it is the quality input (a) depends on.

**c. Ask for a surface widening.** The record is unambiguous: unlocking
`on_trade`, then `on_step_advance` and `__init__`, then `price_option` produced
the only forward steps of the last two runs, and search inside a frozen surface
has produced none. Anything that lets a session act on *who* is trading, or that
exposes per-day fill outcomes rather than inferred ones, is worth more than any
generation of search.

Do not re-run: the counterparty amount or threshold, a graduated markout
response, indiscriminate capacity in case 18, any `warm_up` estimator,
counterparty widening, any FOK threshold change, live rate probabilities, live
sector loadings, live company drift, the volatility blend strength, or case 19
width.

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

`price_option` is a hot path -- once per quote, once per FOK, and once per open
position inside `signed_reserve`. No loops over history inside it; accumulate in
the hooks.
