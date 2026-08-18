import fs from "node:fs/promises";

import { invitationUrlFile } from "./config.mjs";

const allowedHosts = new Set(["hackerrank.com", "www.hackerrank.com", "track.pstmrk.it"]);

export function validateInvitationUrl(value) {
  const invitationUrl = new URL(value.trim());
  if (invitationUrl.protocol !== "https:" || !allowedHosts.has(invitationUrl.hostname)) {
    throw new Error("The stored invitation link is not an allowed HackerRank email URL");
  }
  return invitationUrl.toString();
}

export async function readInvitationUrl() {
  try {
    return validateInvitationUrl(await fs.readFile(invitationUrlFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("No stored invitation link was found");
    }
    throw error;
  }
}

