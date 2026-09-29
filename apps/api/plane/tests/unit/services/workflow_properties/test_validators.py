# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Type-aware validator tests for §14 property types.

Covered here:

- per-type value validation (TEXT, NUMBER, BOOLEAN, DATE, DATETIME,
  DROPDOWN, MULTI_SELECT, MEMBER, URL, EMAIL, ENTITY_REFERENCE);
- per-type ``config`` validation;
- required-property check with defaults applied;
- blank handling (``allow_blank`` short-circuit).
"""

# Third Party imports
import pytest

# Module imports
from plane.services.workflow_properties.errors import (
    WorkflowPropertyInvalidConfig,
    WorkflowPropertyInvalidValue,
    WorkflowPropertyRequiredMissing,
)
from plane.services.workflow_properties.validators import (
    validate_config,
    validate_required_properties,
    validate_value,
)


# ---------------------------------------------------------------------------
# Per-type value validation
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestValidateValueScalars:
    def test_text_accepts_string(self):
        validate_value("hello", "TEXT")

    def test_text_rejects_non_string(self):
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(42, "TEXT")

    def test_number_accepts_int_and_float_and_decimal_strings(self):
        validate_value(42, "NUMBER")
        validate_value(3.14, "NUMBER")
        validate_value("42", "NUMBER")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("not a number", "NUMBER")
        # booleans are not numbers
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(True, "NUMBER")

    def test_boolean_accepts_true_false(self):
        validate_value(True, "BOOLEAN")
        validate_value(False, "BOOLEAN")
        validate_value("true", "BOOLEAN")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("yes", "BOOLEAN")
        # integers are not booleans (the spec is strict)
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(1, "BOOLEAN")

    def test_date_accepts_iso(self):
        validate_value("2026-09-29", "DATE")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("2026-13-99", "DATE")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("not a date", "DATE")

    def test_datetime_accepts_iso(self):
        validate_value("2026-09-29T10:00:00Z", "DATETIME")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("not a datetime", "DATETIME")

    def test_url_requires_scheme(self):
        validate_value("https://example.com", "URL")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("example.com", "URL")

    def test_email_rejects_malformed(self):
        validate_value("a@b.co", "EMAIL")
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("not an email", "EMAIL")


@pytest.mark.unit
@pytest.mark.django_db
class TestValidateValueChoices:
    def test_dropdown_requires_choices_in_config(self):
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("low", "DROPDOWN", config={})

    def test_dropdown_accepts_only_known_choice(self):
        validate_value("low", "DROPDOWN", config={"choices": ["low", "high"]})
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("nope", "DROPDOWN", config={"choices": ["low", "high"]})

    def test_multi_select_validates_each_entry(self):
        validate_value(["low", "high"], "MULTI_SELECT", config={"choices": ["low", "high"]})
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(["nope"], "MULTI_SELECT", config={"choices": ["low", "high"]})
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value([1], "MULTI_SELECT", config={"choices": ["low", "high"]})

    def test_member_accepts_empty_list(self):
        validate_value([], "MEMBER")

    def test_member_rejects_non_list(self):
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value("not-a-list", "MEMBER")


@pytest.mark.unit
@pytest.mark.django_db
class TestValidateValueEntityReference:
    def test_unknown_entity_type_fails_closed(self):
        # The provider registry fails closed — no provider for "vendor"
        # in the test environment.
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(
                {"entity_type": "vendor", "entity_id": "abc"},
                "ENTITY_REFERENCE",
                config={"entity_type": "vendor"},
            )

    def test_mismatched_config_and_value(self):
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(
                {"entity_type": "user", "entity_id": "abc"},
                "ENTITY_REFERENCE",
                config={"entity_type": "vendor"},
            )

    def test_missing_entity_id(self):
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(
                {"entity_type": "user"},
                "ENTITY_REFERENCE",
                config={"entity_type": "user"},
            )

    def test_dangling_reference_is_rejected(self, db, create_user):
        from plane.services.workflow_properties.validators import _as_number
        # No user with this UUID.
        from uuid import uuid4

        bogus = uuid4()
        with pytest.raises(WorkflowPropertyInvalidValue):
            validate_value(
                {"entity_type": "user", "entity_id": str(bogus)},
                "ENTITY_REFERENCE",
                config={"entity_type": "user"},
            )

    def test_resolved_reference_passes(self, db, create_user):
        validate_value(
            {"entity_type": "user", "entity_id": str(create_user.id)},
            "ENTITY_REFERENCE",
            config={"entity_type": "user"},
        )


@pytest.mark.unit
@pytest.mark.django_db
class TestValidateConfig:
    def test_dropdown_requires_choices(self):
        with pytest.raises(WorkflowPropertyInvalidConfig):
            validate_config({}, "DROPDOWN")

    def test_entity_reference_requires_entity_type(self):
        with pytest.raises(WorkflowPropertyInvalidConfig):
            validate_config({}, "ENTITY_REFERENCE")

    def test_member_optional_choices(self):
        validate_config({}, "MEMBER")
        validate_config({"choices": ["alice"]}, "MEMBER")

    def test_text_config_must_be_dict(self):
        with pytest.raises(WorkflowPropertyInvalidConfig):
            validate_config("not a dict", "TEXT")


# ---------------------------------------------------------------------------
# Required-property check
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.django_db
class TestRequiredProperties:
    def test_missing_required_property_raises(self, required_dropdown):
        attachments = [required_dropdown]
        with pytest.raises(WorkflowPropertyRequiredMissing) as exc:
            validate_required_properties(attachments, {})
        assert exc.value.code == "WORKFLOW_PROPERTY_REQUIRED_MISSING"
        assert exc.value.extra["missing"] == ["Priority"]

    def test_blank_required_property_raises(self, required_dropdown):
        with pytest.raises(WorkflowPropertyRequiredMissing):
            validate_required_properties(
                [required_dropdown],
                {str(required_dropdown.property_id): ""},
            )

    def test_satisfied_required_property_returns_empty_list(self, required_dropdown):
        result = validate_required_properties(
            [required_dropdown],
            {str(required_dropdown.property_id): "low"},
        )
        assert result == []

    def test_optional_property_can_be_missing(self, required_dropdown):
        # Flip is_required off and confirm the check passes.
        required_dropdown.is_required = False
        required_dropdown.save()
        validate_required_properties([required_dropdown], {})

    def test_default_supplied_via_attachments_satisfies_required(
        self, required_dropdown, db
    ):
        # Defaults are applied in the caller (serializer / service
        # layer); here we just confirm the check honours a supplied
        # value that came from the attachment's default_value.
        required_dropdown.default_value = "medium"
        required_dropdown.save()
        validate_required_properties(
            [required_dropdown],
            {str(required_dropdown.property_id): required_dropdown.default_value},
        )
