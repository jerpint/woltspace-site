#!/bin/bash
# woltspace installer - a lodge for your wolts
#
#   curl -fsSL https://woltspace.com/install.sh | bash              # container (default)
#   curl -fsSL https://woltspace.com/install.sh | bash -s -- --native  # developers
#
# The default needs only Docker Desktop on the host: everything else lives in
# the image. Today that path clones the repo and builds the slim image from the
# two published packages; once the image itself is published it becomes a pull.
# --native is the developer install: uv, node >= 18, tmux and a harness CLI on
# the host, the two published packages installed directly.
set -euo pipefail

MODE=docker
for arg in "$@"; do
  case "$arg" in
    --docker) MODE=docker ;;
    --native) MODE=native ;;
    -h|--help) sed -n '2,10p' "$0" 2>/dev/null || true; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

say()  { printf '  %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1; }

if [ "$MODE" = docker ]; then
  need docker || { echo "error: docker required - https://docs.docker.com/get-docker/"; exit 1; }
  need git    || { echo "error: git required"; exit 1; }
  if [ -d woltspace/.git ]; then
    say "woltspace already cloned - pulling latest..."
    git -C woltspace fetch --quiet --tags
    git -C woltspace merge --ff-only FETCH_HEAD || say "warning: local changes - skipping pull"
  elif [ -d woltspace ]; then
    echo "error: ./woltspace exists but isn't a git repo - remove it and re-run"; exit 1
  else
    git clone --quiet https://github.com/jerpint/woltspace
  fi
  export WOLTSPACE_WOLTS_DIR="${WOLTSPACE_WOLTS_DIR:-${WOLTS_DIR:-$HOME/.woltspace/wolts}}"
  exec "$PWD/woltspace/woltspace" init
fi

# ---- native -----------------------------------------------------------------
missing=0
if ! need uv; then
  missing=1
  say "missing: uv          -> curl -LsSf https://astral.sh/uv/install.sh | sh"
fi
if need node; then
  major=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)
  if [ "${major:-0}" -lt 18 ]; then missing=1; say "node $major is too old  -> need node >= 18 (https://nodejs.org or nvm)"; fi
else
  missing=1
  say "missing: node >= 18  -> https://nodejs.org (or: brew install node)"
fi
if ! need tmux; then
  missing=1
  say "missing: tmux        -> brew install tmux  (apt: sudo apt install tmux)"
fi
if ! need claude && ! need codex && ! need opencode; then
  say "note: no agent harness on PATH yet (claude, codex or opencode). Install one and log in before your first session:"
  say "      npm install -g @anthropic-ai/claude-code && claude"
fi
[ "$missing" -eq 0 ] || { echo; echo "install the missing pieces above, then re-run."; exit 1; }

say "installing woltspace (python) ..."
uv tool install --force 'woltspace[connectors]' >/dev/null
say "installing @woltspace/tui (node) ..."
npm install -g @woltspace/tui >/dev/null 2>&1 || { echo "error: npm install -g @woltspace/tui failed - check npm permissions (nvm avoids sudo)"; exit 1; }

# uv's bin dir has to be on PATH for `woltspace` to resolve in a fresh shell.
uvbin="$(uv tool dir --bin 2>/dev/null || echo "$HOME/.local/bin")"
case ":$PATH:" in *":$uvbin:"*) ;; *)
  say "note: $uvbin is not on your PATH - run: uv tool update-shell   (then open a new shell)"
  export PATH="$uvbin:$PATH" ;;
esac

echo
woltspace --version
woltspace doctor || true
echo
say "next:  woltspace start        # the lodge opens at http://127.0.0.1:7777"
say "       woltspace tui          # the terminal UI"
say "       woltspace status       # is it up, and where"
say "upgrade later: re-run this script, then woltspace stop && woltspace start"
