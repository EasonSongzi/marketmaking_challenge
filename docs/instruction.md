# Score-Frontier Research After 14.70

## 1. Canonical State

```text
champion        g6-lowband-size-eight
source SHA      a01930269b7599e2e2d68ba8f1fa92215547a4651baf7d9ae4a5eb056e1a4e40
score           14.70 / 16.00
combined PnL    245.82                    telemetry only
gap sum         78.60 across four losing cases
held floor      0.96 minimum runner-up margin (case 10)
remaining       1.30 across cases 6, 7, 18, 19
```

Run `market-loop-20260821` moved 14.10 to 14.70. Run `market-loop-20260821-2` ran
six generations, promoted nothing, and lost nothing: the champion is byte-identical
to where that run started. Its entire output is negative evidence, and that output
is large. **Four of the five dispatch-ready paths the previous memo listed are now
closed on graded evidence, and the instrument that ranked them is falsified.**

Read Section 4 before designing anything. It is the correction, not a refinement.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is not
sign-aware: it scores "the leader fell" and "we rose" identically and can prefer
mutually destructive changes. Use `candidate_pipeline/frontier.sh <repo>` in its
default `report` mode as a per-case evidence lookup only, never as a selector.

**Known report defect.** The archived `market-loop-20260821` g06 analysis names the
twelve-lot rung as the generation winner. Selection actually took the eight-lot
rung on a candidate-ID tie. The promotion is correct under the score-only rule; the
report text is wrong and was left unedited because `results/` is hash-bound.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the champion. PnL and minimum capital are telemetry and never break
a tie. Every plan is schema version 3 with one `exploit` or `probe` objective.
Order score-equal candidates by target gain, target gap, modified lines, then
candidate ID; once a target reaches rank 1 its gap is 0, so a score-equal tie
between two winning arms collapses to candidate ID.

Declare `collateralBudgetHundredths: 0` only when the gate is exactly the target
set. Declare a real budget for anything global. Three generations of
`market-loop-20260821-2` did so at 400 and all nine arms landed inside it, so that
figure is calibrated for a global theo or quote change.

## 3. Rank and Risk Ledger

| Case | Cap | N | Rank | Score | Ours | Leader / runner-up | Gap or margin |
|---:|---:|---:|---:|---:|---:|---|---:|
| 5 | 10 | 2 | 1 | 1.00 | 33.80 | Stalemate Quoter 16.00 | margin 17.80 |
| 6 | 10 | 3 | 2 | .70 | 3.93 | Fixed Width .25 10.37 | gap 6.44 |
| 7 | 10 | 2 | 2 | .40 | 2.80 | Fixed Width .25 23.11 | gap 20.31 |
| 8 | 10 | 3 | 1 | 1.00 | 19.58 | Fixed Width .1 13.50 | margin 6.08 |
| 9 | 10 | 3 | 1 | 1.00 | 31.34 | Fixed Width .1 12.51 | margin 18.83 |
| 10 | 20 | 3 | 1 | 1.00 | 24.97 | Fixed Width .1 24.01 | **margin 0.96** |
| 11 | 20 | 3 | 1 | 1.00 | 21.17 | Fixed Width .1 .17 | margin 21.00 |
| 12 | 20 | 2 | 1 | 1.00 | 3.75 | Fixed Width .05 -6.50 | margin 10.25 |
| 13 | 20 | 4 | 1 | 1.00 | 11.28 | Fixed Width .1 8.87 | margin 2.41 |
| 14 | 20 | 3 | 1 | 1.00 | 17.29 | Lattice 13.99 | margin 3.30 |
| 15 | 20 | 3 | 1 | 1.00 | 13.03 | Lattice 6.74 | margin 6.29 |
| 16 | 40 | 3 | 1 | 1.00 | 27.07 | Fixed Width .05 8.43 | margin 18.64 |
| 17 | 40 | 4 | 1 | 1.00 | 24.97 | Situational 6.10 | margin 18.87 |
| 18 | 40 | 4 | 2 | .80 | 7.44 | Fixed Width .05 39.01 | gap 31.57 |
| 19 | 40 | 4 | 2 | .80 | 3.17 | Situational 23.45 | gap 20.28 |
| 20 | 40 | 4 | 1 | 1.00 | .23 | Lattice -12.26 | margin 12.49 |

**Case 10 at margin 0.96 is the most fragile rank in the repository** and must be
reported by every generation, ahead of case 13 at 2.41 and case 14 at 3.30. All
three are genuinely fragile: `market-loop-20260821-2` lost case 10 in five separate
arms and case 14 in six, across three unrelated global levers.

## 4. Do NOT Read the Leaderboard Archetype

