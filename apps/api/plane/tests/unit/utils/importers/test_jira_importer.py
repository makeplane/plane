# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from plane.db.models import Issue, Label, Project, State
from plane.utils.importers.jira.client import JiraApiError
from plane.utils.importers.jira.constants import JIRA_EXTERNAL_SOURCE, JIRA_TESTCASE_LABEL
from plane.utils.importers.jira.extract import JiraExtractor, build_default_jql
from plane.utils.importers.jira.load import JiraLoader
from plane.utils.importers.jira.rtm_client import parse_rtm_steps
from plane.utils.importers.jira.transform import JiraTransformer


@pytest.mark.unit
def test_jira_api_error_parses_jira_payload():
    error = JiraApiError(
        "HTTP 400 while calling /search/jql",
        details='{"errorMessages":["The requested API has been removed."]}',
    )
    assert "requested API has been removed" in str(error)


@pytest.mark.unit
def test_build_default_jql():
    assert build_default_jql("PROJ") == 'project = "PROJ" AND issuetype = "Test Case"'


@pytest.mark.unit
def test_jira_transformer_adf_to_html():
    transformer = JiraTransformer()
    html = transformer.adf_to_html(
        {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Hello", "marks": [{"type": "strong"}]}],
                }
            ],
        }
    )
    assert "<strong>Hello</strong>" in html


@pytest.mark.unit
def test_jira_transformer_testcase_description_includes_numbered_steps():
    transformer = JiraTransformer()
    html = transformer.testcase_description_html(
        {
            "key": "SPORT-1",
            "rtm_steps": [
                {"action": "Open login page", "expected": "Login form is visible"},
                {"action": "Enter valid credentials", "expected": "User is signed in"},
            ],
            "fields": {"description": None},
        }
    )
    assert "<h3>Test steps</h3>" in html
    assert "<ol>" in html
    assert "<li>" in html
    assert "Open login page" in html
    assert "Login form is visible" in html


@pytest.mark.unit
def test_parse_rtm_step_groups():
    steps = parse_rtm_steps(
        {
            "stepGroups": [
                {
                    "name": "Main",
                    "steps": [
                        {
                            "stepColumns": [
                                {"ordinal": "1", "value": "Click button"},
                                {"ordinal": "2", "value": "Input value"},
                                {"ordinal": "3", "value": "Button reacts"},
                            ]
                        }
                    ],
                }
            ]
        }
    )
    assert len(steps) == 1
    assert steps[0]["action"] == "Click button"
    assert steps[0]["expected"] == "Button reacts"


@pytest.mark.unit
def test_jira_transformer_testcase_description_html():
    transformer = JiraTransformer()
    html = transformer.testcase_description_html(
        {
            "key": "PROJ-1",
            "fields": {
                "description": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": "Description body"}],
                        }
                    ],
                }
            },
        }
    )
    assert "PROJ-1" in html
    assert "Description body" in html


@pytest.mark.unit
@pytest.mark.django_db
def test_jira_loader_imports_testcases(create_user, workspace):
    project = Project.objects.create(
        name="Jira Import Project",
        identifier="JIP",
        workspace=workspace,
        created_by=create_user,
    )
    State.objects.create(
        name="Todo",
        color="#000000",
        project=project,
        workspace=workspace,
        group="unstarted",
        default=True,
        created_by=create_user,
    )

    importer = MagicMock()
    importer.pk = uuid4()
    loader = JiraLoader(
        importer=importer,
        workspace=workspace,
        project=project,
        actor=create_user,
        config={},
        data={"users": []},
    )

    extracted = {
        "testcases": [
            {
                "id": "10001",
                "key": "PROJ-1",
                "fields": {
                    "summary": "Login test",
                    "status": {"name": "To Do", "statusCategory": {"key": "new"}},
                    "priority": {"name": "High"},
                    "labels": ["smoke"],
                    "components": [],
                    "description": None,
                },
            }
        ],
        "comments": [],
        "warnings": ["Skipped Jira comments for PROJ-1: connection reset"],
    }

    with patch("plane.utils.importers.jira.load.Importer.objects.filter") as importer_filter:
        importer_filter.return_value.update = MagicMock()
        imported_data = loader.run(extracted)

    issue = Issue.objects.get(external_id="PROJ-1", project=project)
    assert issue.name == "Login test"
    assert issue.external_source == JIRA_EXTERNAL_SOURCE
    assert issue.priority == "high"
    assert Label.objects.filter(project=project, name=JIRA_TESTCASE_LABEL).exists()
    assert imported_data["warnings"] == ["Skipped Jira comments for PROJ-1: connection reset"]


@pytest.mark.unit
def test_jira_extractor_paginates_search():
    client = MagicMock()
    client.search_issues.side_effect = [
        {
            "issues": [{"id": "1", "key": "PROJ-1"}],
            "isLast": False,
            "nextPageToken": "page-2",
        },
        {
            "issues": [{"id": "2", "key": "PROJ-2"}],
            "isLast": True,
        },
    ]
    client.list_comments.return_value = {"comments": [], "total": 0}

    extractor = JiraExtractor(client)
    extracted = extractor.extract_testcases(project_key="PROJ", config={})

    assert len(extracted["testcases"]) == 2
    assert client.search_issues.call_count == 2
    assert client.search_issues.call_args_list[1].kwargs["next_page_token"] == "page-2"


@pytest.mark.unit
def test_jira_extractor_skips_comment_connection_errors():
    client = MagicMock()
    client.search_issues.return_value = {
        "issues": [{"id": "1", "key": "PROJ-1"}],
        "isLast": True,
    }
    client.get_issue_properties.return_value = {"keys": []}
    client.list_comments.side_effect = JiraApiError(
        "Connection error while calling /issue/PROJ-1/comment: [Errno 104] Connection reset by peer"
    )

    extractor = JiraExtractor(client)
    extracted = extractor.extract_testcases(project_key="PROJ", config={})

    assert extracted["testcases"] == [{"id": "1", "key": "PROJ-1"}]
    assert extracted["comments"] == []
    assert "Skipped Jira comments for PROJ-1" in extracted["warnings"][0]
