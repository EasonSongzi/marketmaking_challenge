import assert from "node:assert/strict";
import test from "node:test";

import {
  headedEnvironmentVariable,
  headedRequested,
  launchOptions,
  visibleUserAgent,
} from "../src/browser.mjs";

test("launchOptions defaults unattended runs to headless Chromium", () => {
  assert.deepEqual(launchOptions({}, {}), {
    headless: true,
    channel: "chromium",
    viewport: { width: 1600, height: 1000 },
  });
  assert.deepEqual(launchOptions({ headed: false }, {}), launchOptions({}, {}));
});

test("launchOptions opens a visible browser when headed is requested", () => {
  assert.deepEqual(launchOptions({ headed: true }, {}), { headless: false, viewport: null });
  assert.deepEqual(
    launchOptions({}, { [headedEnvironmentVariable]: "1" }),
    { headless: false, viewport: null },
  );
});

test("headedRequested reads the environment escape hatch", () => {
  assert.equal(headedRequested({}, {}), false);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "" }), false);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "0" }), false);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "false" }), false);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "FALSE" }), false);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "1" }), true);
  assert.equal(headedRequested({}, { [headedEnvironmentVariable]: "true" }), true);
  assert.equal(headedRequested({ headed: true }, { [headedEnvironmentVariable]: "0" }), true);
});

test("visibleUserAgent drops the token HackerRank's CDN blocks", () => {
  const headless = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    + "(KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36";
  const visible = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    + "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
  assert.equal(visibleUserAgent(headless), visible);
  assert.equal(visibleUserAgent(visible), visible);
});
