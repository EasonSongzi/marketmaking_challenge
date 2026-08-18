import fs from "node:fs/promises";
import { chromium } from "playwright";

import { authenticationStateFile, browserProfileDirectory } from "./config.mjs";

export async function launchBrowser() {
  await fs.mkdir(browserProfileDirectory, { recursive: true, mode: 0o700 });
  await fs.chmod(browserProfileDirectory, 0o700);

  return chromium.launchPersistentContext(browserProfileDirectory, {
    headless: false,
    viewport: null,
  });
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

export async function launchAuthenticatedBrowser() {
  const authentication = JSON.parse(await fs.readFile(authenticationStateFile, "utf8"));
  const context = await launchBrowser();
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
  return { browser: context.browser(), context };
}

export function activePage(context) {
  return context.pages()[0] ?? context.newPage();
}
