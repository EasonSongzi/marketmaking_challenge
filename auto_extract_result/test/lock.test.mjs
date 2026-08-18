import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

import { acquireRunnerLock } from "../src/lock.mjs";

test("acquireRunnerLock serializes concurrent callers", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-lock-"));
  const lockDirectory = path.join(directory, "shared.lock");
  const options = { lockDirectory, log: () => {}, pollMs: 5 };
  let releaseFirst;
  let releaseSecond;

  try {
    releaseFirst = await acquireRunnerLock("first", options);
    let secondAcquired = false;
    const secondRequest = acquireRunnerLock("second", options).then((release) => {
      secondAcquired = true;
      return release;
    });

    await delay(20);
    assert.equal(secondAcquired, false);
    await releaseFirst();
    releaseFirst = undefined;
    releaseSecond = await secondRequest;
    assert.equal(secondAcquired, true);
  } finally {
    await releaseFirst?.();
    await releaseSecond?.();
    await fs.rm(directory, { recursive: true });
  }
});

function captureProcess(child) {
  let stderr = "";
  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const finished = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Child exited ${code}: ${stderr}`));
      }
    });
  });
  return { finished, stdout: () => stdout };
}

async function waitForOutput(capture, expected) {
  const deadline = Date.now() + 2_000;
  while (!capture.stdout().includes(expected)) {
    if (Date.now() >= deadline) {
      throw new Error(`Timed out waiting for child output: ${expected}`);
    }
    await delay(5);
  }
}

test("acquireRunnerLock serializes separate Node processes", async () => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "akuna-process-lock-"));
  const lockDirectory = path.join(directory, "shared.lock");
  const lockModule = new URL("../src/lock.mjs", import.meta.url).href;
  const childScript = [
    `const { acquireRunnerLock } = await import(${JSON.stringify(lockModule)});`,
    "const release = await acquireRunnerLock(process.argv[1], {",
    "  lockDirectory: process.argv[2], pollMs: 5, log: () => {},",
    "});",
    "console.log('acquired:' + process.argv[1]);",
    "await new Promise((resolve) => setTimeout(resolve, Number(process.argv[3])));",
    "await release();",
  ].join("\n");
  let first;
  let second;

  try {
    first = spawn(process.execPath, [
      "--input-type=module",
      "--eval",
      childScript,
      "first",
      lockDirectory,
      "200",
    ]);
    const firstCapture = captureProcess(first);
    await waitForOutput(firstCapture, "acquired:first");

    second = spawn(process.execPath, [
      "--input-type=module",
      "--eval",
      childScript,
      "second",
      lockDirectory,
      "0",
    ]);
    const secondCapture = captureProcess(second);
    await delay(30);
    assert.equal(secondCapture.stdout().includes("acquired:second"), false);

    await firstCapture.finished;
    await secondCapture.finished;
    assert.equal(secondCapture.stdout().includes("acquired:second"), true);
  } finally {
    first?.kill();
    second?.kill();
    await fs.rm(directory, { recursive: true });
  }
});
