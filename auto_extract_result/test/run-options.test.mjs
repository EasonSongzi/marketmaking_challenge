import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { resultsDirectory, sourceFile } from "../src/config.mjs";
import { parseRunOptions, snapshotSource } from "../src/run-options.mjs";

test("parseRunOptions preserves main-worktree defaults", () => {
  assert.deepEqual(parseRunOptions([]), {
    headed: false,
    label: "main",
    resultDirectory: resultsDirectory,
    sourcePath: sourceFile,
  });
});

test("parseRunOptions keeps runs headless unless --headed is passed", () => {
  assert.equal(parseRunOptions([]).headed, false);
  assert.equal(parseRunOptions(["--headed"]).headed, true);
  assert.equal(
    parseRunOptions(["--headed", "--label", "agent-a"]).headed,
    true,
  );
  assert.equal(
    parseRunOptions(["--label", "agent-a", "--headed"]).label,
    "agent-a",
  );
});

test("parseRunOptions accepts absolute worktree paths and a label", () => {
  assert.deepEqual(
    parseRunOptions([
      "--source",
      "/tmp/worktree/Market_making_binary_option.py",
      "--result-dir",
      "/tmp/worktree/auto_extract_result/results",
      "--label",
      "agent-a",
    ]),
    {
      headed: false,
      label: "agent-a",
      resultDirectory: "/tmp/worktree/auto_extract_result/results",
      sourcePath: "/tmp/worktree/Market_making_binary_option.py",
    },
  );
});

test("parseRunOptions rejects relative worktree paths", () => {
  assert.throws(
    () => parseRunOptions(["--source", "Market_making_binary_option.py"]),
    /--source must be an absolute path/,
  );
  assert.throws(
    () => parseRunOptions(["--result-dir", "results"]),
    /--result-dir must be an absolute path/,
  );
});

test("snapshotSource reads an immutable source value and SHA-256", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-source-"));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  try {
    await fs.writeFile(sourcePath, "print('candidate')\n");
    const snapshot = await snapshotSource({
      label: "candidate",
      resultDirectory: directory,
      sourcePath,
    });
    await fs.writeFile(sourcePath, "print('changed later')\n");

    assert.equal(snapshot.source, "print('candidate')\n");
    assert.equal(
      snapshot.sourceSha256,
      "fbf786686eccc3f356b46aa39e66aaa0aeb9f216e16c14fd316006aa01c6cb73",
    );
  } finally {
    await fs.rm(directory, { recursive: true });
  }
});
