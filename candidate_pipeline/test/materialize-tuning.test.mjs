import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFile = promisify(execFileCallback);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const materializer = path.join(root, "materialize-tuning.sh");
const source = `class MarketMaker:
    def __init__(self):
        pass
    def on_step_advance(self, new_underlying_state, new_option_state):
        pass
    def on_trade(self, option, price, quantity, counterparty_id):
        pass
    @property
    def name(self):
        return "fixture"
    def price_option(self, option):
        return 0.5
    def price_option_from_parameters(self, market_parameters, option):
        return 0.5
    def quote(self, option, counterparty_id):
        width = 3
        size = 2
        return width, size
    def respond_to_fok(self, option, fok_order):
        return False
    def warm_up(self, market_history):
        pass
`;

function tuningPlan() {
  return {
    schemaVersion: 2,
    mode: "tune",
    method: "quote",
    rationale: "fixture",
    sampleCount: 3,
    parameters: [
      {
        name: "width",
        type: "int",
        direction: "both",
        parentValue: 3,
        minimum: 1,
        maximum: 6,
        bindings: [{ method: "quote", ordinal: 0 }],
      },
      {
        name: "size",
        type: "int",
        direction: "decrease",
        parentValue: 2,
        minimum: 1,
        maximum: 2,
        bindings: [{ method: "quote", ordinal: 1 }],
      },
    ],
  };
}

test("materializes exactly N coarse, medium, and fine variants", async (t) => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "tuning-materializer-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  const planPath = path.join(directory, "plan.json");
  const manifestPath = path.join(directory, "manifest.json");
  const outputRoot = path.join(directory, "tuning", "variants");
  await fs.writeFile(sourcePath, source);
  await fs.writeFile(planPath, JSON.stringify(tuningPlan()));
  const parentSourceSha256 = createHash("sha256").update(source).digest("hex");
  await fs.writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    parentSourceSha256,
    variants: [
      { id: "coarse-a", granularity: "coarse", parameters: { width: 6, size: 1 } },
      { id: "medium-a", granularity: "medium", parameters: { width: 4, size: 1 } },
      { id: "fine-a", granularity: "fine", parameters: { width: 2, size: 2 } },
    ],
  }));
  const { stdout } = await execFile(materializer, [
    "--source", sourcePath,
    "--plan", planPath,
    "--manifest", manifestPath,
    "--output-root", outputRoot,
  ]);
  const materializedPath = stdout.trim();
  const materialized = JSON.parse(await fs.readFile(materializedPath));
  assert.equal(materialized.variants.length, 3);
  assert.deepEqual(new Set(materialized.variants.map(({ granularity }) => granularity)), new Set(["coarse", "medium", "fine"]));
  for (const variant of materialized.variants) {
    assert.equal(variant.checks.compile, true);
    assert.equal(variant.checks.scope, true);
    assert.match(await fs.readFile(variant.sourcePath, "utf8"), /class MarketMaker/);
  }
});

test("rejects duplicate vectors and parent vectors before writing sources", async (t) => {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "tuning-invalid-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const sourcePath = path.join(directory, "Market_making_binary_option.py");
  const planPath = path.join(directory, "plan.json");
  const manifestPath = path.join(directory, "manifest.json");
  await fs.writeFile(sourcePath, source);
  await fs.writeFile(planPath, JSON.stringify(tuningPlan()));
  await fs.writeFile(manifestPath, JSON.stringify({
    schemaVersion: 1,
    parentSourceSha256: createHash("sha256").update(source).digest("hex"),
    variants: [
      { id: "coarse-a", granularity: "coarse", parameters: { width: 3, size: 2 } },
      { id: "medium-a", granularity: "medium", parameters: { width: 4, size: 1 } },
      { id: "fine-a", granularity: "fine", parameters: { width: 4, size: 1 } },
    ],
  }));
  await assert.rejects(execFile(materializer, [
    "--source", sourcePath,
    "--plan", planPath,
    "--manifest", manifestPath,
    "--output-root", path.join(directory, "variants"),
  ]));
});
