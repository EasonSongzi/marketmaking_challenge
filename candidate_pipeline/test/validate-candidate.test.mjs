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

function runValidator({ baselinePath, candidatePath }, targetMethod = null) {
  return spawnSync(
    "bash",
    [
      validator,
      "--baseline", baselinePath,
      "--candidate", candidatePath,
      ...(targetMethod ? ["--target-method", targetMethod] : []),
    ],
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

test("target scope accepts one target method and rejects a second core method", async (t) => {
  const quoteOnly = baseline.replace("        return None", "        return (0.4, 0.6)");
  const accepted = runValidator(await fixture(t, quoteOnly), "quote");
  assert.equal(accepted.status, 0, accepted.stderr);

  const twoMethods = quoteOnly.replace("        return False", "        return True");
  const rejected = runValidator(await fixture(t, twoMethods), "quote");
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /respond_to_fok differs while target method is MarketMaker\.quote/);
});

test("target scope still allows imports and helper changes", async (t) => {
  const candidate = baseline
    .replace("import math", "import statistics")
    .replace(
      "    def warm_up(self, market_history: object) -> None:\n        pass",
      "    def warm_up(self, market_history: object) -> None:\n        self.samples = []\n\n    def sample_mean(self) -> float:\n        return 0.0",
    );
  const result = runValidator(await fixture(t, candidate), "warm_up");
  assert.equal(result.status, 0, result.stderr);
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

test("permits on_trade bookkeeping alongside a target method", async (t) => {
  const candidate = baseline
    .replace(
      "    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:\n        pass",
      "    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:\n        self.fills = getattr(self, 'fills', [])\n        self.fills.append((counterparty_id, price, quantity))",
    )
    .replace(
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return None",
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return len(getattr(self, 'fills', []))",
    );
  const result = runValidator(await fixture(t, candidate), "quote");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validation passed/);
});

test("still freezes non-bookkeeping core methods against the target", async (t) => {
  const candidate = baseline.replace(
    "    def respond_to_fok(self, option: object, fok_order: object) -> bool:\n        return False",
    "    def respond_to_fok(self, option: object, fok_order: object) -> bool:\n        return True",
  );
  const result = runValidator(await fixture(t, candidate), "quote");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /respond_to_fok differs while target method is MarketMaker.quote/);
});

test("rejects on_trade dropping the baseline position recording", async (t) => {
  const recordingBaseline = baseline.replace(
    "    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:\n        pass",
    "    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:\n        self.position.add_option_quantity(option.option_id, quantity)",
  );
  const directory = await fsPromises.mkdtemp(path.join(tmpdir(), "candidate-scope-"));
  t.after(() => fsPromises.rm(directory, { recursive: true, force: true }));
  const baselinePath = path.join(directory, "baseline.py");
  const candidatePath = path.join(directory, "candidate.py");
  await Promise.all([
    fsPromises.writeFile(baselinePath, recordingBaseline),
    fsPromises.writeFile(
      candidatePath,
      recordingBaseline.replace("        self.position.add_option_quantity(option.option_id, quantity)", "        self.ignored = quantity"),
    ),
  ]);
  const result = runValidator({ baselinePath, candidatePath }, "quote");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /on_trade must still call self\.position\.add_option_quantity/);
});

test("permits on_step_advance bookkeeping alongside a target method", async (t) => {
  const candidate = baseline
    .replace(
      "    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:\n        pass",
      "    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:\n        self._days += 1",
    )
    .replace(
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return None",
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return self._days",
    );
  const result = runValidator(await fixture(t, candidate), "quote");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validation passed/);
});

test("rejects on_step_advance dropping the baseline state refresh", async (t) => {
  const refreshingBaseline = baseline.replace(
    "    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:\n        pass",
    "    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:\n        self.underlying_state = new_underlying_state\n        self.active_option_state = new_option_state",
  );
  const directory = await fsPromises.mkdtemp(path.join(tmpdir(), "candidate-scope-"));
  t.after(() => fsPromises.rm(directory, { recursive: true, force: true }));
  const baselinePath = path.join(directory, "baseline.py");
  const candidatePath = path.join(directory, "candidate.py");
  await Promise.all([
    fsPromises.writeFile(baselinePath, refreshingBaseline),
    fsPromises.writeFile(
      candidatePath,
      refreshingBaseline.replace("        self.active_option_state = new_option_state", "        self._seen = new_option_state"),
    ),
  ]);
  const result = runValidator({ baselinePath, candidatePath }, "quote");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /on_step_advance must still assign self\.active_option_state from new_option_state/);
});

test("permits appending private constant state to __init__ alongside a target method", async (t) => {
  const candidate = baseline
    .replace(
      "        self.cash_balance = cash_balance",
      "        self.cash_balance = cash_balance\n        self._open_trades = []\n        self._counterparty_markout: dict = {}\n        self._daily_returns = list()\n        self._skew_ticks = 0",
    )
    .replace(
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return None",
      "    def quote(self, option: object, counterparty_id: int) -> object:\n        return len(self._open_trades)",
    );
  const result = runValidator(await fixture(t, candidate), "quote");

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /validation passed/);
});

test("rejects __init__ changes that do not keep the baseline body as a prefix", async (t) => {
  const changed = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self.cash_balance = cash_balance * 2")),
    "quote",
  );
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /__init__ must keep the baseline body as a prefix; statement 1 differs/);

  const prepended = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self._ready = True\n        self.cash_balance = cash_balance")),
    "quote",
  );
  assert.equal(prepended.status, 1);
  assert.match(prepended.stderr, /__init__ must keep the baseline body as a prefix/);
});

test("rejects __init__ appending public attributes, computed values, or statements", async (t) => {
  const publicAttribute = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self.cash_balance = cash_balance\n        self.open_trades = []")),
    "quote",
  );
  assert.equal(publicAttribute.status, 1);
  assert.match(publicAttribute.stderr, /may only append assignments to self\._<name> attributes/);

  const computed = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self.cash_balance = cash_balance\n        self._floor = cash_balance * 0.75")),
    "quote",
  );
  assert.equal(computed.status, 1);
  assert.match(computed.stderr, /appended state must be a constant, a literal container/);

  const factoryWithArguments = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self.cash_balance = cash_balance\n        self._seen = set(option_initial_state)")),
    "quote",
  );
  assert.equal(factoryWithArguments.status, 1);
  assert.match(factoryWithArguments.stderr, /appended state must be a constant, a literal container/);

  const statement = runValidator(
    await fixture(t, baseline.replace("        self.cash_balance = cash_balance", "        self.cash_balance = cash_balance\n        self._log()")),
    "quote",
  );
  assert.equal(statement.status, 1);
  assert.match(statement.stderr, /may only append private state assignments; found Expr/);
});
