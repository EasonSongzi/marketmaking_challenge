---
name: review-hackerrank-results
description: Inspect completed Akuna HackerRank results from an attached browser tab, compare every case with the current best baseline, diagnose changes, decide whether the run qualifies for promotion, optionally save a qualifying baseline when explicitly requested, and recommend the next experiment. Use only after local code has been manually copied to HackerRank and run.
---

# Review HackerRank Results

Start after planning, local implementation, manual copying, and the HackerRank run are complete. Do not plan or implement strategy code in this skill.

Treat `Market_making_binary_option.py` as the source of truth. Never run, submit, or edit HackerRank code. Never modify the local strategy or commit, tag, or branch.

## Invocation Mode

- **Review only:** analyze and decide, but write no files.
- **Review and promote if better:** when the user's prompt explicitly requests save or promotion, create baseline files only if the run qualifies. If it does not qualify, write nothing.

## Workflow

1. Verify `Market_making_binary_option.py` exists. Inspect its relevant `MarketMaker` methods and Git diff only to explain result changes.
2. Read `results/baselines/best.md`, then its referenced baseline artifact. If unavailable, use the initial baseline below.
3. Read and follow the installed Browser control skill.
4. Claim the exact attached HackerRank tab by matching browser, provider tab ID, title, and URL. Do not open a duplicate or use web search to bypass authentication.
5. Take a DOM snapshot, locate the results summary, and expand the results panel only if needed.
6. Enumerate every accessible `Test Case N` tab. Click each one and read its matching named `tabpanel`.
7. Never click `Run Code`, `Save & Proceed`, or another submission control. If visible editor code conflicts with the local file, report a likely manual-copy mismatch.
8. Extract metrics, compare with the baseline, diagnose changes, decide promotion, and recommend one concrete next experiment.

## Efficient Extraction

After confirming the accessible roles, collect all cases in one browser-runtime call. Use fresh names for the persistent JavaScript session.

```javascript
var labels = await hackerRankTab.playwright
  .getByRole("tab")
  .allTextContents({ timeoutMs: 5000 });
var numbers = [...new Set(
  labels
    .map((label) => label.match(/^Test Case (\d+)$/)?.[1])
    .filter(Boolean)
    .map(Number)
)].sort((a, b) => a - b);
var results = [];
for (var number of numbers) {
  var name = `Test Case ${number}`;
  await hackerRankTab.playwright
    .getByRole("tab", { name, exact: true })
    .click({ timeoutMs: 5000 });
  var text = await hackerRankTab.playwright
    .getByRole("tabpanel", { name, exact: true })
    .innerText({ timeoutMs: 5000 });
  results.push({ case: number, text });
}
nodeRepl.write(results);
```

If a panel is missing or the page changes unexpectedly, take a fresh DOM snapshot before continuing. Do not retry blindly.

## Analysis

Report for every case: result, score, PnL, ending cash, and starting capital when available. Calculate:

- passed cases
- bankruptcy count
- SCORED points out of 16
- lowest remaining-capital ratio: `ending cash / starting capital`
- per-case and aggregate deltas from the current baseline

Explain likely regressions or improvements from the local diff and grader evidence. Separate facts from inference. Treat THEO as direct evidence for `price_option_from_parameters`; treat trading results as indirect evidence for warm-up and live pricing.

## Initial Baseline

Use only when the stored best baseline cannot be read:

- Strategy: RFQ only
- Quote quantities: bid 1, offer 1
- FOK: always reject
- Passed: 20/20
- Bankruptcies: 0
- SCORED points: 9.00/16.00
- Combined SCORED-case PnL: -2.73
- Lowest remaining-capital ratio: 76.9%

## Promotion Decision

Apply this priority:

1. Require 20/20 passed.
2. Require zero bankruptcies.
3. Prefer higher SCORED points than the current baseline.
4. If points are equal, require a larger minimum capital buffer to promote.
5. Use combined PnL and repeated-run stability only as secondary tie-breakers.

If the run is worse, create no artifact and recommend one focused adjustment.

If the run qualifies:

- In review-only mode, recommend promotion but write nothing.
- In review-and-promote mode, create one new immutable `results/baselines/<strategy>-vN.md` artifact containing strategy settings, aggregate metrics, and all cases; then update `results/baselines/best.md`.

Never overwrite a prior baseline. Do not calculate file hashes. Let a later user-created Git commit bind promoted results to their code. Never commit automatically.

## Response

Lead with the promotion decision. Include:

1. Passed cases, bankruptcies, SCORED points, and lowest capital ratio.
2. A compact all-case table with score, PnL, and ending cash.
3. Deltas from the current baseline.
4. Likely causes with explicit uncertainty.
5. One concrete next experiment.
6. Files created or updated, if any.

Do not claim hidden true prices, unseen fills, or causality unsupported by grader output.
