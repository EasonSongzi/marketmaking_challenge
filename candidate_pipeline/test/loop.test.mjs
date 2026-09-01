import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  archiveGeneration,
  finishRun,
  getStopReason,
  prepareGeneration,
  promoteGeneration,
  registerTuning,
  renderReportText,
  resumeRun,
  startRun,
  statusRun,
} from "../src/loop.mjs";
import { rawCase, rawReport, runtimeErrorCase } from "./fixtures/run-data.mjs";

const execFile = promisify(execFileCallback);
const worktreeRoot = "/tmp/akuna-market-maker";
const marketMakerSource = `\
class MarketMaker:
    def __init__(self, underlying_initial_state: list, option_initial_state: list, cash_balance: float) -> None:
        pass

    def on_step_advance(self, new_underlying_state: list, new_option_state: list) -> None:
        pass

    def on_trade(self, option: object, price: float, quantity: int, counterparty_id: int) -> None:
        pass

    @property
    def name(self) -> str:
        return "fixture"

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

function baseline(schemaVersion = 1, sourceSha256) {
  const value = {
    schemaVersion,
    strategy: "baseline-v1",
    resultArtifact: "results/baselines/baseline-v1.md",
    summary: {
      passed: 20,
      total: 20,
      bankruptcies: 0,
      scoredPointsHundredths: 900,
      combinedPnlCents: -273,
      minimumCapital: { endingCashCents: 769, startingCapitalCents: 1000 },
    },
  };
  if (schemaVersion >= 2) {
    value.sourceSha256 = sourceSha256;
    value.experimentId = "old-run:g01:old";
    value.experiment = { runId: "old-run", generation: 1, candidateId: "old" };
  }
  return value;
}

function plan() {
  return {
    schemaVersion: 1,
    method: "quote",
    rationale: "Quote width is the largest remaining score opportunity.",
    candidates: ["candidate-a", "candidate-b", "candidate-c"].map((id, index) => ({
      id,
      hypothesis: `Hypothesis ${index + 1}`,
      implementationPlan: `Implementation ${index + 1}`,
    })),
  };
}

async function git(repo, ...argumentsList) {
  return execFile("git", ["-C", repo, ...argumentsList], { encoding: "utf8" });
}

async function createRepo(schemaVersion = 1) {
  const repo = await fs.mkdtemp(path.join(tmpdir(), "akuna-loop-test-"));
  await fs.mkdir(path.join(repo, "results", "baselines"), { recursive: true });
  await fs.writeFile(path.join(repo, "Market_making_binary_option.py"), marketMakerSource);
  const source = await fs.readFile(path.join(repo, "Market_making_binary_option.py"));
  const sourceSha256 = createHash("sha256").update(source).digest("hex");
  await fs.writeFile(path.join(repo, "results", "baselines", "best.json"), `${JSON.stringify(baseline(schemaVersion, sourceSha256), null, 2)}\n`);
  await fs.writeFile(path.join(repo, "results", "baselines", "best.md"), "# Current Baseline\n");
  await fs.writeFile(path.join(repo, "results", "baselines", "baseline-v1.md"), "# Baseline\n");
  await fs.writeFile(path.join(repo, ".gitignore"), "results/runs/\n");
  await fs.writeFile(path.join(repo, "AGENTS.MD"), "instructions\n");
  await git(repo, "init", "-q");
  await git(repo, "config", "user.email", "loop-test@example.com");
  await git(repo, "config", "user.name", "Loop Test");
  await git(repo, "add", ".");
  await git(repo, "commit", "-qm", "fixture");
  return repo;
}

async function addChallenger(repo, { id = "parent-challenger", method = "quote", points = 800 } = {}) {
  const championSource = await fs.readFile(path.join(repo, "Market_making_binary_option.py"), "utf8");
  const challengerSource = championSource.replace("        return None", "        return (0.45, 0.55)");
  const sourcePath = path.join(repo, "results", "challengers", id, "r00.py");
  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  await fs.writeFile(sourcePath, challengerSource);
  const sourceSha256 = createHash("sha256").update(challengerSource).digest("hex");
  const candidateEvaluation = evaluation(id, sourcePath, sourceSha256, points);
  const best = JSON.parse(await fs.readFile(path.join(repo, "results", "baselines", "best.json")));
  await fs.writeFile(path.join(repo, "results", "strategy-state.json"), JSON.stringify({
    schemaVersion: 1,
    champion: {
      id: best.strategy,
      sourcePath: "Market_making_binary_option.py",
      sourceSha256: best.sourceSha256,
      summary: best.summary,
    },
    challengers: [{
      id,
      status: "active",
      method,
      origin: "explore",
      rationale: "fixture parent",
      tuningAttempts: 0,
      currentRevision: 0,
      revisions: [{
        number: 0,
        sourcePath: path.relative(repo, sourcePath),
        sourceSha256,
        evaluation: candidateEvaluation,
      }],
      tuningHistory: [],
    }],
    evaluations: {},
  }));
  await git(repo, "add", "results");
  await git(repo, "commit", "-qm", "add parent challenger");
  return { id, sourcePath, sourceSha256, source: challengerSource };
}

function runId(label) {
  return `${label}-${randomBytes(4).toString("hex")}`;
}

async function writePlan(repo, value = plan()) {
  const planPath = path.join(repo, "plan.json");
  await fs.writeFile(planPath, JSON.stringify(value));
  return planPath;
}

async function archiveInputs(repo, label = "default", analysis = { finding: "Fixture finding." }) {
  const summariesPath = path.join(repo, `summaries-${label}.json`);
  const analysisPath = path.join(repo, `analysis-${label}.json`);
  await fs.writeFile(summariesPath, JSON.stringify({
    "candidate-a": "Implemented candidate A.",
    "candidate-b": "Implemented candidate B.",
    "candidate-c": "Implemented candidate C.",
  }));
  await fs.writeFile(analysisPath, JSON.stringify(analysis));
  return { summariesPath, analysisPath };
}

async function removeRegisteredWorktrees(repo) {
  try {
    const { stdout } = await git(repo, "worktree", "list", "--porcelain");
    const paths = stdout.split("\n").filter((line) => line.startsWith("worktree ")).map((line) => line.slice(9));
    for (const worktreePath of paths.slice(1)) {
      await git(repo, "worktree", "remove", "--force", worktreePath).catch(() => {});
    }
  } catch {}
}

async function cleanup(repo, id) {
  await removeRegisteredWorktrees(repo);
  await fs.rm(path.join(worktreeRoot, id), { recursive: true, force: true });
  await fs.rm(repo, { recursive: true, force: true });
}

function evaluation(candidateId, sourcePath, sourceSha256, points) {
  return {
    schemaVersion: 1,
    candidateId,
    valid: true,
    eligible: points > 900,
    sourcePath,
    sourceSha256,
    modifiedLines: 2,
    summary: {
      passed: 20,
      total: 20,
      bankruptcies: 0,
      scoredPointsHundredths: points,
      combinedPnlCents: points - 900,
      minimumCapital: { endingCashCents: 800, startingCapitalCents: 1000 },
    },
    baselineDelta: { scoredPointsHundredths: points - 900, combinedPnlCents: points - 627 },
    reasons: points > 900 ? [] : ["Candidate did not strictly exceed the baseline"],
  };
}

async function populateEvaluations(generation, points = [1000, 1100, 1050]) {
  for (let index = 0; index < generation.candidates.length; index += 1) {
    const candidate = generation.candidates[index];
    const sourcePath = path.join(candidate.worktreePath, "Market_making_binary_option.py");
    await fs.appendFile(sourcePath, `# ${candidate.id}\n`);
    const sourceSha256 = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
    await fs.mkdir(candidate.resultDirectory, { recursive: true });
    await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.md"), `# ${candidate.id}\n`);
    await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"), JSON.stringify({ label: candidate.id }));
    await fs.writeFile(path.join(candidate.resultDirectory, "evaluation.json"), JSON.stringify(evaluation(candidate.id, sourcePath, sourceSha256, points[index])));
  }
}

