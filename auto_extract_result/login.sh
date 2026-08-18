#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -d "$script_dir/node_modules/playwright" ]]; then
  echo "Playwright is not installed. Run ./auto_extract_result/setup.sh first." >&2
  exit 1
fi

invite_file="$script_dir/.invite-url"
if [[ "${1:-}" == "--replace" || ! -f "$invite_file" ]]; then
  umask 077
  IFS= read -r -s -p "Paste the HackerRank invitation link, then press Enter: " invite_url
  printf '\n'

  case "$invite_url" in
    https://track.pstmrk.it/*|https://www.hackerrank.com/tests/*|https://hackerrank.com/tests/*)
      ;;
    *)
      echo "That does not look like the HackerRank invitation link from the email." >&2
      exit 1
      ;;
  esac

  printf '%s\n' "$invite_url" > "$invite_file"
  chmod 600 "$invite_file"
  unset invite_url
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./auto_extract_result/login.sh [--replace]" >&2
  exit 1
else
  echo "Reusing the stored HackerRank invitation link."
fi

exec node "$script_dir/src/login.mjs"
