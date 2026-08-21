---
name: run-market-maker-loop
description: Run or resume the repository's autonomous champion/challenger MarketMaker experiment loop through the shared candidate_pipeline engine. Use only when explicitly invoked to explore structural changes or tune a saved challenger through the fixed HackerRank grader.
argument-hint: "[start <run-id> | resume <run-id> | status <run-id>]"
disable-model-invocation: true
---

# Run the Market-Maker Loop

You are the lead agent. This skill is the Claude Code operator manual for the
provider-independent engine in `candidate_pipeline/`. The Codex manual at
`.agents/skills/run-market-maker-loop/SKILL.md` drives the same commands, run
state, worktrees, and results. Do not fork the engine or invent a parallel
lifecycle.

Run every command from the repository root. Continue without asking for
confirmation until the pipeline reports a stopping condition or the same source
fails extraction twice consecutively.

## Claude-specific operating rules

Read these before anything else; the rest of the lifecycle matches Codex exactly.

- **The pipeline owns worktrees.** `loop.sh prepare` creates detached worktrees
  under `/tmp/akuna-market-maker/<run-id>/gNN/<candidate-id>`. Never pass
  `isolation: "worktree"` to the Agent tool, never call `EnterWorktree`, and never
  run `git worktree add` yourself. Give each worker its absolute pipeline worktree
  path instead.
- **Only you touch the browser, the pipeline, and git.** Workers edit files and run
  local checks. They never call `run-generation.sh`, `candidate.sh`,
  `auto_extract_result/`, or any git command that writes.
- **Model split.** You run on an Opus-class model at high effort. Spawn workers with
  the `market-maker-candidate` subagent (Explore) or `market-maker-tuning-designer`
  (Tune); both pin a Sonnet-class model in their own frontmatter, so do not pass a
  `model` override.
- **Workers execute, you judge.** Workers are execution-only: they apply the plan
  you wrote and run the scope validator and `py_compile`. They do not investigate,
  do not redesign the hypothesis, and do not write test files or scratch scripts.
  Correctness review is yours, and you do not write tests either — judge each diff
  against the rules that already exist (`AGENTS.MD` style, the scope validator,
  `challenge.md`'s bankruptcy rule and grader cases, the `Quote` invariants
  `0 <= bid_price < offer_price <= 1` with positive quantities, and the plan's
  stated hypothesis). Read the diff yourself; do not take a worker's summary at
  face value.
- **Explore fans out, evaluation does not.** Issue all three Agent calls in a single
  assistant block so the workers run concurrently. Evaluation stays serial because
  the HackerRank session is single-threaded.
- **No worker context inheritance.** Each Agent prompt must be self-contained:
  absolute worktree path, absolute parent source path, hypothesis, implementation
  plan, target method, repository constraints, and the exact local checks to run.
  Never continue a finished worker with SendMessage after results are known.
- **Never launch a live evaluation while testing this skill.** Use pipeline fixtures
  (`cd candidate_pipeline && npm test`) instead.

## Start or resume

```bash
candidate_pipeline/loop.sh start --run-id <run-id>
candidate_pipeline/loop.sh status --run-id <run-id>
```

Run IDs are lowercase and hyphenated, e.g. `market-loop-20260820`. For an existing
run, inspect `status` first, execute `resume` only when the run is failed, and
continue the first incomplete generation. Before choosing a mode, read `AGENTS.MD`,
`challenge.md`, the complete `MarketMaker`, `results/champion/champion.json`,
`results/strategy-state.json`, recent evidence under `results/experiments/`, and
`candidate_pipeline/README.md`. `results/baselines/best.*` is only a compatibility
view.

The fixed grader is evaluated once per unique source SHA-256. Never rerun a
completed or cached source. A run stops at 15.00/16.00 or after six completed
generations; there is no stall stop.

## Choose a generation mode