**The archetype rule is dead as a forward predictor. This section replaces it.**

The old rule said the archetype that earns gives the sign of the width and size
levers: where a tight quoter earns, flow is benign and taking more of it pays.
Run `market-loop-20260821-2` g01 falsified it on the case it most confidently
predicted. Case 18 has `Fixed Width .05` earning 39.01, the textbook benign
signature. Giving case 18 four times the deployable capital and up to sixteen lots
a side took it from 7.44 to **-3.36**, rank 2 to rank 3.

The reliable instrument is the **endogenous leader response**, and it is only
measurable after the fact:

```text
case 8    leader 27.86 -> 26.01 as we rose      contestable   flip paid
case 10   leader 35.17 -> 32.43 as we rose      contestable   flip paid
case 18   leader 39.01 -> 42.55 as we rose      NOT contestable
```

In case 18 we did not take profitable flow from the leader, we absorbed flow the
leader was declining. A competitor earning tells you nothing about which flow
reaches *us*. Treat the archetype column as a hypothesis to be priced by a run,
never as evidence that licenses a design.

Two corollaries, both graded:

- **Full withdrawal pays only against a counterparty that does not compete.**
  Case 5 earns 33.80 at a 0.00 bid and 1.00 offer because Stalemate Quoter wins no
  RFQ, so everything routes to us at the worst prices the challenge permits. The
  identical treatment in case 7, the only other two-participant session, was
  byte-identical to the champion in all twenty cases. Inert.
- **Repeat counterparties are the source of our spread income, not a threat.**
  Widening against them by two cents cost 0.90 points.

## 5. What the 14.70 Promotion Proved

The champion reserved three quarters of capital unconditionally, so a ten-dollar
session could deploy only 2.50. Relaxing that inside the exact low-band label
lifted cases 8 and 10 but **saturated immediately**: a threefold change in
deployable capital bought 0.09 in case 10 and nothing in case 8. That identified
the five-lot bid and six-lot offer ceilings as the real constraint. Lifting those,
with every added lot still tested by the file's own `signed_reserve` and
`available_capacity` arithmetic, produced the flip.

```text
case 8    6.95 -> 8.51 (floor) -> 19.58 (ceiling)   rank 2 -> 1
case 10  14.17 -> 16.16 (floor) -> 24.97 (ceiling)  rank 2 -> 1
```

Three durable lessons, all still standing:

1. **That shortfall was not a pricing error.** It was a self-imposed capacity
   limit, and no theo change was needed to gain 0.60.
2. **Declined RFQ flow is routed, not destroyed** — but only where the flow is
   contestable. Section 4 is the test, and it is retrospective.
3. **A session-constant warm-up gate is what makes this safe.** The same
   experiment failed earlier because it gated on `self.cash_balance < 20` and case
   14 leaked in through a mid-episode cash dip.

## 6. Session Map

`self.warm_up_statistics` is constant per session and is the only sound session
discriminator. Never use `self.cash_balance` for identity: the grader mutates it,
and that error has already cost one run its rank.

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
{5, 11, 14, 16}, so **FEDmean <= 2.0 is exactly {18, 20}** — confirmed by grading
in `market-loop-20260821-2` g01, where all eighteen other cases came back
byte-identical. Inside {5,11,14,16}, FEDmin > 2.0 gives {5, 11} and raw corr < 0.75
gives {5} alone, installed as `case_five_regime`.

The `> 0.60` label was independently confirmed exclusive to case 6 from inside
`respond_to_fok` in g04, again by byte-identity of all nineteen other cases.

One threshold remains unfound: **18 from 20**. It is not worth finding. The two
want opposite treatments, but case 20 is already rank 1, so separating them buys
telemetry only.

## 7. Scoped Closures

A closure is only as wide as the interval actually graded. Enumerate the graded
points before trusting one.