test("start accepts an unrelated unstaged file and supports v1, v2, and v3 baselines", async (t) => {
  for (const schemaVersion of [1, 2, 3]) {
    await t.test(`schema ${schemaVersion}`, async () => {
      const repo = await createRepo(schemaVersion);
      const id = runId(`start-v${schemaVersion}`);
      try {
        await fs.appendFile(path.join(repo, "AGENTS.MD"), "user edit\n");
        const { state } = await startRun({ repo, runId: id });
        assert.equal(state.schemaVersion, 2);
        assert.equal(state.config.exploreCandidateCount, 3);
        assert.equal(state.config.maxTuningAttempts, 2);
        assert.equal(state.config.maxGenerations, 6);
        assert.equal(state.config.targetPointsHundredths, 1600);
        assert.equal(state.baseline.legacyBaseline, schemaVersion === 1);
      } finally {
        await cleanup(repo, id);
      }
    });
  }
});

test("stop rules cover target score and generation limit without stalls", () => {
  const state = {
    baseline: { summary: { scoredPointsHundredths: 1500 } },
    config: { targetPointsHundredths: 1600, maxGenerations: 6 },
    generations: [],
    consecutiveNoPromotion: 0,
  };
  assert.equal(getStopReason(state), null);
  state.baseline.summary.scoredPointsHundredths = 1600;
  assert.equal(getStopReason(state), "target score reached");
  state.baseline.summary.scoredPointsHundredths = 1500;
  state.generations = Array.from({ length: 6 }, (_, index) => ({ number: index + 1, status: "promoted" }));
  assert.equal(getStopReason(state), "generation limit reached");
  state.generations = [];
  state.consecutiveNoPromotion = 2;
  assert.equal(getStopReason(state), null);
});

test("start rejects staged changes and a dirty managed source", async () => {
  const repo = await createRepo();
  const firstId = runId("staged");
  const secondId = runId("dirty");
  try {
    await fs.appendFile(path.join(repo, "AGENTS.MD"), "staged\n");
    await git(repo, "add", "AGENTS.MD");
    await assert.rejects(startRun({ repo, runId: firstId }), /staged changes/);
    await git(repo, "restore", "--staged", "AGENTS.MD");
    await fs.appendFile(path.join(repo, "Market_making_binary_option.py"), "# dirty\n");
    await assert.rejects(startRun({ repo, runId: secondId }), /loop-managed files are dirty/);
  } finally {
    await cleanup(repo, firstId);
    await fs.rm(path.join(worktreeRoot, secondId), { recursive: true, force: true });
  }
});

test("prepare validates plans and creates exactly three detached worktrees", async () => {
  const repo = await createRepo();
  const id = runId("prepare");
  try {
    await startRun({ repo, runId: id });
    const invalidPlan = plan();
    invalidPlan.candidates.pop();
    await assert.rejects(prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, invalidPlan) }), /exactly three/);
    const { generation } = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    assert.equal(generation.candidates.length, 3);
    for (const candidate of generation.candidates) {
      assert.ok(candidate.worktreePath.startsWith(`${worktreeRoot}/${id}/`));
      assert.equal((await git(candidate.worktreePath, "symbolic-ref", "-q", "HEAD").catch((error) => error)).code, 1);
    }
  } finally {
    await cleanup(repo, id);
  }
});

test("schema-version-2 Explore can explicitly pin the current champion parent", async () => {
  const repo = await createRepo(2);
  const id = runId("explore-champion");
  try {
    const best = JSON.parse(await fs.readFile(path.join(repo, "results", "baselines", "best.json")));
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({
      repo,
      runId: id,
      planPath: await writePlan(repo, {
        ...plan(),
        schemaVersion: 2,
        mode: "explore",
        parent: { type: "champion", sourceSha256: best.sourceSha256 },
      }),
    });
    assert.equal(prepared.generation.parent.type, "champion");
    assert.equal(prepared.generation.parent.sourceSha256, best.sourceSha256);
    assert.ok(prepared.generation.candidates.every(({ parentReady }) => parentReady));
  } finally {
    await cleanup(repo, id);
  }
});

test("schema-version-3 Explore requires a machine-checkable objective", async () => {
  const repo = await createRepo(2);
  const id = runId("explore-objective");
  try {
    const best = JSON.parse(await fs.readFile(path.join(repo, "results", "baselines", "best.json")));
    await startRun({ repo, runId: id });
    const objectivePlan = {
      ...plan(),
      schemaVersion: 3,
      mode: "explore",
      parent: { type: "champion", sourceSha256: best.sourceSha256 },
      objective: {
        kind: "exploit",
        targetCases: [6],
        expectedGainHundredths: 30,
        collateralBudgetHundredths: 30,
      },
    };
    await assert.rejects(
      prepareGeneration({
        repo,
        runId: id,
        planPath: await writePlan(repo, {
          ...objectivePlan,
          objective: { ...objectivePlan.objective, kind: "probe", expectedGainHundredths: 0 },
        }),
      }),
      /unlock statement/,
    );
    const prepared = await prepareGeneration({
      repo,
      runId: id,
      planPath: await writePlan(repo, objectivePlan),
    });
    assert.deepEqual(prepared.generation.objective, objectivePlan.objective);
  } finally {
    await cleanup(repo, id);
  }
});