Choose `explore` when the champion needs a structural idea. Choose `tune` only when
an active challenger has explicit parameter upside. Save every plan under the run's
ignored `results/runs/<run-id>/inputs/` directory.

### Explore

Write a schema-version-3 plan with `mode: "explore"`, one generation-level `method`
(`quote`, `respond_to_fok`, or `warm_up`), a rationale, exactly three structurally
distinct candidates, one hash-pinned `parent`, and one machine-checkable
`objective`. Use `{"type":"champion","sourceSha256":"..."}` for the current champion
or `{"type":"challenger","challengerId":"...","sourceSha256":"..."}` for the current
revision of an active challenger. A challenger parent initializes every worktree
from its complete source, so the generation can explore a different method without
method-level merging. Never put candidate-level or plural target-method
declarations in the plan.

The objective is the generation's score contract. An `exploit` objective declares
non-empty SCORED `targetCases` (5-20), positive `expectedGainHundredths`, and a
`collateralBudgetHundredths` between 0 and 1600. A zero-gain diagnostic declares
`kind: "probe"`, `expectedGainHundredths: 0`, and an `unlock` statement naming the
positive-score decision it enables. Archive scores every candidate against this
contract as target gain, target gap, and collateral loss.

```json
{
  "kind": "exploit",
  "targetCases": [6],
  "expectedGainHundredths": 30,
  "collateralBudgetHundredths": 0
}
```

Promotion itself is score-only: 20 structurally complete outcomes, no runtime error,
cases 1-4 PASS, every failed scored case an explicit bankruptcy, and SCORED points
strictly above the current champion. Combined PnL and minimum capital are telemetry
and never break a tie.

```bash
candidate_pipeline/loop.sh prepare --run-id <run-id> --plan <absolute-plan-path>
```

Read the prepared worktree and result-directory paths from
`results/runs/<run-id>/state.json`, then spawn three `market-maker-candidate`
agents in one block. Workers may change only the single target core method plus
`MarketMaker` helpers and required imports. Each must validate against the selected
parent and compile:

```bash
candidate_pipeline/validate-candidate.sh \
  --baseline /absolute/parent/Market_making_binary_option.py \
  --candidate /absolute/worktree/Market_making_binary_option.py \
  --target-method <method>
```

For a challenger-parent Explore, `--baseline` is the immutable challenger revision.
Grant each worker one repair pass after a failed validation or local check. A
candidate that still fails is passed to the dispatcher and to `archive` with
`--invalid <candidate-id>`.

Before evaluating, review each returned diff yourself with `git -C <worktree> diff`:

1. The diff implements the assigned hypothesis and touches only the target method,
   `MarketMaker` helpers, and required imports.
2. The `Quote` invariants hold on every path, including the boundary values of each
   new threshold and both inventory signs.
3. No path can produce a bankruptcy-triggering quote that the parent would not.
4. Style matches `AGENTS.MD`.

Reject and send back a single, specific repair instruction when one of these fails.
Do not write a test file, harness, or simulation to decide — the scope validator,
`py_compile`, and these rules are the review.

### Tune

Select one active challenger from `results/strategy-state.json` and tune its
complete current revision without merging any champion methods into it. Write a
schema-version-3 plan containing `mode: "tune"`, `challengerId`,
`parentSourceSha256`, `method`, optional `helpers`, rationale, `sampleCount` N, and
the same `objective` block used by Explore,
plus one or more parameters with `name`, `type`, `direction`, `parentValue`,
inclusive `minimum`/`maximum`, and literal `bindings`. Each binding identifies a
`MarketMaker` method and the zero-based numeric/bool constant ordinal visited in
source order.

Run `loop.sh prepare`. It creates one designer worktree initialized from the full
challenger revision. Spawn exactly one `market-maker-tuning-designer` agent. It
must design exactly N unique joint vectors spanning coarse, medium, and fine
granularities, with no parent vector and no post-result adaptation. After it saves
the draft manifest, materialize and register from the lead:

