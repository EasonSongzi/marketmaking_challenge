# Manual Experiment Loop

## Automated HackerRank run

The Playwright utility under `auto_extract_result/` automates copying the local
solution, running HackerRank, and extracting every test case. Complete its
one-time setup and login, then run:

```bash
./auto_extract_result/run.sh
```

Timestamped reports are written to `auto_extract_result/results/`. See
`auto_extract_result/README.md` for setup, authentication, exit codes, and the
central-runner arguments used to test candidate worktrees without copying
Playwright or authentication files.

Planning and implementation happen in a normal Codex session. The project skill begins only after the local code has been copied to HackerRank and all test cases have run, either through the automation above or the manual fallback below.

## 1. Discuss an idea

Start from a clean baseline and describe one strategy idea.

Suggested prompt:

```text
Read the current baseline and Market_making_binary_option.py. I want to try this idea: <idea>. Help me evaluate it and agree on a small experiment. Do not edit yet.
```

## 2. Implement locally

After agreeing on the experiment, ask Codex to edit and verify the local source of truth.

Suggested prompt:

```text
Implement the agreed experiment in Market_making_binary_option.py. Keep the change focused, run relevant local checks, and show me the diff. Do not commit.
```

## 3. Run on HackerRank manually

You perform these steps:

1. Copy the complete local `Market_making_binary_option.py` into HackerRank.
2. Run all available test cases.
3. Leave the completed results visible.
4. Attach the HackerRank question tab to Codex.

## 4. Review and conditionally promote

Invoke the project skill. This prompt authorizes it to save baseline files only when the result is better; it never authorizes a commit.

Suggested prompt:

```text
Use $review-hackerrank-results with this HackerRank tab. Compare the run with the current baseline. If it qualifies as better, save it as a new promoted baseline and update best.md. If it does not qualify, save nothing. Do not commit.
```

The skill reads every case, analyzes changes, decides whether promotion is justified, and recommends one next experiment.

## 5. Continue or commit

- If the run is not better, discuss the skill's findings in the same session, adjust the idea, implement locally, and repeat the manual HackerRank run. No result artifact is created.
- If the run is promoted, review the local strategy diff, new result artifact, and `results/baselines/best.md`. Then stage and commit the code and result together yourself.

Suggested follow-up after a regression:

```text
Based on the result analysis, propose one focused adjustment for the next experiment. Do not edit until we agree on the plan.
```

Suggested promoted-baseline commit message:

```text
strategy: promote <strategy-name> baseline
```
