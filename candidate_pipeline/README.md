# Candidate Evaluation Pipeline

The autonomous `$run-market-maker-loop` skill is the primary entrypoint. Its
lead agent controls the lifecycle and shared HackerRank session. Subagents only
edit and locally check code in their assigned worktrees; they never launch the
browser runner or commit.

The pipeline delegates raw HackerRank extraction to the single main-worktree
`auto_extract_result/run.sh`, which owns Playwright, authentication, and the
cross-process runner lock. Evaluation, state management, and selection are
local operations.

Every run the pipeline launches is headless, so a long lifecycle never takes
over the screen. Only `auto_extract_result/login.sh` opens a visible browser, and
`auto_extract_result/run.sh --headed` (or `AUTO_EXTRACT_HEADED=1`) forces one for
debugging.

## Autonomous lifecycle

Choose a lowercase, hyphenated run ID, start the run, and inspect its status:

```bash
candidate_pipeline/loop.sh start --run-id <run-id>
candidate_pipeline/loop.sh status --run-id <run-id>
```

For each generation, supply a schema-version-3 plan whose `mode` is `explore`
or `tune`, then prepare detached worktrees:

```bash
candidate_pipeline/loop.sh prepare --run-id <run-id> --plan <plan-json>
```

The plan schema is:

```json
{
  "schemaVersion": 3,
  "mode": "explore",
  "method": "quote",
  "parent": {
    "type": "champion",
    "sourceSha256": "<current-champion-sha256>"
  },
  "objective": {
    "kind": "exploit",
    "targetCases": [6],
    "expectedGainHundredths": 30,
    "collateralBudgetHundredths": 30
  },
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

Explore `method` must be `price_option`, `quote`, `respond_to_fok`, or `warm_up`.
Candidate IDs must be unique lowercase slugs. `parent.type` is either `champion` as above or
`challenger`; a challenger parent also requires `challengerId` and must pin the
SHA-256 of that challenger's current active revision:

```json
{
  "type": "challenger",
  "challengerId": "active-challenger-id",
  "sourceSha256": "<current-revision-sha256>"
}
```

The objective is either `exploit`, with positive expected gain, or `probe`, with
zero expected gain and an `unlock` statement naming the positive-score path it
enables. The Explore schema accepts one generation-level `method`; candidate-level or
plural method declarations are rejected. Challenger-parent worktrees are
initialized from that revision's complete source, not by merging individual
methods into the champion. Read the prepared worktree and result-directory
paths from `results/runs/<run-id>/state.json`.

A Tune plan selects an active entry in `results/strategy-state.json` and gives
`challengerId`, the current `parentSourceSha256`, its method, `sampleCount`, the
same generation objective, and parameter records with type, direction, parent value, inclusive bounds, and
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
  --baseline /absolute/parent/Market_making_binary_option.py \
  --candidate /absolute/worktree/Market_making_binary_option.py \
  --target-method quote
```

For challenger-parent Explore, `--baseline` is the immutable challenger
revision. With `--target-method`, the validator rejects changes to every other
core method while still allowing required imports, `MarketMaker` helpers, the two
bookkeeping hooks, and appended `__init__` state.

`on_trade` and `on_step_advance` are bookkeeping rather than strategy. Both return
`None`, so a recording only reaches behaviour through the method that reads it, which
under the one-target freeze is the target method being attributed. They are the only
observation hooks the grader offers: `on_trade` sees every executed fill's price and
counterparty, and `on_step_advance` sees the day boundary — the previous underlying
state before it is overwritten, the options that expired out of the active book, and
every day including those with no RFQ. Both are exempt from the one-target freeze and
may be extended alongside any target method. Their signatures stay frozen, and each
must keep the side effect the baseline performs: `on_trade` its
`self.position.add_option_quantity` recording, and `on_step_advance` its assignment of
`self.underlying_state` and `self.active_option_state` from its parameters.

`price_option` is a target method, never bookkeeping. It is the live theo, and it is
the only way to make theo depend on state: `warm_up` runs once and can only produce a
session constant. It is separate from `price_option_from_parameters`, which stays
frozen because the THEO case scores that method directly, so a `price_option`
generation cannot put case 1 at risk.

It is a global change with three consumers, and a plan must name which one the
hypothesis targets: the quoted fair value, the `respond_to_fok` acceptance threshold,
and the `signed_reserve` capacity arithmetic. The third is the trap — a theo shift
also moves the size limits, so a gain cannot be attributed to better prices without
disentangling it. `signed_reserve` accumulates only over options with a non-zero
position, so a `price_option` change is reserve-neutral on a flat book and couples
only once inventory exists. Prefer first generations where that coupling is provably
small. Budget collateral as for any global lever.

