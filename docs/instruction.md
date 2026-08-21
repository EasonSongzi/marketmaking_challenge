# Score-Frontier Research After 14.10

## 1. Canonical State

```text
champion        g5-case13-width-three-size-three
source SHA      fbe274bc77f4a70333d18d8df6d7744fdff98b34c851e4d565c0fcc51b94b633
score           14.10 / 16.00
combined PnL    214.94                    telemetry only
gap sum         120.51 across six losing cases
held floor      2.41 minimum runner-up margin (case 13)
```

Run `market-loop-20260820-5` moved 13.30 to 14.10 in two promotions: case 5 and
case 13 both converted from rank 2 to rank 1. Six generations ran with **zero
collateral in every one** — no candidate has moved a non-target case since
per-session labels became the unit of work.

`results/frontier.json` is the generated Ranking index; regenerate it with
`candidate_pipeline/frontier.sh <repo> apply` before relying on plateau queries,
since it still describes the 13.30 plateau.

## 2. Objective Model

Unchanged. Promotion is score-only: twenty structurally complete outcomes, no
runtime error, cases 1-4 PASS, every failed scored case an explicit bankruptcy,
and SCORED points strictly above the champion. PnL and minimum capital are
telemetry and never break a tie. Every plan is schema version 3 and declares one
`exploit` or `probe` objective. Order score-equal candidates by target gain,
target gap, modified lines, then candidate ID.

## 3. Rank and Risk Ledger

| Case | N | Rank | Score | Ours | Leader / runner-up | Gap or margin |
|---:|---:|---:|---:|---:|---|---:|
| 5 | 2 | 1 | 1.00 | 33.80 | Stalemate Quoter 16.00 | margin 17.80 |
| 6 | 3 | 2 | .70 | 3.93 | Fixed Width .25 10.37 | gap 6.44 |
| 7 | 2 | 2 | .40 | 2.80 | Fixed Width .25 23.11 | gap 20.31 |
| 8 | 3 | 2 | .70 | 6.95 | Fixed Width .1 27.86 | gap 20.91 |
| 9 | 3 | 1 | 1.00 | 31.34 | Fixed Width .1 12.51 | margin 18.83 |
| 10 | 3 | 2 | .70 | 14.17 | Fixed Width .1 35.17 | gap 21.00 |
| 11 | 3 | 1 | 1.00 | 21.17 | Fixed Width .1 .17 | margin 21.00 |
| 12 | 2 | 1 | 1.00 | 3.21 | Fixed Width .05 -5.81 | margin 9.02 |
| 13 | 4 | 1 | 1.00 | 11.28 | Fixed Width .1 8.87 | margin 2.41 |
| 14 | 3 | 1 | 1.00 | 17.29 | Lattice 13.99 | margin 3.30 |
| 15 | 3 | 1 | 1.00 | 13.03 | Lattice 6.74 | margin 6.29 |
| 16 | 3 | 1 | 1.00 | 27.07 | Fixed Width .05 8.43 | margin 18.64 |
| 17 | 4 | 1 | 1.00 | 18.06 | Situational 10.54 | margin 7.52 |
| 18 | 4 | 2 | .80 | 7.44 | Fixed Width .05 39.01 | gap 31.57 |
| 19 | 4 | 2 | .80 | 3.17 | Situational 23.45 | gap 20.28 |
| 20 | 4 | 1 | 1.00 | .23 | Lattice -12.26 | margin 12.49 |

Ten ranks are held. Cases 13 and 14, at margins of 2.41 and 3.30, are the
tightest and must be reported explicitly by every generation.

## 4. Session Map

`self.warm_up_statistics` is constant per session and is the only sound session
discriminator. The measured map of `rate_transition_frequencies["unchanged"]`:

```text
> 0.60          {6}                     exact, graded clean three times
(0.50, 0.60]    {9, 15}
(0.40, 0.50]    {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40         {8, 10, 12, 17}         confirmed exactly, run 5 g06
```

