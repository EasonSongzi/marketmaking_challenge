# Score-Frontier Research After market-loop-20260821-3

## 1. Canonical State

```text
champion        g6-lowband-size-eight
source SHA      a01930269b7599e2e2d68ba8f1fa92215547a4651baf7d9ae4a5eb056e1a4e40
score           14.70 / 16.00
combined PnL    245.82                    telemetry only
gap sum         78.60 across cases 6, 7, 18, 19
thinnest margin 0.96 at case 10

head challenger market-loop-20260821-3-g03-g3-markout-size-bonus   revision 0
source SHA      0ccaeed0c68191e1e060dad0f970c111b2e58dad3a1abe1fdcf8ec329d795ef2
score           14.70, tied, not promotable
combined PnL    261.79                    repository record among 20/20 sources
gap sum         58.95, 19.65 below the champion's
thinnest margin 0.65 at case 13
tuningAttempts  0
```

Run `market-loop-20260821-3` ran three generations, promoted nothing, and produced
the most valuable evidence in the repository's history. **It did not close the
board; it reopened it.** The previous memo's Section 8 declared no dispatch-ready
positive-score path existed. That statement is now false, and the reason it was
false is that the memo was reasoning about a frozen editable surface which has since
been widened three times.

**The run is dormant, not finished.** It sits at `status: "active"`, generation 3 of
6, by operator decision. The engine recognises exactly two stop conditions —
`getStopReason` in `candidate_pipeline/src/loop.mjs:577` returns non-null only at
15.00 or after six completed generations — so `loop.sh finish` refuses it, and
`results/runs/` is hash-bound and must never be hand-edited to force one. Nothing
else is outstanding: no worktrees are registered, no processes are running, g03 is
archived, and the report is committed at `483e797`. `startRun` has no cross-run
guard, so a new run ID may be started while this one stays dormant. Resuming it
instead is also legitimate and costs nothing.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is not
sign-aware: it scores "the leader fell" and "we rose" identically and can prefer
mutually destructive changes. Use `candidate_pipeline/frontier.sh <repo>` in its
default `report` mode as a per-case evidence lookup only, never as a selector.

**Two archived reports are known-wrong and cannot be edited.** The
`market-loop-20260821` g06 analysis names the twelve-lot rung as generation winner
when selection actually took the eight-lot rung on a candidate-ID tie. The
`market-loop-20260821-3` g01 analysis, repeated in two later plan rationales, claims
the counterparty branch narrows case 10 to a 0.55 margin and calls it the binding
constraint; that is an endogeneity error, corrected in Section 4, and the true
figure is 1.54 — **wider** than the champion's. Both corrections live here because
`results/` is hash-bound.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the champion. PnL and minimum capital are telemetry and never break
a tie. Every plan is schema version 3 with one `exploit` or `probe` objective.
Order score-equal candidates by target gain, target gap, modified lines, then
candidate ID.

Declare `collateralBudgetHundredths: 0` only when the gate is exactly the target
set. Declare a real budget for anything global; 400 is calibrated for a global theo
or quote change, 200 for a change gated on a measured condition.

The head challenger is tied at 14.70 with the best PnL on record. **It needs exactly
one scored case to flip in order to promote.** Every plan that parents off it should
be read against that fact: it is the cheapest promotion the repository has ever
been positioned for, and case 18 at a 12.71 gap is the closest any losing case has
ever come to rank 1.

## 3. Rank and Risk Ledger

Champion on the left, head challenger on the right. Both at 14.70.

