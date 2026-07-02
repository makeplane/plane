# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from typing import Any

from .client import JiraApiClient
from .constants import DEFAULT_ISSUE_TYPE_NAME, ISSUE_FIELDS, SEARCH_PAGE_SIZE
from .rtm_client import build_rtm_client, fetch_rtm_steps_for_issue


def build_default_jql(project_key: str, issue_type_name: str = DEFAULT_ISSUE_TYPE_NAME) -> str:
    escaped_type = issue_type_name.replace('"', '\\"')
    return f'project = "{project_key}" AND issuetype = "{escaped_type}"'


class JiraExtractor:
    def __init__(self, client: JiraApiClient, *, metadata: dict[str, Any] | None = None):
        self.client = client
        self.metadata = metadata or {}
        self.rtm_client = build_rtm_client(self.metadata)

    def resolve_jql(self, *, project_key: str, config: dict[str, Any]) -> str:
        custom_jql = (config.get("jql") or "").strip()
        if custom_jql:
            return custom_jql
        issue_type_name = (config.get("issue_type_name") or DEFAULT_ISSUE_TYPE_NAME).strip()
        return build_default_jql(project_key, issue_type_name)

    def search_all_issues(self, *, jql: str, fields: list[str] | None = None) -> list[dict[str, Any]]:
        requested_fields = fields or ISSUE_FIELDS
        next_page_token: str | None = None
        issues: list[dict[str, Any]] = []

        while True:
            response = self.client.search_issues(
                jql=jql,
                fields=requested_fields,
                next_page_token=next_page_token,
                max_results=SEARCH_PAGE_SIZE,
            )
            batch = response.get("issues") or []
            issues.extend(batch)
            if response.get("isLast", True):
                break
            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break

        return issues

    def extract_testcases(self, *, project_key: str, config: dict[str, Any]) -> dict[str, Any]:
        jql = self.resolve_jql(project_key=project_key, config=config)
        issues = self.search_all_issues(jql=jql)
        self._enrich_testcases_with_steps(issues)
        comments = self._collect_comments(issues)
        return {
            "project_key": project_key,
            "jql": jql,
            "testcases": issues,
            "comments": comments,
        }

    def preview_counts(
        self,
        *,
        project_key: str,
        config: dict[str, Any],
        extracted: dict[str, Any] | None = None,
    ) -> dict[str, int]:
        extracted = extracted or self.extract_testcases(project_key=project_key, config=config)
        issues = extracted["testcases"]
        labels: set[str] = set()
        states: set[str] = set()
        users: set[str] = set()

        for issue in issues:
            fields = issue.get("fields") or {}
            for label in fields.get("labels") or []:
                if label:
                    labels.add(label)
            for component in fields.get("components") or []:
                name = component.get("name")
                if name:
                    labels.add(name)
            status = fields.get("status") or {}
            if status.get("name"):
                states.add(status["name"])
            for person_key in ("assignee", "reporter"):
                person = fields.get(person_key) or {}
                email = person.get("emailAddress")
                if email:
                    users.add(email.lower())

        for comment in extracted["comments"]:
            author = comment.get("author") or {}
            email = author.get("emailAddress")
            if email:
                users.add(email.lower())

        return {
            "total_testcases": len(issues),
            "total_comments": len(extracted["comments"]),
            "total_labels": len(labels),
            "total_states": len(states),
            "total_users": len(users),
        }

    def _enrich_testcases_with_steps(self, issues: list[dict[str, Any]]) -> None:
        if not issues:
            return
        for issue in issues:
            issue_key = issue.get("key")
            if not issue_key:
                continue
            steps = fetch_rtm_steps_for_issue(
                jira_client=self.client,
                rtm_client=self.rtm_client,
                issue_key=str(issue_key),
            )
            if steps:
                issue["rtm_steps"] = steps

    def _collect_comments(self, issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
        comments: list[dict[str, Any]] = []
        for issue in issues:
            issue_key = issue.get("key")
            if not issue_key:
                continue
            start_at = 0
            while True:
                response = self.client.list_comments(issue_key, start_at=start_at, max_results=SEARCH_PAGE_SIZE)
                batch = response.get("comments") or []
                for comment in batch:
                    comments.append(
                        {
                            **comment,
                            "issue_key": issue_key,
                            "issue_id": issue.get("id"),
                        }
                    )
                total = int(response.get("total") or 0)
                start_at += len(batch)
                if start_at >= total or not batch:
                    break
        return comments
