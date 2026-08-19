# Strategy Research After 13.00: Selective Price–Size Routing Plan

## 1. Current State

**Current champion:** `g6-signed-central`
**Current score:** **13.00 / 16.00 SCORED points**
**Combined PnL:** **129.76**
**Bankruptcies:** **0**
**Minimum ending capital:** **8.15 / 10.00**

The latest loop successfully crossed the previous 13.00 boundary by converting **case 17 from second place to first place** while preserving the important existing ranks. However, Generations 4–6 continued to improve aggregate PnL without producing another rank transition. This is strong evidence that the current quantity-policy family—signed reserve, central-offer gating, and post-fill reserve approximations—is approaching a local plateau.

The next research phase should therefore shift from **quantity-predicate discovery** toward **selective RFQ price–size interaction**. This is justified by the mechanics of the challenge: RFQ orders are routed to the highest bid or lowest offer, and orders may be split among competing market makers. Consequently, a one-cent change in quote price can cause a discontinuous change in allocation rather than merely a small continuous change in expected PnL. 

The immediate score target is:

```text
13.00 -> 13.20
```

The primary target is **case 13**.

---

## 2. Current Rank Frontier

The current champion has the following important SCORED-case structure:

| Case | Current PnL | Current Rank | Main Competitor         | Competitor PnL | Research Status      |
| ---- | ----------: | -----------: | ----------------------- | -------------: | -------------------- |
| 13   |        8.96 |          2nd | Fixed Width 0.1         |          11.96 | **Primary target**   |
| 14   |       11.76 |          2nd | Lattice                 |          23.26 | Secondary target     |
| 15   |        8.68 |          1st | Situational Unawareness |           7.74 | Protect              |
| 16   |       26.25 |          1st | Lattice                 |          10.71 | Protect              |
| 17   |       13.94 |          1st | Situational Unawareness |          13.58 | **Fragile: protect** |
| 18   |        1.32 |          2nd | Fixed Width 0.05        |          42.22 | Protect rank         |
| 19   |        1.07 |          2nd | Situational Unawareness |          21.93 | Protect rank         |
| 20   |       -0.60 |          1st | Lattice                 |          -7.20 | Protect              |

Case 13 is particularly attractive because the current strategy is only **3.00 PnL behind first place**, while historical experiments prove that first place is achievable.

---

## 3. Critical Historical Evidence

The most important archived strategy is:

```text
g5-wide-three-three
```

It produced:

| Case | Historical PnL | Historical Rank |
| ---- | -------------: | --------------: |
| 13   |       **9.39** |         **1st** |
| 14   |      **20.30** |         **1st** |
| 15   |           7.54 |             1st |
| 16   |          28.56 |             1st |
| 18   |           9.97 |             2nd |

The strategy failed globally because its aggressive `width = 3 cents` and `quantity = 3` behavior caused severe capital losses:

```text
case 7  -> ending PnL -3.93
case 12 -> ending PnL -14.38
case 17 -> PnL -20.17
```

Therefore, the historical result should **not** be interpreted as evidence for global quantity three.

The more useful interpretation is:

> The profitable effect appears to come from an interaction between aggressive price and third-unit liquidity.

Historical ablations support this interpretation:

```text
width = 3, quantity = 2  -> case 13 ~= 5.81
width = 2, quantity = 3  -> case 13 ~= 8.76
width = 3, quantity = 3  -> case 13 = 9.39, first place
```

Neither price aggression nor size three alone reproduced the full effect.

The next research question is therefore:

> **Can the current safe quantity-three architecture selectively reproduce the historical 3-cent × size-three routing effect without reopening the bankruptcy paths eliminated by the current champion?**

---

# 4. Research Objective

The objective of the next loop is **not** to maximize aggregate PnL.

The objective is:

```text
Win case 13
while preserving every currently valuable rank.
```

Primary promotion condition:

```text
score >= 13.20
bankruptcies == 0
case 13 == 1st
case 17 == 1st
case 15 == 1st
case 16 == 1st
case 20 == 1st
case 18 >= 2nd
case 19 >= 2nd
```

