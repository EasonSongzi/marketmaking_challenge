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

For each generation, supply a schema-version-2 plan whose `mode` is `explore`
or `tune`, then prepare detached worktrees:

```bash
candidate_pipeline/loop.sh prepare --run-id <run-id> --plan <plan-json>
```

The plan schema is:

```json
{
  "schemaVersion": 2,
  "mode": "explore",
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

Explore `method` must be `quote`, `respond_to_fok`, or `warm_up`. Candidate IDs must be
unique lowercase slugs. Read the prepared worktree and result-directory paths
from `results/runs/<run-id>/state.json`.

A Tune plan selects an active entry in `results/strategy-state.json` and gives
`challengerId`, the current `parentSourceSha256`, its method, `sampleCount`, and
parameter records with type, direction, parent value, inclusive bounds, and
literal bindings. Prepare creates one designer worktree from the challenger's
complete source revision. The worker writes exactly N unique joint vectors
covering coarse, medium, and fine granularities. Materialize and register them:

```bash
candidate_pipeline/materialize-tuning.sh \
  --source <designer>/Market_making_binary_option.py \
  --plan <absolute-plan> --manifest <draft-manifest> \
  --output-root <designer-variants-root>
candidate_pipeline/loop.sh register-tuning --run-id <run-id> \
  --manifest <designer>/.../materialized-manifest.json
```

Explore assigns one subagent to each of three worktrees. Tune assigns one
subagent to the designer worktree and materializes all N variants there.
Workers preserve public signatures and run local checks. Before any live
evaluation, validate each candidate's scope and signatures:

```bash
candidate_pipeline/validate-candidate.sh \
  --baseline /absolute/main/Market_making_binary_option.py \
  --candidate /absolute/worktree/Market_making_binary_option.py
```

Workers receive one repair pass after a failed validation or local check.

Launch the valid candidates through the serial dispatcher:

```bash
candidate_pipeline/run-generation.sh \
  --state /absolute/main/results/runs/<run-id>/state.json \
  --baseline /absolute/main/results/baselines/best.json \
  --output /absolute/main/results/runs/<run-id>/gNN/statuses.json
```

Add `--invalid <candidate-id>` for every worker that exhausted its repair pass.
The dispatcher returns `0` after candidate codes `0`/`2`, `1` after the same
source has two consecutive runner failures, and `3` on malformed or
hash-invalid evidence. The first runner failure is automatically recorded,
resumed, and retried. Integrity failures never retry.

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
rerunning completed HackerRank evaluations. The loop stops at 15.00/16.00 or
after six generations. Add `--invalid <candidate-id>` to `archive` for each worker that
exhausted its repair pass. `archive` runs selection internally, records
`selection.json`, and cleans up verified worktrees. `finish` writes
`results/experiments/<run-id>.md`, creates a
report-only commit when needed, and skips an empty commit.

A browser or authentication failure is automatically recorded and retried once
for the same source. A second consecutive failure stops without selection or
promotion and preserves the worktree. Repair the browser profile with
`auto_extract_result/login.sh`, then resume the same run manually if needed:

```bash
candidate_pipeline/loop.sh archive --run-id <run-id> \
  --failure <message> --failure-kind authentication
candidate_pipeline/loop.sh resume --run-id <run-id>
```

On resume, legacy invalid evaluations are recalculated locally from the saved
raw report and current source hash. A replacement is accepted only when the
same evidence now proves a valid, ineligible candidate result; genuinely
truncated, malformed, identity-mismatched, or hash-invalid evidence remains a
hard stop. The old evaluation is retained as
`evaluation.legacy-invalid.json`; no HackerRank case is rerun.

Pass `--summaries <json-path>` to a successful `archive` call to store actual
worker implementation summaries keyed by candidate ID for Explore or by the
single designer ID for Tune. Pass `--analysis
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

A HackerRank case that explicitly says the testcase failed with an unhandled/runtime error and
was scored zero is a complete failed outcome even when HackerRank omits its normal `Result:` line.
The evaluator records the runtime error, counts the case as failed with score zero, and leaves
unavailable bankruptcy, PnL, and minimum-capital aggregates as `null`. It returns `2`; only an
ambiguous, missing, hash-invalid, or identity-invalid outcome returns `3`.

Each unique source SHA receives at most one live HackerRank run. Cached evidence
is rebound to the current champion before selection.

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

Promotion copies the verified full-source winner to
`Market_making_binary_option.py`, demotes the old full champion into the pool,
updates `results/champion/`, the registry, and the compatibility `best.*`
files, and commits only the strategy state and report as
`strategy: promote <candidate-id>`. It never stages unrelated changes and never
pushes, tags, deploys, or submits.

## Manual fallback

If the autonomous lifecycle is unsuitable, run a candidate directly and use
`$review-hackerrank-results` to inspect the completed result. The manual skill
does not commit.

## Local checks

The scope validator and tuning materializer compile candidate source but do not execute an
arbitrary `MarketMaker`. A universal dynamic quote preflight would need realistic warm-up state,
underlyings, options, positions, and strategy-specific attributes; synthetic objects can miss live
paths or reject a valid strategy, while importing arbitrary candidate code is itself executable.
Use focused local invariant fixtures for the strategy being tuned. The inventory-skew regression
fixture covers boundary fair values, long/short/flat inventory, and the 0/1/2/3/4/6-cent grid.

```bash
cd candidate_pipeline
npm test
npm run check
```