| Case | Cap | N | Champion PnL | Rank | Gap/margin | Challenger PnL | Rank | Gap/margin |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 5 | 10 | 2 | 33.80 | 1 | +17.80 | 33.80 | 1 | +17.80 |
| 6 | 10 | 3 | 3.93 | 2 | -6.44 | 3.42 | 2 | -7.08 |
| 7 | 10 | 2 | 2.80 | 2 | -20.31 | 3.55 | 2 | -18.81 |
| 8 | 10 | 3 | 19.58 | 1 | +6.08 | 23.84 | 1 | +15.69 |
| 9 | 10 | 3 | 31.34 | 1 | +18.83 | 35.75 | 1 | +28.81 |
| 10 | 20 | 3 | 24.97 | 1 | **+0.96** | 24.77 | 1 | +1.98 |
| 11 | 20 | 3 | 21.17 | 1 | +21.00 | 21.13 | 1 | +20.96 |
| 12 | 20 | 2 | 3.75 | 1 | +10.25 | 7.63 | 1 | +18.15 |
| 13 | 20 | 4 | 11.28 | 1 | +2.41 | 9.32 | 1 | **+0.65** |
| 14 | 20 | 3 | 17.29 | 1 | +3.30 | 17.75 | 1 | +5.74 |
| 15 | 20 | 3 | 13.03 | 1 | +6.29 | 16.89 | 1 | +11.54 |
| 16 | 40 | 3 | 27.07 | 1 | +18.64 | 32.17 | 1 | +23.26 |
| 17 | 40 | 4 | 24.97 | 1 | +18.87 | 21.60 | 1 | +15.23 |
| 18 | 40 | 4 | 7.44 | 2 | -31.57 | 10.76 | 2 | **-12.71** |
| 19 | 40 | 4 | 3.17 | 2 | -20.28 | 3.10 | 2 | -20.35 |
| 20 | 40 | 4 | 0.23 | 1 | +12.49 | -3.69 | 1 | +7.53 |

**The binding constraint moves with the parent.** Under the champion it is case 10
at 0.96, then 13 at 2.41 and 14 at 3.30. Under the head challenger it is **case 13
at 0.65**, then 10 at 1.98 and 14 at 5.74. A plan that parents off the challenger
and reports case 10 as its risk is reporting the wrong case. Every generation must
report the thinnest three margins **of its own parent**.

## 4. Endogeneity: The One Instrument, and How It Was Misread

The leaderboard archetype remains dead as a forward predictor, for the reason the
previous memo gave: case 18 has `Fixed Width 0.05` earning 39.01, the textbook
benign signature, and handing that session four times the capital took it from 7.44
to -3.36. A competitor earning tells you nothing about which flow reaches us.

The reliable instrument is still the **endogenous leader response**, measurable only
after the fact. Run `-3` produced the largest reading ever recorded:

```text
case 18   champion  we 7.44   leader Fixed Width 0.05 39.01   gap 31.57
          challenger we 9.61  leader Fixed Width 0.05 23.15   gap 13.54
          the leader fell 15.86 while we rose 2.17 -> gap closed 18.03 in one step
```

The previous best one-step closure was 4.73. **Case 18 is contestable.** The
previous memo concluded it was not, from a capacity treatment that handed extra size
to every counterparty including the informed ones. The flow is separable: taken
selectively it both earns us money and denies the leader far more than it earns us.

**The same endogeneity invalidates naive margin comparisons, and it already cost
one analysis its conclusion.** The runner-up's PnL is not a fixed post to measure
against — it is the runner-up's PnL *in our own session*, and it moves when we move.
The g01 analysis measured the challenger's case-10 PnL of 24.56 against the
*champion's* runner-up figure of 24.01 and reported a 0.55 margin, the tightest in
the repository. In the challenger's own session that runner-up falls to 23.02, so
the true margin is 1.54, wider than the champion's 0.96. The counterparty branch
does not endanger case 10; it protects it. **Never compare a candidate's PnL against
a figure drawn from a different source's session.**

Two corollaries survive from earlier runs, both graded:

- **Full withdrawal pays only against a counterparty that does not compete.** Case 5
  earns 33.80 at a 0.00/1.00 quote because Stalemate Quoter wins no RFQ. The
  identical treatment in case 7 was byte-identical to the champion in all twenty
  cases. Inert.
- **Repeat counterparties are our income, not a threat.** Section 5 now says this
  much more sharply.

## 5. What Run `-3` Proved

### The counterparty markout branch

