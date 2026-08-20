# Strategy Research After 13.30: Inventory Conditioning and the Case-13 Trade

## 1. Current State

**Current champion:** `g6-fed-five-hold-position`
**Current score:** **13.30 / 16.00 SCORED points**
**Combined PnL:** **155.53**
**Bankruptcies:** **0**
**Minimum ending capital:** **7.65 / 10.00**

The previous loop (`market-loop-20260819-4`) ran six Explore generations and promoted
three times:

```text
score:
13.30 -> 13.30   (unchanged)

combined PnL:
154.75 -> 154.86 -> 155.40 -> 155.53
```

No rank boundary moved. The loop's value was diagnostic: it closed three
candidate axes permanently, localized the case-13 mechanism exactly, and found
a new productive axis (per-contract inventory) that produced two of the three
promotions.

---

## 2. Current Rank Frontier

| Case | Our PnL | Rank | Leading competitor      | Competitor PnL | Research status |
| ---- | ------: | ---: | ----------------------- | -------------: | --------------- |
| 5    |    2.23 |  2nd | Stalemate Quoter        |          37.00 | Closed |
| 6    |    0.10 |  2nd | Fixed Width 0.25        |          10.93 | Closed |
| 7    |   -2.35 |  2nd | Fixed Width 0.25        |          20.14 | Closed |
| 8    |    1.61 |  2nd | Fixed Width 0.1         |          30.70 | Closed |
| 10   |   11.15 |  2nd | Fixed Width 0.1         |          33.83 | Closed |
| 11   |   21.06 |  1st | —                       |              — | **Protect (fragile)** |
| 12   |    4.22 |  1st | —                       |              — | Protect |
| 13   |    8.52 |  2nd | Fixed Width 0.1         |          11.39 | **Ceiling reached** |
| 14   |   17.03 |  1st | Lattice                 |          14.07 | Protect (margin 2.96) |
| 15   |    8.99 |  1st | Situational Unawareness |           5.96 | Protect |
| 16   |   27.07 |  1st | Fixed Width 0.05        |           8.43 | Protect |
| 17   |   18.29 |  1st | Situational Unawareness |           9.52 | Protect |
| 18   |    7.44 |  2nd | Fixed Width 0.05        |          39.01 | Closed |
| 19   |   -2.62 |  2nd | Situational Unawareness |          22.08 | Closed |
| 20   |    0.49 |  1st | Lattice                 |         -10.65 | Protect |

Case 11 is newly fragile: generation 6 showed a single structural change can
cost it 2.11 while it remains first. Add it to the protected list.

---

## 3. What The Previous Loop Established

### 3.1 The case-13 mechanism is fully localized — and is a trade, not a win

The mechanism is **the cheap fourth bid unit on FED contracts**. Withholding it:

```text
Fixed Width 0.1:  11.39 -> 11.21
ours:              8.52 ->  9.40
case-13 gap:       2.88 ->  1.81   (best in project)
case-14 margin:    2.92 ->  3.01   (improves)
```

but it is a **net PnL loss of 3.27**, and the ledger is fully localized:

```text
gains:   case 13 +0.88   case 19 +0.41   case 15 +0.23   case 14 +0.09
losses:  case 20 -2.02   case 10 -1.94   case 18 -0.65   case 12 -0.31
```

The reference source is the challenger `market-loop-20260819-4-g03-g3-cheap-four-company`.

### 3.2 Three axes are closed. Do not reopen them.

**Capital (40.0 boundary) — degenerate.** Withholding the FED fourth unit only
at or above 40.0 cash reproduces the champion to the cent in all 20 cases; the
complement reproduces the full withdrawal to the cent. The cheap FED fourth
unit never fires in the capital-rich regime, because the capital-certified rule
above already supplies the fourth unit there.

**Tenor, on the fourth unit — refuted twice, for two different reasons.**
Globally, any tenor restriction on the cheap fourth unit collapses the case-14
margin from 2.92 to below 0.20, because the long-tenor *company* fourth unit is
what suppresses Lattice. Inside the FED branch, both signs of the trade live in
the same long-dated region, so tenor cannot separate benefit from cost.

**The fifth unit, as a case-13 lever — refuted.** Fixed Width 0.1 stays pinned
at exactly 11.39 under every fifth-unit variation. The fifth unit has zero
influence on competitor suppression; withholding it on the company subset costs
0.32 of our own case-13 PnL and 3.85 combined.

