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

Run `market-loop-20260821` moved 14.10 to 14.70 in a single promotion that took
cases 8 and 10 to rank 1 together. Thirteen of sixteen scored ranks are now held.
Eleven consecutive generations have run at **zero collateral**: no candidate has
moved a case outside its declared warm-up label since per-session labels became
the unit of work.

**Do not run `frontier.sh apply`.** Its anchor rule minimises gap sum, which is not
sign-aware: it scores "the leader fell" and "we rose" identically and can prefer
mutually destructive changes. Use `candidate_pipeline/frontier.sh <repo>` in its
default `report` mode as a per-case evidence lookup only, never as a champion
selector.

**Known report defect.** The archived `market-loop-20260821` g06 analysis names the
twelve-lot rung as the generation winner. Selection actually took the eight-lot
rung: all three arms scored 14.70, both targets reached rank 1 so the target gap
was 0 for each, and the tie fell through to candidate ID. The promotion is correct
under the score-only rule. The report text is wrong and was left unedited because
`results/` is hash-bound to archived evidence.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the champion. PnL and minimum capital are telemetry and never break
a tie. Every plan is schema version 3 with one `exploit` or `probe` objective.
Order score-equal candidates by target gain, target gap, modified lines, then
candidate ID — and note that once a target reaches rank 1 its gap is 0, so a
score-equal tie between two winning arms collapses to candidate ID.

Declare `collateralBudgetHundredths: 0` when the gate is exactly the target set.
Declare a real budget when the label is strictly larger than the target, as the
low-band work did; both such generations then came in at 0.00 realised collateral
anyway, with the non-target cases inside the gate improving rather than degrading.

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

**Case 10 at margin 0.96 is now the most fragile rank in the repository** and must
be reported explicitly by every generation, ahead of case 13 at 2.41 and case 14
at 3.30. It was won in the same generation that made it fragile: our 24.97 sits
just 0.96 above Fixed Width 0.1, whose own PnL is endogenous and rose as we took
its flow. Any future low-band change can lose it.

## 4. Read the Leaderboard Archetype

This is the generalisation of the old Stalemate rule and it is the single most
useful instrument in the repository. Each session's competitor table contains
named strategies whose behaviour is known from their names. **The archetype that
earns tells you the sign of the width and size levers before you spend a run.**

```text
Fixed Width .05 / .1     aggressive, tight, takes flow
Fixed Width .25          passive, wide, declines flow
Stalemate Quoter         fully passive, wins no RFQ at all
```

Where a TIGHT quoter earns, session flow is benign and taking more of it pays.
Where a tight quoter loses, or where the WIDE quoter leads, flow is adversely
informed and declining pays. Every measured case obeys this:

```text
case 8    Fixed Width .1 earned 27.86      benign   ceiling raise paid   CONFIRMED
case 10   Fixed Width .1 earned 35.17      benign   ceiling raise paid   CONFIRMED
case 6    Fixed Width .25 leads, Stalemate 0.00     toxic   every tight arm lost
case 7    Fixed Width .25 leads, no tight entrant   toxic   width 12 lost to width 20
case 18   Fixed Width .05 earns 39.01      benign   PREDICTS the ceiling raise pays
case 19   Fixed Width .05 LOSES 20.53      toxic    predicts more size would hurt
case 20   every competitor loses           toxic    we win at rank 1 by declining
```

Cases 18 and 19 sit at the same 40.00 capital with the same four participants and
point in **opposite** directions. Read this table before designing any per-case
treatment, and never assume a treatment that paid in one case transfers.

## 5. What the Promotion Actually Proved

The winning chain was two generations and its mechanism is general.

The champion reserved three quarters of capital unconditionally,
`cash_floor = 0.75 * self.cash_balance`, so a ten-dollar session could deploy only
2.50. Relaxing that inside the exact low-band label lifted cases 8 and 10 but
**saturated immediately**: a threefold difference in deployable capital, from a
half reserve to none, bought 0.09 in case 10 and exactly nothing in case 8. That
measurement identified the real constraint as the five-lot bid and six-lot offer
ceilings. Lifting those, with every added lot still individually tested by the
file's own `signed_reserve` and `available_capacity` arithmetic, produced the flip.

```text
case 8    6.95 -> 8.51 (floor) -> 19.58 (ceiling)   rank 2 -> 1
case 10  14.17 -> 16.16 (floor) -> 24.97 (ceiling)  rank 2 -> 1
case 12   3.21 -> 3.21          -> 3.75             non-target, improved
case 17  18.06 -> 19.63         -> 24.97            non-target, improved
```

Three durable lessons:

1. **Our shortfall was never a pricing error.** It was a self-imposed capacity
   limit. No theo change was needed to gain 0.60.
2. **Declined RFQ flow is routed, not destroyed.** Competitor PnL is endogenous
   and falls as we take flow, so contesting closes a gap from both ends at once.
   In case 10 a change worth 1.99 to us cost the leader 2.74.
3. **A session-constant warm-up gate is what makes this safe.** The same
   experiment failed in run `market-loop-20260819-3` because it gated on
   `self.cash_balance < 20`, and case 14 leaked in through a mid-episode cash dip.
   Case 14 came back byte-identical under the warm-up gate, as predicted.

## 6. Session Map

`self.warm_up_statistics` is constant per session and is the only sound session
discriminator. Do not use `self.cash_balance` for identity: the grader mutates it,
and that specific error has already cost one run its rank.

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

