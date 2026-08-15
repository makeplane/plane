# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""HTTP sidecar that runs allowlisted python commands in the mounted test repo."""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from whitelist import validate_argv

WORKDIR = Path(os.environ.get("TESTHUB_WORKDIR", "/opt/testhub/workdir"))
HOST = os.environ.get("TESTHUB_RUNNER_HOST", "0.0.0.0")
PORT = int(os.environ.get("TESTHUB_RUNNER_PORT", "8090"))
MAX_OUTPUT = 2_000_000
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


def _python_cmd(argv: list[str]) -> list[str]:
    uv = shutil.which("uv")
    if uv:
        return [uv, "run", "--", *argv]
    return argv


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
        if path != "/v1/exec":
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json(400, {"error": "invalid json"})
            return
        argv = data.get("argv") or []
        timeout = int(data.get("timeout") or 180)
        timeout = max(5, min(timeout, 900))
        try:
            safe_argv = validate_argv(argv)
        except ValueError as exc:
            self._json(400, {"error": str(exc)})
            return
        if not WORKDIR.is_dir():
            self._json(500, {"error": f"workdir missing: {WORKDIR}"})
            return
        cmd = _python_cmd(safe_argv)
        try:
            completed = subprocess.run(  # noqa: S603 — argv is allowlisted
                cmd,
                cwd=str(WORKDIR),
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout,
                check=False,
            )
        except subprocess.TimeoutExpired:
            self._json(200, {"exit_code": 124, "stdout": "", "stderr": "timeout", "git": read_git_meta(WORKDIR)})
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
                "git": read_git_meta(WORKDIR),
            },
        )


def main() -> int:
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"testhub-runner listening on {HOST}:{PORT} workdir={WORKDIR}", flush=True)
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