test("Explore selects a hash-pinned active challenger and rejects extra method declarations", async () => {
  const repo = await createRepo(2);
  const id = runId("explore-parent");
  try {
    const parent = await addChallenger(repo);
    await startRun({ repo, runId: id });
    const explorePlan = {
      ...plan(),
      schemaVersion: 2,
      mode: "explore",
      method: "respond_to_fok",
      parent: {
        type: "challenger",
        challengerId: parent.id,
        sourceSha256: parent.sourceSha256,
      },
    };
    const multipleMethods = { ...explorePlan, methods: ["quote", "respond_to_fok"] };
    await assert.rejects(
      prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, multipleMethods) }),
      /unsupported fields: methods/,
    );
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, explorePlan) });
    assert.deepEqual(
      {
        type: prepared.generation.parent.type,
        challengerId: prepared.generation.parent.challengerId,
        revision: prepared.generation.parent.revision,
        sourceSha256: prepared.generation.parent.sourceSha256,
      },
      { type: "challenger", challengerId: parent.id, revision: 0, sourceSha256: parent.sourceSha256 },
    );
    for (const candidate of prepared.generation.candidates) {
      assert.equal(
        await fs.readFile(path.join(candidate.worktreePath, "Market_making_binary_option.py"), "utf8"),
        parent.source,
      );
    }
  } finally {
    await cleanup(repo, id);
  }
});

test("Explore rejects stale or inactive challenger parents", async () => {
  const repo = await createRepo(2);
  const id = runId("explore-stale-parent");
  try {
    const parent = await addChallenger(repo);
    await startRun({ repo, runId: id });
    const explorePlan = {
      ...plan(),
      schemaVersion: 2,
      mode: "explore",
      parent: { type: "challenger", challengerId: parent.id, sourceSha256: "0".repeat(64) },
    };
    await assert.rejects(
      prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, explorePlan) }),
      /does not match the challenger revision/,
    );
    const registryPath = path.join(repo, "results", "strategy-state.json");
    const registry = JSON.parse(await fs.readFile(registryPath));
    registry.challengers[0].status = "retired";
    await fs.writeFile(registryPath, JSON.stringify(registry));
    explorePlan.parent.sourceSha256 = parent.sourceSha256;
    await assert.rejects(
      prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, explorePlan) }),
      /active challenger/,
    );
  } finally {
    await cleanup(repo, id);
  }
});

test("tune prepare creates one designer worktree and registers exactly N variants", async () => {
  const repo = await createRepo(2);
  const id = runId("tune-prepare");
  try {
    const realSource = marketMakerSource.replace(
      "        return None",
      "        values = (3, 1, 2, 3)\n        return values",
    );
    const mainSourcePath = path.join(repo, "Market_making_binary_option.py");
    await fs.writeFile(mainSourcePath, realSource);
    const championSha = createHash("sha256").update(realSource).digest("hex");
    const fixtureBaseline = baseline(2, championSha);
    await fs.writeFile(path.join(repo, "results", "baselines", "best.json"), JSON.stringify(fixtureBaseline));
    const challengerId = "challenger-one";
    const challengerDirectory = path.join(repo, "results", "challengers", challengerId);
    const challengerSource = path.join(challengerDirectory, "r00.py");
    await fs.mkdir(challengerDirectory, { recursive: true });
    await fs.writeFile(challengerSource, `${realSource}\n# challenger\n`);
    const sourceSha256 = createHash("sha256").update(await fs.readFile(challengerSource)).digest("hex");
    const challengerEvaluation = evaluation("challenger-one", challengerSource, sourceSha256, 850);
    const best = JSON.parse(await fs.readFile(path.join(repo, "results", "baselines", "best.json")));
    await fs.writeFile(path.join(repo, "results", "strategy-state.json"), JSON.stringify({
      schemaVersion: 1,
      champion: { id: best.strategy, sourceSha256: best.sourceSha256, summary: best.summary },
      challengers: [{
        id: challengerId,
        status: "active",
        method: "quote",
        origin: "explore",
        rationale: "fixture",
        tuningAttempts: 0,
        currentRevision: 0,
        revisions: [{ number: 0, sourcePath: path.relative(repo, challengerSource), sourceSha256, evaluation: challengerEvaluation }],
        tuningHistory: [],
      }],
      evaluations: {},
    }));
    await git(repo, "add", "Market_making_binary_option.py", "results");
    await git(repo, "commit", "-qm", "add challenger");
    await startRun({ repo, runId: id });
    const tunePlan = {
      schemaVersion: 2,
      mode: "tune",
      challengerId,
      parentSourceSha256: sourceSha256,
      method: "quote",
      rationale: "Tune the complete challenger.",
      sampleCount: 3,
      parameters: [{
        name: "width",
        type: "int",
        direction: "both",
        parentValue: 3,
        minimum: 1,
        maximum: 5,
        bindings: [{ method: "quote", ordinal: 0 }, { method: "quote", ordinal: 3 }],
      }],
    };
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, tunePlan) });
    assert.equal(prepared.generation.mode, "tune");
    assert.equal(prepared.generation.candidates.length, 0);
    assert.equal(await fs.readFile(path.join(prepared.generation.designer.worktreePath, "Market_making_binary_option.py"), "utf8"), await fs.readFile(challengerSource, "utf8"));
    const variants = [
      { id: "coarse-one", granularity: "coarse", parameters: { width: 5 } },
      { id: "medium-one", granularity: "medium", parameters: { width: 4 } },
      { id: "fine-one", granularity: "fine", parameters: { width: 2 } },
    ];
    await fs.mkdir(path.dirname(prepared.generation.designer.manifestPath), { recursive: true });
    await fs.writeFile(prepared.generation.designer.manifestPath, JSON.stringify({ schemaVersion: 1, parentSourceSha256: sourceSha256, variants }));
    const registered = await registerTuning({
      repo,
      runId: id,
      manifestPath: prepared.generation.designer.manifestPath,
      materializerPath: path.resolve(path.dirname(new URL(import.meta.url).pathname), "../materialize-tuning.sh"),
    });
    assert.equal(registered.generation.candidates.length, 3);
    assert.equal(new Set(registered.generation.candidates.map(({ worktreePath }) => worktreePath)).size, 1);
    for (const [index, candidate] of registered.generation.candidates.entries()) {
      const candidateSha = createHash("sha256").update(await fs.readFile(candidate.sourcePath)).digest("hex");
      await fs.mkdir(candidate.resultDirectory, { recursive: true });
      await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.md"), `# ${candidate.id}\n`);
      await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"), JSON.stringify({ label: candidate.id }));
      await fs.writeFile(
        path.join(candidate.resultDirectory, "evaluation.json"),
        JSON.stringify(evaluation(candidate.id, candidate.sourcePath, candidateSha, [800, 870, 860][index])),
      );
    }
    const summariesPath = path.join(repo, "tune-summaries.json");
    const analysisPath = path.join(repo, "tune-analysis.json");
    await fs.writeFile(summariesPath, JSON.stringify({ [registered.generation.designer.id]: "Designed three tuning vectors." }));
    await fs.writeFile(analysisPath, JSON.stringify({ finding: "The medium vector improved the challenger." }));
    const archived = await archiveGeneration({ repo, runId: id, summariesPath, analysisPath });
    assert.equal(archived.generation.selection.promotion, false);
    const updatedRegistry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    const updated = updatedRegistry.challengers.find(({ id: candidateId }) => candidateId === challengerId);
    assert.equal(updated.tuningAttempts, 1);
    assert.equal(updated.revisions.length, 2);
    assert.equal(updated.revisions.at(-1).evaluation.summary.scoredPointsHundredths, 870);
    await assert.rejects(fs.access(registered.generation.designer.worktreePath));

    const secondPlan = {
      ...tunePlan,
      parentSourceSha256: updated.revisions.at(-1).sourceSha256,
      parameters: [{ ...tunePlan.parameters[0], parentValue: 4 }],
    };
    const secondPrepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo, secondPlan) });
    await fs.mkdir(path.dirname(secondPrepared.generation.designer.manifestPath), { recursive: true });
    await fs.writeFile(secondPrepared.generation.designer.manifestPath, JSON.stringify({
      schemaVersion: 1,
      parentSourceSha256: secondPlan.parentSourceSha256,
      variants: [
        { id: "coarse-two", granularity: "coarse", parameters: { width: 1 } },
        { id: "medium-two", granularity: "medium", parameters: { width: 2 } },
        { id: "fine-two", granularity: "fine", parameters: { width: 3 } },
      ],
    }));
    const secondRegistered = await registerTuning({
      repo,
      runId: id,
      manifestPath: secondPrepared.generation.designer.manifestPath,
      materializerPath: path.resolve(path.dirname(new URL(import.meta.url).pathname), "../materialize-tuning.sh"),
    });
    for (const [index, candidate] of secondRegistered.generation.candidates.entries()) {
      const candidateSha = createHash("sha256").update(await fs.readFile(candidate.sourcePath)).digest("hex");
      await fs.mkdir(candidate.resultDirectory, { recursive: true });
      await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.md"), `# ${candidate.id}\n`);
      await fs.writeFile(path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"), JSON.stringify({ label: candidate.id }));
      await fs.writeFile(path.join(candidate.resultDirectory, "evaluation.json"), JSON.stringify(
        evaluation(candidate.id, candidate.sourcePath, candidateSha, [700, 800, 750][index]),
      ));
    }
    const secondSummaries = path.join(repo, "tune-summaries-two.json");
    const secondAnalysis = path.join(repo, "tune-analysis-two.json");
    await fs.writeFile(secondSummaries, JSON.stringify({ [secondRegistered.generation.designer.id]: "Designed the second batch." }));
    await fs.writeFile(secondAnalysis, JSON.stringify({ finding: "The second batch did not improve the challenger." }));
    await archiveGeneration({ repo, runId: id, summariesPath: secondSummaries, analysisPath: secondAnalysis });
    const retiredRegistry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    const retired = retiredRegistry.challengers.find(({ id: candidateId }) => candidateId === challengerId);
    assert.equal(retired.tuningAttempts, 2);
    assert.equal(retired.status, "retired");
  } finally {
    await cleanup(repo, id);
  }
});