```bash
candidate_pipeline/materialize-tuning.sh \
  --source <designer-worktree>/Market_making_binary_option.py \
  --plan <absolute-plan-path> \
  --manifest <absolute-draft-manifest> \
  --output-root <designer-variants-root>

candidate_pipeline/loop.sh register-tuning --run-id <run-id> \
  --manifest <designer-worktree>/.../materialized-manifest.json
```

The materializer enforces directions, bounds, unique vectors, AST-only constant
changes, compilation, and scope. Do not ask the worker to revise after seeing
HackerRank results.

## Evaluate and archive

```bash
candidate_pipeline/run-generation.sh \
  --state /absolute/results/runs/<run-id>/state.json \
  --baseline /absolute/results/baselines/best.json \
  --output /absolute/results/runs/<run-id>/gNN/statuses.json
```

Add `--invalid <candidate-id>` for every worker that exhausted its repair pass. The
dispatcher is serial because the browser is single-session. It skips completed and
cached sources, and repeats scope validation before using cached evidence or
launching HackerRank. A runner, browser, or authentication failure is automatically
recorded, resumed, and retried once for the same source; a successful retry resets
that source's counter. A second consecutive failure preserves the worktree and
stops. Integrity status `3` never retries.

Exit codes: `0` after candidate codes `0`/`2`; `1` after two consecutive runner
failures on the same source; `3` on malformed or hash-invalid evidence.

Then save worker summaries and a post-evaluation analysis under
`results/runs/<run-id>/inputs/` and archive. For Explore, summaries are keyed by the
three candidate IDs; for Tune, provide one summary keyed by the designer ID. The
analysis needs a non-empty `finding`, and may add `nextGenerationRationale`. An
Explore analysis may include at most one `challenger` object with a non-winner
`candidateId` and tuning-upside `rationale`.

```bash
candidate_pipeline/loop.sh archive --run-id <run-id> \
  --summaries <summaries-json> --analysis <analysis-json>
```

Archive hash-verifies full sources and evidence, runs selection internally, caches
every valid source SHA, and cleans worktrees only after verified archival. Tune
selects the best of N, compares it with the parent challenger, creates a new
immutable revision only when it improves, and retires the lineage after its second
unsuccessful tuning batch. When Explore starts from an active challenger and does
not beat the champion, the pipeline automatically preserves the best candidate that
strictly beats its parent as a new active derived challenger; if the analysis
supplies a challenger decision, it must identify that same candidate. Valid but
currently bankrupt or failing structural candidates may enter the pool, but
promotion still requires 20/20, zero bankruptcies, zero runtime errors, and a
strict improvement over the current champion.

## Promote and finish

If archive reports a winner:

```bash
candidate_pipeline/loop.sh promote --run-id <run-id>
```

The full winner source becomes champion, the full old champion becomes a new
challenger, and a Tune parent is marked promoted. The loop updates the baseline,
strategy registry, challenger revisions, report, and a scoped Git commit without
staging unrelated files. Never push, tag, deploy, or submit.

Continue generations until `status` recommends stopping, then:

```bash
candidate_pipeline/loop.sh finish --run-id <run-id>
```

Report the run ID, generations and modes, champion promotions, challenger
admissions/updates/retirements, final score, report path
(`results/experiments/<run-id>.md`), verification, and any preserved failed
worktree.

## Failure recovery

If authentication or the browser profile breaks, repair it from the main worktree
and resume the same run without rerunning completed candidates:

```bash
./auto_extract_result/login.sh
candidate_pipeline/loop.sh archive --run-id <run-id> \
  --failure <message> --failure-kind authentication
candidate_pipeline/loop.sh resume --run-id <run-id>
```

Failure kinds are `authentication`, `browser`, `runner`, and `integrity`. Integrity
failures must be corrected before resuming and are always a hard stop.
