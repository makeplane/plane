#!/bin/bash
# uninstall.sh -- remove the chrome-profile shim and (optionally) the user config.
#
# What this removes:
#   - $PREFIX/bin/chrome-profile (the shim install.sh wrote)
#   - $XDG_CONFIG_HOME/chrome-profile/profiles.json (only with --purge)
#
# What this does NOT remove:
#   - The skill files themselves (under ~/.agents/skills/chrome-profile/ or
#     wherever npx skills add put them). Use `npx skills remove chrome-profile`
#     for that.
#   - Chrome data, cookies, or any profile.
#
# Usage:
#   ./uninstall.sh           remove shim only (config preserved)
#   ./uninstall.sh --purge   also delete profiles.json from $XDG_CONFIG_HOME
set -euo pipefail

PREFIX="${PREFIX:-$HOME/.local}"
BIN_DIR="$PREFIX/bin"
SHIM="$BIN_DIR/chrome-profile"
PURGE=0
for arg in "$@"; do
  case "$arg" in
    --purge|-p) PURGE=1 ;;
    -h|--help)
      sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "uninstall.sh: unknown flag '$arg'" >&2; exit 2 ;;
  esac
done

if [[ -e "$SHIM" || -L "$SHIM" ]]; then
  rm -f "$SHIM"
  echo "[+] removed shim: $SHIM"
else
  echo "[=] no shim at $SHIM (already removed?)"
fi

CFG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CFG_DIR="$CFG_HOME/chrome-profile"
if [[ $PURGE -eq 1 ]]; then
  if [[ -d "$CFG_DIR" ]]; then
    rm -rf "$CFG_DIR"
    echo "[+] purged config: $CFG_DIR"
  else
    echo "[=] no config dir at $CFG_DIR"
  fi
else
  if [[ -d "$CFG_DIR" ]]; then
    echo "[*] preserved config: $CFG_DIR  (use --purge to remove)"
  fi
fi

echo ""
echo "[*] To also remove the skill files, run:"
echo "    npx skills remove chrome-profile"
