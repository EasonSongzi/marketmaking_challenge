import { fileURLToPath } from "node:url";
import path from "node:path";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));

export const automationDirectory = path.resolve(sourceDirectory, "..");
export const repositoryDirectory = path.resolve(automationDirectory, "..");
export const authenticationStateFile = path.join(automationDirectory, ".auth-state.json");
export const browserProfileDirectory = path.join(automationDirectory, ".browser-profile");
export const invitationUrlFile = path.join(automationDirectory, ".invite-url");
export const resultsDirectory = path.join(automationDirectory, "results");
export const sourceFile = path.join(repositoryDirectory, "Market_making_binary_option.py");

export const questionUrl =
  "https://www.hackerrank.com/test-v2/df07obepma7/questions/g6o4j5oosst";
export const editorAttempts = 10;
export const editorTimeoutMs = 3_000;
export const runTimeoutMs = 10 * 60 * 1000;
