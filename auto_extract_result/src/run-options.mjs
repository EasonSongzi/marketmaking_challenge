import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { resultsDirectory, sourceFile } from "./config.mjs";

function optionValue(argumentsList, index, option) {
  const value = argumentsList[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

export function parseRunOptions(argumentsList) {
  let label;
  let resultDirectory = resultsDirectory;
  let sourcePath = sourceFile;

  for (let index = 0; index < argumentsList.length; index += 1) {
    const option = argumentsList[index];
    const value = optionValue(argumentsList, index, option);
    if (option === "--source") {
      sourcePath = value;
    } else if (option === "--result-dir") {
      resultDirectory = value;
    } else if (option === "--label") {
      label = value;
    } else {
      throw new Error(`Unknown option: ${option}`);
    }
    index += 1;
  }

  if (!path.isAbsolute(sourcePath)) {
    throw new Error("--source must be an absolute path");
  }
  if (!path.isAbsolute(resultDirectory)) {
    throw new Error("--result-dir must be an absolute path");
  }
  if (label !== undefined && (label.length === 0 || /[\r\n]/.test(label))) {
    throw new Error("--label must be non-empty and stay on one line");
  }

  return {
    label: label ?? (sourcePath === sourceFile ? "main" : path.basename(path.dirname(sourcePath))),
    resultDirectory: path.normalize(resultDirectory),
    sourcePath: path.normalize(sourcePath),
  };
}

export async function snapshotSource(options) {
  const stats = await fs.stat(options.sourcePath);
  if (!stats.isFile()) {
    throw new Error(`Source is not a regular file: ${options.sourcePath}`);
  }
  const source = await fs.readFile(options.sourcePath, "utf8");
  const sourceSha256 = createHash("sha256").update(source).digest("hex");
  return { ...options, source, sourceSha256 };
}
