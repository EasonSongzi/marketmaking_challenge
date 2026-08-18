import assert from "node:assert/strict";
import test from "node:test";

import { validateInvitationUrl } from "../src/invitation.mjs";

test("validateInvitationUrl accepts HackerRank and email-tracking invitation URLs", () => {
  assert.equal(
    validateInvitationUrl("https://www.hackerrank.com/tests/example/login?token=hidden"),
    "https://www.hackerrank.com/tests/example/login?token=hidden",
  );
  assert.equal(
    validateInvitationUrl("https://track.pstmrk.it/example"),
    "https://track.pstmrk.it/example",
  );
});

test("validateInvitationUrl rejects unrelated or insecure URLs", () => {
  assert.throws(() => validateInvitationUrl("https://example.com/login"));
  assert.throws(() => validateInvitationUrl("http://www.hackerrank.com/tests/example/login"));
});

