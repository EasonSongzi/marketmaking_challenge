#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

npm ci
npx playwright install chromium

echo "Setup complete. Run ./auto_extract_result/login.sh once before the first automated run."