`on_trade` records `(counterparty_id, option_id, quantity, theo_at_fill)`; a
settlement pass marks each open trade to the current theo and accumulates a signed
per-counterparty markout; `quote` narrows by two cents against any counterparty
whose accumulated markout is positive.

```text
g01  widen against negative markout        13.60   worst arm of the generation
g01  instant-edge proxy                    14.00
g01  narrow toward positive markout        14.70   PnL 257.31, all 16 ranks held
g02  amount 1 / 2 / 4 / 8      PnL 249.34 / 257.31 / 238.37 / 240.19
                               score 14.70 / 14.70 / 14.10 / 14.40
g02  threshold 0.0 / 0.5 / 2.0 / 5.0   PnL 257.31 / 251.78 / 249.84 / 245.82
g03  selective size bonus                  14.70   PnL 261.79, case 18 = 10.76
g03  selective size ladder (8 lots)        14.70   PnL 263.63, case 18 worse
g03  response scaled by markout magnitude  14.70   PnL 247.16, case 18 backwards
```

Four findings, each independently decisive:

1. **The sign is the opposite of the classic one: tighten, do not widen.** Widening
   is the single most damaging response tested, and this reproduces the previous
   run's fill-proxy result from the other direction.
2. **The branch is the entire gain, proven by natural experiment.** At threshold
   5.0 the branch never fires in any of the twenty cases and PnL reads 245.82 —
   the champion's figure to the cent. Nothing else in the diff contributes.
3. **The binary form is correct and both constants are at their optimum.** The
   amount has an interior maximum at 2, with 4 and 8 both *losing score*. The
   threshold declines monotonically from 0.0, so any positive markout however small
   deserves the full response. Graduating the response by confidence (`g3-markout-
   scaled-width`) destroys value and is the only arm that moved case 18 backwards.
   **Do not tune this branch again** — a second unsuccessful batch retires the
   lineage for nothing.
4. **Width and size act on different things.** The width lever takes flow *from*
   the leader: 39.01 -> 23.15. The size lever does not: 23.15 -> 23.47 -> 24.00 as
   our own PnL climbs. Selective size earns without denying, so **it can never close
   a rank gap on its own.** Any generation intending to flip case 18 must move the
   width lever.

### Where the counterparty axis cannot reach

Cases 6, 7 and 19 have no repeat-counterparty structure for any counterparty rule to
act on. Case 19 was byte-identical across all three g01 arms; g06 of the previous
run established the same for cases 6 and 7. **Case 18 is the only losing case the
counterparty axis can touch.**

### The engine change paid for itself

Unlocking `on_trade` is what made the measurement possible. The previous run had to
infer fills by differencing position snapshots inside `quote`, a proxy blind to
execution price, and drew a directionally correct but unusable conclusion. With a
real signed markout the same axis set a PnL record on the first attempt. **Widening
the editable surface has been worth more than any six generations of tuning inside
it.** Section 6 is therefore the most important section in this memo.

## 6. The Editable Surface (READ BEFORE DESIGNING)

The frozen surface the previous memo reasoned about no longer exists. Three
unlocks landed after g03 of run `-3` was archived, so **no generation in the
repository has ever used them**:

| Unlocked | Commit | Status |
|---|---|---|
| `on_trade` bookkeeping | `612ac27` | used by run `-3`; paid for itself |
| `on_step_advance` bookkeeping, `__init__` appends | `3a18baa` | **never used** |
| `price_option` as a target method | `2b869ae` | **never used** |

- **`price_option` is a target of its own, never bookkeeping.** It is the live theo
  and the only way to make theo state-dependent, because `warm_up` runs once and
  yields a session constant. It has three consumers and the plan must name which one
  it targets: the quoted fair value, the `respond_to_fok` threshold, and the
  `signed_reserve` capacity arithmetic. The third fuses pricing with sizing;
  `signed_reserve` sums only over non-zero positions, so that coupling is absent on
  a flat book and appears only with inventory. Prefer a first generation where the
  reserve effect is provably small. `price_option_from_parameters` stays frozen and
  the THEO case scores it directly, so a `price_option` generation cannot risk
  case 1.
