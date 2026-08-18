#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -d "$script_dir/node_modules/playwright" ]]; then
  echo "Playwright is not installed. Run ./auto_extract_result/setup.sh first." >&2
  exit 1
fi

exec node "$script_dir/src/run.mjs"

