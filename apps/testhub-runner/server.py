# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""HTTP sidecar that runs allowlisted python commands and git clone/fetch."""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from git_sync import GitSyncError, clone_or_fetch, resolve_exec_workdir
from whitelist import validate_argv

WORKDIR = Path(os.environ.get("TESTHUB_WORKDIR", "/opt/testhub/workdir"))
HOST = os.environ.get("TESTHUB_RUNNER_HOST", "0.0.0.0")
PORT = int(os.environ.get("TESTHUB_RUNNER_PORT", "8090"))
MAX_OUTPUT = 2_000_000
UV_ENV_ROOT_DEFAULT = "/opt/testhub/uv-envs"
_SECRET_RE = re.compile(
    r"(?i)((?:password|passwd|secret|token|api[_-]?key|authorization|access_key|private_key)\s*[=:]\s*)(\S+)"
)


def read_git_meta(repo_root: Path) -> dict[str, str | None]:
    git_dir = repo_root / ".git"
    if git_dir.is_file():
        text = git_dir.read_text(encoding="utf-8").strip()
        if text.lower().startswith("gitdir:"):
            raw = text.split(":", 1)[1].strip()
            candidate = Path(raw)
            git_dir = candidate if candidate.is_absolute() else (repo_root / candidate)
    if not git_dir.is_dir():
        return {"branch": None, "sha": None}
    head_file = git_dir / "HEAD"
    if not head_file.is_file():
        return {"branch": None, "sha": None}
    head = head_file.read_text(encoding="utf-8").strip()
    if head.startswith("ref:"):
        ref = head.split(":", 1)[1].strip()
        branch = ref.removeprefix("refs/heads/")
        ref_file = git_dir / ref
        sha = ref_file.read_text(encoding="utf-8").strip() if ref_file.is_file() else None
        if not sha:
            packed = git_dir / "packed-refs"
            if packed.is_file():
                needle = f" {ref}"
                for line in packed.read_text(encoding="utf-8").splitlines():
                    if line.endswith(needle):
                        sha = line.split(" ", 1)[0].strip()
                        break
        return {"branch": branch, "sha": sha}
    return {"branch": None, "sha": head or None}


def _clip(text: str) -> str:
    if len(text) <= MAX_OUTPUT:
        return text
    return text[:MAX_OUTPUT] + "\n… [truncated]"


def _redact(text: str) -> str:
    return _SECRET_RE.sub(r"\1***", text)


def uv_env_root() -> Path:
    raw = os.environ.get("TESTHUB_UV_ENV_ROOT") or UV_ENV_ROOT_DEFAULT
    return Path(raw)


def uv_env_dir(workdir: Path) -> Path:
    """Linux-side venv path for a workdir. Never reuse a Windows bind-mount `.venv`."""
    root = uv_env_root()
    key = str(workdir).replace("\\", "/").rstrip("/") or "/"
    default = str(Path(os.environ.get("TESTHUB_WORKDIR", "/opt/testhub/workdir"))).replace("\\", "/").rstrip("/")
    if key == default:
        return root / "local-mount"
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
    return root / digest


def exec_environment(workdir: Path) -> dict[str, str]:
    env = dict(os.environ)
    env.pop("PYTHONSAFEPATH", None)
    dest = uv_env_dir(workdir)
    dest.mkdir(parents=True, exist_ok=True)
    env["UV_PROJECT_ENVIRONMENT"] = str(dest)
    env.setdefault("UV_LINK_MODE", "copy")
    workdir_s = str(workdir)
    existing = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = workdir_s if not existing else f"{workdir_s}{os.pathsep}{existing}"
    return env


def python_cmd(argv: list[str], workdir: Path) -> list[str]:
    uv = shutil.which("uv")
    if uv:
        return [uv, "run", "--directory", str(workdir), "--no-dev", "--", *argv]
    return argv


