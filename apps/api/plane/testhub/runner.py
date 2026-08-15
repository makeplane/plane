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
) -> RunnerResult:
    url = f"{_base_url()}/v1/exec"
    try:
        response = requests.post(
            url,
            json={"job_id": job_id, "argv": argv, "timeout": timeout},
            timeout=timeout + 30,
        )
    except requests.RequestException as exc:
        raise RunnerError(f"testhub runner unreachable: {exc}") from exc
    if response.status_code >= 400:
        detail = response.text[:500]
        raise RunnerError(f"testhub runner rejected exec ({response.status_code}): {detail}")
    payload = response.json()
    return RunnerResult(
        exit_code=int(payload.get("exit_code", 1)),
        stdout=str(payload.get("stdout") or ""),
        stderr=str(payload.get("stderr") or ""),
        git=payload.get("git") or {},
    )


def _base_url() -> str:
    return str(getattr(settings, "TESTHUB_RUNNER_URL", "http://testhub-runner:8090")).rstrip("/")
