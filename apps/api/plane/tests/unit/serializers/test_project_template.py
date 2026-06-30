# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import (
    ProjectTemplateSerializer,
    ProjectTemplateWriteSerializer,
)
from plane.app.serializers.project_template import (
    PROJECT_TEMPLATE_SCHEMA_VERSION,
    validate_project_template_payload,
)
from plane.db.models import ProjectTemplate, Workspace, WorkspaceMember


def _valid_payload():
    """Return a minimal valid template payload fixture."""
    return {
        "schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION,
        "states": [
            {
                "state_key": "backlog",
                "name": "Backlog",
                "color": "#60646C",
                "group": "backlog",
                "sequence": 15000,
                "default": True,
            },
            {
                "state_key": "todo",
                "name": "Todo",
                "color": "#3F76FF",
                "group": "unstarted",
                "sequence": 25000,
            },
        ],
        "labels": [
            {
                "label_key": "bug",
                "name": "Bug",
                "color": "#F59E0B",
                "order": 100,
            }
        ],
        "modules": [
            {
                "module_key": "core",
                "name": "Core",
                "status": "planned",
            }
        ],
        "cycles": [
            {
                "cycle_key": "sprint-1",
                "name": "Sprint 1",
            }
        ],
        "starter_issues": [
            {
                "name": "First issue",
                "state_key": "backlog",
                "label_keys": ["bug"],
                "module_key": "core",
                "cycle_key": "sprint-1",
                "priority": "medium",
            }
        ],
    }


@pytest.mark.unit
class TestProjectTemplateSerializer:
    """Tests for the ProjectTemplate payload validation serializer."""

    @pytest.mark.django_db
    def test_payload_helper_accepts_minimal_valid_payload(self):
        """The standalone payload validator accepts a minimal but complete payload."""
        payload = _valid_payload()
        # No exception should be raised
        result = validate_project_template_payload(payload)
        assert result == payload

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_schema_version(self):
        """The validator rejects payloads without the required schema_version field."""
        payload = _valid_payload()
        payload.pop("schema_version")
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_unsupported_schema_version(self):
        """The validator rejects payloads with an unsupported schema_version."""
        payload = _valid_payload()
        payload["schema_version"] = PROJECT_TEMPLATE_SCHEMA_VERSION + 1
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_state_keys(self):
        """Duplicate stable state_key values are rejected by D-03/D-04."""
        payload = _valid_payload()
        payload["states"].append(dict(payload["states"][0]))
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_state_defaults(self):
        """More than one default=true state entry is rejected."""
        payload = _valid_payload()
        payload["states"].append(
            {
                "state_key": "todo-2",
                "name": "Todo 2",
                "color": "#3F76FF",
                "group": "unstarted",
                "sequence": 35000,
                "default": True,
            }
        )
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_invalid_state_group(self):
        """State group values not in the allowed enum are rejected."""
        payload = _valid_payload()
        payload["states"][0]["group"] = "not-a-group"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_invalid_state_color(self):
        """State color values that are not a #RRGGBB hex string are rejected."""
        payload = _valid_payload()
        payload["states"][0]["color"] = "blue"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_dangling_starter_issue_state(self):
        """Starter issues referencing unknown state_key values are rejected."""
        payload = _valid_payload()
        payload["starter_issues"][0]["state_key"] = "missing-state"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_dangling_starter_issue_label(self):
        """Starter issues referencing unknown label_keys are rejected."""
        payload = _valid_payload()
        payload["starter_issues"][0]["label_keys"] = ["not-a-real-label"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_invalid_priority(self):
        """Starter issue priority values outside the allowed enum are rejected."""
        payload = _valid_payload()
        payload["starter_issues"][0]["priority"] = "doom"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_accepts_optional_module_date_metadata(self):
        """Optional integer start/target/duration metadata is accepted when well formed."""
        payload = _valid_payload()
        payload["modules"][0]["start_offset_days"] = 0
        payload["modules"][0]["target_offset_days"] = 7
        payload["modules"][0]["duration_days"] = 7
        payload["cycles"][0]["start_offset_days"] = 0
        payload["cycles"][0]["target_offset_days"] = 14
        payload["cycles"][0]["duration_days"] = 14
        result = validate_project_template_payload(payload)
        assert result["modules"][0]["duration_days"] == 7

    @pytest.mark.django_db
    def test_payload_helper_rejects_non_integer_date_metadata(self):
        """Non-integer date metadata values are rejected during Phase 1 validation."""
        payload = _valid_payload()
        payload["modules"][0]["start_offset_days"] = "soon"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_inverted_date_metadata(self):
        """start_offset_days must not exceed target_offset_days when both are set."""
        payload = _valid_payload()
        payload["cycles"][0]["start_offset_days"] = 14
        payload["cycles"][0]["target_offset_days"] = 7
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_write_serializer_creates_template_with_valid_payload(self, db, create_user, workspace):
        """The write serializer persists a custom template for the given workspace."""
        payload = _valid_payload()
        serializer = ProjectTemplateWriteSerializer(
            data={
                "name": "Custom Template",
                "description": "A custom template",
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": payload,
            },
            context={"workspace_id": workspace.id, "request_user": create_user},
        )
        assert serializer.is_valid(), serializer.errors
        instance = serializer.save()
        assert instance.workspace_id == workspace.id
        assert instance.system_key is None
        assert instance.is_system is False
        assert instance.payload["schema_version"] == PROJECT_TEMPLATE_SCHEMA_VERSION

    @pytest.mark.django_db
    def test_read_serializer_returns_repr_fields(self, db, create_user, workspace):
        """The read serializer exposes the fields the frontend will need for the catalog."""
        from plane.app.serializers import ProjectTemplateSerializer

        template = ProjectTemplate.objects.create(
            workspace=workspace,
            name="Custom Template",
            description="desc",
            template_type=ProjectTemplate.TemplateType.CUSTOM,
            system_key=None,
            is_system=False,
            is_active=True,
            payload=_valid_payload(),
            created_by=create_user,
        )
        data = ProjectTemplateSerializer(template).data
        for key in (
            "id",
            "name",
            "description",
            "template_type",
            "system_key",
            "is_system",
            "is_active",
            "payload",
            "workspace",
            "created_at",
            "updated_at",
        ):
            assert key in data