Inside the middle band, THR log-return `sample_std_dev <= 0.025` gives {7,13,19}:

```text
corr > 0.50                             {19}
corr <= 0.50 and FEDmax >= 3.0          {7}
corr <= 0.50 and FEDmax < 3.0           {13}     installed, promoted
```

The complement {5,11,14,16,18,20} splits by FEDmean > 2.0 to {5,11,14,16}, then
FEDmin > 2.0 to {5,11}, then raw corr < 0.75 to **{5} alone** — installed and
promoted.

Inside the low band, `fed_history_maximum >= 3.0` gives **{8,17}** and its
complement **{10,12}**. Raw company-return correlation is above 0.50 for every
low-band session and carries no information there.

## 5. The Levers and Their Signs

Two levers now have measured, session-dependent signs. Neither generalises;
both must be measured per label.

```text
WIDTH   case 5   monotone to the 0.00/1.00 boundary        2.23 -> 19.87
        case 6   interior maximum at 18; 24/30/40 worse    closed both ways
        case 7   flat 2.80 at every width 25-55, -2.03 at 8
        case 13  narrower beats wider; 8 -> 4 closed the gap to 2.19

SIZE    case 5   +12 lots flipped the rank                 19.87 -> 33.80
        case 6   monotone harmful; 8/12/16 all worse       closed upward
        case 13  size 3 converted width 3 to rank 1; size 2 lost the rank
        low band size 3 with width 3 harmed all four
```

**The Stalemate Quoter's session PnL is the cheap test for which sign applies.**
It earns 37.00 in case 5 where withdrawal and size pay, and 0.00 in case 6 and
case 8 where they cost. Where it earns nothing, the counterparties are informed
and both levers run backwards.

## 6. Scoped Closures

```text
case 6 / static width           Closed both directions. Interior maximum at 18.
case 6 / size upward            Closed. 8, 12 and 16 lots each strictly worse.
case 7 / quote width 8 to 55    Closed. 2.80 is our no-RFQ PnL, 23.11 is the
                                leader's uncontested ceiling. Only respond_to_fok
                                or theo can move this case.
low band / tighter and larger   Closed. Width 3 at size 3 harmed 8, 10, 12, 17.
low band / raw correlation      Closed as a discriminator. Uninformative.
case 12 bankruptcy risk         Retired. The configuration that bankrupted case 12
                                in run 2026-08-18 ran clean under current capacity
                                logic.
global PnL and capital ratio    Closed as objectives. Telemetry only.
```

## 7. Next Score Paths

1. **Low-band isolation, then the opposite treatment — +0.30 each for cases 8
   and 10.** Two thresholds remain: separate 8 from 17 inside FEDmax >= 3.0, and
   10 from 12 inside its complement, using statistics other than correlation.
   Isolation alone will not score, because tighter-and-larger is now closed here;
   an isolated label needs the untested opposite direction, wider and smaller.
2. **`respond_to_fok` — the only untouched core method.** Case 7 is the argument:
   its PnL is width-invariant, so its 20.31 gap is unreachable from `quote`.
   No generation in run 5 targeted this method.
3. **Case 6 theo or skew — +0.30.** Both cheap axes are closed; the remaining
   6.44 needs a different mechanism.
4. **Cases 18 and 19 — +0.20 each.** Gaps of 31.57 and 20.28 make these the
   least reachable targets. Leave them last.

## 8. Hard Invariants

Unchanged: preserve core method signatures and repository scope rules; compile
and pass the method-level validator before a live run; emit no stdout from
`MarketMaker`; never rerun a completed source SHA; runtime errors are always
ineligible; cases 1-4 must pass; evidence must parse consistently; one browser
session and one Git lifecycle mutation at a time.

The challenge charges cash equal to a trade's **maximum loss** — a 0.00 buy and a
1.00 sell each charge nothing, which is why unbounded size is safe at that quote
and only there. Any size override that bypasses the file's `signed_reserve` and
`available_capacity` guards must bound its own per-fill charge.