```text
case 6                          CLOSED ON EVERY AXIS THE FILE EXPOSES.
  static width                  interior maximum at 18, both directions.
  size upward                   8, 12, 16 lots each strictly worse.
  skew                          both directions; tight offer catastrophic.
  rate model                    byte-identical under 3 estimators incl. full refit.
  company drift                 worse under every shrinkage: 3.07 / 2.32 / 2.12.
  respond_to_fok loosening      loses money.
  respond_to_fok tightening     edge 0.10 and cap 0.10 both byte-identical;
                                declining the WHOLE book is worth +0.04.
  counterparty axis             never fires; no repeat counterparties there.
case 7                          CLOSED.
  quote width                   graded 12,16,20,25,35,45,55,100. 25->100 is a flat
                                plateau at 2.80: at >=25 we already win no RFQ, so
                                2.80 is the pure non-participation baseline.
  size at the 0/1 boundary      12 and 20 lots identical, both LOSE 0.22.
  respond_to_fok                closed both directions.
  rate model / drift            worse (drift-half gave 4.08, best on record, but
                                arrived with a 1.90 point loss elsewhere).
case 18
  capacity and ceiling          CLOSED NEGATIVE. floor 0.75->0.0 crossed with
                                ceilings ~5/6, 8, 16: 7.44 -> -3.36 / -1.62 / -1.64.
                                Saturated; nearly all damage is the floor.
  rate model / drift            closed; drift shrinkage destroys it.
  counterparty surcharge        INTERIOR OPTIMUM at +2 cents: 7.44 -> 9.18, the
                                best case-18 reading on record. See Section 8.
case 19
  rate model                    byte-identical under all three estimators.
  withdrawal                    inert by Section 4; three competitors quote real
                                prices, so 0.00/1.00 wins nothing.
  width                         NEVER SWEPT. The only ungraded axis on the board.
low band / capital and size     COMPLETE. Champion sits on both plateaus.
warm_up / rate_target           CLOSED AT THE HARD-CODED 2.0, both directions.
                                Damage monotone in distance: 14.70 / 13.80 / 13.50
                                at 0.0 / 0.5 / 1.0 of the way to the history mean,
                                plus a free penalized fit. 2.0 is the generator's
                                value; estimating it only overfits.
warm_up / company drift         CLOSED AT FULL STRENGTH. Monotone in how much
                                drift survives: 13.00 / 12.80 / 12.10 for
                                significance-shrunk / half / zero. The drift is
                                real signal; removing it costs 2.60 and 124.73 PnL.
counterparty widening           CLOSED. 13.80 / 13.30 / 13.60 at +2c / +5c /
                                withdraw-at-3. Repeat counterparties carry our PnL.
global PnL and capital ratio    Closed as objectives. Telemetry only.
```

## 8. What Is Actually Left

**There is no dispatch-ready positive-score path.** The previous memo listed five;
four are now closed and the fifth was answered. Say so plainly rather than
re-running a closed axis.

```text
1. case 18 capacity      CLOSED NEGATIVE by g01.
2. case 6 FOK tightening CLOSED by g04; whole book worth 0.04.
3. case 19 withdrawal    Mechanism proven inert by g05.
4. case 7 size           CLOSED by g05 at the boundary; width closed 8-100.
5. warm_up estimation    ANSWERED. Both halves walked in both directions across
                         six estimators. The estimator the file already has beats
                         all of them. The 14.70 shortfall is NOT a
                         parameter-estimation failure.
```

The honest position: the remaining 1.30 is not reachable by tuning any lever the
current structure exposes, and all four losing cases now have a documented reason
why. A future run wanting score needs a structural idea outside this catalogue.

Three leads survive, in order, and none is strong:

**a. Quote repeat counterparties TIGHTER.** This is the one counterparty variant
never run and the only counterparty hypothesis still standing. g06 proved repeat
counterparties are our income; the untested inference is that we should compete
harder for them, not less. Global, so budget 400 and expect the thin margins at
0.96, 2.41 and 3.30 to be the binding constraint.

**b. Case 18 at a +2-cent counterparty surcharge.** The only treatment that has
ever moved case 18 upward, 7.44 to 9.18. It scores nothing on its own — rank needs
39.01 — but it is the only positive signal on that case and it says case-18 flow
really is partly informed at the counterparty level. Worth revisiting only if (a)
finds a way to keep it without the 0.90 collateral.

**c. Case 19 width.** The last ungraded axis. Zero collateral on an exclusive gate,
and worth approximately zero: tighter takes more of a session that bankrupts
Fixed Width .05 at -20.53, and wider is proven inert. Run it only to complete the
map, never expecting score.

## 9. Hard Invariants

Preserve core method signatures and repository scope rules; compile and pass the
method-level validator before a live run; emit no stdout from `MarketMaker`; never
rerun a completed source SHA; runtime errors are always ineligible; cases 1-4 must
pass; ranking, cash, result, source SHA and raw evidence must parse consistently;
one browser session and one Git lifecycle mutation at a time.

The challenge charges cash equal to a trade's **maximum loss**. A 0.00 buy and a
1.00 sell each charge nothing, which is why unbounded size is safe at that quote
and only there. Any override that bypasses the file's `signed_reserve` and
`available_capacity` guards must bound its own per-fill charge, and that applies
with full force to `respond_to_fok`, which still has no such guard at all.

`self.cash_balance` is the **live** balance the grader mutates, not starting
capital. Never gate a session label on it.