### 3.3 Per-contract inventory is the productive axis

Declining a unit on a contract we already hold produced both PnL promotions:

```text
FED fourth unit, already long   -> +0.54  (case 12 +1.04)
FED fifth unit, already long    -> +0.13  (near-costless)
any non-zero position, not just long -> +0.04 only
```

Almost all of the effect is directional, not concentration of either sign.
Aggregate `active_exposure` is the blunt form of this and loses money (-2.72);
per-contract position is the sharp form and gains.

### 3.4 The company branch of the inventory condition is unresolved

`g6-any-four-hold-position` drops the FED test and declines the fourth unit on
**any** cheap single-leg contract already held. It produces the best case-14
state in the project:

```text
ours 17.29 / Lattice 13.99 / margin 3.30
case 15 +0.67   case 10 +0.38   case 7 +0.30   case 14 +0.26
case 11 -2.11   <- the entire deficit
```

Net -0.59, decided by one case. This is the single most diagnosable open
question in the project.

---

## 4. Core Research Question For The Next Loop

> **Why does declining the already-held fourth unit on company contracts cost
> 2.11 in case 11, when it gains in cases 7, 10, 14 and 15?**

If case 11 can be isolated and excluded, the company inventory condition is
worth roughly +1.5 and would also widen the case-14 margin to 3.30.

This is a PnL question at a fixed score of 13.30, not a rank question.

---

## 5. Freeze List

Freeze everything the prior memo froze, plus what this loop settled.

* **Warm-up estimation** — all of it. Unchanged frontier.
* **`price_option_from_parameters`** — THEO is not the frontier.
* **`respond_to_fok`** — no result has ever implicated FOK acceptance.
* **Base quote prices** — normal width, repeat-request width, bid/offer shades,
  fill-signal skew, one-cent first-touch narrowing.
* **Risk architecture** — `cash_floor = 0.75 * cash_balance`,
  `available_capacity`, `active_exposure`, `signed_reserve`. Do not relax.
* **Offer architecture** — all four offer q3 rules, offer q4/q5, low-capital q6.
* **Capital-certified bid Q4** at `cash_balance >= 40.0`.
* **The FED fifth-unit tenor withdrawal** and **both already-long conditions**
  now in the champion. These are the promoted mechanisms.
* **The 40.0 capital boundary and tenor**, as conditions on the cheap fourth
  unit. Closed by evidence, see 3.2.

---

## 5b. Challenger Pool (curated after this loop)

Six active challengers remain. The pool was pruned after the run: three stacked
demoted champions and three superseded sources were retired, and one archived
candidate was admitted.

| Challenger | PnL | Why it is kept |
| --- | ---: | --- |
| `...-4-g06-g6-fed-four-hold-any-position` | 155.44 | Fourth unit gated on `!= 0`. **Orthogonal to the champion**, which gates the fourth unit on `> 0` and adds the fifth-unit condition. Composing the two is untested. |
| `...-4-g06-champion-g5-fed-four-hold-long-position` | 155.40 | Immediate predecessor, one conjunct behind. The single retained fallback. |
| `...-4-g06-g6-any-four-hold-position` | 154.81 | Best case-14 state in the project (margin 3.30). Entire deficit is case 11. |
| `...-4-g03-g3-cheap-four-company` | 151.59 | Best case-13 state in the project (gap 1.81). Costs 3.27 PnL. |
| `...-3-g06-g6-single-leg-wide-cheap-four` | 147.51 | Only source using the `fair_value_cents <= 40` wide trigger instead of `bid_price <= 0.25`. Uncomposed. |
| `...-3-g02-g2-lowcap-central-offer-six` | 143.74 | Only remaining offer-side variant; central-band gate on offer q6. |

Retired this pass, with reasons recorded in the registry: the three demoted
champions that are strict subsets of the current champion, `g1-short-company-leg-four`
(dominated on all three axes by `g3-cheap-four-company`), `g5-short-cheap-bid-four`
(scores 13.00, loses case 14), and `g3-lowcap-exposure-offer-three` (duplicates an
idiom the champion already carries, on a refuted axis).