test("failure preserves worktrees and the same generation can resume", async () => {
  const repo = await createRepo();
  const id = runId("resume");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const completedResult = path.join(prepared.generation.candidates[0].resultDirectory, "evaluation.json");
    const completedSource = path.join(prepared.generation.candidates[0].worktreePath, "Market_making_binary_option.py");
    const completedSha = createHash("sha256").update(await fs.readFile(completedSource)).digest("hex");
    await fs.mkdir(path.dirname(completedResult), { recursive: true });
    await fs.writeFile(completedResult, JSON.stringify(evaluation("candidate-a", completedSource, completedSha, 1000)));
    const malformedResult = path.join(prepared.generation.candidates[1].resultDirectory, "evaluation.json");
    await fs.mkdir(path.dirname(malformedResult), { recursive: true });
    await fs.writeFile(malformedResult, "malformed\n");
    await archiveGeneration({ repo, runId: id, failure: "authentication expired", failureKind: "authentication" });
    const failed = await statusRun({ repo, runId: id });
    assert.equal(failed.state.generations[0].candidates[0].status, "evaluated");
    assert.equal(failed.state.generations[0].candidates[1].status, "prepared");
    for (const candidate of prepared.generation.candidates) await fs.access(candidate.worktreePath);
    const resumed = await resumeRun({ repo, runId: id });
    assert.equal(resumed.resumed, true);
    assert.equal(resumed.state.status, "active");
    assert.equal(resumed.generation.number, 1);
    assert.equal(JSON.parse(await fs.readFile(completedResult)).candidateId, "candidate-a");
    const preparedAgain = await prepareGeneration({ repo, runId: id, planPath: "/unused" });
    assert.equal(preparedAgain.resumed, true);
    assert.equal(preparedAgain.generation.candidates[0].status, "evaluated");
    const report = await fs.readFile(path.join(repo, "results", "experiments", `${id}.md`), "utf8");
    assert.match(report, /Previous failure \(authentication\): authentication expired/);
    assert.match(report, /Recovery instruction: Repair the HackerRank browser profile/);
  } finally {
    await cleanup(repo, id);
  }
});

test("resume prices legacy scored bankruptcy without another run", async () => {
  const repo = await createRepo();
  const id = runId("legacy-performance");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const candidate = prepared.generation.candidates[0];
    const sourcePath = path.join(candidate.worktreePath, "Market_making_binary_option.py");
    const sourceSha256 = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
    const cases = Array.from({ length: 20 }, (_, index) => (
      index === 6
        ? rawCase(index + 1, { passed: false, bankrupt: true, endingCashCents: -255 })
        : rawCase(index + 1)
    ));
    await fs.mkdir(candidate.resultDirectory, { recursive: true });
    await fs.writeFile(
      path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"),
      JSON.stringify(rawReport({ label: candidate.id, sourcePath, sourceSha256, cases })),
    );
    await fs.writeFile(
      path.join(candidate.resultDirectory, "evaluation.json"),
      JSON.stringify({
        ...evaluation(candidate.id, sourcePath, sourceSha256, 1130),
        valid: false,
        eligible: false,
        reasons: ["Cases did not pass: 7", "Bankruptcy reported in cases: 7"],
      }),
    );

    await archiveGeneration({ repo, runId: id, failure: "legacy integrity failure", failureKind: "integrity" });
    const resumed = await resumeRun({ repo, runId: id });
    const refreshed = JSON.parse(await fs.readFile(path.join(candidate.resultDirectory, "evaluation.json")));
    assert.equal(refreshed.valid, true);
    assert.equal(refreshed.eligible, false);
    assert.equal(refreshed.schemaVersion, 2);
    assert.equal(refreshed.summary.bankruptcies, 1);
    assert.match(refreshed.reasons.join("\n"), /baseline score/);
    await fs.access(path.join(candidate.resultDirectory, "evaluation.legacy-invalid.json"));
    assert.equal(resumed.generation.candidates[0].evaluation.valid, true);
  } finally {
    await cleanup(repo, id);
  }
});

