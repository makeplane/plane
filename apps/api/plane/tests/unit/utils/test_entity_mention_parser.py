# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import Issue, Project, State, Workspace
from plane.utils.entity_mention_parser import (
    build_mention_component,
    transform_entity_mentions_in_html,
    transform_entity_mentions_in_text,
)


@pytest.fixture
def workspace(create_user):
    return Workspace.objects.create(
        name="Test Workspace",
        slug="test-workspace",
        owner=create_user,
    )


@pytest.fixture
def project(workspace, create_user):
    return Project.objects.create(
        name="Test Project",
        identifier="ENG",
        workspace=workspace,
        created_by=create_user,
    )


@pytest.fixture
def state(project):
    return State.objects.create(
        name="Todo",
        project=project,
        group="unstarted",
        color="#60646C",
    )


@pytest.fixture
def issue(workspace, project, state, create_user):
    return Issue.objects.create(
        name="Referenced Issue",
        workspace=workspace,
        project=project,
        state=state,
        created_by=create_user,
    )


@pytest.mark.unit
class TestEntityMentionParser:
    @pytest.mark.django_db
    def test_transform_issue_mention_with_type_prefix(self, workspace, project, issue):
        identifier = f"{project.identifier}-{issue.sequence_id}"
        html = f"<p>Blocked by @issue/{identifier}</p>"
        result = transform_entity_mentions_in_html(html, workspace_slug=workspace.slug)

        assert "mention-component" in result
        assert f'entity_identifier="{issue.id}"' in result
        assert 'entity_name="issue"' in result
        assert f'entity_display_name="{identifier}"' in result

    @pytest.mark.django_db
    def test_transform_issue_mention_without_type_prefix(self, workspace, project, issue):
        identifier = f"{project.identifier}-{issue.sequence_id}"
        text = f"See @{identifier} for details"
        result = transform_entity_mentions_in_text(text, workspace_slug=workspace.slug)

        assert "mention-component" in result
        assert f'entity_identifier="{issue.id}"' in result

    @pytest.mark.django_db
    def test_transform_project_mention(self, workspace, project):
        text = "Track in @project/ENG"
        result = transform_entity_mentions_in_text(text, workspace_slug=workspace.slug)

        assert "mention-component" in result
        assert f'entity_identifier="{project.id}"' in result
        assert 'entity_name="project"' in result
        assert 'entity_display_name="ENG"' in result

    @pytest.mark.django_db
    def test_unknown_mention_is_left_unchanged(self, workspace):
        text = "Unknown @issue/ZZZ-999 reference"
        result = transform_entity_mentions_in_text(text, workspace_slug=workspace.slug)
        assert result == text

    @pytest.mark.django_db
    def test_existing_mention_component_is_not_replaced(self, workspace, project, issue):
        existing = build_mention_component(
            entity_name="issue",
            entity_identifier=str(issue.id),
            entity_display_name=f"{project.identifier}-{issue.sequence_id}",
        )
        html = f"<p>Already linked {existing}</p>"
        result = transform_entity_mentions_in_html(html, workspace_slug=workspace.slug)
        assert result.count("mention-component") == 1

    def test_build_mention_component_includes_display_name(self):
        component = build_mention_component(
            entity_name="issue",
            entity_identifier="test-id",
            entity_display_name="ENG-42",
        )
        assert 'entity_display_name="ENG-42"' in component