**The highest-value composition available without any new idea** is the champion's
fifth-unit already-long condition together with the `!= 0` fourth-unit predicate.

---

## 6. Generation 1: Isolate Case 11

Start from the challenger `market-loop-20260819-4-g06-g6-any-four-hold-position`
or from the champion, and condition the *company* already-long withdrawal so it
does not fire in whatever state case 11 occupies.

Candidates should partition by state the file can already see and that has not
been tested on this branch:

```text
fair_value_cents band
bid_price depth below the 0.25 cheap threshold
position magnitude (>= 2 rather than > 0)
repeat-request state
```

Position magnitude is the highest-priority candidate: declining only when we
hold two or more units is the natural weakening of a rule whose sole failure is
a single case.

The diagnostic is per-case PnL against the champion, with case 11 and case 14
reported explicitly.

---

## 7. Generation 2: Extend Inventory Conditioning To The Offer Side

The already-long condition has only ever been applied to bid quantity. The
offer side has four q3 rules plus q4/q5/q6 escalations and has never been
inventory-conditioned at all.

The symmetric hypothesis is that adding offer size on a contract we are already
**short** carries the same concentration cost. Test withholding the offer q4 or
q5 escalation when `position < 0` on that contract.

This is the largest untested surface in the strategy.

---

## 8. Generation 3: Tune

By this point at least one inventory-conditioned source should be worth tuning.
Genuinely unswept constants, in priority order:

```text
the cheap threshold 0.25, inside an inventory-conditioned fourth unit
the position threshold, if generation 1 introduces one
```

Do not sweep the cash floor, the 40.0 capital boundary, or any width.

---

## 9. Case 13: Stop Or Pay

Case 13 is reachable only by paying PnL. Two honest options:

**Option A — accept 13.30 and maximize PnL.** The correct default. The gap of
1.81 requires roughly +1.8 of own PnL on one case while Fixed Width 0.1 sits
pinned at 11.21 under every source that activates the mechanism. Nothing found
in four loops moves it further.

**Option B — pay for the rank deliberately.** If a later loop recovers enough
PnL elsewhere that the 3.27 cost becomes affordable, compose the FED fourth-unit
withdrawal back in. It would still leave case 13 second at 9.40 against 11.21,
so this is only worth doing if some *other* mechanism closes the remaining 1.81.

Do not spend a whole loop on case 13 again without new evidence that the 11.21
floor is breakable.

---

## 10. Required Diagnostics

Every generation must report per-case PnL deltas against the champion for all
twenty cases, and explicitly:

```text
case 11: our PnL, rank                  (newly fragile)
case 13: our PnL, Fixed Width 0.1, gap
case 14: our PnL, Lattice, margin       (currently 2.96)
case 20: our PnL, rank
combined PnL, minimum capital, bankruptcies
```

Interpretation of case-13 movement is unchanged:

```text
ours rises, competitor falls   -> ideal routing transition
ours rises, competitor rises more -> harmful flow release
```

---

## 11. Promotion Rules

Immediate promotion requires:

```text
20 / 20 passed
bankruptcies == 0
zero runtime errors
strict improvement under the pipeline selector
```

At an unchanged score of 13.30 the selector reduces to combined PnL, so the
benchmark is:

```text
155.53
```

All first-place ranks must be preserved: 3, 9, 11, 12, 14, 15, 16, 17, 20.

---

## 12. Explicit Non-Goals

* Warm-up, THEO, or FOK changes.
* Generic width tuning on either side.
* Reopening the 40.0 capital boundary or tenor as fourth-unit conditions.
* Any further Q6/Q7 bid escalation.
* Aggregate `active_exposure` conditioning — the per-contract form dominates it.
* Case 18 or case 19 first-place attempts; both deficits exceed 24.
* Chasing case 13 without new evidence against the 11.21 floor.

---

## 13. Final Research Directive

The previous loop answered **where** the case-13 mechanism lives and proved it
is a trade rather than an improvement. It also found that the strategy's
remaining PnL upside is not about how much size to quote or on which contract
family, but about **not repeating size on a contract we already hold**.

The next loop's question is:

```text
Where else does repeat exposure cost us,
and what makes case 11 the exception?
```

Treat 13.30 as the architecture's score ceiling, combined PnL as the objective,
and the protected first-place ranks as hard constraints.
