export class EditorTimeoutError extends Error {}

export function matchesQuestionUrl(candidateUrl, questionUrl) {
  const candidate = new URL(candidateUrl);
  const expected = new URL(questionUrl);
  return candidate.origin === expected.origin && candidate.pathname === expected.pathname;
}

export async function findQuestionPage(context, questionUrl) {
  for (const page of context.pages().toReversed()) {
    if (!matchesQuestionUrl(page.url(), questionUrl)) {
      continue;
    }
    const runButton = page.getByRole("button", { name: "Run Code", exact: true });
    if (await runButton.isVisible()) {
      return { page, runButton };
    }
  }
  return null;
}

export async function waitForQuestion(context, questionUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const question = await findQuestionPage(context, questionUrl);
    if (question !== null) {
      return question;
    }
    await context.pages()[0].waitForTimeout(500);
  }
  throw new Error("Timed out waiting for the HackerRank coding question");
}

export async function waitForEditor(page, timeoutMs) {
  try {
    await page.waitForFunction(
      () => {
        if ((globalThis.monaco?.editor?.getModels?.() ?? []).length > 0) {
          return true;
        }
        const editor = document.querySelector('.monaco-editor[role="code"]');
        return editor?.getClientRects().length > 0;
      },
      null,
      { timeout: timeoutMs },
    );
  } catch (error) {
    if (error.name !== "TimeoutError") {
      throw error;
    }
    throw new EditorTimeoutError(
      `HackerRank editor did not initialize within ${timeoutMs / 1000} seconds`,
    );
  }
}

export async function retryEditor(context, questionUrl, question, timeoutMs, maxAttempts) {
  let currentQuestion = question;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await waitForEditor(currentQuestion.page, timeoutMs);
      return currentQuestion;
    } catch (error) {
      if (!(error instanceof EditorTimeoutError)) {
        throw error;
      }
      if (attempt === maxAttempts) {
        throw new EditorTimeoutError(
          `HackerRank editor did not initialize after ${maxAttempts} attempts`,
        );
      }
    }

    console.log(`Editor attempt ${attempt}/${maxAttempts} failed; opening a new question page.`);
    const retryPage = await context.newPage();
    await retryPage.goto(questionUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!matchesQuestionUrl(retryPage.url(), questionUrl)) {
      throw new Error("The saved authentication state did not reach the HackerRank coding question");
    }
    const runButton = retryPage.getByRole("button", { name: "Run Code", exact: true });
    await runButton.waitFor({ state: "visible", timeout: 30_000 });
    await currentQuestion.page.close();
    currentQuestion = { page: retryPage, runButton };
  }
}
