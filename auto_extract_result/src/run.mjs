import fs from "node:fs/promises";
import path from "node:path";

import { launchAuthenticatedBrowser, saveAuthentication } from "./browser.mjs";
import {
  browserProfileDirectory,
  editorAttempts,
  editorTimeoutMs,
  questionUrl,
  runTimeoutMs,
} from "./config.mjs";
import { acquireRunnerLock } from "./lock.mjs";
import { matchesQuestionUrl, retryEditor } from "./question.mjs";
import {
  buildRawReport,
  buildReport,
  casePassed,
  extractCaseNumbers,
  reportTimestamp,
} from "./report.mjs";
import { parseRunOptions, snapshotSource } from "./run-options.mjs";

class AuthenticationError extends Error {}

async function profileExists() {
  try {
    await fs.access(browserProfileDirectory);
    return true;
  } catch {
    return false;
  }
}

async function openQuestion(context, page) {
  await page.goto(questionUrl, { waitUntil: "domcontentloaded" });
  if (!matchesQuestionUrl(page.url(), questionUrl)) {
    throw new AuthenticationError(
      "The saved authentication state did not reach the HackerRank coding question",
    );
  }
  const runButton = page.getByRole("button", { name: "Run Code", exact: true });
  await runButton.waitFor({ state: "visible", timeout: 30_000 });
  let directQuestion = { page, runButton };
  directQuestion = await retryEditor(
    context,
    questionUrl,
    directQuestion,
    editorTimeoutMs,
    editorAttempts,
  );

  await saveAuthentication(context, directQuestion.page);
  return directQuestion;
}

async function replaceEditor(page, source) {
  const editorUpdated = await page.evaluate((expected) => {
    const models = globalThis.monaco.editor.getModels();
    const model = models.find((candidate) => candidate.getValue().includes("class MarketMaker:"))
      ?? (models.length === 1 ? models[0] : null);
    if (model === null) {
      return false;
    }
    model.setValue(expected);
    return model.getValue() === expected;
  }, source);

  if (!editorUpdated) {
    throw new Error("HackerRank Monaco model could not be identified; Run Code was not clicked");
  }

  await page.waitForTimeout(500);
  const editorMatches = await page.evaluate(
    (expected) => globalThis.monaco.editor.getModels()
      .some((model) => model.getValue() === expected),
    source,
  );

  if (!editorMatches) {
    throw new Error("HackerRank editor verification failed; Run Code was not clicked");
  }
}

async function runCases(page, runButton) {
  await runButton.click();
  await page.getByRole("button", { name: "Abort", exact: true }).waitFor({
    state: "visible",
    timeout: 15_000,
  });
  await runButton.waitFor({ state: "visible", timeout: runTimeoutMs });
  await page.getByRole("tab", { name: /^Test Case \d+$/ }).first().waitFor({
    state: "visible",
    timeout: runTimeoutMs,
  });

  const labels = await page.getByRole("tab").allTextContents();
  const caseNumbers = extractCaseNumbers(labels);
  if (caseNumbers.length === 0) {
    throw new Error("HackerRank returned no accessible test-case tabs");
  }

  const cases = [];
  for (const number of caseNumbers) {
    const name = `Test Case ${number}`;
    await page.getByRole("tab", { name, exact: true }).click();
    const text = await page.getByRole("tabpanel", { name, exact: true }).innerText();
    cases.push({ number, text });
  }
  return cases;
}

async function saveReport(cases, request) {
  const createdAt = new Date();
  const filename = `hackerrank-run-${reportTimestamp(createdAt)}`;
  const markdownPath = path.join(request.resultDirectory, `${filename}.md`);
  const jsonPath = path.join(request.resultDirectory, `${filename}.json`);
  const report = buildReport({
    createdAt,
    questionUrl,
    label: request.label,
    sourcePath: request.sourcePath,
    sourceSha256: request.sourceSha256,
    cases,
  });
  const rawReport = buildRawReport({
    createdAt,
    questionUrl,
    label: request.label,
    sourcePath: request.sourcePath,
    sourceSha256: request.sourceSha256,
    cases,
  });

  await fs.mkdir(request.resultDirectory, { recursive: true });
  await fs.writeFile(jsonPath, `${JSON.stringify(rawReport, null, 2)}\n`, { flag: "wx" });
  await fs.writeFile(markdownPath, report, { flag: "wx" });
  return { jsonPath, markdownPath };
}

async function main() {
  const request = await snapshotSource(parseRunOptions(process.argv.slice(2)));
  console.log(
    `Prepared HackerRank run for ${request.label}: ${request.sourcePath} (${request.sourceSha256})`,
  );
  const releaseLock = await acquireRunnerLock(request.label);
  let context;

  try {
    if (!(await profileExists())) {
      throw new AuthenticationError("No saved HackerRank browser profile was found");
    }
    context = await launchAuthenticatedBrowser({ headed: request.headed });
    const page = await context.newPage();
    for (const stalePage of context.pages()) {
      if (stalePage !== page) {
        await stalePage.close();
      }
    }
    const question = await openQuestion(context, page);
    await replaceEditor(question.page, request.source);
    const cases = await runCases(question.page, question.runButton);
    const reportPaths = await saveReport(cases, request);
    const passedCases = cases.filter(({ text }) => casePassed(text)).length;

    console.log(`Saved ${cases.length} test cases to ${reportPaths.markdownPath}`);
    console.log(`Saved raw JSON to ${reportPaths.jsonPath}`);
    console.log(`Passed: ${passedCases}/${cases.length}`);
    if (passedCases !== cases.length) {
      process.exitCode = 2;
    }
  } finally {
    try {
      await context?.close();
    } finally {
      await releaseLock();
    }
  }
}

main().catch((error) => {
  if (error instanceof AuthenticationError) {
    console.error(`${error.message}. Run ./auto_extract_result/login.sh, then try again.`);
  } else {
    console.error(`Automation failed: ${error.message}`);
  }
  process.exitCode = 1;
});
