import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRawReport,
  buildReport,
  casePassed,
  extractCaseNumbers,
  reportTimestamp,
} from "../src/report.mjs";

test("extractCaseNumbers returns unique sorted test cases", () => {
  assert.deepEqual(
    extractCaseNumbers(["All Cases", "Test Case 10", "Test Case 2", "Test Case 2"]),
    [2, 10],
  );
});

test("casePassed only accepts an explicit PASS result", () => {
  assert.equal(casePassed("Result: PASS (score=1.00)"), true);
  assert.equal(casePassed("Result: FAIL"), false);
  assert.equal(casePassed("All available test cases passed"), false);
});

test("reportTimestamp produces a sortable unique-name component", () => {
  assert.equal(reportTimestamp(new Date(2026, 7, 17, 9, 8, 7)), "2026-08-17-090807");
});

test("buildReport preserves raw output and records failed runs", () => {
  const report = buildReport({
    createdAt: new Date("2026-08-17T12:00:00.000Z"),
    questionUrl: "https://www.hackerrank.com/example",
    label: "agent-a",
    sourcePath: "/tmp/worktree-a/Market_making_binary_option.py",
    sourceSha256: "abc123",
    cases: [
      { number: 1, text: "Compiler Message\nResult: PASS" },
      { number: 2, text: "Traceback\nResult: FAIL" },
    ],
  });

  assert.match(report, /Label: agent-a/);
  assert.match(report, /Source: `\/tmp\/worktree-a\/Market_making_binary_option\.py`/);
  assert.match(report, /Source SHA-256: `abc123`/);
  assert.match(report, /Overall: One or more test cases failed/);
  assert.match(report, /Passed: 1\/2/);
  assert.match(report, /## Test Case 2[\s\S]*Traceback[\s\S]*Result: FAIL/);
});

test("buildRawReport preserves browser cases without reparsing Markdown", () => {
  const cases = [{ number: 1, text: "Compiler Message\nResult: PASS" }];
  const rawReport = buildRawReport({
    createdAt: new Date("2026-08-18T03:27:46.978Z"),
    questionUrl: "https://www.hackerrank.com/example",
    label: "agent-a",
    sourcePath: "/tmp/worktree-a/Market_making_binary_option.py",
    sourceSha256: "abc123",
    cases,
  });

  assert.equal(rawReport.schemaVersion, 1);
  assert.equal(rawReport.createdAt, "2026-08-18T03:27:46.978Z");
  assert.equal(rawReport.cases, cases);
});
