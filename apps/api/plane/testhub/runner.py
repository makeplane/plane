# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests
from django.conf import settings


@dataclass
class RunnerResult:
    exit_code: int
    stdout: str
    stderr: str
    git: dict[str, Any]


class RunnerError(RuntimeError):
    pass


def runner_health() -> dict[str, Any]:
    url = f"{_base_url()}/v1/health"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise RunnerError(f"testhub runner unreachable: {exc}") from exc


def exec_job(
    *,
    job_id: str,
    argv: list[str],
    timeout: int = 300,
    workdir: str | None = None,
) -> RunnerResult:
    url = f"{_base_url()}/v1/exec"
    payload: dict[str, Any] = {"job_id": job_id, "argv": argv, "timeout": timeout}
    if workdir:
        payload["workdir"] = workdir
    try:
        response = requests.post(
            url,
            json=payload,
            timeout=timeout + 30,
        )
    except requests.RequestException as exc:
        raise RunnerError(f"testhub runner unreachable: {exc}") from exc
    if response.status_code >= 400:
        detail = response.text[:500]
        raise RunnerError(f"testhub runner rejected exec ({response.status_code}): {detail}")
    body = response.json()
    return RunnerResult(
        exit_code=int(body.get("exit_code", 1)),
        stdout=str(body.get("stdout") or ""),
        stderr=str(body.get("stderr") or ""),
        git=body.get("git") or {},
    )


def git_sync(
    *,
    repo_url: str,
    branch: str,
    workdir: str,
    timeout: int = 300,
) -> RunnerResult:
    url = f"{_base_url()}/v1/git-sync"
    try:
        response = requests.post(
            url,
            json={"repo_url": repo_url, "branch": branch, "workdir": workdir, "timeout": timeout},
            timeout=timeout + 30,
        )
    except requests.RequestException as exc:
        raise RunnerError(f"testhub runner unreachable: {exc}") from exc
    if response.status_code >= 400:
        detail = response.text[:500]
        try:
            body = response.json()
            if isinstance(body, dict) and body.get("error"):
                detail = str(body["error"])
        except ValueError:
            pass
        raise RunnerError(f"testhub runner rejected git-sync ({response.status_code}): {detail}")
    body = response.json()
    if body.get("error"):
        raise RunnerError(str(body.get("error")))
    return RunnerResult(
        exit_code=int(body.get("exit_code", 1)),
        stdout=str(body.get("stdout") or ""),
        stderr=str(body.get("stderr") or ""),
        git=body.get("git") or {},
    )


def _base_url() -> str:
    return str(getattr(settings, "TESTHUB_RUNNER_URL", "http://testhub-runner:8090")).rstrip("/")
