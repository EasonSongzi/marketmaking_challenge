---
name: run-market-maker-loop
description: Run or resume the repository's autonomous champion/challenger MarketMaker experiment loop. Use only when explicitly invoked to explore structural changes or tune a saved challenger through the fixed HackerRank grader.
---

# Run the Market-Maker Loop

Operate as the lead agent. Continue without interaction until the pipeline reports a stopping condition or the same source fails extraction twice consecutively.

## Start or resume

Start with `candidate_pipeline/loop.sh start --run-id <run-id>`. For an existing run, inspect `status`, execute `resume` only when it is failed, and continue the first incomplete generation. Read `AGENTS.MD`, the challenge, the complete `MarketMaker`, `results/champion/champion.json`, `results/strategy-state.json`, recent evidence, and `candidate_pipeline/README.md` before choosing a mode. `results/baselines/best.*` is only a compatibility view.

The fixed grader is evaluated once per unique source SHA-256. Never rerun a completed or cached source. A run stops at 15.00/16.00 or after six completed generations; there is no stall stop.

## Choose a generation mode

Choose `explore` when the champion needs a structural idea. Choose `tune` only when an active challenger has explicit parameter upside. Save every plan below the run's ignored `inputs/` directory.

### Explore

Write a schema-version-2 plan with `mode: "explore"`, one target method, a rationale, exactly three structurally distinct candidates, and one hash-pinned `parent`. Use `{"type":"champion","sourceSha256":"..."}` for the current champion or `{"type":"challenger","challengerId":"...","sourceSha256":"..."}` for the current revision of an active challenger. A challenger parent initializes every worktree from its complete source so the generation can explore a different method without method-level merging. Prepare it with `loop.sh prepare`.

Spawn three workers using `model: "gpt-5.6-luna"`, `reasoning_effort: "medium"`, and `fork_turns: "none"`. Give each worker its complete worktree path, hypothesis, implementation plan, repository constraints, and checks. Workers may change only the single target core method plus `MarketMaker` helpers and required imports. They must validate against the selected parent with `validate-candidate.sh --target-method <method>`, compile, and must not run HackerRank or commit. Never put candidate-level or plural target-method declarations in the plan.

### Tune

Select one active challenger from `results/strategy-state.json`. Tune its complete current revision without merging any champion methods into it. Write a schema-version-2 plan containing:

- `mode: "tune"`, `challengerId`, `parentSourceSha256`, `method`, optional `helpers`, rationale, and `sampleCount` N;
- one or more parameters with `name`, `type`, `direction`, `parentValue`, inclusive `minimum`/`maximum`, and literal `bindings`;
- each binding identifies a `MarketMaker` method and the zero-based numeric/bool constant ordinal visited in source order.

Run `loop.sh prepare`. It creates one designer worktree initialized from the full challenger revision. Spawn exactly one Luna/medium worker with no inherited turns. The worker must design exactly N unique joint vectors containing coarse, medium, and fine granularities, with no parent vector and no post-result adaptation. Save the draft manifest in the designer tuning directory, then run:

```bash
candidate_pipeline/materialize-tuning.sh \
  --source <designer-worktree>/Market_making_binary_option.py \
  --plan <absolute-plan-path> \
  --manifest <absolute-draft-manifest> \
  --output-root <designer-variants-root>
```

The materializer enforces directions, bounds, unique vectors, AST-only constant changes, compilation, and scope. It writes `materialized-manifest.json`. From the lead, register that exact path with `loop.sh register-tuning --run-id <run-id> --manifest <path>`. Do not ask the worker to revise after seeing HackerRank results.

## Evaluate and archive

Run the prepared candidates through `candidate_pipeline/run-generation.sh`. The dispatcher is serial because the browser is single-session. It skips completed and cached sources. A runner/browser/authentication failure automatically records the failure, resumes, and retries the same source once. A successful retry resets that source's counter. A second consecutive failure preserves the worktree and stops. Integrity status `3` never retries.

For Explore, summaries are keyed by the three candidate IDs. For Tune, provide one summary keyed by the designer ID. Save a post-evaluation analysis with a non-empty `finding`; an Explore analysis may include at most one `challenger` object with a non-winner `candidateId` and tuning-upside `rationale`. When Explore starts from an active challenger and does not beat the champion, the pipeline automatically preserves the best candidate that strictly beats its parent as a new active derived challenger; if analysis supplies a challenger decision, it must identify that same candidate. Valid but currently bankrupt or failing structural candidates may enter the pool, but promotion still requires 20/20, zero bankruptcies, and a strict improvement over the current champion.

Archive with `loop.sh archive`. It hash-verifies full sources and evidence, caches every valid source SHA, and cleans worktrees only after verified archival. Tune selects the best of N, compares it with the parent challenger, creates a new immutable revision only when it improves, and retires the lineage after its second unsuccessful tuning batch.

## Promote and finish

If archive reports a winner, run `loop.sh promote`. The full winner source becomes champion, the full old champion becomes a new challenger, and a Tune parent is marked promoted. The loop updates the baseline, strategy registry, challenger revisions, report, and scoped Git commit without staging unrelated files. Never push, tag, deploy, or submit.

Continue until `status` recommends stopping, then run `finish`. Return the run ID, generations and modes, champion promotions, challenger admissions/updates/retirements, final score, report path, verification, and any preserved failed worktree.

Do not execute the live lifecycle while validating this skill. Use pipeline fixtures only.
