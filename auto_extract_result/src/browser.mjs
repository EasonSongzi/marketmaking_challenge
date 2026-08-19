import fs from "node:fs/promises";
import { chromium } from "playwright";

import { authenticationStateFile, browserProfileDirectory } from "./config.mjs";

export const headedEnvironmentVariable = "AUTO_EXTRACT_HEADED";

const headlessViewport = { width: 1600, height: 1000 };

function environmentRequestsHeaded(environment) {
  const value = environment[headedEnvironmentVariable];
  if (value === undefined) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

export function headedRequested(options = {}, environment = process.env) {
  return options.headed === true || environmentRequestsHeaded(environment);
}

export function launchOptions(options = {}, environment = process.env) {
  if (headedRequested(options, environment)) {
    return { headless: false, viewport: null };
  }
  return { headless: true, channel: "chromium", viewport: headlessViewport };
}

export function visibleUserAgent(userAgent) {
  return userAgent.replace("HeadlessChrome/", "Chrome/");
}

let cachedUserAgent = null;

async function headlessUserAgent() {
  if (cachedUserAgent === null) {
    const browser = await chromium.launch({ headless: true, channel: "chromium" });
    try {
      const page = await browser.newPage();
      cachedUserAgent = visibleUserAgent(await page.evaluate(() => navigator.userAgent));
    } finally {
      await browser.close();
    }
  }
  return cachedUserAgent;
}

export async function launchBrowser(options = {}) {
  await fs.mkdir(browserProfileDirectory, { recursive: true, mode: 0o700 });
  await fs.chmod(browserProfileDirectory, 0o700);

  const launch = launchOptions(options);
  if (launch.headless) {
    launch.userAgent = await headlessUserAgent();
  }
  return chromium.launchPersistentContext(browserProfileDirectory, launch);
}

export async function saveAuthentication(context, page) {
  const authentication = {
    storageState: await context.storageState({ indexedDB: true }),
    sessionStorage: {
      origin: new URL(page.url()).origin,
      values: await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage))),
    },
  };
  await fs.writeFile(authenticationStateFile, JSON.stringify(authentication), { mode: 0o600 });
  await fs.chmod(authenticationStateFile, 0o600);
}

export async function launchAuthenticatedBrowser(options = {}) {
  const authentication = JSON.parse(await fs.readFile(authenticationStateFile, "utf8"));
  const context = await launchBrowser(options);
  await context.addCookies(authentication.storageState.cookies);
  await context.addInitScript(({ origins, sessionStorage }) => {
    const storedOrigin = origins.find(({ origin }) => origin === window.location.origin);
    for (const { name, value } of storedOrigin?.localStorage ?? []) {
      window.localStorage.setItem(name, value);
    }
    if (window.location.origin === sessionStorage.origin) {
      for (const [key, value] of Object.entries(sessionStorage.values)) {
        window.sessionStorage.setItem(key, value);
      }
    }
  }, {
    origins: authentication.storageState.origins,
    sessionStorage: authentication.sessionStorage,
  });
  return context;
}

export function activePage(context) {
  return context.pages()[0] ?? context.newPage();
}