test("resume locally reclassifies legacy runtime-error evidence and corrects its failure text", async () => {
  const repo = await createRepo();
  const id = runId("legacy-runtime");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const candidate = prepared.generation.candidates[0];
    const sourcePath = path.join(candidate.worktreePath, "Market_making_binary_option.py");
    const sourceSha256 = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
    const cases = Array.from({ length: 20 }, (_, index) => (
      index === 4 ? runtimeErrorCase(index + 1) : rawCase(index + 1)
    ));
    await fs.mkdir(candidate.resultDirectory, { recursive: true });
    await fs.writeFile(
      path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"),
      JSON.stringify(rawReport({ label: candidate.id, sourcePath, sourceSha256, cases })),
    );
    await fs.writeFile(
      path.join(candidate.resultDirectory, "evaluation.json"),
      JSON.stringify({
        ...evaluation(candidate.id, sourcePath, sourceSha256, 0),
        valid: false,
        eligible: false,
        reasons: [
          "Case 5 cannot be parsed: Expected exactly one Result field, found 0",
          "Expected bankruptcy data for 19 cases, found 18",
          "Expected exactly 16 SCORED results, found 15",
        ],
      }),
    );

    await archiveGeneration({
      repo,
      runId: id,
      failure: `${candidate.id} integrity failure after retry`,
      failureKind: "integrity",
    });
    const resumed = await resumeRun({ repo, runId: id });
    const refreshed = JSON.parse(await fs.readFile(path.join(candidate.resultDirectory, "evaluation.json")));
    assert.equal(refreshed.valid, true);
    assert.equal(refreshed.eligible, false);
    assert.equal(refreshed.summary.runtimeErrors, 1);
    assert.equal(refreshed.summary.combinedPnlCents, null);
    assert.match(refreshed.reasons.join("\n"), /runtime error in cases 5/i);
    assert.equal(resumed.generation.previousFailure.message, `${candidate.id} integrity failure`);
    await fs.access(path.join(candidate.resultDirectory, "evaluation.legacy-invalid.json"));
  } finally {
    await cleanup(repo, id);
  }
});

test("resume keeps genuinely truncated evidence stopped as an integrity failure", async () => {
  const repo = await createRepo();
  const id = runId("truncated-integrity");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const candidate = prepared.generation.candidates[0];
    const sourcePath = path.join(candidate.worktreePath, "Market_making_binary_option.py");
    const sourceSha256 = createHash("sha256").update(await fs.readFile(sourcePath)).digest("hex");
    const report = rawReport({ label: candidate.id, sourcePath, sourceSha256 });
    report.cases.pop();
    await fs.mkdir(candidate.resultDirectory, { recursive: true });
    await fs.writeFile(
      path.join(candidate.resultDirectory, "hackerrank-run-fixture.json"),
      JSON.stringify(report),
    );
    await fs.writeFile(
      path.join(candidate.resultDirectory, "evaluation.json"),
      JSON.stringify({
        ...evaluation(candidate.id, sourcePath, sourceSha256, 0),
        valid: false,
        eligible: false,
        reasons: ["Expected exactly 20 cases, found 19"],
      }),
    );

    await archiveGeneration({ repo, runId: id, failure: "truncated evidence", failureKind: "integrity" });
    await assert.rejects(resumeRun({ repo, runId: id }), /remains invalid.*exactly 20 cases/s);
    const stopped = await statusRun({ repo, runId: id });
    assert.equal(stopped.state.status, "failed");
    assert.equal(stopped.state.stopReason, "integrity failure");
  } finally {
    await cleanup(repo, id);
  }
});

test("prepare repairs a missing worktree and persists setup failures for explicit resume", async () => {
  const repo = await createRepo();
  const id = runId("partial-setup");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const missing = prepared.generation.candidates[2].worktreePath;
    await git(repo, "worktree", "remove", "--force", missing);
    await fs.mkdir(missing, { recursive: true });
    await assert.rejects(prepareGeneration({ repo, runId: id, planPath: "/unused" }), /exists but is not a registered worktree/);
    const failed = await statusRun({ repo, runId: id });
    assert.equal(failed.state.status, "failed");
    assert.equal(failed.state.generations[0].failure.kind, "setup");
    await fs.rm(missing, { recursive: true });
    const repaired = await resumeRun({ repo, runId: id });
    await fs.access(missing);
    assert.equal(repaired.generation.status, "prepared");
    assert.equal(repaired.generation.candidates[2].status, "prepared");
  } finally {
    await cleanup(repo, id);
  }
});

test("every command rejects deeply tampered generation and candidate identity state", async (t) => {
  for (const [label, mutate, message] of [
    ["generation-number", (state) => { state.generations[0].number = 2; }, /invalid number/],
    ["candidate-id", (state) => { state.generations[0].candidates[0].id = "../escape"; }, /candidate ID must match/],
    ["duplicate-id", (state) => { state.generations[0].candidates[1].id = "candidate-a"; }, /IDs must be unique/],
    ["result-path", (state) => { state.generations[0].candidates[0].resultDirectory = "/tmp/elsewhere"; }, /Unexpected result path/],
  ]) {
    await t.test(label, async () => {
      const repo = await createRepo();
      const id = runId(`state-${label}`);
      try {
        const started = await startRun({ repo, runId: id });
        await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
        const state = JSON.parse(await fs.readFile(started.paths.statePath));
        mutate(state);
        await fs.writeFile(started.paths.statePath, JSON.stringify(state));
        await assert.rejects(statusRun({ repo, runId: id }), message);
      } finally {
        await cleanup(repo, id);
      }
    });
  }
});

test("prepare rejects a tampered candidate path before creating or reusing it", async () => {
  const repo = await createRepo();
  const id = runId("prepare-path");
  const forgedPath = path.join(worktreeRoot, `${id}-other`, "g01", "candidate-a");
  try {
    const started = await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const state = JSON.parse(await fs.readFile(started.paths.statePath));
    state.generations[0].candidates[0].worktreePath = forgedPath;
    await fs.writeFile(started.paths.statePath, JSON.stringify(state));
    await assert.rejects(prepareGeneration({ repo, runId: id, planPath: "/unused" }), /Unexpected worktree path/);
    await assert.rejects(fs.access(forgedPath));
    for (const candidate of prepared.generation.candidates) await fs.access(candidate.worktreePath);
  } finally {
    await cleanup(repo, id);
    await fs.rm(path.join(worktreeRoot, `${id}-other`), { recursive: true, force: true });
  }
});

test("archive validates failure kinds", async () => {
  const repo = await createRepo();
  const id = runId("failure-kind");
  try {
    await startRun({ repo, runId: id });
    await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await assert.rejects(archiveGeneration({ repo, runId: id, failureKind: "browser" }), /requires a failure message/);
    await assert.rejects(archiveGeneration({ repo, runId: id, failure: "failed", failureKind: "network" }), /must be one of/);
  } finally {
    await cleanup(repo, id);
  }
});

