# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from typing import Any

from .client import EvaApiClient
from .constants import (
    ATTACHMENT_FIELDS,
    CHUNK_SIZE,
    COMMENT_FIELDS,
    DOCUMENT_FIELDS,
    TASK_FIELDS,
    TESTCASE_FIELDS,
)


class EvaExtractor:
    def __init__(self, client: EvaApiClient):
        self.client = client

    def list_projects(self) -> list[dict[str, Any]]:
        return self.client.call(
            "CmfProject.list",
            {"fields": ["id", "code", "name", "cache_status_type", "workflow_id"]},
        )

    def list_users(self) -> list[dict[str, Any]]:
        return self.client.call("CmfPerson.list", {"fields": ["id", "login", "name", "code"]})

    def list_tasks(self, project_id: str) -> list[dict[str, Any]]:
        return self.client.call(
            "CmfTask.list",
            {
                "filter": [["parent_id", "==", project_id], ["system", "==", False]],
                "fields": TASK_FIELDS,
                "include_archived": "true",
            },
        )

    def list_comments(self, task_ids: list[str]) -> list[dict[str, Any]]:
        return self._batch_fetch("CmfComment.list", task_ids, {"fields": COMMENT_FIELDS})

    def list_attachments(self, task_ids: list[str]) -> list[dict[str, Any]]:
        return self._batch_fetch("CmfAttachment.list", task_ids, {"fields": ATTACHMENT_FIELDS})

    def list_documents(self, project_id: str) -> list[dict[str, Any]]:
        try:
            return self.client.call(
                "CmfDocument.list",
                {
                    "filter": [["parent_id", "==", project_id]],
                    "fields": DOCUMENT_FIELDS,
                    "include_archived": "true",
                },
            )
        except Exception:
            return []

    def list_testcases(self, project_id: str) -> list[dict[str, Any]]:
        try:
            return self.client.call(
                "CmfTestcase.list",
                {
                    "filter": [["parent_id", "==", project_id], ["system", "==", False]],
                    "fields": TESTCASE_FIELDS,
                    "include_archived": "true",
                },
            )
        except Exception:
            return []

    def extract_project(self, project_id: str) -> dict[str, Any]:
        tasks = self.list_tasks(project_id)
        task_ids = [task["id"] for task in tasks if task.get("id")]
        comments = self.list_comments(task_ids)
        attachments = self.list_attachments(task_ids)
        documents = self.list_documents(project_id)
        testcases = self.list_testcases(project_id)

        return {
            "project_id": project_id,
            "tasks": tasks,
            "comments": comments,
            "attachments": attachments,
            "documents": documents,
            "testcases": testcases,
        }

    def preview_counts(self, project_id: str) -> dict[str, int]:
        extracted = self.extract_project(project_id)
        tasks = extracted["tasks"]
        tags = {tag.get("name") for task in tasks for tag in (task.get("tags") or []) if tag.get("name")}
        users = set()
        for task in tasks:
            for key in ("responsible", "cmf_author"):
                person = task.get(key) or {}
                if person.get("login"):
                    users.add(person["login"])
        for comment in extracted["comments"]:
            author = comment.get("cmf_author") or {}
            if author.get("login"):
                users.add(author["login"])

        return {
            "total_tasks": len(tasks),
            "total_comments": len(extracted["comments"]),
            "total_attachments": len(extracted["attachments"]),
            "total_documents": len(extracted["documents"]),
            "total_testcases": len(extracted["testcases"]),
            "total_labels": len(tags),
            "total_users": len(users),
            "total_states": len({task.get("cache_status_type") for task in tasks if task.get("cache_status_type")}),
            "total_modules": len(
                {
                    item.get("code")
                    for task in tasks
                    for item in (task.get("fix_versions") or [])
                    if item.get("code")
                }
            ),
            "total_cycles": len(
                {item.get("code") for task in tasks for item in (task.get("lists") or []) if item.get("code")}
            ),
        }

    def _batch_fetch(self, method: str, parent_ids: list[str], kwargs: dict[str, Any]) -> list[dict[str, Any]]:
        if not parent_ids:
            return []

        results: list[dict[str, Any]] = []
        for index in range(0, len(parent_ids), CHUNK_SIZE):
            chunk = parent_ids[index : index + CHUNK_SIZE]
            base_filter = kwargs.get("filter", [])
            chunk_filter = ["parent_id", "IN", chunk]
            merged_filter = [base_filter, chunk_filter] if base_filter else chunk_filter
            rows = self.client.call(method, {**kwargs, "filter": merged_filter})
            results.extend(rows or [])
        return results
