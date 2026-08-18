# Candidate Evaluation Pipeline

The autonomous `$run-market-maker-loop` skill is the primary entrypoint. Its
lead agent controls the lifecycle and shared HackerRank session. Subagents only
edit and locally check code in their assigned worktrees; they never launch the
browser runner or commit.

The pipeline delegates raw HackerRank extraction to the single main-worktree
`auto_extract_result/run.sh`, which owns Playwright, authentication, and the
cross-process runner lock. Evaluation, state management, and selection are
local operations.

## Autonomous lifecycle

Choose a lowercase, hyphenated run ID, start the run, and inspect its status:

```bash
candidate_pipeline/loop.sh start --run-id <run-id>
candidate_pipeline/loop.sh status --run-id <run-id>
```

For each generation, supply a JSON plan containing one target method and
exactly three distinct candidates, then prepare detached worktrees:

```bash
candidate_pipeline/loop.sh prepare --run-id <run-id> --plan <plan-json>
```

The plan schema is:

```json
{
  "schemaVersion": 1,
  "method": "quote",
  "rationale": "Evidence-based generation rationale.",
  "candidates": [
    {
      "id": "candidate-a",
      "hypothesis": "Distinct testable hypothesis.",
      "implementationPlan": "Implementation brief and expected tradeoff."
    },
    {
      "id": "candidate-b",
      "hypothesis": "A different testable hypothesis.",
      "implementationPlan": "Implementation brief and expected tradeoff."
    },
    {
      "id": "candidate-c",
      "hypothesis": "A third testable hypothesis.",
      "implementationPlan": "Implementation brief and expected tradeoff."
    }
  ]
}
```

`method` must be `quote`, `respond_to_fok`, or `warm_up`. Candidate IDs must be
unique lowercase slugs. Read the prepared worktree and result-directory paths
from `results/runs/<run-id>/state.json`.

The lead assigns one subagent to each returned worktree and waits for all three.
Workers edit `MarketMaker` and required imports, preserve public signatures,
and run local checks. Before any live evaluation, validate each candidate's
scope and signatures:

```bash
candidate_pipeline/validate-candidate.sh \
  --baseline /absolute/main/Market_making_binary_option.py \
  --candidate /absolute/worktree/Market_making_binary_option.py
```

Workers receive one repair pass after a failed validation or local check.

Launch the valid candidates together through the fail-fast dispatcher. It
queues all candidate processes behind the shared browser lock and terminates
siblings after the first runner or integrity failure:

```bash
candidate_pipeline/run-generation.sh \
  --state /absolute/main/results/runs/<run-id>/state.json \
  --baseline /absolute/main/results/baselines/best.json \
  --output /absolute/main/results/runs/<run-id>/gNN/statuses.json
```

Add `--invalid <candidate-id>` for every worker that exhausted its repair pass.
The dispatcher returns `0` after candidate codes `0`/`2`, `1` on a runner or
infrastructure failure, and `3` on malformed or hash-invalid evidence. It
atomically records every completed, skipped, failed, or cancelled candidate in
the output JSON.

After the dispatcher finishes successfully, save worker summaries and a
post-evaluation analysis under `results/runs/<run-id>/inputs/`, archive evidence
before promotion, then finish after `status` reports a stopping condition:

```bash
candidate_pipeline/loop.sh archive --run-id <run-id> \
  --summaries <summaries-json> --analysis <analysis-json>
candidate_pipeline/loop.sh promote --run-id <run-id>
candidate_pipeline/loop.sh finish --run-id <run-id>
```

`results/runs/<run-id>/state.json` records completed candidates, evaluations,
promotions, commits, and the stop reason. Resume from this state without
rerunning completed HackerRank evaluations. The loop stops at 15.00/16.00,
after five generations, or after two consecutive generations without
promotion. Add `--invalid <candidate-id>` to `archive` for each worker that
exhausted its repair pass. `archive` runs selection internally, records
`selection.json`, and cleans up verified worktrees. `finish` writes
`results/experiments/<run-id>.md`, creates a
report-only commit when needed, and skips an empty commit.

