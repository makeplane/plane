# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers import (
    ProjectTemplateDuplicateSerializer,
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

    # ---------------------------------------------------------------
    # CUST-04 hardening: state validation edge cases
    # ---------------------------------------------------------------
    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_state_names(self):
        """State validation rejects duplicate state names (CUST-04)."""
        payload = _valid_payload()
        payload["states"][1]["name"] = payload["states"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_default_state(self):
        """State validation rejects payloads with zero default states (CUST-04)."""
        payload = _valid_payload()
        payload["states"][0]["default"] = False
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_state_name(self):
        """State validation rejects entries without a name (CUST-04)."""
        payload = _valid_payload()
        del payload["states"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_state_sequences(self):
        """State validation rejects duplicate sequence/order values (CUST-04)."""
        payload = _valid_payload()
        payload["states"][1]["sequence"] = payload["states"][0]["sequence"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    # ---------------------------------------------------------------
    # CUST-05 hardening: label validation edge cases
    # ---------------------------------------------------------------
    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_label_keys(self):
        """Label validation rejects duplicate label_key values (CUST-05)."""
        payload = _valid_payload()
        payload["labels"].append(dict(payload["labels"][0]))
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_label_names(self):
        """Label validation rejects duplicate label names (CUST-05)."""
        payload = _valid_payload()
        payload["labels"].append(
            {
                "label_key": "feature",
                "name": payload["labels"][0]["name"],
                "color": "#3F76FF",
                "order": 200,
            }
        )
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_invalid_label_color(self):
        """Label validation rejects non-hex color values (CUST-05)."""
        payload = _valid_payload()
        payload["labels"][0]["color"] = "red"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_label_orders(self):
        """Label validation rejects duplicate order values (CUST-05)."""
        payload = _valid_payload()
        payload["labels"].append(
            {
                "label_key": "feature",
                "name": "Feature",
                "color": "#3F76FF",
                "order": payload["labels"][0]["order"],
            }
        )
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_label_name(self):
        """Label validation rejects entries without a name (CUST-05)."""
        payload = _valid_payload()
        del payload["labels"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    # ---------------------------------------------------------------
    # CUST-06 hardening: module validation edge cases
    # ---------------------------------------------------------------
    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_module_keys(self):
        """Module validation rejects duplicate module_key values (CUST-06)."""
        payload = _valid_payload()
        payload["modules"].append(dict(payload["modules"][0]))
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_invalid_module_status(self):
        """Module validation rejects status values outside the allowed enum (CUST-06)."""
        payload = _valid_payload()
        payload["modules"][0]["status"] = "not-a-status"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_module_name(self):
        """Module validation rejects entries without a name (CUST-06)."""
        payload = _valid_payload()
        del payload["modules"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_module_non_integer_date_metadata(self):
        """Module validation rejects string/float date metadata (CUST-06)."""
        payload = _valid_payload()
        payload["modules"][0]["start_offset_days"] = 1.5
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_module_boolean_date_metadata(self):
        """Module validation rejects bool values for date metadata (CUST-06)."""
        payload = _valid_payload()
        payload["modules"][0]["duration_days"] = True
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_module_inverted_date_metadata(self):
        """Module validation rejects start_offset_days > target_offset_days (CUST-06)."""
        payload = _valid_payload()
        payload["modules"][0]["start_offset_days"] = 30
        payload["modules"][0]["target_offset_days"] = 7
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    # ---------------------------------------------------------------
    # CUST-07 hardening: cycle validation edge cases
    # ---------------------------------------------------------------
    @pytest.mark.django_db
    def test_payload_helper_rejects_duplicate_cycle_keys(self):
        """Cycle validation rejects duplicate cycle_key values (CUST-07)."""
        payload = _valid_payload()
        payload["cycles"].append(dict(payload["cycles"][0]))
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_missing_cycle_name(self):
        """Cycle validation rejects entries without a name (CUST-07)."""
        payload = _valid_payload()
        del payload["cycles"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_cycle_non_integer_date_metadata(self):
        """Cycle validation rejects string/float date metadata (CUST-07)."""
        payload = _valid_payload()
        payload["cycles"][0]["start_offset_days"] = "soon"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_cycle_boolean_date_metadata(self):
        """Cycle validation rejects bool values for date metadata (CUST-07)."""
        payload = _valid_payload()
        payload["cycles"][0]["duration_days"] = False
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    # ---------------------------------------------------------------
    # CUST-08 hardening: starter issue validation edge cases
    # ---------------------------------------------------------------
    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_missing_title(self):
        """Starter issue validation rejects entries without a name/title (CUST-08)."""
        payload = _valid_payload()
        del payload["starter_issues"][0]["name"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_invalid_priority(self):
        """Starter issue validation rejects priorities outside the allowed enum (CUST-08)."""
        payload = _valid_payload()
        payload["starter_issues"][0]["priority"] = "p0-critical"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_dangling_state(self):
        """Starter issue validation rejects unknown state_key references (CUST-08)."""
        payload = _valid_payload()
        payload["starter_issues"][0]["state_key"] = "missing-state"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_dangling_label(self):
        """Starter issue validation rejects unknown label_keys (CUST-08)."""
        payload = _valid_payload()
        payload["starter_issues"][0]["label_keys"] = ["nonexistent-label"]
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_dangling_module(self):
        """Starter issue validation rejects unknown module_key references (CUST-08)."""
        payload = _valid_payload()
        payload["starter_issues"][0]["module_key"] = "missing-module"
        with pytest.raises(Exception):
            validate_project_template_payload(payload)

    @pytest.mark.django_db
    def test_payload_helper_rejects_starter_issue_dangling_cycle(self):
        """Starter issue validation rejects unknown cycle_key references (CUST-08)."""
        payload = _valid_payload()
        payload["starter_issues"][0]["cycle_key"] = "missing-cycle"
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

    @pytest.mark.django_db
    def test_write_serializer_create_rejects_builtin_attempt(
        self, db, create_user, workspace
    ):
        """The write serializer rejects attempts to create a built-in row."""
        serializer = ProjectTemplateWriteSerializer(
            data={
                "name": "Fake Built-in",
                "template_type": ProjectTemplate.TemplateType.BUILT_IN,
                "payload": _valid_payload(),
            },
            context={"workspace_id": workspace.id, "request_user": create_user},
        )
        assert not serializer.is_valid()
        # Either is_system or template_type must surface in the errors.
        assert any(
            key in serializer.errors for key in ("is_system", "template_type")
        )

    @pytest.mark.django_db
    def test_write_serializer_create_with_blank_name_rejected(
        self, db, create_user, workspace
    ):
        """A custom template POST without a name fails serializer validation."""
        serializer = ProjectTemplateWriteSerializer(
            data={
                "template_type": ProjectTemplate.TemplateType.CUSTOM,
                "payload": _valid_payload(),
            },
            context={"workspace_id": workspace.id, "request_user": create_user},
        )
        assert not serializer.is_valid()
        assert "name" in serializer.errors


@pytest.mark.unit
class TestProjectTemplateDuplicateSerializer:
    """Tests for the ProjectTemplateDuplicateSerializer used by the duplicate endpoint."""

    @pytest.mark.django_db
    def test_duplicate_serializer_accepts_optional_name(
        self, db, create_user, workspace
    ):
        """The duplicate serializer accepts a request with no name (use source name)."""
        serializer = ProjectTemplateDuplicateSerializer(data={})
        assert serializer.is_valid(), serializer.errors

    @pytest.mark.django_db
    def test_duplicate_serializer_accepts_provided_name(
        self, db, create_user, workspace
    ):
        """The duplicate serializer accepts a custom name."""
        serializer = ProjectTemplateDuplicateSerializer(
            data={"name": "My Software Copy"}
        )
        assert serializer.is_valid(), serializer.errors
        assert serializer.validated_data["name"] == "My Software Copy"

    @pytest.mark.django_db
    def test_duplicate_serializer_rejects_blank_name(self, db):
        """The duplicate serializer rejects blank-name input."""
        serializer = ProjectTemplateDuplicateSerializer(data={"name": ""})
        assert not serializer.is_valid()
        assert "name" in serializer.errors
