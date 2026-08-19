# HackerRank Result Automation

This utility copies a snapshotted `Market_making_binary_option.py` into the
Akuna HackerRank question, runs every available case, and saves each case's raw
result as both Markdown and JSON. The main worktree owns the Playwright
installation, authentication state, browser profile, and a cross-process lock
shared by every worktree. Candidate evaluation and winner selection live in
the repository-level `candidate_pipeline/` module.

## One-time setup

Node.js 20 or newer is required. From the repository root:

```bash
./auto_extract_result/setup.sh
./auto_extract_result/login.sh
```

`login.sh` asks for the invitation link without echoing it, then opens the full
email invitation flow in a dedicated **visible** browser. Login is always headed,
because only you can complete every redirect and any first-time name,
work-experience, disclosure, or agreement step yourself. The script waits for up
to ten minutes and finishes automatically only after the exact coding-question
URL, its `Run Code` button, and the Monaco code model appear. Each editor attempt waits up to three seconds. If it does not initialize,
the login flow opens the exact question in a new page and tries again, up to ten
total attempts, before failing without saving.

If the invitation link has already been saved, rerunning `login.sh` reuses it
without asking you to paste it again. Use the following command only when the
email sends a replacement or the saved link expires:

```bash
./auto_extract_result/login.sh --replace
```

The link is stored in `auto_extract_result/.invite-url` with file permission
`600`. The reusable browser profile stays in
`auto_extract_result/.browser-profile/` with directory permission `700`. After
the exact coding question opens, `login.sh` also saves the test authentication
state in `auto_extract_result/.auth-state.json` with permission `600`. All three
locations are ignored by Git, and their contents are never printed or written
to a result report.

`run.sh` reuses `.browser-profile/` and opens the exact coding-question URL in a
new page. Reusing the full profile preserves the browser cache and worker state
that HackerRank needs to restore the editor within the short initialization
timeout. It also restores cookies, localStorage, and sessionStorage from
`.auth-state.json`, because the invitation flow may replace the profile's test
session and Chrome does not retain sessionStorage when the browser exits. If
that combined state no longer reaches the question, rerun `login.sh` and
complete the onboarding flow manually; `run.sh` never accepts agreements on
your behalf.

`login.sh` and `run.sh` acquire the same `.runner-lock/`. If another agent is
using HackerRank, later processes wait instead of starting another browser.
The lock records its owning process and automatically recovers when that process
no longer exists.

## Headless by default

Every automated run — `run.sh` with or without arguments, and everything the
`candidate_pipeline/` research loop invokes — launches Chromium **headless**, so
unattended evaluation never steals the screen. The persistent profile,
authentication state, cookies, localStorage, sessionStorage, and HackerRank
interaction logic are identical in both modes; only the window is hidden.

Two flows stay visible:

- `login.sh` is always headed. Establishing or repairing authentication needs
  you at the keyboard.
- `run.sh --headed` forces a visible browser for debugging a run.

The same escape hatch is available as an environment variable, which is useful
when the runner is invoked indirectly by the pipeline:

```bash
./auto_extract_result/run.sh --headed
AUTO_EXTRACT_HEADED=1 ./auto_extract_result/run.sh
```

`AUTO_EXTRACT_HEADED` is treated as unset when it is empty, `0`, or `false`.

Headless Chromium reports itself as `HeadlessChrome`, and HackerRank's CDN
answers that user agent with an `Access Denied` page at the correct question
URL, so no `Run Code` button ever appears. Headless launches therefore reuse the
same browser's own user agent with that one token normalized, leaving the
version, platform, and client hints untouched. Headed launches are unchanged.

## Run an experiment

```bash
./auto_extract_result/run.sh
```

With no arguments, the runner snapshots the main worktree source and saves the
report under the main `auto_extract_result/results/`, preserving the original
behavior.

## Run a worktree candidate

The main agent calls the **main worktree's** runner for worktree candidates
rather than asking subagents to launch Chromium. All paths must be absolute:

```bash
/absolute/path/to/main/auto_extract_result/run.sh \
  --source /absolute/path/to/candidate/Market_making_binary_option.py \
  --result-dir /absolute/path/to/candidate/auto_extract_result/results \
  --label agent-name
```

`--source`, `--result-dir`, `--label`, and `--headed` are optional. A custom
source without a label defaults to the source worktree directory name. Before
waiting for the shared lock, the runner reads the complete source into memory
and calculates its SHA-256. Later edits in that worktree cannot change the queued run. The
report is written to the requested result directory and records the label,
absolute source path, and source SHA-256.

Multiple agents may invoke the command concurrently. Their source snapshots are
taken independently, but the shared lock serializes all HackerRank browser,
editor, run, and extraction operations. Reports use timestamped names and are
created without overwriting existing files.

The command opens headless Chromium, verifies that the complete local source
matches the HackerRank editor, runs the tests, and writes a timestamped
report. Each Monaco initialization attempt waits up to three seconds, and the
script opens a fresh question page for up to ten total attempts before failing.
A report pair looks like:

```text
auto_extract_result/results/hackerrank-run-2026-08-17-221530.md
auto_extract_result/results/hackerrank-run-2026-08-17-221530.json
```

Exit status `0` means every accessible case passed. Status `2` means the report
was saved but at least one case failed. Status `1` means authentication or the
automation itself failed.

If HackerRank changes its page structure or the saved session expires, use the
manual run instructions in the repository README and rerun `login.sh` as
needed.
