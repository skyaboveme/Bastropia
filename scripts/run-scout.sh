#!/bin/zsh
# Daily runner. macOS launchd calls this; it also works from a terminal.
set -euo pipefail
cd "$(dirname "$0")/.."

NODE="${BASTROPIA_NODE:-$HOME/.nvm/versions/node/v22.23.4/bin/node}"
if [[ ! -x "$NODE" ]]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  NODE="$(nvm which 22.23.4)"
fi

mkdir -p data/scout
echo "---- $(date '+%Y-%m-%d %H:%M:%S %Z') ----" >> data/scout/launchd.log
"$NODE" scripts/event-scout.mjs "$@" 2>&1 | tee -a data/scout/launchd.log