A candidate that increases PnL substantially but leaves the score at 13.00 should generally remain a challenger rather than replace the champion.

---

# 5. Freeze List

The following components should remain frozen throughout the first four generations.

## Warm-Up Estimation

Do not modify:

* FED transition estimation;
* drift estimation;
* volatility estimation;
* sector covariance estimation;
* rate-beta estimation;
* warm-up sample handling.

There is currently no evidence that estimation error is the closest score boundary.

## Option Pricing

Do not modify `price_option_from_parameters`.

THEO pricing is already exact.

## FOK Policy

Do not modify `respond_to_fok`.

No current rank-boundary evidence justifies reopening FOK research.

## Existing Quantity Architecture

Preserve:

* signed collateral reserve;
* current central-offer logic;
* existing low-loss third-unit behavior;
* current inventory accounting;
* current repeat-RFQ memory logic;
* 40-capital/high-capital branch;
* bankruptcy safeguards.

The experiment should change **quote price only inside explicitly defined states**.

---

# 6. Core Experimental Principle

Do not test generic:

```python
half_width = 0.03
```

against:

```python
half_width = 0.04
```

globally.

Instead test conditional policies of the form:

```python
if safe_size_three_state:
    half_width = 0.03
else:
    half_width = existing_width
```

The central hypothesis is:

```text
Aggressive pricing is valuable specifically when we also have enough
safe capacity to participate with the third contract.
```

Thus price and quantity should be treated as a **coupled execution decision**.

---

# 7. Six-Generation Research Loop

## Generation 1: Safe-Q3 Coupled Narrowing

### Hypothesis

The historical `3-cent × quantity-three` advantage can be recovered by narrowing prices only when the current champion already independently determines that quantity three is safe.

### Change

Keep the current quantity calculation unchanged.

After quantities are determined:

```python
if bid_quantity == 3:
    bid_half_width = 0.03
else:
    bid_half_width = existing_bid_width

if offer_quantity == 3:
    offer_half_width = 0.03
else:
    offer_half_width = existing_offer_width
```

Do not make quantity three easier to obtain.

The experiment changes only the price attached to already-approved third-unit states.

### Why Generation 1 Comes First

This is the cleanest test of the price–size interaction hypothesis because:

```text
quantity policy: controlled
risk policy: controlled
state classification: controlled
price conditional on q=3: treatment
```

### Primary Diagnostics

Inspect:

```text
case 13
case 14
case 17
case 18
```

Especially record:

```text
our PnL change
competitor PnL change
rank change
```

A reduction in `Fixed Width 0.1` PnL in case 13 is valuable evidence even if our own PnL increase is modest.

---

## Generation 2: First-Touch Q3 Narrowing

Run this generation regardless of whether G1 fully promotes if G1 shows any case-13 routing signal.

### Hypothesis

Aggressive pricing is primarily useful for winning the **initial RFQ allocation**, while repeat RFQs contain worse information and should retain the current wider defensive behavior.

### Change

Apply the G1 narrow price only when:

```text
quantity == 3
AND
this option has not previously been filled / quoted aggressively
```

Conceptually:

```python
if first_touch and quantity == 3:
    half_width = 0.03
else:
    half_width = current_policy
```

Keep existing repeat-RFQ widening unchanged.

### Interpretation

Compare G1 and G2.

If:

```text
G1 helps case 13 but damages case 17
G2 preserves most case-13 improvement and restores case 17
```

then the adverse selection is likely concentrated in repeat RFQs.

If G2 loses the entire case-13 signal, aggressive pricing likely needs to remain active beyond the first interaction.

---

## Generation 3: Bid-Side Decomposition

### Hypothesis

The useful allocation effect may originate predominantly from one RFQ direction.

The current quantity research already showed strong side asymmetry. Price aggressiveness should therefore also be decomposed by side.

### Change

Use narrow pricing only on q=3 bids:

```python
if bid_quantity == 3:
    bid_half_width = 0.03

offer_half_width = current_policy
```

