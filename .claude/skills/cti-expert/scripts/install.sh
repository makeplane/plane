#!/usr/bin/env bash
# CTI Expert — all-in-one tool installer
# Usage: bash scripts/install.sh [--headless] [--go] [--all]
#   --headless  Auto-install Scrapling headless browser (downloads ~200MB Chromium)
#   --go        Install Go-based tools (requires Go 1.21+)
#   --all       Install everything including headless + Go tools
#
# Supported platforms: Linux (apt), macOS (brew), Windows (Git Bash / WSL)

set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Platform detection ────────────────────────────────────────
RAW_OS="$(uname -s)"
case "$RAW_OS" in
  Linux)             OS="linux" ;;
  Darwin)            OS="macos" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
  *)                 OS="unknown" ;;
esac

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH="x86_64" ;;
  aarch64|arm64) ARCH="arm64" ;;
esac

# ── Venv paths differ on Windows ─────────────────────────────
if [[ "$OS" == "windows" ]]; then
  VENV_BIN="$HOME/.claude/skills/.venv/Scripts"
else
  VENV_BIN="$HOME/.claude/skills/.venv/bin"
fi
VENV_PIP="$VENV_BIN/pip"
VENV_PYTHON="$VENV_BIN/python3"
[[ "$OS" == "windows" && ! -f "$VENV_PYTHON" ]] && VENV_PYTHON="$VENV_BIN/python"

OPT_HEADLESS=false
OPT_GO=false
for arg in "$@"; do
  case $arg in
    --headless) OPT_HEADLESS=true ;;
    --go)       OPT_GO=true ;;
    --all)      OPT_HEADLESS=true; OPT_GO=true ;;
  esac
done

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

INSTALLED=0; SKIPPED=0; FAILED=0

log_ok()   { echo -e "  ${GREEN}✔${NC} $1"; INSTALLED=$((INSTALLED+1)); }
log_skip() { echo -e "  ${YELLOW}–${NC} $1 (already installed)"; SKIPPED=$((SKIPPED+1)); }
log_fail() { echo -e "  ${RED}✘${NC} $1 — $2"; FAILED=$((FAILED+1)); }
section()  { echo -e "\n${BOLD}${CYAN}▶ $1${NC}"; }

has()    { command -v "$1" &>/dev/null; }
has_py() { "$VENV_PYTHON" -c "import $1" &>/dev/null 2>&1; }

apt_install() {
  local pkg="$1" cmd="${2:-$1}"
  if has "$cmd"; then
    log_skip "$pkg"
  elif [[ "$OS" == "linux" ]]; then
    if sudo apt-get install -y "$pkg" &>/dev/null 2>&1; then
      log_ok "$pkg"
    else
      log_fail "$pkg" "try: sudo apt-get update && sudo apt install $pkg"
    fi
  elif [[ "$OS" == "macos" ]]; then
    if has brew && brew install "$pkg" &>/dev/null 2>&1; then
      log_ok "$pkg"
    else
      log_fail "$pkg" "try: brew install $pkg"
    fi
  else
    log_fail "$pkg" "Windows: install manually (winget or choco)"
  fi
}

pip_install() {
  local pkg="$1" import_name="${2:-}"
  local check_name="${import_name:-${pkg//-/_}}"
  check_name="${check_name%%\[*}"

  if has_py "$check_name"; then
    log_skip "$pkg"
  elif "$VENV_PIP" install --quiet "$pkg" 2>/dev/null; then
    log_ok "$pkg"
  else
    log_fail "$pkg" "pip install failed"
  fi
}

# Install via pipx (for tools with complex system-level deps)
pipx_install() {
  local tool="$1" cmd="${2:-$1}" pre_pkg="${3:-}"
  if has "$cmd"; then
    log_skip "$tool ($cmd)"
    return
  fi
  if [[ -n "$pre_pkg" ]] && [[ "$OS" == "linux" ]]; then
    sudo apt-get install -y "$pre_pkg" &>/dev/null 2>&1 || true
  fi
  if has pipx; then
    if pipx install "$tool" &>/dev/null 2>&1; then
      log_ok "$tool"
    else
      log_fail "$tool" "pipx install $tool failed"
    fi
  else
    log_fail "$tool" "pipx not found — install with: pip3 install pipx"
  fi
}

go_install() {
  local tool="$1" cmd="$2" mod="$3"
  if has "$cmd"; then
    log_skip "$tool ($cmd)"
  elif go install "$mod" &>/dev/null 2>&1; then
    log_ok "$tool"
  else
    log_fail "$tool" "go install $mod failed"
  fi
}