- **`on_step_advance` sees what `quote` cannot**: the day boundary, the previous
  underlying state before it is overwritten, the options that expired out of the
  active book, and **every day including those with no RFQ**. Its baseline
  assignments of `self.underlying_state` and `self.active_option_state` must survive.
- **`__init__` may only be appended to**, each statement assigning a `self._`
  attribute to a constant, literal container, or empty container factory call.
  Anything computed belongs in the target method.
- Still frozen: `name`, `price_option_from_parameters`, and every method signature.

## 7. Session Map

`self.warm_up_statistics` is constant per session and is the only sound session
discriminator. Never gate on `self.cash_balance`: it is the live balance the grader
mutates, and that error has already cost one run its rank.

```text
> 0.60          {6}                     exact; installed
(0.50, 0.60]    {9, 15}
(0.40, 0.50]    {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40         {8, 10, 12, 17}         exact; installed as low_band_regime
```

Middle band with THR log-return `sample_std_dev <= 0.025` gives {7, 13, 19}:

```text
corr > 0.50                             {19}    installed as case_nineteen_regime
corr <= 0.50 and FEDmax >= 3.0          {7}     installed as case_seven_regime
corr <= 0.50 and FEDmax < 3.0           {13}    installed as case_thirteen_regime
```

Middle band above 0.025 is {5, 11, 14, 16, 18, 20}. FEDmean > 2.0 narrows it to
{5, 11, 14, 16}, so **FEDmean <= 2.0 is exactly {18, 20}** — confirmed by grading,
where all eighteen other cases came back byte-identical. Inside {5,11,14,16},
FEDmin > 2.0 gives {5, 11} and raw corr < 0.75 gives {5} alone, installed as
`case_five_regime`. The `> 0.60` label was independently confirmed exclusive to
case 6 from inside `respond_to_fok`.

The `18 from 20` threshold remains unfound. The two want opposite treatments, but
case 20 is already rank 1, so separating them buys telemetry only — **unless** a
case-18 width treatment gated on the shared label starts costing case 20, in which
case finding it becomes the blocking problem. Section 9(a) is exactly that risk.

## 8. Scoped Closures

A closure is only as wide as the interval actually graded, and **a closure is only
valid for the editable surface it was measured on**. Both case-18 entries below were
reversed once the surface widened.

```text
case 6                          CLOSED ON EVERY AXIS THE FILE EXPOSES.
  static width                  interior maximum at 18, both directions.
  size upward                   8, 12, 16 lots each strictly worse.
  skew                          both directions; tight offer catastrophic.
  rate model                    byte-identical under 3 estimators incl. full refit.
  company drift                 worse under every shrinkage: 3.07 / 2.32 / 2.12.
  respond_to_fok                loosening loses; tightening byte-identical;
                                declining the WHOLE book is worth +0.04.
  counterparty axis             never fires; no repeat counterparties there.
case 7                          CLOSED on the current surface.
  quote width                   graded 12,16,20,25,35,45,55,100. 25->100 is a flat
                                plateau at 2.80: at >=25 we win no RFQ.
  size at the 0/1 boundary      12 and 20 lots identical, both LOSE 0.22.
  respond_to_fok / rate / drift closed.
  counterparty axis             never fires.
case 18
  INDISCRIMINATE capacity       CLOSED NEGATIVE. 7.44 -> -3.36 / -1.62 / -1.64.
  SELECTIVE capacity            OPEN AND POSITIVE. 9.61 -> 10.76 on positive-markout
                                counterparties only, best reading ever. But the
                                leader is flat, so size alone cannot flip the rank.
  width via counterparty        THE LEVER THAT WORKS. Gap 31.57 -> 13.54 -> 12.71.
  rate model / drift            closed; drift shrinkage destroys it.
case 19
  rate model                    byte-identical under all three estimators.
  withdrawal                    inert; three competitors quote real prices.
  counterparty axis             never fires; byte-identical in all g01 arms.
  width                         NEVER SWEPT. Still the only ungraded axis.
counterparty widening           CLOSED, twice, from two independent measures.
counterparty narrowing amount   CLOSED at the interior optimum 2 (1/2/4/8 graded).
counterparty threshold          CLOSED at 0.0, monotone (0.0/0.5/2.0/5.0 graded).
graduated markout response      CLOSED NEGATIVE. Binary is correct.
low band / capital and size     COMPLETE. Champion sits on both plateaus.
warm_up / rate_target           CLOSED AT THE HARD-CODED 2.0, damage monotone in
                                distance. 2.0 is the generator's value.
warm_up / company drift         CLOSED AT FULL STRENGTH. Removing it costs 2.60.
warm_up estimation              ANSWERED across six estimators. The 14.70 shortfall
                                is NOT a parameter-estimation failure.
global PnL and capital ratio    Closed as objectives. Telemetry only.
```

