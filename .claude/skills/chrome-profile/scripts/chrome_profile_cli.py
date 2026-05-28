#!/usr/bin/env python3
"""chrome-profile: Open a URL in a specific Chrome profile via the running Chrome.

Profile selection is resolved AT RUNTIME from Chrome's Local State by matching the
Google account email (or a substring of the display name) — never by the brittle
`Profile <N>` directory name (which differs per machine and per profile-creation order).

The opened URL gets a `#cdp-profile=<key>` fragment so an agent driving the browser
through chrome-devtools-mcp can find the resulting tab in `list_pages` without
ambiguity.

Config resolution order (first found wins):
  1. $XDG_CONFIG_HOME/chrome-profile/profiles.json   (per-machine override)
  2. <skill>/profiles.json                                (shared, ships with the skill)
"""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
SKILL_CONFIG = SKILL_DIR / "profiles.json"
LOCAL_CONFIG = (
    Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config"))
    / "chrome-profile"
    / "profiles.json"
)
DEFAULT_CDP_PORT = 9222
SAFE_URL_SCHEMES = {"http", "https", "file"}


def redact_email(value: str | None) -> str:
    if not value:
        return ""
    if "@" not in value:
        return value
    local, domain = value.split("@", 1)
    if not local:
        return f"***@{domain}"
    return f"{local[:1]}***@{domain}"


def profile_label(info: dict, show_emails: bool = False) -> str:
    email = info.get("user_name", "")
    return email if show_emails else redact_email(email)


def sanitized_spec(spec: dict) -> dict:
    clean = dict(spec)
    if "email" in clean:
        clean["email"] = redact_email(str(clean["email"]))
    return clean


def validate_url(url: str) -> None:
    if not url or url.startswith("-"):
        sys.exit("chrome-profile: URL must not be empty or start with '-'.")
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme and parsed.scheme not in SAFE_URL_SCHEMES:
        allowed = ", ".join(sorted(SAFE_URL_SCHEMES))
        sys.exit(f"chrome-profile: unsupported URL scheme '{parsed.scheme}'. Allowed: {allowed}.")


def add_profile_anchor(url: str, key: str) -> str:
    marker = f"cdp-profile={urllib.parse.quote(key, safe='')}"
    return f"{url}&{marker}" if "#" in url else f"{url}#{marker}"


def chrome_binary() -> str:
    sys_name = platform.system()
    if sys_name == "Darwin":
        return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if sys_name == "Linux":
        for candidate in ("google-chrome", "google-chrome-stable", "chromium"):
            path = shutil.which(candidate)
            if path:
                return path
        sys.exit("chrome-profile: could not find google-chrome on PATH")
    if sys_name == "Windows":
        for env in ("ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"):
            base = os.environ.get(env)
            if not base:
                continue
            candidate = Path(base) / "Google" / "Chrome" / "Application" / "chrome.exe"
            if candidate.exists():
                return str(candidate)
        sys.exit("chrome-profile: could not find chrome.exe in standard locations")
    sys.exit(f"chrome-profile: unsupported OS: {sys_name}")


def chrome_user_data_dir() -> Path:
    sys_name = platform.system()
    home = Path.home()
    if sys_name == "Darwin":
        return home / "Library" / "Application Support" / "Google" / "Chrome"
    if sys_name == "Linux":
        return home / ".config" / "google-chrome"
    if sys_name == "Windows":
        return Path(os.environ["LOCALAPPDATA"]) / "Google" / "Chrome" / "User Data"
    sys.exit(f"chrome-profile: unsupported OS: {sys_name}")


def load_local_state() -> dict:
    p = chrome_user_data_dir() / "Local State"
    if not p.exists():
        sys.exit(f"chrome-profile: Local State not found at {p}")
    return json.loads(p.read_text())


def info_cache() -> dict:
    return load_local_state().get("profile", {}).get("info_cache", {})


def load_config() -> tuple[dict, Path]:
    if LOCAL_CONFIG.exists():
        return json.loads(LOCAL_CONFIG.read_text()), LOCAL_CONFIG
    if SKILL_CONFIG.exists():
        return json.loads(SKILL_CONFIG.read_text()), SKILL_CONFIG
    sys.exit(
        "chrome-profile: no profiles.json found.\n"
        f"  Expected: {LOCAL_CONFIG}  (per-machine override)\n"
        f"  or:       {SKILL_CONFIG}  (shared)\n"
        "Run `chrome-profile setup` to generate one."
    )


def save_config(cfg: dict, target: Path) -> Path:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(cfg, indent=2) + "\n")
    return target


