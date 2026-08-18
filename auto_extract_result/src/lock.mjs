import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";

import { runnerLockDirectory } from "./config.mjs";

const ownerFilename = "owner.json";

async function delay(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function lockIsStale(lockDirectory) {
  const ownerPath = path.join(lockDirectory, ownerFilename);
  try {
    const owner = JSON.parse(await fs.readFile(ownerPath, "utf8"));
    if (owner.hostname !== hostname()) {
      return false;
    }
    try {
      process.kill(owner.pid, 0);
      return false;
    } catch (error) {
      return error.code === "ESRCH";
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    const stats = await fs.stat(lockDirectory);
    return Date.now() - stats.mtimeMs > 5_000;
  }
}

export async function acquireRunnerLock(label, options = {}) {
  const lockDirectory = options.lockDirectory ?? runnerLockDirectory;
  const log = options.log ?? console.log;
  const pollMs = options.pollMs ?? 500;
  const token = randomUUID();
  let waiting = false;

  while (true) {
    try {
      await fs.mkdir(lockDirectory);
      await fs.writeFile(
        path.join(lockDirectory, ownerFilename),
        JSON.stringify({ hostname: hostname(), label, pid: process.pid, token }),
        { flag: "wx" },
      );
      log(`Acquired HackerRank runner lock for ${label}.`);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }
      try {
        if (await lockIsStale(lockDirectory)) {
          await fs.rm(lockDirectory, { recursive: true, force: true });
          continue;
        }
      } catch (lockError) {
        if (lockError.code === "ENOENT") {
          continue;
        }
        throw lockError;
      }
      if (!waiting) {
        log(`HackerRank runner is busy; ${label} is waiting for the shared lock.`);
        waiting = true;
      }
      await delay(pollMs);
    }
  }

  return async () => {
    const ownerPath = path.join(lockDirectory, ownerFilename);
    try {
      const owner = JSON.parse(await fs.readFile(ownerPath, "utf8"));
      if (owner.token === token) {
        await fs.rm(lockDirectory, { recursive: true });
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  };
}
