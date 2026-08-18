---
name: run-market-maker-loop
description: Run or resume the repository's autonomous, scored MarketMaker experiment loop. Use only when explicitly invoked to improve quote, respond_to_fok, or warm_up by planning three distinct candidates per generation, delegating implementations to isolated worktrees, evaluating them through HackerRank, promoting strict improvements, and writing the experiment report.
---

# Run the Market-Maker Loop

Operate as the lead agent. Continue without interaction until the deterministic pipeline reports a stopping condition or a hard failure.

## Start or resume

For a new run, choose a lowercase, hyphenated run ID and execute `candidate_pipeline/loop.sh start --run-id <run-id>`. For `resume <run-id>`, inspect `candidate_pipeline/loop.sh status --run-id <run-id>`, then execute `candidate_pipeline/loop.sh resume --run-id <run-id>`. Read `results/runs/<run-id>/state.json` and continue at the first incomplete candidate. Treat a candidate as completed only when its result directory contains `evaluation.json` whose candidate ID and source SHA-256 match the current worktree source. Never rerun that completed evaluation.

Before each generation, read `AGENTS.MD`, the challenge documentation, the complete `MarketMaker` class, `results/baselines/best.json`, `results/baselines/best.md`, recent candidate evaluations, prior `results/experiments/` reports, and `candidate_pipeline/README.md`.

## Plan and prepare

Choose exactly one target from `quote`, `respond_to_fok`, or `warm_up`. Base the choice on current code and measured evidence; allow repeats when justified. Store transient input JSON under the ignored `results/runs/<run-id>/inputs/` directory so it cannot pollute the repository root. Write a version-1 plan JSON there with `method`, a concise `rationale`, and exactly three distinct candidates. Give each candidate a lowercase hyphenated `id`, `hypothesis`, and `implementationPlan` describing its implementation brief and expected tradeoff. Record decision summaries, not private chain-of-thought.

Execute `candidate_pipeline/loop.sh prepare --run-id <run-id> --plan <plan-json>`. Read the three detached `worktreePath` and `resultDirectory` values from the updated state file.

## Delegate three candidates

Call `spawn_agent` three times before waiting, once for each prepared worktree, then use `wait_agent` until all three finish. Give each worker its path, candidate ID, hypothesis, baseline summary, repository constraints, and local-check commands. Permit changes only inside `MarketMaker` plus required imports. Preserve challenge public signatures and code outside the class.

Require `candidate_pipeline/validate-candidate.sh --baseline <main-repo>/Market_making_binary_option.py --candidate <worktree>/Market_making_binary_option.py`, `python3 -m py_compile Market_making_binary_option.py`, and focused local checks. The validator permits import changes and `MarketMaker` internals while pinning challenge code and public signatures. Require a short implementation summary and actual check outcomes. Prohibit workers from running HackerRank, invoking `candidate.sh`, or committing.

If a worker fails local checks, call `followup_task` once for that worker with the failure output and wait once more. After one failed repair, record the candidate invalid and continue only when another candidate remains valid.

## Evaluate, archive, and select

From the lead session, launch all valid candidates together through the cancellation-aware dispatcher:

```bash
candidate_pipeline/run-generation.sh \
  --state <main-repo>/results/runs/<run-id>/state.json \
  --baseline <main-repo>/results/baselines/best.json \
  --output <main-repo>/results/runs/<run-id>/gNN/statuses.json
```

Add one `--invalid <candidate-id>` for each worker that exhausted its repair pass. Never let workers access the browser runner. The dispatcher starts the remaining `candidate.sh` processes concurrently, relies on the central browser lock for serialization, skips already evaluated candidates on resume, and terminates queued siblings after the first runner or integrity failure.

Interpret the dispatcher status and saved per-candidate codes exactly: candidate `0` means eligible, candidate `2` means valid but ineligible, dispatcher `3` means malformed or hash-invalid evidence, and dispatcher `1` means runner or pipeline failure. On `1`, stop immediately without selection or promotion, preserve worktrees and state, and direct recovery through `./auto_extract_result/login.sh`. On `3`, hard-stop for integrity review. Resume the same run after repair.

Save the workers' actual summaries as a JSON object keyed by candidate ID. Save a post-evaluation analysis JSON with a non-empty `finding` and, when another generation is useful, a non-empty `nextGenerationRationale`. Execute `candidate_pipeline/loop.sh archive --run-id <run-id> --summaries <summaries-json> --analysis <analysis-json>`, adding one `--invalid <candidate-id>` for each candidate that exhausted its repair pass. `archive` copies and hash-verifies the evidence, runs selection, records `selection.json`, and cleans up only verified registered worktrees. If a browser command failed, instead execute `candidate_pipeline/loop.sh archive --run-id <run-id> --failure <message> --failure-kind <authentication|browser|runner>`; do not select, promote, or clean up. Record an evidence failure with `--failure-kind integrity`.

Interpret archive status `3` as an input or integrity failure and `1` as an unexpected pipeline failure. Never override its selector. The gate requires 20/20 passes, zero bankruptcies, and strictly better points or equal points with a better minimum-capital ratio; ranking is points, minimum-capital ratio, combined PnL, modified lines, then candidate ID.

## Promote and continue

For a verified winner, execute `candidate_pipeline/loop.sh promote --run-id <run-id>`. Let it update the strategy, immutable baseline, `best.json`, `best.md`, report, and scoped `strategy: promote <candidate-id>` commit. Do not stage unrelated changes. Never push, tag, deploy, or submit.

Remove only pipeline-registered worktrees with successfully archived, hash-verified evidence. Preserve worktrees after any archive or integrity failure.

Continue with the promoted baseline or, when no candidate qualifies, the unchanged baseline. Stop when state reports at least 15.00/16.00, five completed generations, or two consecutive generations without promotion.

## Finish

Execute `candidate_pipeline/loop.sh finish --run-id <run-id>` after `status` reports a recommended stop. Let it create `results/experiments/<run-id>.md` and a report-only `experiment: finish <run-id>` commit when needed; do not create an empty commit.

Ensure the report includes starting and final baselines, stop reason, score trend, each generation's method and rationale, candidate hypotheses and implementation summaries, evaluation metrics and baseline deltas, selections, promotions, commits, findings, and recovery instructions. Return the run ID, stop reason, promoted candidates and commits, final score, report path, verification, and preserved worktrees. State that each candidate received one HackerRank run and that stochastic variation remains possible.

Do not execute this live lifecycle while validating the skill. Exercise `candidate_pipeline` tests and temporary-repository fixture evaluations instead; never represent fixtures as live evidence or promote them in the real repository. Use `$review-hackerrank-results` only as the manual fallback for an already completed HackerRank run.