`__init__` is neither a target nor bookkeeping, and may only be **appended** to. The
baseline body must survive as an exact prefix, and every appended statement must assign
a `self._`-prefixed attribute to a constant, a literal container, or an empty
`list()`/`dict()`/`set()`/`tuple()` call. This lets the bookkeeping hooks and the target
method share state without each carrying its own `getattr` lazy initialiser — which the
one-target freeze would forbid them from keeping in agreement, since only the target
method may change. Anything computed belongs in the target method, not here.
The serial dispatcher repeats this validation before using cached evidence or
launching HackerRank. A scope-invalid candidate is skipped and must be passed
to `archive` with `--invalid <candidate-id>`. Workers receive one repair pass
after a failed validation or local check.

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
rerunning completed HackerRank evaluations. The loop stops at 16.00/16.00 or
after six generations. Add `--invalid <candidate-id>` to `archive` for each worker that
exhausted its repair pass. `archive` runs selection internally, records
`selection.json`, and cleans up verified worktrees. `finish` writes
`results/experiments/<run-id>.md`, creates a
report-only commit when needed, and skips an empty commit.

Explore promotion eligibility is always recomputed against the current
champion by SCORED points only, regardless of which parent supplied the source. If the parent is an
active challenger and no candidate beats the champion, the best valid
candidate that improves the declared target score or target gap within its
collateral budget is automatically stored as a new
active `derived-explore` challenger with immutable parent lineage. An optional
analysis `challenger` decision may add rationale for that same candidate, but
cannot replace it with a weaker branch. Only a candidate that strictly exceeds
the current champion's total score can enter the promotion transaction. PnL and
minimum capital never break a score tie.

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

- `0`: valid and strictly exceeds the baseline SCORED points;
- `2`: evidence is valid but performance is ineligible, including runtime errors,
  guard-case failures, non-bankruptcy scored failures, or not strictly exceeding the baseline score;
- `3`: evidence is malformed or incomplete, or the source SHA changed;
- `1`: runner or pipeline failure.

A HackerRank case that explicitly says the testcase failed with an unhandled/runtime error and
was scored zero is a complete failed outcome even when HackerRank omits its normal `Result:` line.
The evaluator records the runtime error, counts the case as failed with score zero, and leaves
unavailable bankruptcy, PnL, and minimum-capital aggregates as `null`. It returns `2`; only an
ambiguous, missing, hash-invalid, or identity-invalid outcome returns `3`.

A bankruptcy in cases 5-20 is a complete, valid zero-score case. It may promote
when gains in other scored cases make total score strictly higher. Cases 1-4
must still pass.

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
`eligible=true`, then orders by SCORED points, modified line count, and candidate
ID. Before temporary worktrees
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

## Ranking frontier and retracking

Every non-runtime financial case stores its complete Ranking block in evaluation
schema version 2: participant count, our rank/PnL, leader, leader gap, runner-up,
and held margin, all in integer cents. Rebuild the archive frontier without a
grader run:

```bash
candidate_pipeline/frontier.sh /absolute/repo report
```

Use `apply` as the second argument for the explicit retracking transaction. It
selects the maximum-score portfolio anchor by losing-case gap sum, held-margin
floor, source lines, and candidate ID; preserves target frontier sources as
active challengers; and updates the canonical source, baseline, champion record,
registry, and `results/frontier.json`. The operation is hash-verified and
idempotent.

## Offline pricing probe

`src/price_error_probe.py` measures a market-maker source's live pricing error against
the true data-generating parameters. It is a screen, not a grader: it consumes no
HackerRank run, and it never decides promotion.

```bash
python3 candidate_pipeline/src/price_error_probe.py width-table
python3 candidate_pipeline/src/price_error_probe.py screen-drift
python3 candidate_pipeline/src/price_error_probe.py error-table --source /path/to/candidate.py
```

Subcommands are `error-table`, `variance`, `width-table`, `screen-drift` and `live-vol`.
Every command runs across four parameter regimes; `theo-case` is the parameter vector
the THEO case prints, so it is a real draw from the grader's generator rather than a
guess. Judge a candidate on cross-regime dominance -- admissible only when it never
raises error in any regime by warm-up cell -- because ranking on one regime selects
variants the grader has already rejected. `docs/instruction.md` sections 5 to 8 carry
the current readings and the reasoning.

Use it before spending a graded arm on a `warm_up` or `price_option` candidate. It
does not model counterparty flow, competing makers or session length, so it cannot
predict score.

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