## 9. Dispatch Queue

Unlike the previous memo, this one has real candidates. In order:

**a. Case-18 width, confined to the `{18, 20}` label.** The strongest lead the
repository has. Width is the lever that moves the leader; the global narrowing
amount is measured to an interior optimum at 2 with 4 and 8 losing score, and the
resolution is to stop applying the aggressive amount globally. Confine a larger
narrowing to middle band / THR volatility above 0.025 / FEDmean <= 2.0 — an
exclusively-graded label — on top of the existing positive-markout condition, and
walk it at roughly 4, 6 and 8 while the global amount stays at 2. Parent is the head
challenger. Declared collateral is **case 20**, which shares the label and holds
rank 1 at +7.53; an arm that takes case 20 loses a full point against case 18's
0.20 and is disqualified regardless of PnL. Report case 13 at 0.65 as well.

**b. `price_option`, the live theo.** Never reachable before `2b869ae`. It is the
only route to a state-dependent theo and the one axis in this repository that has
never been graded at all. Name the consumer in the plan. The natural first
hypothesis is that our theo is correct on average but stale within a day, and that
the quoted fair value — not the FOK threshold, not the reserve arithmetic — should
respond to the drift the file already estimates. A probe objective is legitimate
here; the unlock statement writes itself.

**c. Rebuild the markout branch on the surface it deserves.** The existing branch
was written when `on_step_advance` and `__init__` were frozen, and it shows: state
is lazily initialised with `getattr` in two places, and `_settle_markout` runs
inside `quote`, so it only updates on days that carry an RFQ and it silently drops
any option that has left `self.active_option_state` — every expiring trade loses its
final markout. Settling in `on_step_advance` fixes both, and `__init__` appends
remove the lazy initialisers. This is a strictly better measurement of a lever
already proven to pay, and it is the cheapest structural work on the board. It is
not a tuning batch and does not count against the lineage's tuning attempts.

**d. Case 19 width.** The last ungraded axis, zero collateral on an exclusive gate,
expected value approximately zero. Run it only to complete the map.

Do not re-run: the counterparty amount, the counterparty threshold, a graduated
markout response, indiscriminate capacity in case 18, any `warm_up` estimator, or
counterparty widening in any form.

## 10. Hard Invariants

Preserve core method signatures and repository scope rules; compile and pass the
method-level validator before a live run; emit no stdout from `MarketMaker`; never
rerun a completed source SHA; runtime errors are always ineligible; cases 1-4 must
pass; ranking, cash, result, source SHA and raw evidence must parse consistently;
one browser session and one Git lifecycle mutation at a time.

The challenge charges cash equal to a trade's **maximum loss**. A 0.00 buy and a
1.00 sell each charge nothing, which is why unbounded size is safe at that quote and
only there. Any override that bypasses the file's `signed_reserve` and
`available_capacity` guards must bound its own per-fill charge, and that applies with
full force to `respond_to_fok`, which still has no such guard at all.

`self.cash_balance` is the **live** balance the grader mutates, not starting capital.
Never gate a session label on it.