# Download pre-built binary from GitHub releases
gh_binary_install() {
  local tool="$1" cmd="$2" repo="$3" asset_pattern="$4" install_dir="${5:-/usr/local/bin}"
  if has "$cmd"; then
    log_skip "$tool ($cmd)"
    return
  fi
  if ! has gh; then
    log_fail "$tool" "gh CLI not found — install from https://cli.github.com"
    return
  fi
  local url
  url=$(gh api "repos/$repo/releases/latest" \
    --jq ".assets[] | select(.name | test(\"$asset_pattern\")) | .browser_download_url" 2>/dev/null | head -1)
  if [[ -z "$url" ]]; then
    log_fail "$tool" "no matching release asset (pattern: $asset_pattern)"
    return
  fi
  local tmp; tmp=$(mktemp -d)
  if curl -sL "$url" | tar -xz -C "$tmp" 2>/dev/null; then
    local bin; bin=$(find "$tmp" -name "$cmd" -type f | head -1)
    if [[ -n "$bin" ]]; then
      sudo mv "$bin" "$install_dir/$cmd" 2>/dev/null || mv "$bin" "$HOME/.local/bin/$cmd" 2>/dev/null
      log_ok "$tool"
    else
      log_fail "$tool" "binary '$cmd' not found in archive"
    fi
  else
    log_fail "$tool" "download/extract failed"
  fi
  rm -rf "$tmp"
}

# ── Header ───────────────────────────────────────────────────
echo -e "${BOLD}CTI Expert — Tool Installer${NC}"
echo "Platform: $OS/$ARCH"
echo "Skill:    $SKILL_DIR"
echo "Venv:     $HOME/.claude/skills/.venv"
[[ "$OPT_HEADLESS" == true ]] && echo "Mode:     +headless"
[[ "$OPT_GO" == true ]]       && echo "Mode:     +go"

# ── Venv check ──────────────────────────────────────────────
section "Python environment"
if [[ ! -f "$VENV_PIP" ]]; then
  echo -e "  ${RED}✘${NC} Venv not found at $HOME/.claude/skills/.venv"
  echo "  Run: python3 -m venv ~/.claude/skills/.venv"
  exit 1
fi
echo -e "  ${GREEN}✔${NC} $("$VENV_PYTHON" --version 2>&1)"

# ── System tools ─────────────────────────────────────────────
section "System tools"
apt_install whois whois
apt_install dnsutils dig
apt_install jq jq
apt_install libimage-exiftool-perl exiftool
apt_install poppler-utils pdfinfo
apt_install qpdf qpdf
apt_install mat2 mat2
apt_install pandoc pandoc
# libcairo2-dev needed by maigret on Linux
if [[ "$OS" == "linux" ]] && ! dpkg -l libcairo2-dev &>/dev/null 2>&1; then
  sudo apt-get install -y libcairo2-dev &>/dev/null 2>&1 && log_ok "libcairo2-dev (maigret dep)" || true
fi

# ── Python: core skill deps ───────────────────────────────────
section "Python: core skill requirements"
REQ="$SKILL_DIR/scripts/requirements.txt"
if [[ -f "$REQ" ]]; then
  if "$VENV_PIP" install --quiet -r "$REQ" 2>/dev/null; then
    log_ok "requirements.txt (python-docx, matplotlib, networkx, numpy, whoisdomain, scrapling)"
  else
    log_fail "requirements.txt" "pip install -r failed"
  fi
else
  log_fail "requirements.txt" "not found at $REQ"
fi

# ── Python: OSINT tools ───────────────────────────────────────
section "Python: OSINT tools"
pipx_install maigret maigret libcairo2-dev   # needs cairo; pipx isolates its env
pip_install  sherlock-project sherlock
pipx_install blackbird blackbird 2to3        # needs 2to3 build tool; correct PyPI name (not blackbird-osint)
pip_install  holehe holehe
pip_install  h8mail h8mail
pip_install  theHarvester theHarvester
pip_install  trufflehog trufflehog
pip_install  waymore waymore
pip_install  cloudscraper cloudscraper
pip_install  xeuledoc xeuledoc
pip_install  agentflow agentflow            # correct PyPI name (not agentflow-py)

# msftrecon — not on PyPI, install via git
if "$VENV_PYTHON" -c "import msftrecon" &>/dev/null 2>&1; then
  log_skip "msftrecon"
else
  if "$VENV_PIP" install --quiet "git+https://github.com/Arcanum-Sec/msftrecon.git" 2>/dev/null; then
    log_ok "msftrecon (M365/Azure tenant recon)"
  else
    log_fail "msftrecon" "pip install from git failed"
  fi
fi

# sharetrace — not on PyPI, no setup.py; clone + install deps + register via .pth
SHARETRACE_REPO="https://github.com/7onez/sharetrace.git"
SHARETRACE_DIR="$HOME/.claude/skills/cti-expert/vendor/sharetrace"

# Fast-skip: already importable AND vendor clone origin matches current fork
if "$VENV_PYTHON" -c "import sharetrace" &>/dev/null 2>&1 && \
   [[ -d "$SHARETRACE_DIR/.git" ]] && \
   [[ "$(git -C "$SHARETRACE_DIR" remote get-url origin 2>/dev/null)" == "$SHARETRACE_REPO" ]]; then
  log_skip "sharetrace"
