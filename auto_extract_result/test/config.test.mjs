import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  authenticationStateFile,
  automationDirectory,
  editorAttempts,
  editorTimeoutMs,
  invitationUrlFile,
  resultsDirectory,
  runnerLockDirectory,
  sourceFile,
} from "../src/config.mjs";

test("automation paths stay inside the intended repository folders", () => {
  assert.equal(authenticationStateFile, path.join(automationDirectory, ".auth-state.json"));
  assert.equal(resultsDirectory, path.join(automationDirectory, "results"));
  assert.equal(runnerLockDirectory, path.join(automationDirectory, ".runner-lock"));
  assert.equal(invitationUrlFile, path.join(automationDirectory, ".invite-url"));
  assert.equal(editorAttempts, 10);
  assert.equal(editorTimeoutMs, 3_000);
  assert.equal(
    sourceFile,
    path.join(path.dirname(automationDirectory), "Market_making_binary_option.py"),
  );
});
