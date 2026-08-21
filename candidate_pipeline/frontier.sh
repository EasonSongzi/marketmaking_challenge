#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo="${1:-$(pwd)}"
mode="${2:-report}"

cd "$script_dir"
exec node --input-type=module -e '
  import path from "node:path";
  import { retrackStrategy } from "./src/frontier.mjs";
  const repo = path.resolve(process.argv[1]);
  const result = await retrackStrategy(repo, { apply: process.argv[2] === "apply" });
  console.log(JSON.stringify(result.action === "frontier" ? result.frontier : result, null, 2));
' "$repo" "$mode"