A browser or authentication failure stops the run immediately without
selection or promotion and preserves its worktrees. Repair the browser profile
with `auto_extract_result/login.sh`, then resume the same run. Record the
failure without cleanup and resume by running:

```bash
candidate_pipeline/loop.sh archive --run-id <run-id> \
  --failure <message> --failure-kind authentication
candidate_pipeline/loop.sh resume --run-id <run-id>
```

On resume, legacy evaluations marked invalid solely because cases failed or
reported bankruptcy are recalculated locally from the saved raw report. The
old evaluation is retained as `evaluation.legacy-invalid.json`; no HackerRank
case is rerun.

Pass `--summaries <json-path>` to a successful `archive` call to store actual
worker implementation summaries keyed by candidate ID. Pass `--analysis
<json-path>` with a required `finding` and optional `nextGenerationRationale`
to record the lead's evidence-based result analysis. Use failure kind
`authentication`, `browser`, `runner`, or `integrity`; integrity failures must
be corrected before resuming.

## Evaluate a worktree candidate

The main agent calls:

```bash
/absolute/main/candidate_pipeline/candidate.sh \
  --source /absolute/worktree/Market_making_binary_option.py \
  --result-dir /absolute/worktree/.candidate-results/run-001/agent-a \
  --label agent-a \
  --baseline /absolute/main/results/baselines/best.json
```

`candidate.sh` invokes the central extractor. Runner status `0` or `2`
continues to the evaluator; runner status `1` stops the pipeline. The evaluator
writes `evaluation.json` beside the worktree's raw Markdown and JSON.

Candidate exit statuses are:

- `0`: valid and strictly exceeds the baseline;
- `2`: evidence is valid but performance is ineligible, including failed tests,
  bankruptcy, or not strictly exceeding the baseline;
- `3`: evidence is malformed or incomplete, or the source SHA changed;
- `1`: runner or pipeline failure.

Each candidate receives one live HackerRank run. Historical unpromoted results
may inform a hypothesis but cannot be promoted without a fresh evaluation.

## Standalone selector API

`archive` invokes the selector automatically for the autonomous workflow. Use
`select.sh` directly only when evaluating candidates outside that lifecycle:

```bash
/absolute/main/candidate_pipeline/select.sh \
  --candidate /absolute/worktree-a/.candidate-results/run-001/agent-a/evaluation.json \
  --candidate /absolute/worktree-b/.candidate-results/run-001/agent-b/evaluation.json \
  --candidate /absolute/worktree-c/.candidate-results/run-001/agent-c/evaluation.json \
  --output /absolute/main/results/runs/run-001/selection.json
```

The selector rechecks every valid source SHA, filters on `valid=true` and
`eligible=true`, then orders by SCORED points, minimum remaining-capital ratio,
combined PnL, modified line count, and candidate ID. Before temporary worktrees
are removed, the main agent must copy the winner's raw Markdown, raw JSON, and
evaluation into the main run directory and recheck the promoted source SHA.

Selector exit statuses are:

- `0`: a unique winner was written;
- `2`: no candidate passed the promotion gate;
- `3`: an evaluation or source SHA is invalid;
- `1`: selector failure.

Archive and hash-verify each source, patch, raw Markdown and JSON, evaluation,
and plan before cleanup or promotion. Treat malformed data, changed hashes, and
selection-integrity failures as hard stops. Remove only pipeline-registered
worktrees whose evidence was archived and verified.

Promotion copies the verified winner to `Market_making_binary_option.py`,
creates an immutable baseline artifact, updates `best.json` and `best.md`, and
commits only the strategy, baseline files, and experiment report as
`strategy: promote <candidate-id>`. It never stages unrelated changes and never
pushes, tags, deploys, or submits.

## Manual fallback

If the autonomous lifecycle is unsuitable, run a candidate directly and use
`$review-hackerrank-results` to inspect the completed result. The manual skill
does not commit.

## Local checks

```bash
cd candidate_pipeline
npm test
npm run check
```
