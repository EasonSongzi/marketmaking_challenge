# HackerRank Result Automation

This utility copies the repository's `Market_making_binary_option.py` into the
Akuna HackerRank question, runs every available case, and saves each case's raw
result under `auto_extract_result/results/`.

## One-time setup

Node.js 20 or newer is required. From the repository root:

```bash
./auto_extract_result/setup.sh
./auto_extract_result/login.sh
```

`login.sh` asks for the invitation link without echoing it, then opens the full
email invitation flow in a dedicated browser. Complete every redirect and any
first-time name, work-experience, disclosure, or agreement step yourself. The
script waits for up to ten minutes and finishes automatically only after the
exact coding-question URL, its `Run Code` button, and the Monaco code model
appear. Each editor attempt waits up to three seconds. If it does not initialize,
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

## Run an experiment

```bash
./auto_extract_result/run.sh
```

The command opens a visible Chromium browser, verifies that the complete local
source matches the HackerRank editor, runs the tests, and writes a timestamped
report. Each Monaco initialization attempt waits up to three seconds, and the
script opens a fresh question page for up to ten total attempts before failing.
A report path looks like:

```text
auto_extract_result/results/hackerrank-run-2026-08-17-221530.md
```

Exit status `0` means every accessible case passed. Status `2` means the report
was saved but at least one case failed. Status `1` means authentication or the
automation itself failed.

If HackerRank changes its page structure or the saved session expires, use the
manual run instructions in the repository README and rerun `login.sh` as
needed.