def _probe_cdp_endpoint(port: int = DEFAULT_CDP_PORT) -> dict | None:
    """Return Chrome DevTools /json/version payload, or None when not CDP."""
    url = f"http://127.0.0.1:{port}/json/version"
    try:
        with urllib.request.urlopen(url, timeout=2) as response:
            if response.status != 200:
                return None
            payload = json.loads(response.read().decode("utf-8"))
            if payload.get("Browser") and payload.get("webSocketDebuggerUrl"):
                return payload
    except (OSError, urllib.error.URLError, json.JSONDecodeError):
        return None
    return None


def _probe_port_listener(port: int = DEFAULT_CDP_PORT) -> dict:
    """Best-effort local listener inspection without failing on missing tools."""
    if platform.system() == "Windows":
        return {"listening": False, "command": None, "pid": None}
    try:
        result = subprocess.run(
            ["lsof", "-nP", f"-iTCP:{port}", "-sTCP:LISTEN"],
            check=False,
            capture_output=True,
            text=True,
            timeout=3,
        )
    except (OSError, subprocess.SubprocessError):
        return {"listening": False, "command": None, "pid": None}
    lines = [line for line in result.stdout.splitlines() if line.strip()]
    if len(lines) < 2:
        return {"listening": False, "command": None, "pid": None}
    parts = lines[1].split()
    return {
        "listening": True,
        "command": parts[0] if parts else None,
        "pid": parts[1] if len(parts) > 1 else None,
    }


def _read_json_if_exists(path: Path) -> dict | None:
    try:
        if path.exists():
            return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None
    return None


def _extract_chrome_devtools_browser_url(config: dict | None) -> str | None:
    if not isinstance(config, dict):
        return None
    servers = config.get("mcpServers") or {}
    if not isinstance(servers, dict):
        return None
    server = servers.get("chrome-devtools") or servers.get("chrome_devtools")
    if not isinstance(server, dict):
        return None
    args = server.get("args") or []
    if not isinstance(args, list):
        return None
    for idx, arg in enumerate(args):
        if arg == "--browserUrl" and idx + 1 < len(args):
            return str(args[idx + 1])
        if isinstance(arg, str) and arg.startswith("--browserUrl="):
            return arg.split("=", 1)[1]
    return None


def _has_claude_in_chrome(config: dict | None) -> bool:
    if not isinstance(config, dict):
        return False
    servers = config.get("mcpServers") or {}
    if not isinstance(servers, dict):
        return False
    return "claude-in-chrome" in servers


def _load_mcp_config_summary() -> dict:
    """Find enough MCP config to guide setup; never expose full config."""
    candidates = []
    env_path = os.environ.get("MCP_CONFIG_PATH")
    if env_path:
        candidates.append(Path(env_path))
    candidates.extend([
        Path.cwd() / ".claude" / ".mcp.json",
        Path.home() / ".claude.json",
    ])
    for path in candidates:
        config = _read_json_if_exists(path)
        if not config:
            continue
        browser_url = _extract_chrome_devtools_browser_url(config)
        claude_in_chrome = _has_claude_in_chrome(config)
        if browser_url:
            return {
                "path": str(path),
                "chrome_devtools_browser_url": browser_url,
                "claude_in_chrome_configured": claude_in_chrome,
            }
        servers = config.get("mcpServers") if isinstance(config, dict) else {}
        if isinstance(servers, dict) and ("chrome-devtools" in servers or claude_in_chrome):
            return {
                "path": str(path),
                "chrome_devtools_browser_url": None,
                "claude_in_chrome_configured": claude_in_chrome,
            }
    return {"path": None, "chrome_devtools_browser_url": None, "claude_in_chrome_configured": False}


def _browser_url_port(browser_url: str | None) -> int | None:
    if not browser_url:
        return None
    try:
        parsed = urllib.parse.urlparse(browser_url)
        if parsed.scheme not in {"http", "https"}:
            return None
        return parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError:
        return None


def _probe_claude_in_chrome(listener: dict, cdp_payload: dict | None) -> str:
    """Heuristic: Chrome owns 9222 but it is not CDP, matching claude-in-chrome."""
    if cdp_payload:
        return "unknown"
    command = (listener.get("command") or "").lower()
    if listener.get("listening") and "chrome" in command:
        return "likely"
    return "unknown"


