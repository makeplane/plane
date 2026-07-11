# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Thin HTTP client for the Cloudflare Worker that runs the contracts
pipeline. Django never talks to the Cloudflare account API directly — the
Worker exposes a narrow, single-purpose trigger surface protected by a shared
secret (same pattern as LIVE_SERVER_SECRET_KEY for apps/live).
"""

import requests
from django.conf import settings


class WorkerTriggerError(Exception):
    pass


def _post(path, payload, timeout=30):
    base_url = settings.CF_WORKER_TRIGGER_URL
    secret = settings.CF_WORKER_TRIGGER_SECRET
    if not base_url or not secret:
        raise WorkerTriggerError("CF_WORKER_TRIGGER_URL / CF_WORKER_TRIGGER_SECRET are not configured")

    response = requests.post(
        f"{base_url.rstrip('/')}{path}",
        json=payload,
        headers={"X-Trigger-Secret": secret},
        timeout=timeout,
    )
    if response.status_code >= 400:
        raise WorkerTriggerError(f"Worker trigger failed ({response.status_code}): {response.text[:500]}")
    return response.json()


def trigger_contract_pipeline(job_id, contract_id, workspace_id, asset_id, mode="EXTRACT_FULL", retry_options=None):
    """Starts a ContractPipelineWorkflow instance; returns the workflow instance id."""
    data = _post(
        "/trigger/extract",
        {
            "job_id": str(job_id),
            "contract_id": str(contract_id),
            "workspace_id": str(workspace_id),
            "asset_id": str(asset_id),
            "mode": mode,
            "retry_options": retry_options or {},
        },
    )
    return data.get("workflow_instance_id")


def _get(path):
    base_url = settings.CF_WORKER_TRIGGER_URL
    secret = settings.CF_WORKER_TRIGGER_SECRET
    if not base_url or not secret:
        raise WorkerTriggerError("CF_WORKER_TRIGGER_URL / CF_WORKER_TRIGGER_SECRET are not configured")

    response = requests.get(
        f"{base_url.rstrip('/')}{path}",
        headers={"X-Trigger-Secret": secret},
        timeout=15,
    )
    if response.status_code >= 400:
        raise WorkerTriggerError(f"Worker request failed ({response.status_code}): {response.text[:500]}")
    return response.json()


def get_chat_models():
    """Env-declared chat models for the UI picker: {models, default_model}."""
    return _get("/models")


def chat_with_contracts(workspace_id, mode, query, history, contract_id=None, model=None):
    """Synchronous chat turn against the Worker. `mode` is GENERAL (RAG over
    vectorized chunks) or CONTRACT (full extracted text as system context).
    Returns {answer, sources: [{contract_id, title, file_name, asset_id, similarity}]}.
    """
    return _post(
        "/chat",
        {
            "workspace_id": str(workspace_id),
            "mode": mode,
            "query": query,
            "history": history,
            "contract_id": str(contract_id) if contract_id else None,
            "model": model or None,
        },
        timeout=90,
    )


def trigger_contract_query(job_id, query_id, workspace_id, user_query):
    """Starts a ContractQueryWorkflow instance; returns the workflow instance id."""
    data = _post(
        "/trigger/query",
        {
            "job_id": str(job_id),
            "query_id": str(query_id),
            "workspace_id": str(workspace_id),
            "user_query": user_query,
        },
    )
    return data.get("workflow_instance_id")
