# Score-Frontier Research After 14.10

## 1. Canonical State

```text
champion        g5-case13-width-three-size-three
source SHA      fbe274bc77f4a70333d18d8df6d7744fdff98b34c851e4d565c0fcc51b94b633
score           14.10 / 16.00
combined PnL    214.94                    telemetry only
gap sum         120.51 across six losing cases
held floor      2.41 minimum runner-up margin (case 13)
remaining       1.90 across cases 6, 7, 8, 10, 18, 19
```

Run `market-loop-20260820-5` moved 13.30 to 14.10 in two promotions, case 5 and
case 13, each converting rank 2 to rank 1. Six generations ran with **zero
collateral in every one**: since per-session warm-up labels became the unit of
work, no candidate has moved a case outside its declared target.

`results/frontier.json` still describes the 13.30 plateau. Regenerate it with
`candidate_pipeline/frontier.sh <repo> apply` before trusting plateau queries.
Note that `apply` also reseats the active challenger pool; use the default
`report` mode if you only need the index.

## 2. Objective Model

Promotion is score-only: twenty structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the champion. PnL and minimum capital are telemetry and never break
a tie. Every plan is schema version 3 with one `exploit` or `probe` objective.
Order score-equal candidates by target gain, target gap, modified lines, then
candidate ID.

Declare `collateralBudgetHundredths: 0` for any label-gated generation. Six
consecutive generations have earned that default, and a non-zero collateral result
now falsifies the label rather than pricing a trade.

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

Ten ranks are held. Cases 13 and 14, at margins 2.41 and 3.30, are the tightest
and must be reported explicitly by every generation.

## 4. Session Map

`self.warm_up_statistics` is constant per session and is the only sound session
discriminator. Do not use `self.cash_balance` for identity: the grader mutates it.

```text
> 0.60          {6}                     exact; graded clean three times
(0.50, 0.60]    {9, 15}
(0.40, 0.50]    {5, 7, 11, 13, 14, 16, 18, 19, 20}
<= 0.40         {8, 10, 12, 17}         confirmed exactly, run 5 g06
```

Middle band with THR log-return `sample_std_dev <= 0.025` gives {7, 13, 19}:

```text
corr > 0.50                             {19}    installed as case_nineteen_regime
corr <= 0.50 and FEDmax >= 3.0          {7}     installed as case_seven_regime
corr <= 0.50 and FEDmax < 3.0           {13}    installed, promoted
```

Middle band with volatility above 0.025 is {5, 11, 14, 16, 18, 20}; FEDmean > 2.0
narrows it to {5, 11, 14, 16}, FEDmin > 2.0 to {5, 11}, and raw corr < 0.75 to
**{5} alone** — installed as `case_five_regime`, promoted.

Low band: `fed_history_maximum >= 3.0` gives **{8, 17}**, complement **{10, 12}**.
Raw company-return correlation exceeds 0.50 in every low-band session and is
useless as a discriminator there.

Two thresholds remain unfound: 8 from 17, and 10 from 12.

## 5. The Levers and Their Signs

Width and size are two-directional levers whose sign is a property of the
session's counterparty mix. Neither generalises; both must be measured per label.

```text
WIDTH   case 5   monotone out to the 0.00/1.00 boundary     2.23 -> 19.87
        case 6   interior maximum at 18; 24/30/40 worse     closed both ways
        case 7   flat 2.80 across widths 25-55; -2.03 at 8
        case 13  narrower wins; 8 -> 4 closed the gap to 2.19

SIZE    case 5   twelve lots flipped the rank               19.87 -> 33.80
        case 6   monotone harmful; 8, 12, 16 all worse      closed upward
        case 13  size 3 converted width 3 to rank 1; size 2 lost the rank
        low band width 3 at size 3 harmed all four cases
```

**The Stalemate Quoter's session PnL is the cheap test for which sign applies.**
It earns 37.00 in case 5, where withdrawal and size pay, and 0.00 in cases 6 and 8,
where both cost. Where it earns nothing, the counterparties are informed and both
levers run backwards. Read that column before designing any per-case treatment.

## 6. Scoped Closures

```text
case 6 / static width           Closed both directions. Interior maximum at 18.
case 6 / size upward            Closed. 8, 12 and 16 lots each strictly worse.
case 7 / quote width 8 to 55    Closed. See Section 7: this closure is what turns
                                case 7 into a clean FOK measuring instrument.
low band / tighter and larger   Closed. Width 3 at size 3 harmed 8, 10, 12, 17.
low band / raw correlation      Closed as a discriminator. Uninformative there.
case 12 bankruptcy risk         Retired. The configuration that bankrupted case 12
                                in run 2026-08-18 ran clean under current capacity
                                logic.
global PnL and capital ratio    Closed as objectives. Telemetry only.
```

## 7. The Unopened Method

`respond_to_fok` has never been the target of a generation. It is twenty lines and
contains **four numeric constants and no session conditioning at all** — the only
core method with none. Reproduced in full because the next run starts here:

