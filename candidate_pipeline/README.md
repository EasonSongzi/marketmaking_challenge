# Candidate Evaluation Pipeline

This repository-level module is run by the main agent. Subagents only edit and
locally check code in their own worktrees; they do not launch the shared
Chromium session.

The pipeline delegates raw HackerRank extraction to the single main-worktree
`auto_extract_result/run.sh`, which owns Playwright, authentication, and the
cross-process runner lock. Evaluation and selection are local operations.

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
- `2`: valid but does not exceed the baseline;
- `3`: incomplete input, parse failure, or changed source SHA;
- `1`: runner or pipeline failure.

## Select the generation winner

After all candidates finish, the main agent runs:

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

## Local checks

```bash
cd candidate_pipeline
npm test
npm run check
```
