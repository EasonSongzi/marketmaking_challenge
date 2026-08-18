import assert from "node:assert/strict";
import test from "node:test";

import { EditorTimeoutError, matchesQuestionUrl, retryEditor } from "../src/question.mjs";

const questionUrl = "https://www.hackerrank.com/test-v2/example/questions/question-id";

test("matchesQuestionUrl accepts the exact question with harmless URL state", () => {
  assert.equal(matchesQuestionUrl(questionUrl, questionUrl), true);
  assert.equal(matchesQuestionUrl(`${questionUrl}?view=editor#results`, questionUrl), true);
});

test("matchesQuestionUrl rejects login and onboarding pages", () => {
  assert.equal(
    matchesQuestionUrl("https://www.hackerrank.com/test-v2/example/login", questionUrl),
    false,
  );
  assert.equal(
    matchesQuestionUrl("https://www.hackerrank.com/test-v2/example/instructions", questionUrl),
    false,
  );
});

function editorPage(fails) {
  return {
    closed: false,
    async close() {
      this.closed = true;
    },
    getByRole() {
      return { waitFor: async () => {} };
    },
    async goto() {},
    async waitForFunction() {
      if (fails) {
        const error = new Error("timed out");
        error.name = "TimeoutError";
        throw error;
      }
    },
    url() {
      return questionUrl;
    },
  };
}

test("retryEditor returns the first editor that initializes", async () => {
  const pages = [editorPage(true), editorPage(true), editorPage(false)];
  let nextPage = 1;
  const context = { newPage: async () => pages[nextPage++] };
  const question = await retryEditor(
    context,
    questionUrl,
    { page: pages[0], runButton: {} },
    3_000,
    10,
  );

  assert.equal(question.page, pages[2]);
  assert.equal(nextPage, 3);
  assert.equal(pages[0].closed, true);
  assert.equal(pages[1].closed, true);
});

test("retryEditor fails only after all ten attempts time out", async () => {
  const pages = Array.from({ length: 10 }, () => editorPage(true));
  let nextPage = 1;
  const context = { newPage: async () => pages[nextPage++] };

  await assert.rejects(
    retryEditor(
      context,
      questionUrl,
      { page: pages[0], runButton: {} },
      3_000,
      10,
    ),
    (error) => error instanceof EditorTimeoutError
      && error.message === "HackerRank editor did not initialize after 10 attempts",
  );
  assert.equal(nextPage, 10);
});
