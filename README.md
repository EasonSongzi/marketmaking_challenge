# Market-Maker Experiment Workflow

## Autonomous loop (primary)

Use the repository skill to plan, implement, evaluate, and promote scored
`MarketMaker` experiments without interaction:

```text
Use $run-market-maker-loop to start a new experiment loop.
```

The lead agent chooses an `explore` or `tune` generation. Explore creates three
structurally distinct champion variants in parallel worktrees. Tune selects one
saved full-source challenger, uses one subagent to design N coarse/medium/fine
joint parameter vectors, and evaluates the materialized variants serially.
Every unique source SHA is run once through the fixed grader; later occurrences
reuse the project evaluation cache.

The loop stops after reaching 15.00/16.00 or completing six generations. Its
tracked report is written to
`results/experiments/<run-id>.md`; state and archived candidate evidence live
under `results/runs/<run-id>/`. The canonical champion lives in
`results/champion/`, full-source challenger revisions live in
`results/challengers/`, and `results/strategy-state.json` indexes both plus the
evaluation cache. Former champion evidence lives in `results/history/`.

If authentication fails, repair the saved browser profile:

```bash
./auto_extract_result/login.sh
```

Then resume without rerunning completed candidates:

```text
Use $run-market-maker-loop to resume <run-id>.
```

See `candidate_pipeline/README.md` for lifecycle commands and failure behavior.
Complete the setup in `auto_extract_result/README.md` before the first live run.

## Manual fallback

Use `$review-hackerrank-results` when the autonomous lifecycle cannot be used or
when you intentionally want to review one completed run by hand.

1. Edit and locally verify `Market_making_binary_option.py`.
2. Run `./auto_extract_result/run.sh`, or paste the source into HackerRank and
   run all cases manually.
3. Leave the completed results visible and attach that tab to Codex.
4. Invoke:

```text
Use $review-hackerrank-results with this HackerRank tab. Compare the run with the current baseline. If it qualifies as better, save it as a new promoted baseline and update best.md. If it does not qualify, save nothing. Do not commit.
```

The manual skill analyzes every case and recommends the next experiment. It
does not commit; review and commit promoted strategy and baseline files yourself.
