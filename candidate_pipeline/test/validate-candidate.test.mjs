import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const validator = path.resolve(testDirectory, "../validate-candidate.sh");

const baseline = `\
import math

CONSTANT = 1

class Outside:
    value = CONSTANT

class MarketMaker:
    def __init__(self, underlying_initial_state: list, option_initial_state: list, cash_balance: float) -> None:
        self.cash_balance = cash_balance

    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:
        pass

    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:
        pass

    @property
    def name(self) -> str:
        return "baseline"

    def price_option(self, option: object) -> float:
        return 0.5

    def price_option_from_parameters(self, market_parameters: object, option: object) -> float:
        return 0.5

    def quote(self, option: object, counterparty_id: int) -> object:
        return None

    def respond_to_fok(self, option: object, fok_order: object) -> bool:
        return False

    def warm_up(self, market_history: object) -> None:
        pass
`;

async function fixture(t, candidate = baseline) {
  const directory = await fsPromises.mkdtemp(path.join(tmpdir(), "candidate-scope-"));
  t.after(() => fsPromises.rm(directory, { recursive: true, force: true }));
  const baselinePath = path.join(directory, "baseline.py");
  const candidatePath = path.join(directory, "candidate.py");
  await Promise.all([
    fsPromises.writeFile(baselinePath, baseline),
    fsPromises.writeFile(candidatePath, candidate),
  ]);
  return { baselinePath, candidatePath };
}

function runValidator({ baselinePath, candidatePath }) {
  return spawnSync(
    "bash",
    [validator, "--baseline", baselinePath, "--candidate", candidatePath],
    { encoding: "utf8" },
  );
}

test("accepts import changes and arbitrary MarketMaker body and helper changes", async (t) => {
  const candidate = baseline
    .replace("import math", "import statistics\nfrom collections import defaultdict")
    .replace('return "baseline"', 'return "candidate"')
    .replace(
      "    def warm_up(self, market_history: object) -> None:\n        pass",
      "    def warm_up(self, market_history: object) -> None:\n        self.samples = []\n\n    @staticmethod\n    def helper(value: float) -> float:\n        return value * 2",
    );
  const result = runValidator(await fixture(t, candidate));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validation passed/);
});

test("rejects changed or added non-import top-level code", async (t) => {
  const changed = runValidator(await fixture(t, baseline.replace("CONSTANT = 1", "CONSTANT = 2")));
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /non-import top-level code outside MarketMaker differs/);

  const added = runValidator(await fixture(t, `${baseline}\nADDED = True\n`));
  assert.equal(added.status, 1);
  assert.match(added.stderr, /candidate: Assign/);
});

test("rejects a missing, duplicated, or renamed MarketMaker", async (t) => {
  const missingMethod = runValidator(await fixture(t, baseline.replace("    def warm_up(", "    def renamed_warm_up(")));
  assert.equal(missingMethod.status, 1);
  assert.match(missingMethod.stderr, /exactly one warm_up method; found 0/);

  const duplicatedClass = runValidator(await fixture(t, `${baseline}\nclass MarketMaker:\n    pass\n`));
  assert.equal(duplicatedClass.status, 1);
  assert.match(duplicatedClass.stderr, /exactly one top-level MarketMaker class; found 2/);
});

test("rejects core method signature changes", async (t) => {
  const candidate = baseline.replace(
    "def quote(self, option: object, counterparty_id: int) -> object:",
    "def quote(self, option: object, counterparty_id: int, size: int = 1) -> object:",
  );
  const result = runValidator(await fixture(t, candidate));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /MarketMaker\.quote signature differs from baseline/);
});

test("rejects core method decorator changes", async (t) => {
  const candidate = baseline.replace("    @property\n    def name", "    @staticmethod\n    def name");
  const result = runValidator(await fixture(t, candidate));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /MarketMaker\.name decorators differ from baseline/);
});

test("reports candidate syntax errors without a traceback", async (t) => {
  const result = runValidator(await fixture(t, `${baseline}\nif (`));

  assert.equal(result.status, 1);
  assert.match(result.stderr, /candidate file is not valid Python at line/);
  assert.doesNotMatch(result.stderr, /Traceback/);
});

test("shell entrypoint accepts paths containing spaces", async (t) => {
  const directory = await fsPromises.mkdtemp(path.join(tmpdir(), "candidate scope "));
  t.after(() => fsPromises.rm(directory, { recursive: true, force: true }));
  const baselinePath = path.join(directory, "base line.py");
  const candidatePath = path.join(directory, "candidate file.py");
  fs.writeFileSync(baselinePath, baseline);
  fs.writeFileSync(candidatePath, baseline);

  assert.equal(runValidator({ baselinePath, candidatePath }).status, 0);
});