Do not narrow the offer.

### Research Question

Does aggressive third-unit **buy-side participation** explain the case-13 improvement?

### Evaluation

Compare against both:

```text
Champion
Generation 1
```

Record changes in:

```text
case 13 PnL
case 13 Fixed Width 0.1 PnL
case 14
case 17
case 18
minimum capital
```

---

## Generation 4: Offer-Side Decomposition

### Hypothesis

The profitable historical behavior instead originates predominantly from aggressive q=3 offers.

### Change

Mirror Generation 3:

```python
bid_half_width = current_policy

if offer_quantity == 3:
    offer_half_width = 0.03
```

### Interpretation

Generations 3 and 4 form a controlled side attribution experiment.

Possible outcomes:

```text
G3 >> G4:
    focus future research on bid routing

G4 >> G3:
    focus future research on offer routing

G3 ~= G4 and both positive:
    both sides contribute independently

G1 positive but G3/G4 individually weak:
    interaction requires simultaneous two-sided competitiveness
```

Do not immediately combine predicates until this attribution is understood.

---

# 8. Generation 5: State Tomography of the Winning Side

Generation 5 should not be predetermined before observing G1–G4.

Select whichever side showed the strongest case-13 signal and determine **which state variable explains it**.

Test three challengers representing economically distinct hypotheses.

## Candidate A: Central Fair Value

Narrow only when:

```text
quantity == 3
AND
fair value is central
```

Example coarse region:

```text
0.20 <= fair_value <= 0.80
```

The exact boundary should use an existing repository convention where possible rather than introducing a broad numerical sweep.

### Hypothesis

Central contracts require more collateral but may generate more balanced and competitive RFQ flow.

---

## Candidate B: Position-Reducing State

Narrow only when the potential trade reduces current directional inventory.

Conceptually:

```text
aggressive bid when short
aggressive offer when long
```

### Hypothesis

The historical aggressive strategy may have worked because some of its most competitive fills naturally closed inventory rather than expanding exposure.

This would provide a structural safety mechanism rather than a capital threshold.

---

## Candidate C: Flat / Low-Inventory State

Narrow only when:

```text
abs(position) <= small threshold
```

### Hypothesis

Aggressive first-touch liquidity may be valuable while inventory is approximately neutral but become adversely selected once directional exposure accumulates.

---

## Selection Rule

Select the state predicate that maximizes:

```text
rank improvement per unit of collateral risk
```

not raw PnL.

Prefer:

```text
case 13 first
case 17 preserved
```

over:

```text
higher total PnL
case 13 still second
```

---

# 9. Generation 6: Controlled Composition

Generation 6 is an integration generation.

Do not introduce a new mechanism.

Combine only independently supported components from G1–G5.

Example:

```python
if (
    bid_quantity == 3
    and is_first_touch
    and abs(position) <= inventory_threshold
):
    bid_half_width = 0.03
```

or:

```python
if (
    offer_quantity == 3
    and central_fair_value
    and position > 0
):
    offer_half_width = 0.03
```

The exact composition must be derived from prior generation evidence.

### Generation 6 Objective

Produce the smallest rule that achieves:

```text
13.20+
```

while preserving the current champion's safety properties.

If multiple combinations achieve 13.20, choose the structurally simplest one.

---

# 10. Required Per-Generation Diagnostics

Do not evaluate experiments only using:

```text
score
combined PnL
bankruptcy
```

For every generation, produce a frontier table:

| Case | Baseline Rank | Candidate Rank | Baseline PnL | Candidate PnL | Leader PnL | Gap to Higher Rank | Buffer to Lower Rank |
| ---- | ------------: | -------------: | -----------: | ------------: | ---------: | -----------------: | -------------------: |

At minimum include:

```text
13
14
15
17
18
19
20
```

Also record competitor PnL where relevant.

For case 13 specifically:

```text
Our PnL
Fixed Width 0.1 PnL
Lattice PnL
allocation/routing changes visible in logs
```

The critical quantity is not merely:

```text
delta own PnL
```

