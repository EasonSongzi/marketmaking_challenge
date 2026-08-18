import { activePage, launchBrowser, saveAuthentication } from "./browser.mjs";
import { editorAttempts, editorTimeoutMs, questionUrl, runTimeoutMs } from "./config.mjs";
import { readInvitationUrl } from "./invitation.mjs";
import { acquireRunnerLock } from "./lock.mjs";
import { retryEditor, waitForQuestion } from "./question.mjs";

async function main() {
  const invitationUrl = await readInvitationUrl();
  const releaseLock = await acquireRunnerLock("login");
  let context;

  try {
    context = await launchBrowser();
    const page = await activePage(context);
    await page.goto(invitationUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    console.log("The HackerRank invitation flow is open in the dedicated browser.");
    console.log("Complete every redirect, profile field, and agreement yourself.");
    console.log("The script will continue only after the coding question and Run Code button appear.");
    let question = await waitForQuestion(context, questionUrl, runTimeoutMs);
    question = await retryEditor(
      context,
      questionUrl,
      question,
      editorTimeoutMs,
      editorAttempts,
    );
    await saveAuthentication(context, question.page);
    console.log("Onboarding verified. Future runs will open the coding question directly.");
  } finally {
    try {
      await context?.close();
    } finally {
      await releaseLock();
    }
  }
}

main().catch((error) => {
  console.error(`Login setup failed: ${error.message}`);
  process.exitCode = 1;
});