else
  mkdir -p "$(dirname "$SHARETRACE_DIR")"
  if [[ -d "$SHARETRACE_DIR/.git" ]]; then
    CURRENT_ORIGIN="$(git -C "$SHARETRACE_DIR" remote get-url origin 2>/dev/null)"
    if [[ "$CURRENT_ORIGIN" == "$SHARETRACE_REPO" ]]; then
      git -C "$SHARETRACE_DIR" pull --quiet 2>/dev/null
    else
      echo "  sharetrace: origin mismatch ($CURRENT_ORIGIN) — re-cloning from 7onez fork"
      rm -rf "$SHARETRACE_DIR" 2>/dev/null
      git clone --quiet --depth 1 "$SHARETRACE_REPO" "$SHARETRACE_DIR" 2>/dev/null
    fi
  else
    rm -rf "$SHARETRACE_DIR" 2>/dev/null
    git clone --quiet --depth 1 "$SHARETRACE_REPO" "$SHARETRACE_DIR" 2>/dev/null
  fi
  if [[ -d "$SHARETRACE_DIR/sharetrace" ]] && \
     "$VENV_PIP" install --quiet -r "$SHARETRACE_DIR/requirements.txt" 2>/dev/null; then
    SITE_PKG="$("$VENV_PYTHON" -c "import site; print(site.getsitepackages()[0])" 2>/dev/null)"
    if [[ -n "$SITE_PKG" ]]; then
      echo "$SHARETRACE_DIR" > "$SITE_PKG/sharetrace.pth"
      log_ok "sharetrace (share link identity extraction, 11 platforms)"
    else
      log_fail "sharetrace" "could not resolve venv site-packages"
    fi
  else
    log_fail "sharetrace" "clone or pip install -r requirements.txt failed"
  fi
fi

# ── Python: Scrapling headless (optional) ─────────────────────
section "Python: Scrapling headless browser"
if "$VENV_PYTHON" -c "from scrapling.fetchers import StealthyFetcher" &>/dev/null 2>&1; then
  log_skip "Scrapling[fetchers] + headless browser"
elif [[ "$OPT_HEADLESS" == true ]]; then
  echo "  Installing Scrapling[fetchers] + Chromium (~200MB)..."
  if "$VENV_PIP" install --quiet "scrapling[fetchers]" 2>/dev/null && \
     scrapling install &>/dev/null 2>&1; then
    log_ok "Scrapling headless (StealthyFetcher + DynamicFetcher)"
  else
    log_fail "Scrapling headless" "install failed — check network/disk"
  fi
else
  echo -e "  ${YELLOW}–${NC} Scrapling headless skipped (add --headless, downloads ~200MB)"
fi

# ── Go tools (optional) ────────────────────────────────────────
section "Go tools"
if [[ "$OPT_GO" == true ]]; then
  if ! has go; then
    log_fail "Go tools" "Go not found — install from https://go.dev/dl/ then re-run with --go"
  else
    echo -e "  ${GREEN}✔${NC} $(go version)"
    GOBIN="${GOPATH:-$HOME/go}/bin"
    [[ ":$PATH:" != *":$GOBIN:"* ]] && echo -e "  ${YELLOW}!${NC} Add to shell: export PATH=\"\$PATH:$GOBIN\""

    # PhoneInfoga: go module path broken — use pre-built binary instead
    local_os="Linux"; [[ "$OS" == "macos" ]] && local_os="Darwin"; [[ "$OS" == "windows" ]] && local_os="Windows"
    gh_binary_install "PhoneInfoga" "phoneinfoga" \
      "sundowndev/phoneinfoga" \
      "${local_os}_${ARCH}\\.tar\\.gz" \
      "$GOBIN"

    go_install "Subfinder"  subfinder  "github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"
    go_install "Amass"      amass      "github.com/owasp-amass/amass/v4/...@master"
    go_install "GAU"        gau        "github.com/lc/gau/v2/cmd/gau@latest"
    go_install "Gitleaks"   gitleaks   "github.com/gitleaks/gitleaks@latest"
    go_install "httpx"      httpx      "github.com/projectdiscovery/httpx/cmd/httpx@latest"
  fi
else
  echo -e "  ${YELLOW}–${NC} Skipped (add --go to install Go tools, requires Go 1.21+)"
fi

# ── Manual-only tools ─────────────────────────────────────────
section "Manual-install tools (not automated)"
echo "  ASN:        bash <(curl -sL https://raw.githubusercontent.com/nitefood/asn/master/asn)"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}─────────────────────────────────────────${NC}"
echo -e "${GREEN}✔ Installed: $INSTALLED${NC}  ${YELLOW}– Skipped: $SKIPPED${NC}  ${RED}✘ Failed: $FAILED${NC}"
[[ $FAILED -gt 0 ]] && echo -e "${RED}Some tools failed. Check errors above.${NC}"
echo ""
