# Score-Frontier Research After 13.30

## 1. Canonical State

The champion is the deterministic portfolio anchor selected from every archived
source at the maximum observed score.

```text
champion        g3-case7-width25
source SHA      183cf6019cee631065b0a11f8ee7f88f7ebd3c817b6e4eca917b7f9fab7add59
score           13.30 / 16.00
combined PnL    180.99                    telemetry only
gap sum         162.11 across eight losing cases
held floor      3.30 minimum runner-up margin
source lines    1180
```

`results/frontier.json` is the generated Ranking index. It was built from 279
archived raw reports: 276 have complete Ranking evidence and three runtime-error
reports do not. At 13.30 there are 78 unique sources and exactly one per-case score
vector.

The old champion `g2-fed-max-probe` remains active as
`frontier-g2-fed-max-probe`; it preserves the session-discriminator research branch.

## 2. Objective Model

Champion promotion is score-only. A candidate promotes only when:

```text
all twenty outcomes are structurally complete
no runtime error occurs
cases 1-4 PASS
every failed scored case is an explicit bankruptcy
SCORED points strictly exceed the current champion
```

A bankruptcy in cases 5-20 is not a hard rejection. Its case already scores zero,
so the total score prices its complete cost. PnL and minimum capital are recorded but
never break a score tie.

Among multiple score-improving candidates, order by total score, modified lines, then
candidate ID.

Every new plan uses schema version 3 and declares one objective:

```json
{
  "kind": "exploit",
  "targetCases": [6],
  "expectedGainHundredths": 30,
  "collateralBudgetHundredths": 30
}
```

`exploit` requires positive expected score. `probe` requires zero immediate gain plus
an `unlock` statement naming the positive-score path whose uncertainty it removes.
Probe results cannot replace the champion at equal score and cannot create global
freeze rules.

## 3. Rank and Risk Ledger

All values below come from the anchor's parsed Ranking blocks.

| Case | N | Rank | Score | Ours | Leader / runner-up | Gap or margin | Score at risk/upside |
|---:|---:|---:|---:|---:|---|---:|---:|
| 5 | 2 | 2 | .40 | 2.23 | Stalemate 37.00 | gap 34.77 | +.60 / -.40 |
| 6 | 3 | 2 | .70 | 3.93 | Fixed Width .25 10.37 | gap 6.44 | +.30 / -.70 |
| 7 | 2 | 2 | .40 | 2.80 | Fixed Width .25 23.11 | gap 20.31 | +.60 / -.40 |
| 8 | 3 | 2 | .70 | 6.95 | Fixed Width .1 27.86 | gap 20.91 | +.30 / -.70 |
| 9 | 3 | 1 | 1.00 | 31.34 | Fixed Width .1 12.51 | margin 18.83 | -1.00 |
| 10 | 3 | 2 | .70 | 14.17 | Fixed Width .1 35.17 | gap 21.00 | +.30 / -.70 |
| 11 | 3 | 1 | 1.00 | 21.17 | Fixed Width .1 .17 | margin 21.00 | -1.00 |
| 12 | 2 | 1 | 1.00 | 3.21 | Fixed Width .05 -5.81 | margin 9.02 | -1.00 |
| 13 | 4 | 2 | .80 | 8.90 | Fixed Width .1 15.73 | gap 6.83 | +.20 / -.80 |
| 14 | 3 | 1 | 1.00 | 17.29 | Lattice 13.99 | margin 3.30 | -1.00 |
| 15 | 3 | 1 | 1.00 | 13.03 | Lattice 6.74 | margin 6.29 | -1.00 |
| 16 | 3 | 1 | 1.00 | 27.07 | Fixed Width .05 8.43 | margin 18.64 | -1.00 |
| 17 | 4 | 1 | 1.00 | 18.06 | Situational 10.54 | margin 7.52 | -1.00 |
| 18 | 4 | 2 | .80 | 7.44 | Fixed Width .05 39.01 | gap 31.57 | +.20 / -.80 |
| 19 | 4 | 2 | .80 | 3.17 | Situational 23.45 | gap 20.28 | +.20 / -.80 |
| 20 | 4 | 1 | 1.00 | .23 | Lattice -12.26 | margin 12.49 | -1.00 |