def detect_bridge_state(
    cdp_probe_fn=_probe_cdp_endpoint,
    port_listener_fn=_probe_port_listener,
    mcp_config_fn=_load_mcp_config_summary,
    extension_probe_fn=None,
) -> dict:
    """Detect whether an agent can read tabs opened by this CLI."""
    port = DEFAULT_CDP_PORT
    cdp_payload = cdp_probe_fn(port)
    listener = port_listener_fn(port)
    config = mcp_config_fn()
    browser_url = config.get("chrome_devtools_browser_url") if isinstance(config, dict) else None
    configured_port = _browser_url_port(browser_url)
    configured_cdp_payload = (
        cdp_payload
        if configured_port == port
        else cdp_probe_fn(configured_port)
        if configured_port
        else None
    )
    extension_state = (
        extension_probe_fn()
        if extension_probe_fn
        else _probe_claude_in_chrome(listener, cdp_payload)
    )
    claude_in_chrome_configured = bool(
        config.get("claude_in_chrome_configured") if isinstance(config, dict) else False
    )
    non_cdp_squatter = bool(listener.get("listening") and not cdp_payload)

    state = {
        "ok": False,
        "bridge": "none",
        "port": port,
        "cdp_endpoint": {
            "ok": bool(cdp_payload),
            "non_cdp_squatter": non_cdp_squatter,
            "browser": cdp_payload.get("Browser") if cdp_payload else None,
        },
        "port_listener": listener,
        "chrome_devtools_mcp": {
            "browser_url_configured": browser_url,
            "browser_url_port": configured_port,
            "browser_url_cdp_ok": bool(configured_cdp_payload),
            "config_path": config.get("path") if isinstance(config, dict) else None,
        },
        "claude_in_chrome": {
            "state": extension_state,
            "configured": claude_in_chrome_configured,
        },
        "remediation": [],
    }

    if browser_url and configured_cdp_payload:
        state["ok"] = True
        state["bridge"] = "chrome_devtools_mcp_attached"
        return state
    if extension_state == "likely" and claude_in_chrome_configured:
        state["ok"] = True
        state["bridge"] = "claude_in_chrome"
        return state
    if browser_url and not configured_cdp_payload:
        state["bridge"] = "chrome_devtools_mcp_unreachable"
        state["remediation"].append(
            f"chrome-devtools-mcp is configured for {browser_url}, but that endpoint did not return Chrome DevTools JSON."
        )
        return state
    if extension_state == "likely" and not claude_in_chrome_configured:
        state["bridge"] = "claude_in_chrome_likely_without_mcp_config"
        state["remediation"].append(
            "Chrome appears to own port 9222 without CDP, but no claude-in-chrome MCP config was found. Sign in to the extension and restart the agent session."
        )
        return state
    if cdp_payload:
        state["bridge"] = "cdp_endpoint_without_mcp_config"
        state["remediation"].append(
            "Add chrome-devtools-mcp with --browserUrl http://127.0.0.1:9222 to .claude/.mcp.json, then restart the agent session."
        )
        return state

    state["remediation"].extend([
        "Install and sign in to the claude-in-chrome extension, then restart the agent session.",
        "Or relaunch Chrome with --remote-debugging-port=9222 and configure chrome-devtools-mcp with --browserUrl http://127.0.0.1:9222.",
        "After setup, run `chrome-profile doctor` again before opening profile-scoped tabs.",
    ])
    return state


def detect_bridge_state_default() -> dict:
    return detect_bridge_state()


def format_bridge_report(state: dict, json_mode: bool = False) -> str:
    if json_mode:
        return json.dumps(state, indent=2, sort_keys=True)
    lines = [
        f"bridge={state.get('bridge')}",
        f"ok={str(state.get('ok')).lower()}",
        f"cdp_endpoint.ok={str(state.get('cdp_endpoint', {}).get('ok')).lower()}",
        f"cdp_endpoint.non_cdp_squatter={str(state.get('cdp_endpoint', {}).get('non_cdp_squatter')).lower()}",
    ]
    browser_url = state.get("chrome_devtools_mcp", {}).get("browser_url_configured")
    if browser_url:
        lines.append(f"chrome_devtools_mcp.browser_url_configured={browser_url}")
    remediation = state.get("remediation") or []
    if remediation:
        lines.append("remediation:")
        lines.extend(f"  - {item}" for item in remediation)
    return "\n".join(lines)


def cmd_doctor(args) -> None:
    state = detect_bridge_state_default()
    print(format_bridge_report(state, json_mode=args.json))
    if not state.get("ok"):
        sys.exit(1)


