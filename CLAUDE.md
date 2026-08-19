# Akuna Market-Making Challenge

Autonomous champion/challenger research loop for the `MarketMaker` class in
`Market_making_binary_option.py`, scored by a fixed HackerRank grader.

## Required reading

| File | Why |
| --- | --- |
| `challenge.md` | The problem, the 20 grader cases, and the bankruptcy rule |
| `AGENTS.MD` | Mandatory `MarketMaker` code write style — applies to every provider |
| `candidate_pipeline/README.md` | The experiment lifecycle, commands, and exit statuses |
| `docs/instruction.md` | Current research memo: frozen components, protected ranks, next targets |
| `results/strategy-state.json` | Current champion and challenger pool |

## Provider-independent engine

`candidate_pipeline/` is the shared experiment engine. Codex and Claude Code drive
the **same** scripts, run state, worktrees, evaluation logic, results, and
champion/challenger history. Neither provider owns it.

- Codex entry point: `.agents/skills/run-market-maker-loop/` (`$run-market-maker-loop`)
- Claude entry point: `.claude/skills/run-market-maker-loop/` (`/run-market-maker-loop`)

Both are thin operator manuals over the same commands. When lifecycle behavior
changes, change `candidate_pipeline/` and let both manuals describe it. Never
fork the engine, reimplement evaluation or selection, or add a Claude-only
results layout.

## Hard constraints

- Never hand-edit `Market_making_binary_option.py` on `main`. Strategy changes reach
  `main` only through `loop.sh promote`.
- Never edit or delete `results/champion/`, `results/challengers/`, `results/history/`,
  `results/experiments/`, `results/runs/`, `results/baselines/`, or
  `results/strategy-state.json` by hand. Hashes bind them to archived evidence.
- Worktrees under `/tmp/akuna-market-maker/` are created and removed by the pipeline
  and are authoritative. Do not create git worktrees yourself, and never use the
  Agent tool's `isolation: "worktree"` or `EnterWorktree` for this repository.
- HackerRank runs are serialized by a cross-process lock and are the scarce resource.
  Each unique source SHA-256 is graded at most once; cached evidence is reused.
  Never launch a live run outside the lifecycle, and never rerun a completed source.
- Only the lead agent runs the browser, the pipeline, or git. Workers edit files in
  their assigned worktree and run local checks.
- Never push, tag, deploy, or submit. `loop.sh` makes its own scoped commits.

## Local checks

```bash
npm --prefix candidate_pipeline test && npm --prefix candidate_pipeline run check
```

These are fixture-only and safe to run at any time. They never touch HackerRank.

Known pre-existing failure: the Tune fixture in `candidate_pipeline/test/loop.test.mjs`
loads the real champion source and pins `quote` constant ordinals that promotions have
since shifted, so `tune prepare ...` fails. 112 of 113 tests pass. The materializer is
correctly rejecting a genuine ordinal/parentValue mismatch; only the fixture is stale.
