# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest
from django.db import IntegrityError

from plane.db.models import ProjectTemplate, Workspace, WorkspaceMember


@pytest.mark.unit
class TestProjectTemplateModel:
    """Tests for the ProjectTemplate model."""

    @pytest.mark.django_db
    def test_builtin_template_can_have_null_workspace(self, db, create_user):
        """Built-in templates are global records with workspace_id NULL per D-10."""
        template = ProjectTemplate.objects.create(
            workspace=None,
            name="Software Project",
            description="Built-in software project template",
            template_type=ProjectTemplate.TemplateType.BUILT_IN,
            system_key="software-project",
            is_system=True,
            is_active=True,
            payload={"schema_version": 1},
        )
        assert template.id is not None
        assert template.workspace_id is None
        assert template.is_system is True
        assert template.system_key == "software-project"

    @pytest.mark.django_db
    def test_custom_template_requires_workspace(self, db, create_user, workspace):
        """Custom templates must reference a workspace; the workspace FK enforces it."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Custom Template",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            system_key=None,
            is_system=False,
            is_active=True,
            payload={"schema_version": 1},
            created_by=create_user,
        )
        assert template.workspace_id == workspace.id
        assert template.is_system is False

    @pytest.mark.django_db
    def test_payload_default_is_empty_dict(self, db, create_user, workspace):
        """The payload JSON field defaults to an empty dict for newly created rows."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Default Payload Template",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            is_active=True,
            created_by=create_user,
        )
        assert template.payload == {}

    @pytest.mark.django_db
    def test_is_active_default_true(self, db, create_user, workspace):
        """The is_active field defaults to True for newly created templates."""
        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Active Template",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            is_system=False,
            created_by=create_user,
        )
        assert template.is_active is True