def resolve_profile_dir(key: str, spec: dict, cache: dict) -> tuple[str, dict]:
    """Resolve a profile spec to the current machine's Chrome profile dir.

    spec can be:
      {"email": "x@y.z"}             — exact match on info_cache.<dir>.user_name
      {"name_contains": "Cognition"} — case-insensitive substring of info_cache.<dir>.name
      {"dir": "Profile 17"}          — explicit dir name (escape hatch; NOT portable)
    """
    email = (spec.get("email") or "").strip().lower()
    name_sub = (spec.get("name_contains") or "").strip().lower()
    explicit_dir = (spec.get("dir") or "").strip()

    if explicit_dir:
        info = cache.get(explicit_dir)
        if not info:
            sys.exit(
                f"chrome-profile: key '{key}' has dir='{explicit_dir}' but Chrome has no such profile here."
            )
        return explicit_dir, info

    matches = []
    for d, info in cache.items():
        if email and (info.get("user_name") or "").lower() == email:
            matches.append((d, info))
            continue
        if name_sub and name_sub in (info.get("name") or "").lower():
            matches.append((d, info))

    if not matches:
        sys.exit(
            f"chrome-profile: key '{key}' could not be resolved on this machine.\n"
            f"  Spec: {sanitized_spec(spec)}\n"
            f"  Run `chrome-profile discover` to see available profiles.\n"
            f"  If this profile does not exist yet, create it in Chrome first."
        )
    if len(matches) > 1:
        dirs = ", ".join(d for d, _ in matches)
        print(
            f"[!] key '{key}' matches multiple profiles ({dirs}); using first match.",
            file=sys.stderr,
        )
    return matches[0]


def cmd_list(args) -> None:
    cfg, source = load_config()
    cache = info_cache()
    profiles = cfg.get("profiles", {})
    if not profiles:
        print(f"(no profile keys configured in {source})")
        return
    print(f"# config: {source}")
    width = max(len(k) for k in profiles)
    for key in sorted(profiles):
        spec = profiles[key]
        try:
            d, info = resolve_profile_dir(key, spec, cache)
            status = f"-> {d:<14}  {profile_label(info, args.show_emails):<40}  ({info.get('name','')})"
        except SystemExit:
            status = "-> UNRESOLVED on this machine"
        print(f"  {key:<{width}}  {status}")