but:

```text
delta relative PnL
=
delta own PnL
-
delta competitor PnL
```

because price changes can steal order flow from competitors.

---

# 11. Promotion Rules

## Immediate Promotion

Promote immediately if:

```text
score >= 13.20
bankruptcies == 0
current first-place cases preserved
case 18 >= 2nd
case 19 >= 2nd
```

Do not continue tuning the same mechanism merely to increase aggregate PnL.

---

## Challenger Retention

Keep a non-promoting strategy active if it provides one of the following:

1. Best observed case-13 PnL.
2. Best observed case-14 PnL.
3. Largest reduction in the case-13 leader's PnL.
4. Strongest minimum-capital protection.
5. A clearly independent side/state attribution signal.

For example, `g3-side-reserve` should remain scientifically relevant because its **130.26 combined PnL** and **14.10 case-14 PnL** demonstrate an independent collateral-allocation mechanism even though its score is lower.

---

## Archive

Archive candidates that:

```text
leave all ranks unchanged
AND
do not materially improve a target boundary
AND
introduce no new structural evidence
```

A +$2 aggregate PnL improvement with identical frontier behavior is no longer sufficient research progress.

---

# 12. Explicit Non-Goals for This Loop

Do not spend generations on:

* warm-up estimator refinements;
* FOK edge thresholds;
* global quantity three;
* global 3-cent quotes;
* global quote-width sweeps;
* cash-floor sweeps such as 0.70 / 0.75 / 0.80;
* minor reserve-margin tuning;
* arbitrary fair-value threshold optimization;
* simultaneous edits to pricing and quantity eligibility;
* case-specific hardcoding.

These either have already been substantially explored or do not target the closest current rank boundary.

---

# 13. If Case 13 Reaches First Place

Once case 13 becomes first:

```text
Score target achieved: 13.20
```

Freeze the successful case-13 mechanism.

The next target becomes **case 14**.

Historical evidence is unusually strong:

```text
current champion:      11.76, second
historical wide-q3:    20.30, first
current leader:        23.26
```

The historical strategy changed both our PnL and competitor routing substantially, so case 14 should be treated as another **allocation-structure problem**, not simply as an 11.50-dollar standalone-PnL deficit.

Research should then repeat the same methodology:

```text
price × size
-> side decomposition
-> first/repeat decomposition
-> inventory decomposition
-> collateral-state decomposition
```

rather than returning to broad parameter optimization.

---

# 14. Updated Score Envelope

The previous research document described **13.30** as the next historical envelope because it was written from a 12.80 baseline.

That target is now outdated.

The current champion has already captured the additional case-17 score:

```text
Current                     13.00
+ win case 13               +0.20
+ win case 14               +0.30
---------------------------------
Evidence-backed envelope    13.50
```

Therefore the revised research ladder is:

```text
13.00
  |
  | selective price-size routing
  v
13.20
  |
  | recover case-14 historical routing
  v
13.50
```

This **does not imply that 13.50 is the theoretical maximum**. It is simply the highest score currently supported by concrete repository evidence showing that the missing ranks have individually been achieved.

---

# 15. Final Research Directive

For the next six-generation loop:

> **Freeze estimation, pricing theory, FOK logic, and quantity eligibility. Treat the current quantity policy as the safety layer and investigate whether locally narrowing quotes from four cents to three cents specifically when safe quantity-three participation is already available can recover the historical case-13 allocation advantage. First establish whether the effect exists, then isolate first-touch versus repeat behavior, then bid versus offer behavior, then condition the winning side on economically meaningful state variables. Promote on rank transitions, not aggregate PnL.**

The sequence should be:

```text
G1  q3-conditioned 3-cent pricing
G2  first-touch q3-conditioned pricing
G3  bid-only q3-conditioned pricing
G4  offer-only q3-conditioned pricing
G5  state tomography on the winning side
G6  compose only independently validated signals
```

**Primary target:** case 13 first place and **13.20+**.
**Secondary target after promotion:** case 14 and the evidence-backed **13.50** frontier.
