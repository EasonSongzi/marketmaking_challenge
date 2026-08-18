#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec python3 "$script_dir/src/materialize_tuning.py" \
  --scope-validator "$script_dir/validate-candidate.sh" \
  "$@"
