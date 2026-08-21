---
name: run-market-maker-loop
description: Run or resume the repository's autonomous champion/challenger MarketMaker experiment loop. Use only when explicitly invoked to explore structural changes or tune a saved challenger through the fixed HackerRank grader.
---

# Run the Market-Maker Loop

Operate as the lead agent. Continue without interaction until the pipeline reports a stopping condition or the same source fails extraction twice consecutively.

## Start or resume

Start with `candidate_pipeline/loop.sh start --run-id <run-id>`. For an existing run, inspect `status`, execute `resume` only when it is failed, and continue the first incomplete generation. Before drafting a plan, read `AGENTS.MD`, the challenge, `docs/instruction.md`, `results/frontier.json`, the complete `MarketMaker`, `results/champion/champion.json`, `results/strategy-state.json`, recent evidence, and `candidate_pipeline/README.md`. Treat `docs/instruction.md` as a research ledger: hard invariants are mandatory, while scoped closures may be reopened only under their stated condition. `results/baselines/best.*` is only a compatibility view.

The fixed grader is evaluated once per unique source SHA-256. Never rerun a completed or cached source. A run stops at 15.00/16.00 or after six completed generations; there is no stall stop.

## Operational fast path

Keep one Git lifecycle process active at a time. The initializer's managed-file cleanliness check and worktree creation can be silent; do not start overlapping `git status`, worktree, or maintenance commands to diagnose them. Inspect `state.json`, registered worktree paths, directory growth, or lock ownership with lightweight read-only checks, and never remove a lock while its owning process is active. Do not bypass the cleanliness guard.

When sandboxing restricts `.git` or GUI processes, request elevated execution on the first attempt for:

- `prepare`, setup-failure `resume`, `archive`, `promote`, and `finish`, which create/remove worktrees or commit scoped state;
- `run-generation.sh`, which launches the headless Playwright browser.

Do not spend the dispatcher's automatic retry on a browser launch that is predictably blocked by the sandbox. A genuine runner, browser, or authentication failure still follows the normal retry and stopping rules below.

Keep compilation artifacts out of tracked worktrees. Give workers a task-specific temporary cache, for example:

```bash
PYTHONPYCACHEPREFIX=/tmp/akuna-pycache/<candidate-id> \
  python3 -m py_compile Market_making_binary_option.py
```

Before dispatch, the lead must inspect each source diff in addition to the method-level validator. Confirm the condition was added to the intended rule, run `git status --short`, and remove only worker-generated artifacts so the worktree contains the authorized source/helper/import changes. Give one repair pass for a misplaced but scope-valid change.

For a repeated control, require byte-identical source formatting and verify the expected SHA-256 before dispatch. Cache identity is source-based, so a semantically identical reformatted control is a new source and wastes a live grader evaluation.

## Choose a generation mode

Choose `explore` when the champion needs a structural idea. Choose `tune` only when an active challenger has explicit parameter upside. Save every plan below the run's ignored `inputs/` directory.

### Explore

Write a schema-version-3 plan with `mode: "explore"`, one target method, a rationale, exactly three structurally distinct candidates, one hash-pinned `parent`, and one machine-checkable `objective`. An exploit objective declares `kind: "exploit"`, non-empty SCORED `targetCases`, positive `expectedGainHundredths`, and `collateralBudgetHundredths`. A zero-gain diagnostic declares `kind: "probe"`, expected gain zero, and an `unlock` statement naming the positive-score decision it enables. Use `{"type":"champion","sourceSha256":"..."}` for the current champion or `{"type":"challenger","challengerId":"...","sourceSha256":"..."}` for an active frontier revision. A challenger parent initializes every worktree from its complete source. Prepare it with `loop.sh prepare`.

Spawn three workers using `model: "gpt-5.6-luna"`, `reasoning_effort: "medium"`, and `fork_turns: "none"`. Give each worker its complete worktree path, hypothesis, implementation plan, repository constraints, and checks. Workers may change only the single target core method plus `MarketMaker` helpers and required imports. They must validate against the selected parent with `validate-candidate.sh --target-method <method>`, compile with a temporary `PYTHONPYCACHEPREFIX`, inspect their diff, and must not run HackerRank or commit. Never put candidate-level or plural target-method declarations in the plan.

### Tune

Select one active challenger from `results/strategy-state.json`. Tune its complete current revision without merging any champion methods into it. Write a schema-version-3 plan containing:

- `mode: "tune"`, `challengerId`, `parentSourceSha256`, `method`, optional `helpers`, rationale, `sampleCount` N, and the same objective fields used by Explore;
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

For Explore, summaries are keyed by the three candidate IDs. For Tune, provide one summary keyed by the designer ID. Save a post-evaluation analysis with a non-empty `finding`; an Explore analysis may include at most one `challenger` object with a non-winner `candidateId` and tuning-upside `rationale`. When Explore starts from an active challenger and does not beat the champion, the pipeline preserves the best safe candidate that improves the declared target score or target gap without exceeding its collateral budget. A scored-case bankruptcy is permitted and is priced as that case's zero score. Runtime errors, cases 1-4 failures, and non-bankruptcy scored FAILs remain ineligible.

Archive with `loop.sh archive`. It hash-verifies full sources and parsed Ranking evidence, caches every valid source SHA, records target gain/gap and collateral loss, and cleans worktrees only after verified archival. Tune orders variants by the declared target objective, never by PnL, creates a new immutable revision only when that objective improves, and retires the lineage after its second unsuccessful tuning batch.

## Promote and finish

If archive reports a winner, run `loop.sh promote`. Promotion requires a strict total-score increase; combined PnL and minimum capital are telemetry and never break a tie. The full winner source becomes champion, the full old champion becomes a challenger, and a Tune parent is marked promoted. A probe or equal-score result can update research evidence but cannot replace the champion or create a global freeze. Never push, tag, deploy, or submit.

Continue until `status` recommends stopping, then run `finish`. Return the run ID, generations and modes, champion promotions, challenger admissions/updates/retirements, final score, report path, verification, and any preserved failed worktree.

Do not execute the live lifecycle while validating this skill. Use pipeline fixtures only.