There are no globally protected scored cases. The final column is the risk budget.
A hypothesis may spend a rank when its predicted net score is positive.

## 4. Research Frontiers

Active source branches are deliberately small:

```text
frontier-g2-fed-max-probe
    Current session-map branch. Exact labels distinguish cases 7, 13, and 19 and
    retain the inferred case-5 complement.

frontier-g3-cheap-four-short-company
    Best 13.30 gap for cases 5 and 13. Case 13 gap is 1.73 in this source, the
    closest observed max-score route to a rank flip.

frontier-g5-fed-four-hold-short
    Best 13.30 gap for case 18.
```

All former active challengers remain immutable evidence but are retired. Do not
reactivate a source merely because it has higher combined PnL.

## 5. Hard Invariants

These are engineering/evidence constraints rather than strategy preferences:

- preserve the core method signatures and repository scope rules;
- compile and pass the method-level validator before a live run;
- emit no stdout from `MarketMaker`;
- never rerun a completed source SHA;
- runtime errors are always ineligible;
- cases 1-4 must pass;
- Ranking, cash, result, source SHA, and raw evidence must parse consistently;
- one browser session and one Git lifecycle mutation at a time.

## 6. Scoped Closures

A closure applies only to the stated axis and session label. It may be reopened when a
new discriminator changes that scope or when a score-positive trade explicitly budgets
the known loss.

```text
case 7 / isolated static half-width 25-55
    Closed: every tested width produced the same 2.80 / rank-2 result.
    Reopen only by changing quote architecture, theo, skew, size, or FOK—not width.

case 6 / static width through 18
    Open: response remained monotone and widths above 18 are untested.

case 13 / cheap fourth-unit mechanism
    Open inside the exact case-13 label. The mechanism reached rank 1 in
    g5-wide-three-three; its old case-7/12 bankruptcies do not transfer to an isolated
    label automatically.

case 5 / broad 45-cent width
    Open only inside the exact complement label. Broad evidence moved our PnL +5.71 and
    the leader -1.00; widths beyond 45 remain untested.

global PnL, capital ratio, and PnL-only promotion
    Closed as objectives. They remain telemetry and causal evidence.
```

Do not turn a local plateau, a PnL loss, or one bankrupt session into a global freeze.

## 7. Next Score Paths

Order by direct score potential and evidence-backed reachability.

1. **Case 6 width extension — +0.30.** From the session-map branch, test isolated
   half-widths 24, 30, and 40. Nothing outside case 6 may move.
2. **Case 13 mechanism transplant — +0.20.** Install the proven fourth-unit mechanism
   only in the exact case-13 fingerprint; case 7 and 12 must remain outside the gate.
3. **Case 5 isolated width walk — +0.60.** Use the measured complement label and test
   widths beyond 45. A 45-cent control is evidence, not a PnL promotion target.
4. **Case 7 winner clone — +0.60 diagnostic.** Replace the isolated quote path with a
   symmetric Fixed Width .25-style quote. A profitable result implicates our quote
   architecture; a flat result implicates theo.

Before dispatch, state the target cases, expected score gain, maximum collateral loss,
and predicted footprint. A zero-score probe must identify the later positive-score
decision it unlocks.

## 8. Per-Generation Analysis

Use evaluation v2 Ranking data; do not reconstruct tables by hand. Report:

- target score gain and whether the declared expectation was met;
- collateral score loss outside target cases;
- rank, N, leader, gap, runner-up margin, and bankruptcy for every moved case;
- endogenous competitor movement separately from our own PnL movement;
- whether a closure is local, reopened, or unchanged;
- the exact source SHA to preserve as a research frontier, if any.

Combined PnL can explain routing but can never justify promotion or a new freeze by
itself.