def _launch_chrome_tab(key: str, url: str, show_emails: bool = False) -> tuple[str, dict]:
    validate_url(url)
    cfg, _ = load_config()
    profiles = cfg.get("profiles", {})
    if key not in profiles:
        sys.exit(
            f"chrome-profile: unknown key '{key}'.\n"
            f"Known: {', '.join(sorted(profiles)) or '(none)'}"
    )
    profile_dir, info = resolve_profile_dir(key, profiles[key], info_cache())
    anchored = add_profile_anchor(url, key)
    subprocess.Popen(
        [chrome_binary(), f"--profile-directory={profile_dir}", anchored],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    print(f"[+] {key} -> {profile_dir} ({profile_label(info, show_emails)})")
    print(f"    opened: {anchored}")
    print(f"    find:   list_pages -> tab whose url contains 'cdp-profile={key}'")
    return profile_dir, info


def cmd_open(args) -> None:
    if not getattr(args, "force", False):
        state = detect_bridge_state_default()
        if not state.get("ok"):
            print(format_bridge_report(state), file=sys.stderr)
            print(
                "chrome-profile: no readable browser bridge detected. "
                "Run `chrome-profile doctor` for setup guidance, or pass --force to open for the human only.",
                file=sys.stderr,
            )
            sys.exit(1)
    _launch_chrome_tab(args.key, args.url, show_emails=getattr(args, "show_emails", False))


def cmd_discover(args) -> None:
    cache = info_cache()
    print(f"# Chrome profiles in {chrome_user_data_dir()}")
    for d in sorted(cache):
        info = cache[d]
        print(f"  {d:<14}  {info.get('name',''):<40}  {profile_label(info, args.show_emails)}")


def derive_key(info: dict) -> str:
    name = info.get("name", "")
    m = re.search(r"\[([a-z0-9_-]+)\]", name, re.IGNORECASE)
    if m:
        return m.group(1).lower()
    email = info.get("user_name", "")
    if email and "@" in email:
        local = email.split("@", 1)[0]
        return re.sub(r"[^a-z0-9]+", "-", local.lower()).strip("-")
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def cmd_setup(args) -> None:
    cache = info_cache()
    if not cache:
        sys.exit("chrome-profile: no profiles found in Local State")

    # Default: per-machine config (survives `npx skills update`).
    # --shared writes inside the skill dir; useful only when you control the skill
    # source (e.g. a forked repo or a personal sync setup).
    target = SKILL_CONFIG if args.shared else LOCAL_CONFIG

    existing = {}
    if target.exists():
        existing = (json.loads(target.read_text()) or {}).get("profiles", {})
    existing_by_email = {
        (v.get("email") or "").lower(): k for k, v in existing.items() if v.get("email")
    }

    proposed: list[tuple[str, dict, dict]] = []
    used_keys: set[str] = set()
    for d in sorted(cache):
        info = cache[d]
        email = (info.get("user_name") or "").lower()
        if email and email in existing_by_email:
            key = existing_by_email[email]
        else:
            key = derive_key(info)
            base = key
            i = 2
            while key in used_keys:
                key = f"{base}-{i}"
                i += 1
        used_keys.add(key)

        # Prefer email (portable); fall back to name_contains; dir only as last resort.
        if email:
            spec = {"email": info["user_name"]}
        elif info.get("name"):
            spec = {"name_contains": info["name"]}
        else:
            spec = {"dir": d}
        proposed.append((key, spec, info))

    if args.yes or args.non_interactive:
        chosen = {k: spec for k, spec, _ in proposed}
        path = save_config({"profiles": chosen}, target)
        print(f"[+] Wrote {len(chosen)} profile mapping(s) to {path}")
        return

    print(f"[*] Found {len(cache)} Chrome profile(s) at {chrome_user_data_dir()}")
    print(f"[*] Writing to {target}\n")
    print("[*] Per profile: press <Enter> to keep auto key, type a new key, '-' to skip, 'q' to abort.\n")

    chosen: dict[str, dict] = {}
    for key, spec, info in proposed:
        label = f"{info.get('name','')[:32]:<32}  {profile_label(info, args.show_emails)}"
        try:
            answer = input(f"  [{key:<14}]  {label}\n  key> ").strip()
        except EOFError:
            answer = ""
        if answer == "q":
            print("aborted; no changes written.")
            return
        if answer == "-":
            print(f"  (skipped {profile_label(info, args.show_emails)})")
            continue
        new_key = answer or key
        if new_key in chosen:
            print(f"  ! key '{new_key}' already used; auto-renaming")
            i = 2
            while f"{new_key}-{i}" in chosen:
                i += 1
            new_key = f"{new_key}-{i}"
        chosen[new_key] = spec
        print()

    path = save_config({"profiles": chosen}, target)
    print(f"\n[+] Wrote {len(chosen)} profile mapping(s) to {path}")


def main(argv=None) -> None:
    ap = argparse.ArgumentParser(prog="chrome-profile", description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd")

    p_open = sub.add_parser("open", help="open URL in a profile (default if KEY URL given)")
    p_open.add_argument("key"); p_open.add_argument("url")
    p_open.add_argument("--force", action="store_true", help="open even when no readable MCP/browser bridge is detected")
    p_open.add_argument("--show-emails", action="store_true", help="show full Chrome profile email addresses in CLI output")
    p_open.set_defaults(func=cmd_open)

    p_setup = sub.add_parser("setup", help="discover profiles and write profiles.json")
    p_setup.add_argument("--yes", "-y", action="store_true", help="accept all auto-derived keys")
    p_setup.add_argument("--non-interactive", action="store_true")
    p_setup.add_argument("--show-emails", action="store_true", help="show full Chrome profile email addresses while choosing keys")
    p_setup.add_argument(
        "--shared",
        action="store_true",
        help=f"write to {SKILL_CONFIG} (shared with the skill) instead of the per-machine config. WARNING: `npx skills update` overwrites the skill dir, which wipes a shared profiles.json. Prefer the default (per-machine) location unless you fork this repo.",
    )
    p_setup.set_defaults(func=cmd_setup)

    p_list = sub.add_parser("list", help="show configured keys and what they resolve to on this machine")
    p_list.add_argument("--show-emails", action="store_true", help="show full Chrome profile email addresses")
    p_list.set_defaults(func=cmd_list)

    p_disc = sub.add_parser("discover", help="show all Chrome profiles on this machine (no config needed)")
    p_disc.add_argument("--show-emails", action="store_true", help="show full Chrome profile email addresses")
    p_disc.set_defaults(func=cmd_discover)

    p_doctor = sub.add_parser("doctor", help="check whether an agent can read opened Chrome tabs")
    p_doctor.add_argument("--json", action="store_true", help="print machine-readable bridge state")
    p_doctor.set_defaults(func=cmd_doctor)

    argv = sys.argv[1:] if argv is None else argv
    if argv and argv[0] not in {"open", "setup", "list", "discover", "doctor", "-h", "--help"}:
        argv = ["open", *argv]
    args = ap.parse_args(argv)
    if not hasattr(args, "func"):
        ap.print_help()
        sys.exit(0)
    args.func(args)


if __name__ == "__main__":
    main()