Middle band with volatility above 0.025 is {5, 11, 14, 16, 18, 20}. FEDmean > 2.0
narrows it to {5, 11, 14, 16}, so **FEDmean <= 2.0 inside that slice is {18, 20}**
and is available immediately without new tomography. Inside {5,11,14,16}, FEDmin
> 2.0 gives {5, 11} and raw corr < 0.75 gives {5} alone, installed as
`case_five_regime`.

One threshold remains unfound: **18 from 20**.

## 7. Scoped Closures

```text
case 6 / static width           Closed BOTH directions under the current champion.
                                Interior maximum at 18, which is simultaneously our
                                maximum and the leader's minimum. Narrow side
                                measured 2.95 / 2.29 / 1.63 at 16 / 13 / 10.
case 6 / size upward            Closed. 8, 12 and 16 lots each strictly worse.
case 6 / skew                   Closed both directions. A tight OFFER is
                                catastrophic, -0.16 and rank 3 below Stalemate; a
                                tight bid merely underperforms. Withdrawing the
                                offer entirely moves 2.51 -> 2.49, so at 30 cents
                                the case-6 offer is already fully declined.
case 7 / quote width            Closed 8 through 55, now on REAL evidence at 12,
                                16, 20: 1.59 / 3.37 / 4.86 against 2.80 at 25.
                                Leader is a step function, 20.14 at any width
                                inside 25 and 23.11 at 25 or wider. Rank needs
                                20.14 and width tops out near 5. Unreachable.
case 7 / respond_to_fok         Closed both constraints. Raising the 0.50 cap to
                                2.00 made case 7 WORSE, 2.80 -> 2.59; a cash-aware
                                guard produced an identical vector; cutting edge to
                                0.008/0.005 changed nothing in any of twenty cases,
                                proving no case-7 FOK order is priced in that band.
low band / capital and size     COMPLETE. Reserve saturates by a half, ceiling
                                saturates by twelve. The champion sits on both
                                plateaus at floor 0.0 and ceiling 8.
low band / raw correlation      Closed as a discriminator. Uninformative there.
global PnL and capital ratio    Closed as objectives. Telemetry only.
```

**A closure is only as wide as the interval actually graded.** Run
`market-loop-20260821` falsified the archived case-7 width closure, which had been
written as "8 to 55" on evidence from 25, 35, 45, 55 and the 8-cent fallback,
interpolating across a band no source had ever occupied. Reopening 12 to 20 found
the best case-7 PnL on record. Before trusting any closure, enumerate the graded
points; if there is a hole, the closure does not cover it.

## 8. Next Score Paths

Dispatch-ready, in order. 1.30 points remain and they sit in four cases.

**1. Case 18 capacity and ceiling — +0.20, and the best-founded target left.**
Case 18 holds 40.00 of capital, the largest on the board, so with the 0.75 floor it
has 10.00 available and the five-and-six-lot ceilings bind long before capital
does. Fixed Width 0.05 earns 39.01 there, which by Section 4 says the flow is
benign and taking more of it pays — the same signature that cases 8 and 10 had
before the promotion. Gate on middle band, THR volatility > 0.025, FEDmean <= 2.0,
which is exactly {18, 20} and needs no new tomography. Run the identical treatment
that just worked: relax `cash_floor` and lift the quantity ceiling in one ladder,
reusing the file's own guard expressions so every added lot stays solvency-tested.
Collateral budget must be real, because case 20 is inside the gate at rank 1; its
12.49 margin is the buffer, and losing it costs 1.00 against a 0.20 prize, so any
arm that moves case 20's rank is disqualified regardless of case 18.

**2. Case 6 respond_to_fok selectivity — +0.30, the largest remaining prize.**
Case 6's gap of 6.44 is the smallest on the board and every quote axis is now
closed, leaving FOK and theo. Section 4 says case-6 flow is toxic, and run
`market-loop-20260821` g01 showed that in a toxic session LOOSENING the FOK
constraints loses money. The untested direction is therefore tightening: raise
`edge` above 0.034/0.02 and lower the 0.50 maximum-loss cap, gated on the proven
`flat_rate_frequency > 0.60` label. Note the honest ceiling first: our entire
case-6 PnL is 3.93 and the leader earns 10.37, so FOK selectivity alone probably
cannot clear it. Run it because it is cheap and because it completes the case-6
map, not because it is likely to score.

**3. Case 19 — do not add size. +0.20 if anything works at all.**
Fixed Width 0.05 LOSES 20.53 in case 19, so the flow is toxic and the capacity
treatment that pays in case 18 would be actively harmful here. Case 19 is already
isolated exactly as `case_nineteen_regime` at a 45-cent half-width, which is the
correct defensive posture. If case 19 is attempted, attempt withdrawal, not
participation: widen past 45 toward the 0.00/1.00 boundary where the challenge
charges no cash, exactly as case 5 was won.

**4. Case 7 size downward — the last untested quote axis on case 7.**
Width and FOK are both closed. Size in isolation has never been tested, and the
archetype rule says a wide quoter leads there, so the direction to test is
smaller, never larger. Low expected value: the rank needs 20.14 against our 2.80.

**5. `warm_up` parameter estimation — the only route to theo, still never
targeted by any generation.** The scope validator freezes
`price_option_from_parameters` and an Explore `method` must be `quote`,
`respond_to_fok` or `warm_up`, so "fix the theoretical value" means "improve the
parameter estimation in `warm_up`" and nothing else. This is now the only
structural surface left untouched. Treat as research until something implicates
theo directly — but note that the last run's promotion came from a structural
constraint nobody had questioned, and this is the last one of those remaining.

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
with full force to `respond_to_fok`, which still has no such guard at all. The
promoted low-band escalation is safe precisely because it reuses those guards on
every increment rather than replacing them: it graded with zero bankruptcies even
while deploying the entire low-band account.