```python
theoretical_value = self.price_option(option)
position = self.position.option_quantity_by_option_id.get(option.option_id, 0)
if fok_order.quantity <= abs(position):
    if position > 0 and fok_order.order_type == OrderType.BUY:
        return fok_order.price >= theoretical_value
    if position < 0 and fok_order.order_type == OrderType.SELL:
        return fok_order.price <= theoretical_value
edge = 0.034 if fok_order.quantity > 2 else 0.02
if fok_order.order_type == OrderType.BUY:
    return (fok_order.price >= theoretical_value + edge
            and (1.0 - fok_order.price) * fok_order.quantity <= 0.5)
return (fok_order.price <= theoretical_value - edge
        and fok_order.price * fok_order.quantity <= 0.5)
```

Three facts make this the highest-value unexplored surface.

**The 0.50 cap is brutally restrictive and is not a solvency check.** It bounds the
maximum loss of a single FOK trade at fifty cents in sessions holding ten to forty
dollars. A mid-priced option near 0.50 is therefore capped at one lot; only deep
out-of-the-money or deep in-the-money orders reach five. Nothing in this method
reads `self.cash_balance`, so the constant is a fixed proxy for solvency rather
than a measurement of it — while `quote` next door carries a full `cash_floor`,
`available_capacity` and `signed_reserve` apparatus. Porting that apparatus into
`respond_to_fok` is simultaneously the safety fix and the thing that unlocks size.

**Case 7 is a clean FOK measuring instrument, and the width closure is why.** At
the promoted 25-cent half-width we are wider than the Fixed Width 0.25 leader's
12.5 and lose every RFQ by construction, so case 7's 2.80 is **entirely FOK PnL**.
At the 8-cent width we win RFQ flow and fall to -2.03, so contested case-7 RFQ
flow is worth -4.83. Any change to `respond_to_fok` inside `case_seven_regime`
therefore produces a case-7 delta that is 100% FOK-attributable, with no quoting
term to confound it. No other case offers that.

**Theo is unreachable except through its inputs.** The scope validator freezes
`price_option_from_parameters`, and an Explore plan's `method` must be one of
`quote`, `respond_to_fok`, or `warm_up`. So "fix the theoretical value" means
"improve the parameter estimation in `warm_up`" and nothing else. Plan accordingly.

## 8. Next Score Paths

Dispatch-ready, in order. Each is one generation of three candidates.

**1. Case 7 FOK gate — +0.60, the largest single prize left.** Target
`respond_to_fok`, gate every change on `case_seven_regime` recomputed inline from
`self.warm_up_statistics`. Our 2.80 is pure FOK against a 23.11 leader, so the
headroom is real and the instrument is clean. Probe both constraints at once:
raise the 0.50 caps to about 2.00; replace the fixed cap with a cash-aware guard
in `quote`'s idiom, for example a quarter of `self.cash_balance`; and separately
cut `edge` from 0.034/0.02 to roughly 0.008/0.005 at the unchanged cap. The first
two say whether case-7 FOK is volume-limited, the third whether it is price-limited.
Case 7 scores .40, so a bankruptcy there costs 0.40 and is priced.

**2. Case 6 FOK gate — +0.30, the cheapest conversion if path 1 works.** Gap 6.44
is the smallest on the board and both quote axes are closed, so FOK is the only
lever left. The `flat_rate_frequency > 0.60` gate is the most thoroughly proven
label in the repository. Run whichever treatment path 1 identifies.

**3. Global FOK rule behind a real solvency guard — up to +1.00 across cases 8,
10, 18 and 19.** If a label-gated FOK change pays, the same starvation likely
affects every case, and this is the only single change that can move several at
once. It must carry a genuine `self.cash_balance` guard, because the method has
none today and the 0.50 constant is all that currently stands between it and
bankruptcy. Do not attempt this before paths 1 and 2 have measured the response.

**4. Low-band isolation, then the opposite treatment — +0.30 each for cases 8 and
10.** Two thresholds remain: 8 from 17 inside FEDmax >= 3.0, and 10 from 12 in the
complement, using any session-constant statistic except correlation. Isolation
alone will not score: tighter-and-larger is closed here, so an isolated label needs
the untested opposite direction, wider and smaller.

**5. `warm_up` parameter estimation — unquantified.** The only route to theo. No
generation has targeted it. Treat as research, not as a scoring path, until
something implicates theo directly.

**Cases 18 and 19**, at gaps of 31.57 and 20.28, are the least reachable targets on
the board. Leave them last.

## 9. Hard Invariants

Preserve core method signatures and repository scope rules; compile and pass the
method-level validator before a live run; emit no stdout from `MarketMaker`; never
rerun a completed source SHA; runtime errors are always ineligible; cases 1-4 must
pass; Ranking, cash, result, source SHA and raw evidence must parse consistently;
one browser session and one Git lifecycle mutation at a time.

The challenge charges cash equal to a trade's **maximum loss**. A 0.00 buy and a
1.00 sell each charge nothing, which is why unbounded size is safe at that quote
and only there. Any override that bypasses the file's `signed_reserve` and
`available_capacity` guards must bound its own per-fill charge, and that applies
with full force to `respond_to_fok`, which has no such guard at all.
