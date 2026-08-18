import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseOptions(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 2) {
    const option = argumentsList[index];
    const value = argumentsList[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`${option ?? "Option"} requires a value`);
    }
    if (option === "--source") {
      options.sourcePath = value;
    } else if (option === "--result-dir") {
      options.resultDirectory = value;
    } else if (option === "--label") {
      options.label = value;
    } else if (option === "--baseline") {
      options.baselinePath = value;
    } else {
      throw new Error(`Unknown option: ${option}`);
    }
  }
  for (const [name, value] of Object.entries(options)) {
    if (name !== "label" && !path.isAbsolute(value)) {
      throw new Error(`${name} must be an absolute path`);
    }
  }
  if (
    !options.sourcePath
    || !options.resultDirectory
    || !options.label
    || !options.baselinePath
    || /[\r\n]/.test(options.label)
  ) {
    throw new Error("--source, --result-dir, --label, and --baseline are required");
  }
  return options;
}

function runProcess(command, argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal !== null) {
        reject(new Error(`${command} exited after signal ${signal}`));
      } else {
        resolve(code ?? 1);
      }
    });
  });
}

export async function runCandidate(options, dependencies = {}) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const moduleDirectory = path.dirname(scriptDirectory);
  const runnerPath = dependencies.runnerPath
    ?? path.join(moduleDirectory, "..", "auto_extract_result", "run.sh");
  const evaluatorPath = dependencies.evaluatorPath ?? path.join(moduleDirectory, "evaluate.sh");
  const execute = dependencies.execute ?? runProcess;
  const runnerStatus = await execute(runnerPath, [
    "--source", options.sourcePath,
    "--result-dir", options.resultDirectory,
    "--label", options.label,
  ]);
  if (runnerStatus === 1) {
    return 1;
  }
  if (runnerStatus !== 0 && runnerStatus !== 2) {
    throw new Error(`Runner returned unsupported status ${runnerStatus}`);
  }
  return execute(evaluatorPath, [
    "--run-dir", options.resultDirectory,
    "--baseline", options.baselinePath,
  ]);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  process.exitCode = await runCandidate(options);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Candidate run failed: ${error.message}`);
    process.exitCode = 1;
  });
}