test("successful archive requires all summaries and a finding", async () => {
  const repo = await createRepo();
  const id = runId("required-analysis");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await assert.rejects(archiveGeneration({ repo, runId: id }), /requires --summaries/);
    await resumeRun({ repo, runId: id });
    const summariesPath = path.join(repo, "incomplete-summaries.json");
    await fs.writeFile(summariesPath, JSON.stringify({ "candidate-a": "Only one." }));
    await assert.rejects(archiveGeneration({ repo, runId: id, summariesPath, analysisPath: (await archiveInputs(repo, "required")).analysisPath }), /candidate-b must be a non-empty string/);
  } finally {
    await cleanup(repo, id);
  }
});

test("archive rejects a state path outside the exact run generation layout", async () => {
  const repo = await createRepo();
  const id = runId("exact-path");
  try {
    const started = await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    const state = JSON.parse(await fs.readFile(started.paths.statePath));
    state.generations[0].candidates[0].worktreePath = path.join(worktreeRoot, id, "g99", "candidate-a");
    await fs.writeFile(started.paths.statePath, JSON.stringify(state));
    await assert.rejects(archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "exact") }), /Unexpected worktree path/);
    for (const candidate of prepared.generation.candidates) await fs.access(candidate.worktreePath);
  } finally {
    await cleanup(repo, id);
  }
});

test("archive verifies sources, selects the winner, archives evidence, and cleans registered worktrees", async () => {
  const repo = await createRepo();
  const id = runId("archive");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    const summariesPath = path.join(repo, "summaries.json");
    await fs.writeFile(summariesPath, JSON.stringify({
      "candidate-a": "Implemented candidate A.",
      "candidate-b": "Implemented candidate B.",
      "candidate-c": "Implemented candidate C.",
    }));
    const analysisPath = path.join(repo, "analysis.json");
    await fs.writeFile(analysisPath, JSON.stringify({
      finding: "Candidate B improved score without reducing minimum capital.",
      nextGenerationRationale: "Test whether the winning width generalizes to FOK inventory.",
      challenger: { candidateId: "candidate-a", rationale: "The structure has tuning upside." },
    }));
    const { generation } = await archiveGeneration({ repo, runId: id, summariesPath, analysisPath });
    assert.equal(generation.selection.winner.candidateId, "candidate-b");
    assert.equal(generation.candidates[0].implementationSummary, "Implemented candidate A.");
    assert.equal(generation.finding, "Candidate B improved score without reducing minimum capital.");
    assert.equal(generation.nextGenerationRationale, "Test whether the winning width generalizes to FOK inventory.");
    const registry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    assert.equal(registry.challengers.length, 1);
    assert.equal(registry.challengers[0].status, "active");
    const report = await fs.readFile(path.join(repo, "results", "experiments", `${id}.md`), "utf8");
    assert.match(report, /Finding: Candidate B improved score/);
    assert.match(report, /Next-generation rationale: Test whether/);
    for (const candidate of generation.candidates) {
      await fs.access(candidate.archivedSourcePath);
      await fs.access(path.join(candidate.archiveDirectory, "candidate.patch"));
      await fs.access(path.join(candidate.archiveDirectory, "raw", "hackerrank-run-fixture.md"));
      await fs.access(path.join(candidate.archiveDirectory, "raw", "hackerrank-run-fixture.json"));
      await assert.rejects(fs.access(candidate.worktreePath));
    }
  } finally {
    await cleanup(repo, id);
  }
});

test("archive rejects empty post-evaluation analysis fields and preserves worktrees", async () => {
  const repo = await createRepo();
  const id = runId("analysis");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    const analysisPath = path.join(repo, "analysis.json");
    await fs.writeFile(analysisPath, JSON.stringify({ finding: "  " }));
    const { summariesPath } = await archiveInputs(repo, "invalid-analysis");
    await assert.rejects(archiveGeneration({ repo, runId: id, summariesPath, analysisPath }), /non-empty finding/);
    for (const candidate of prepared.generation.candidates) await fs.access(candidate.worktreePath);
  } finally {
    await cleanup(repo, id);
  }
});

test("archive recomputes eligibility instead of trusting candidate JSON", async () => {
  const repo = await createRepo();
  const id = runId("forged-gate");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation, [800, 800, 800]);
    for (const candidate of prepared.generation.candidates) {
      const evaluationPath = path.join(candidate.resultDirectory, "evaluation.json");
      const forged = JSON.parse(await fs.readFile(evaluationPath));
      forged.eligible = true;
      await fs.writeFile(evaluationPath, JSON.stringify(forged));
    }
    const { generation } = await archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "forged") });
    assert.equal(generation.selection.promotion, false);
    assert.ok(generation.candidates.every(({ evaluation: candidateEvaluation }) => candidateEvaluation.eligible === false));
  } finally {
    await cleanup(repo, id);
  }
});

test("Explore preserves the best strict parent improvement as a derived challenger", async () => {
  const repo = await createRepo(2);
  const id = runId("derived-explore");
  try {
    const parent = await addChallenger(repo, { points: 800 });
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({
      repo,
      runId: id,
      planPath: await writePlan(repo, {
        ...plan(),
        schemaVersion: 2,
        mode: "explore",
        method: "warm_up",
        parent: {
          type: "challenger",
          challengerId: parent.id,
          sourceSha256: parent.sourceSha256,
        },
      }),
    });
    await populateEvaluations(prepared.generation, [850, 890, 880]);
    const { generation } = await archiveGeneration({
      repo,
      runId: id,
      ...await archiveInputs(repo, "derived-explore"),
    });
    assert.equal(generation.selection.promotion, false);
    assert.equal(generation.derivedCandidateId, "candidate-b");
    const registry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    const derived = registry.challengers.find(({ origin }) => origin === "derived-explore");
    assert.equal(derived.status, "active");
    assert.equal(derived.method, "warm_up");
    assert.deepEqual(derived.derivedFrom, {
      challengerId: parent.id,
      revision: 0,
      sourceSha256: parent.sourceSha256,
    });
    assert.equal(
      derived.revisions.find(({ number }) => number === derived.currentRevision).sourceSha256,
      generation.candidates[1].sourceSha256,
    );
  } finally {
    await cleanup(repo, id);
  }
});

test("challenger-parent Explore discards branches that do not improve the parent", async () => {
  const repo = await createRepo(2);
  const id = runId("derived-explore-weaker");
  try {
    const parent = await addChallenger(repo, { points: 850 });
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({
      repo,
      runId: id,
      planPath: await writePlan(repo, {
        ...plan(),
        schemaVersion: 2,
        mode: "explore",
        method: "warm_up",
        parent: {
          type: "challenger",
          challengerId: parent.id,
          sourceSha256: parent.sourceSha256,
        },
      }),
    });
    await populateEvaluations(prepared.generation, [840, 830, 820]);
    const { generation } = await archiveGeneration({
      repo,
      runId: id,
      ...await archiveInputs(repo, "derived-explore-weaker", {
        finding: "No branch improved the parent.",
        challenger: { candidateId: "candidate-a", rationale: "Keep the least weak branch." },
      }),
    });

    assert.equal(generation.derivedCandidateId, undefined);
    assert.equal(generation.challengerUpdate, undefined);
    const registry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    assert.deepEqual(registry.challengers.map(({ id: challengerId }) => challengerId), [parent.id]);
  } finally {
    await cleanup(repo, id);
  }
});