def missing_apps_module(workdir: Path, argv: list[str]) -> str | None:
    """Return an error if `python -m apps.*` has no matching files in workdir."""
    if len(argv) < 3 or argv[0] not in {"python", "python3"} or argv[1] != "-m":
        return None
    module = argv[2]
    if not module.startswith("apps.") or ".." in module:
        return None
    parts = module.split(".")
    if not all(part.isidentifier() for part in parts):
        return None
    rel = Path(*parts)
    if (workdir / rel / "__main__.py").is_file() or (workdir / rel).with_suffix(".py").is_file():
        return None
    return (
        f"workdir has no {module} (expected {rel.as_posix()}/__main__.py). "
        "Use a test-platform repo with apps.index_platform (template >= 2.2.0). "
        "Formulation-only spec repos cannot run TestCopilot Sync."
    )


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict | None:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return None
        if not isinstance(data, dict):
            self._json(400, {"error": "invalid json"})
            return None
        return data

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in {"/v1/health", "/health"}:
            exists = WORKDIR.is_dir()
            self._json(
                200,
                {
                    "ok": exists,
                    "workdir": str(WORKDIR),
                    "exists": exists,
                    "git": read_git_meta(WORKDIR) if exists else {"branch": None, "sha": None},
                },
            )
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/v1/exec":
            self._handle_exec()
            return
        if path == "/v1/git-sync":
            self._handle_git_sync()
            return
        self._json(404, {"error": "not found"})

    def _handle_exec(self) -> None:
        data = self._read_json()
        if data is None:
            return
        argv = data.get("argv") or []
        timeout = int(data.get("timeout") or 180)
        timeout = max(5, min(timeout, 900))
        try:
            safe_argv = validate_argv(argv)
            workdir = resolve_exec_workdir(data.get("workdir"), WORKDIR)
        except (ValueError, GitSyncError) as exc:
            self._json(400, {"error": str(exc)})
            return
        if not workdir.is_dir():
            self._json(500, {"error": f"workdir missing: {workdir}"})
            return
        missing = missing_apps_module(workdir, safe_argv)
        if missing:
            self._json(
                200,
                {
                    "exit_code": 1,
                    "stdout": "",
                    "stderr": missing,
                    "git": read_git_meta(workdir),
                },
            )
            return
        cmd = python_cmd(safe_argv, workdir)
        try:
            completed = subprocess.run(  # noqa: S603 — argv is allowlisted
                cmd,
                cwd=str(workdir),
                env=exec_environment(workdir),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired:
            self._json(200, {"exit_code": 124, "stdout": "", "stderr": "timeout", "git": read_git_meta(workdir)})
            return
        except FileNotFoundError as exc:
            self._json(500, {"error": str(exc)})
            return
        self._json(
            200,
            {
                "exit_code": completed.returncode,
                "stdout": _clip(_redact(completed.stdout or "")),
                "stderr": _clip(_redact(completed.stderr or "")),
                "git": read_git_meta(workdir),
            },
        )

    def _handle_git_sync(self) -> None:
        data = self._read_json()
        if data is None:
            return
        timeout = int(data.get("timeout") or 300)
        timeout = max(30, min(timeout, 900))
        try:
            result = clone_or_fetch(
                repo_url=str(data.get("repo_url") or ""),
                branch=str(data.get("branch") or ""),
                workdir=str(data.get("workdir") or ""),
                timeout=timeout,
            )
        except GitSyncError as exc:
            self._json(400, {"error": str(exc)})
            return
        except subprocess.TimeoutExpired:
            self._json(200, {"exit_code": 124, "stdout": "", "stderr": "timeout", "git": {"branch": None, "sha": None}})
            return
        dest = Path(result["workdir"])
        self._json(
            200,
            {
                "exit_code": 0,
                "stdout": _clip(_redact(result.get("stdout") or "")),
                "stderr": "",
                "git": read_git_meta(dest),
            },
        )


def main() -> int:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"testhub-runner listening on {HOST}:{PORT} workdir={WORKDIR}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
