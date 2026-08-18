import fs from "node:fs";

const argumentsList = process.argv.slice(2);
const option = (name) => argumentsList[argumentsList.indexOf(name) + 1];
const label = option("--label");
const logPath = option("--fixture-log");
const delay = Number(option("--fixture-delay"));
const exitCode = Number(option("--fixture-exit"));

function log(event) {
  fs.appendFileSync(logPath, `${JSON.stringify({ label, event, time: Date.now() })}\n`);
}

log("start");
process.once("SIGTERM", () => {
  log("term");
  process.exit(143);
});
setTimeout(() => {
  log("exit");
  process.exit(exitCode);
}, delay);