test("archive never turns equal-score PnL into a promotion", async () => {
  const repo = await createRepo();
  const id = runId("pnl-gate");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation, [900, 900, 900]);
    const pnls = [-273, -200, -300];
    const capitals = [769, 760, 800];
    for (const [index, candidate] of prepared.generation.candidates.entries()) {
      const evaluationPath = path.join(candidate.resultDirectory, "evaluation.json");
      const saved = JSON.parse(await fs.readFile(evaluationPath));
      saved.eligible = false;
      saved.summary.combinedPnlCents = pnls[index];
      saved.summary.minimumCapital = { endingCashCents: capitals[index], startingCapitalCents: 1000 };
      await fs.writeFile(evaluationPath, JSON.stringify(saved));
    }

    const { generation } = await archiveGeneration({
      repo,
      runId: id,
      ...await archiveInputs(repo, "pnl-gate"),
    });
    assert.equal(generation.candidates[0].evaluation.eligible, false);
    assert.equal(generation.candidates[1].evaluation.eligible, false);
    assert.equal(generation.candidates[2].evaluation.eligible, false);
    assert.equal(generation.selection.promotion, false);
  } finally {
    await cleanup(repo, id);
  }
});

test("an archive SHA mismatch is a hard stop and preserves every worktree", async () => {
  const repo = await createRepo();
  const id = runId("hash");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    const evaluationPath = path.join(prepared.generation.candidates[1].resultDirectory, "evaluation.json");
    const damaged = JSON.parse(await fs.readFile(evaluationPath));
    damaged.sourceSha256 = "0".repeat(64);
    await fs.writeFile(evaluationPath, JSON.stringify(damaged));
    await assert.rejects(archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "hash") }), /source SHA-256 changed/);
    for (const candidate of prepared.generation.candidates) await fs.access(candidate.worktreePath);
  } finally {
    await cleanup(repo, id);
  }
});

test("promotion migrates v1 to v3 and commits only loop outputs", async () => {
  const repo = await createRepo();
  const id = runId("promote");
  try {
    await fs.appendFile(path.join(repo, "AGENTS.MD"), "unrelated user edit\n");
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "promote") });
    const promoted = await promoteGeneration({ repo, runId: id });
    const migrated = JSON.parse(await fs.readFile(path.join(repo, "results", "baselines", "best.json")));
    assert.equal(migrated.schemaVersion, 3);
    assert.equal(migrated.experimentId, `${id}:g01:candidate-b`);
    assert.equal(migrated.experiment.runId, id);
    assert.equal(migrated.strategy, "candidate-b");
    assert.equal(migrated.resultArtifact, "results/champion/result.md");
    const champion = JSON.parse(await fs.readFile(path.join(repo, "results", "champion", "champion.json")));
    assert.equal(champion.id, "candidate-b");
    assert.equal(champion.sourcePath, "Market_making_binary_option.py");
    assert.equal(champion.sourceSha256, migrated.sourceSha256);
    await fs.access(path.join(repo, champion.resultArtifact));
    const registry = JSON.parse(await fs.readFile(path.join(repo, "results", "strategy-state.json")));
    const demoted = registry.challengers.find(({ origin }) => origin === "demoted-champion");
    assert.ok(demoted);
    assert.equal(demoted.status, "active");
    assert.equal(
      createHash("sha256").update(await fs.readFile(path.join(repo, demoted.revisions[0].sourcePath))).digest("hex"),
      demoted.revisions[0].sourceSha256,
    );
    const { stdout: names } = await git(repo, "show", "--pretty=format:", "--name-only", promoted.commit);
    assert.ok(!names.split("\n").includes("AGENTS.MD"));
    assert.match((await git(repo, "status", "--short", "--", "AGENTS.MD")).stdout, /^ M AGENTS\.MD/);
  } finally {
    await cleanup(repo, id);
  }
});

test("promotion rechecks that the winner still strictly exceeds the current champion", async () => {
  const repo = await createRepo();
  const id = runId("promotion-champion-gate");
  try {
    const started = await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "promotion-champion-gate") });
    const state = JSON.parse(await fs.readFile(started.paths.statePath));
    const winnerId = state.generations[0].selection.winner.candidateId;
    const winner = state.generations[0].candidates.find(({ id: candidateId }) => candidateId === winnerId);
    winner.evaluation.summary = structuredClone(state.baseline.summary);
    await fs.writeFile(started.paths.statePath, JSON.stringify(state));
    await assert.rejects(
      promoteGeneration({ repo, runId: id }),
      /does not strictly exceed the current champion/,
    );
  } finally {
    await cleanup(repo, id);
  }
});

test("promotion preflights the baseline and retries after a commit failure", async () => {
  const repo = await createRepo();
  const preflightId = runId("promotion-preflight");
  const retryId = runId("promotion-retry");
  try {
    await startRun({ repo, runId: preflightId });
    let prepared = await prepareGeneration({ repo, runId: preflightId, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: preflightId, ...await archiveInputs(repo, "preflight") });
    await fs.appendFile(path.join(repo, "Market_making_binary_option.py"), "# unexpected\n");
    await assert.rejects(promoteGeneration({ repo, runId: preflightId }), /current strategy no longer matches/);
    assert.equal((await statusRun({ repo, runId: preflightId })).state.generations[0].promotionTransaction, undefined);
    await git(repo, "restore", "Market_making_binary_option.py");

    await fs.rm(path.join(repo, "results", "runs", preflightId), { recursive: true });
    await fs.rm(path.join(repo, "results", "experiments", `${preflightId}.md`));
    await fs.rm(path.join(repo, "results", "strategy-state.json"), { force: true });
    await fs.rm(path.join(repo, "results", "challengers"), { recursive: true, force: true });
    await startRun({ repo, runId: retryId });
    prepared = await prepareGeneration({ repo, runId: retryId, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: retryId, ...await archiveInputs(repo, "retry") });
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await assert.rejects(promoteGeneration({ repo, runId: retryId }), /git -C .* commit/);
    const pending = await statusRun({ repo, runId: retryId });
    assert.equal(pending.state.generations[0].status, "archived");
    assert.equal(pending.state.generations[0].promotion, null);
    assert.equal(pending.state.generations[0].promotionTransaction.candidateId, "candidate-b");
    assert.equal((await git(repo, "diff", "--cached", "--quiet").then(() => 0, (error) => error.code)), 0);
    await fs.rm(hook);
    const promoted = await promoteGeneration({ repo, runId: retryId });
    assert.ok(promoted.commit);
    assert.equal(promoted.generation.status, "promoted");
    assert.equal(promoted.generation.promotionTransaction, undefined);
  } finally {
    await cleanup(repo, preflightId);
    await fs.rm(path.join(worktreeRoot, retryId), { recursive: true, force: true });
  }
});

