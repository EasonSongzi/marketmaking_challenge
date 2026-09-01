import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const probe = path.join(root, "src", "price_error_probe.py");

// The probe is a Monte-Carlo instrument, so these assert the mechanism and the two
// effects large enough to survive a test-sized sample, not the memo's exact numbers.
function run(args) {
  return execFile("python3", [probe, ...args], {
    env: { ...process.env, PYTHONPYCACHEPREFIX: path.join(root, ".pycache-test") },
  });
}

function widthFor(stdout, bucket) {
  const line = stdout.split("\n").find((row) => row.startsWith(bucket));
  assert.ok(line, `missing bucket ${bucket}`);
  return Number(line.match(/(\d+)\(/)[1]);
}

test("width-table wants spreads tight and long-dated single legs wide", async () => {
  const { stdout } = await run(["width-table", "--regimes", "theo-case", "--draws", "60"]);
  assert.ok(widthFor(stdout, "SPREAD 10d") < widthFor(stdout, "AJR 10d"));
  assert.ok(widthFor(stdout, "AJR 1d") < widthFor(stdout, "AJR 5d"));
});

test("a seed reproduces a run exactly", async () => {
  const args = ["error-table", "--regimes", "theo-case", "--draws", "5", "--seed", "7"];
  const first = await run(args);
  const second = await run(args);
  assert.equal(first.stdout, second.stdout);
});

test("screen-drift admits pooling and rejects a zero drift", async () => {
  const { stdout } = await run([
    "screen-drift", "--regimes", "theo-case", "high-drift",
    "--warm-up-lengths", "60", "--draws", "40",
  ]);
  const rowFor = (label) => stdout.split("\n").find((row) => row.startsWith(label));
  assert.match(rowFor("pooled "), /yes\s*$/);
  assert.match(rowFor("zero "), /NO\s*$/);
});

test("variance reports a total better calibrated than either component", async () => {
  const { stdout } = await run(["variance", "--regimes", "theo-case", "--draws", "40"]);
  const errorRow = stdout.split("\n").find((row) => row.includes("err"));
  const percentages = [...errorRow.matchAll(/(-?\d+)%/g)].map((match) => Math.abs(Number(match[1])));
  assert.equal(percentages.length, 3);
  const [sector, idiosyncratic, total] = percentages;
  assert.ok(total < sector && total < idiosyncratic);
});

test("an unknown regime fails instead of silently defaulting", async () => {
  await assert.rejects(run(["variance", "--regimes", "nonexistent"]), /Unknown regime/);
});