test("promotion reconciles a commit completed before transaction state was finalized", async () => {
  const repo = await createRepo();
  const id = runId("promotion-reconcile");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "reconcile") });
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await assert.rejects(promoteGeneration({ repo, runId: id }), /git -C .* commit/);
    await fs.rm(hook);
    const pending = (await statusRun({ repo, runId: id })).state;
    const transaction = pending.generations[0].promotionTransaction;
    await git(
      repo,
      "add",
      "--",
      "Market_making_binary_option.py",
      "results/baselines",
      "results/champion",
      "results/challengers",
      "results/strategy-state.json",
      `results/experiments/${id}.md`,
    );
    await git(repo, "commit", "-qm", "strategy: promote candidate-b");
    const { stdout: committedHead } = await git(repo, "rev-parse", "HEAD");
    const reconciled = await promoteGeneration({ repo, runId: id });
    assert.equal(reconciled.commit, committedHead.trim());
    assert.equal(reconciled.generation.status, "promoted");
    assert.equal(reconciled.generation.promotionTransaction, undefined);
    assert.equal(reconciled.state.baseline.sourceSha256, transaction.sourceSha256);
  } finally {
    await cleanup(repo, id);
  }
});

test("promotion retry refuses to overwrite a user-edited strategy", async () => {
  const repo = await createRepo();
  const id = runId("promotion-retry-edit");
  try {
    await startRun({ repo, runId: id });
    const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
    await populateEvaluations(prepared.generation);
    await archiveGeneration({ repo, runId: id, ...await archiveInputs(repo, "retry-edit") });
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await assert.rejects(promoteGeneration({ repo, runId: id }), /git -C .* commit/);
    await fs.rm(hook);
    await fs.appendFile(path.join(repo, "Market_making_binary_option.py"), "# user edit\n");
    await assert.rejects(promoteGeneration({ repo, runId: id }), /neither the baseline nor the pending winner/);
  } finally {
    await cleanup(repo, id);
  }
});

test("finish retries a report commit without claiming the transaction completed", async () => {
  const repo = await createRepo();
  const id = runId("finish-retry");
  try {
    await startRun({ repo, runId: id, targetPointsHundredths: 800 });
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await assert.rejects(finishRun({ repo, runId: id }), /git -C .* commit/);
    const pending = await statusRun({ repo, runId: id });
    assert.equal(pending.state.status, "complete");
    assert.equal(pending.state.finishTransaction.reason, "target score reached");
    assert.equal((await git(repo, "diff", "--cached", "--quiet").then(() => 0, (error) => error.code)), 0);
    await fs.rm(hook);
    const finished = await finishRun({ repo, runId: id });
    assert.ok(finished.commit);
    assert.equal(finished.state.finishTransaction, undefined);
  } finally {
    await cleanup(repo, id);
  }
});

test("finish reconciles a report commit completed before state finalization", async () => {
  const repo = await createRepo();
  const id = runId("finish-reconcile");
  try {
    await startRun({ repo, runId: id, targetPointsHundredths: 800 });
    const hook = path.join(repo, ".git", "hooks", "pre-commit");
    await fs.writeFile(hook, "#!/bin/sh\nexit 1\n");
    await fs.chmod(hook, 0o755);
    await assert.rejects(finishRun({ repo, runId: id }), /git -C .* commit/);
    await fs.rm(hook);
    await git(repo, "add", "--", `results/experiments/${id}.md`);
    await git(repo, "commit", "-qm", `experiment: finish ${id}`);
    const { stdout: committedHead } = await git(repo, "rev-parse", "HEAD");
    const reconciled = await finishRun({ repo, runId: id });
    assert.equal(reconciled.commit, committedHead.trim());
    assert.equal(reconciled.state.finishTransaction, undefined);
    assert.ok(reconciled.state.commits.includes(committedHead.trim()));
  } finally {
    await cleanup(repo, id);
  }
});

test("finish ignores arbitrary reasons until a configured stop is reached", async () => {
  const repo = await createRepo();
  const id = runId("finish-reason");
  try {
    await startRun({ repo, runId: id });
    await assert.rejects(finishRun({ repo, runId: id, reason: "manual override" }), /No stop condition/);
    const current = await statusRun({ repo, runId: id });
    assert.equal(current.state.status, "active");
    assert.equal(current.state.finishTransaction, undefined);
  } finally {
    await cleanup(repo, id);
  }
});

test("two non-promoting generations do not stop the run", async () => {
  const repo = await createRepo();
  const id = runId("finish");
  try {
    await startRun({ repo, runId: id });
    for (let generationNumber = 0; generationNumber < 2; generationNumber += 1) {
      const prepared = await prepareGeneration({ repo, runId: id, planPath: await writePlan(repo) });
      await archiveGeneration({
        repo,
        runId: id,
        invalidIds: prepared.generation.candidates.map(({ id: candidateId }) => candidateId),
        ...await archiveInputs(repo, `finish-${generationNumber}`),
      });
    }
    assert.equal((await statusRun({ repo, runId: id })).recommendedStop, null);
    await assert.rejects(finishRun({ repo, runId: id }), /No stop condition/);
  } finally {
    await cleanup(repo, id);
  }
});

test("report rendering includes candidate metrics and failure recovery", () => {
  const state = {
    runId: "report-test",
    status: "failed",
    createdAt: "2026-08-18T00:00:00.000Z",
    stopReason: "HackerRank runner or authentication failure",
    startingBaseline: { strategy: "old", summary: baseline().summary },
    baseline: { strategy: "old", summary: baseline().summary },
    scoreTrend: [900],
    generations: [{
      number: 1,
      method: "quote",
      rationale: "Evidence summary.",
      candidates: [{
        id: "candidate-a",
        hypothesis: "Test a tighter quote.",
        implementationPlan: "Reduce width.",
        implementationSummary: "Reduced width by one cent.",
        status: "evaluated",
        evaluation: evaluation("candidate-a", "/tmp/source", "a".repeat(64), 1000),
      }],
      selection: null,
      promotion: null,
      finding: "The candidate improved points.",
      nextGenerationRationale: "Test the same risk control in FOK handling.",
      previousFailure: { kind: "authentication", message: "expired once" },
      failure: { kind: "authentication", message: "authentication expired" },
    }],
  };
  const report = renderReportText(state);
  assert.match(report, /20\/20 passed; 0 bankruptcies; 10\.00\/16\.00 points/);
  assert.match(report, /Finding: The candidate improved points\./);
  assert.match(report, /Next-generation rationale: Test the same risk control/);
  assert.match(report, /Previous failure \(authentication\): expired once/);
  assert.match(report, /auto_extract_result\/login\.sh/);
});
