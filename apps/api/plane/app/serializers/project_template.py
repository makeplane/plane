# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from rest_framework import serializers

# Module imports
from plane.db.models import ProjectTemplate
from .base import BaseSerializer


# Payload version shipped with the v1 catalog. Bumping this value in a future
# release allows the validator to either accept the new shape or reject older
# payloads (see D-02 in CONTEXT.md).
PROJECT_TEMPLATE_SCHEMA_VERSION = 1

# Enum-like constants used for payload validation. These are intentionally
# duplicated as constants (not TextChoices) so the JSON payload is independent
# of the database-level model enums.
PROJECT_TEMPLATE_STATE_GROUPS = frozenset(
    [
        "backlog",
        "unstarted",
        "started",
        "completed",
        "cancelled",
        "triage",
    ]
)

PROJECT_TEMPLATE_MODULE_STATUSES = frozenset(
    [
        "backlog",
        "planned",
        "in-progress",
        "paused",
        "completed",
        "cancelled",
    ]
)

PROJECT_TEMPLATE_ISSUE_PRIORITIES = frozenset(
    ["urgent", "high", "medium", "low", "none"]
)

# Hex color helper, also used by the migration seed.
HEX_COLOR_RE = "#" + "[0-9a-fA-F]" * 6


# ---------------------------------------------------------------------------
# Built-in template fixtures
# ---------------------------------------------------------------------------
# These three records are the catalog's stable global built-ins. They are
# seeded by migration 0122 and remain read-only at the API layer.
# Stable system_key values are part of the migration contract (D-12).
# ---------------------------------------------------------------------------
def _builtin_payload(name, description, states, labels, modules, cycles, starter_issues):
    return {
        "name": name,
        "description": description,
        "template_type": ProjectTemplate.TemplateType.BUILT_IN,
        "is_system": True,
        "is_active": True,
        "payload": {
            "schema_version": PROJECT_TEMPLATE_SCHEMA_VERSION,
            "states": states,
            "labels": labels,
            "modules": modules,
            "cycles": cycles,
            "starter_issues": starter_issues,
        },
    }


BUILT_IN_PROJECT_TEMPLATES = [
    {
        "system_key": "software-project",
        **_builtin_payload(
            name="Software Project",
            description="Workflow for software engineering teams shipping a product.",
            states=[
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
                {
                    "state_key": "in_progress",
                    "name": "In Progress",
                    "color": "#F59E0B",
                    "group": "started",
                    "sequence": 35000,
                },
                {
                    "state_key": "done",
                    "name": "Done",
                    "color": "#46A758",
                    "group": "completed",
                    "sequence": 45000,
                },
                {
                    "state_key": "cancelled",
                    "name": "Cancelled",
                    "color": "#9AA4BC",
                    "group": "cancelled",
                    "sequence": 55000,
                },
            ],
            labels=[
                {
                    "label_key": "bug",
                    "name": "Bug",
                    "color": "#F59E0B",
                    "order": 100,
                },
                {
                    "label_key": "feature",
                    "name": "Feature",
                    "color": "#3F76FF",
                    "order": 200,
                },
            ],
            modules=[
                {
                    "module_key": "core",
                    "name": "Core",
                    "status": "planned",
                }
            ],
            cycles=[
                {
                    "cycle_key": "sprint-1",
                    "name": "Sprint 1",
                    "start_offset_days": 0,
                    "target_offset_days": 14,
                    "duration_days": 14,
                }
            ],
            starter_issues=[
                {
                    "name": "Set up the project backlog",
                    "state_key": "backlog",
                    "label_keys": [],
                    "module_key": "core",
                    "cycle_key": "sprint-1",
                    "priority": "medium",
                }
            ],
        ),
    },
    {
        "system_key": "marketing-campaign",
        **_builtin_payload(
            name="Marketing Campaign",
            description="Workflow for planning and executing a marketing campaign.",
            states=[
                {
                    "state_key": "backlog",
                    "name": "Backlog",
                    "color": "#60646C",
                    "group": "backlog",
                    "sequence": 15000,
                    "default": True,
                },
                {
                    "state_key": "scheduled",
                    "name": "Scheduled",
                    "color": "#3F76FF",
                    "group": "unstarted",
                    "sequence": 25000,
                },
                {
                    "state_key": "live",
                    "name": "Live",
                    "color": "#46A758",
                    "group": "started",
                    "sequence": 35000,
                },
                {
                    "state_key": "completed",
                    "name": "Completed",
                    "color": "#9AA4BC",
                    "group": "completed",
                    "sequence": 45000,
                },
            ],
            labels=[
                {
                    "label_key": "social",
                    "name": "Social",
                    "color": "#3F76FF",
                    "order": 100,
                },
                {
                    "label_key": "email",
                    "name": "Email",
                    "color": "#F59E0B",
                    "order": 200,
                },
            ],
            modules=[],
            cycles=[
                {
                    "cycle_key": "launch-week",
                    "name": "Launch Week",
                    "start_offset_days": 0,
                    "target_offset_days": 7,
                    "duration_days": 7,
                }
            ],
            starter_issues=[
                {
                    "name": "Draft launch announcement",
                    "state_key": "backlog",
                    "label_keys": ["social"],
                    "module_key": None,
                    "cycle_key": "launch-week",
                    "priority": "high",
                }
            ],
        ),
    },
    {
        "system_key": "operations-project",
        **_builtin_payload(
            name="Operations Project",
            description="Workflow for running internal operations projects.",
            states=[
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
                {
                    "state_key": "doing",
                    "name": "Doing",
                    "color": "#F59E0B",
                    "group": "started",
                    "sequence": 35000,
                },
                {
                    "state_key": "done",
                    "name": "Done",
                    "color": "#46A758",
                    "group": "completed",
                    "sequence": 45000,
                },
            ],
            labels=[
                {
                    "label_key": "process",
                    "name": "Process",
                    "color": "#3F76FF",
                    "order": 100,
                }
            ],
            modules=[
                {
                    "module_key": "ops",
                    "name": "Operations",
                    "status": "planned",
                }
            ],
            cycles=[
                {
                    "cycle_key": "month-1",
                    "name": "Month 1",
                    "start_offset_days": 0,
                    "target_offset_days": 30,
                    "duration_days": 30,
                }
            ],
            starter_issues=[
                {
                    "name": "Document current process",
                    "state_key": "backlog",
                    "label_keys": ["process"],
                    "module_key": "ops",
                    "cycle_key": "month-1",
                    "priority": "medium",
                }
            ],
        ),
    },
]


# ---------------------------------------------------------------------------
# Payload validation
# ---------------------------------------------------------------------------
import re


_HEX_COLOR_COMPILED = re.compile(r"^" + HEX_COLOR_RE + "$")


def _require_unique_keys(sections, key_name, section_name):
    """Return a set of unique keys for a payload section while enforcing D-03/D-04."""
    keys = []
    seen = set()
    for index, section in enumerate(sections):
        if not isinstance(section, dict):
            raise serializers.ValidationError(
                {section_name: f"Entry {index} must be an object"}
            )
        key = section.get(key_name)
        if not key or not isinstance(key, str):
            raise serializers.ValidationError(
                {section_name: f"Entry {index} is missing {key_name}"}
            )
        if key in seen:
            raise serializers.ValidationError(
                {section_name: f"Duplicate {key_name} '{key}'"}
            )
        seen.add(key)
        keys.append(key)
    return set(keys)


def _validate_date_metadata(payload_obj, errors, section_name, index):
    """Validate Phase 1 optional date metadata fields.

    Phase 1 only enforces type and order. The numeric values are stored as
    integers and interpreted during project creation in Phase 2.
    """
    start = payload_obj.get("start_offset_days")
    target = payload_obj.get("target_offset_days")
    duration = payload_obj.get("duration_days")
    for field_name, value in (
        ("start_offset_days", start),
        ("target_offset_days", target),
        ("duration_days", duration),
    ):
        if value is not None and (not isinstance(value, int) or isinstance(value, bool)):
            errors.append(
                {
                    section_name: (
                        f"Entry {index} {field_name} must be an integer or null"
                    )
                }
            )
    if (
        isinstance(start, int)
        and not isinstance(start, bool)
        and isinstance(target, int)
        and not isinstance(target, bool)
        and start > target
    ):
        errors.append(
            {
                section_name: (
                    f"Entry {index} start_offset_days must not exceed target_offset_days"
                )
            }
        )


def _validate_color(color, errors, location):
    if not isinstance(color, str) or not _HEX_COLOR_COMPILED.match(color):
        errors.append({location: f"color {color!r} is not a valid #RRGGBB hex string"})


def validate_project_template_payload(payload):
    """Validate a template payload against Phase 1 invariants.

    Implements the strict validation required by D-01..D-04 and CUST-04..CUST-08.
    Returns the payload unchanged on success; raises
    ``serializers.ValidationError`` on the first violation. Multiple violations
    are accumulated into a list before raising so callers can surface every
    problem at once.
    """
    if not isinstance(payload, dict):
        raise serializers.ValidationError({"payload": "Payload must be a JSON object"})

    errors = []

    schema_version = payload.get("schema_version")
    if schema_version != PROJECT_TEMPLATE_SCHEMA_VERSION:
        errors.append(
            {"schema_version": f"Must equal {PROJECT_TEMPLATE_SCHEMA_VERSION}"}
        )

    states = payload.get("states", []) or []
    labels = payload.get("labels", []) or []
    modules = payload.get("modules", []) or []
    cycles = payload.get("cycles", []) or []
    starter_issues = payload.get("starter_issues", []) or []

    state_keys = set()
    state_names = set()
    state_sequences = set()
    default_count = 0
    for index, state in enumerate(states):
        if not isinstance(state, dict):
            errors.append({"states": f"Entry {index} must be an object"})
            continue
        key = state.get("state_key")
        if not key or not isinstance(key, str):
            errors.append({"states": f"Entry {index} is missing state_key"})
        elif key in state_keys:
            errors.append({"states": f"Duplicate state_key '{key}'"})
        else:
            state_keys.add(key)
        name = state.get("name")
        if not name or not isinstance(name, str):
            errors.append({"states": f"Entry {index} is missing name"})
        else:
            if name in state_names:
                errors.append({"states": f"Duplicate state name '{name}'"})
            state_names.add(name)
        sequence = state.get("sequence")
        if sequence is not None:
            if sequence in state_sequences:
                errors.append(
                    {"states": f"Duplicate state sequence {sequence!r}"}
                )
            state_sequences.add(sequence)
        _validate_color(state.get("color"), errors, f"states[{index}].color")
        group = state.get("group")
        if group not in PROJECT_TEMPLATE_STATE_GROUPS:
            errors.append(
                {"states": f"Entry {index} group {group!r} is not a valid state group"}
            )
        if state.get("default") is True:
            default_count += 1
    if default_count != 1:
        errors.append(
            {"states": "Exactly one state must have default=True"}
        )

    label_keys = set()
    label_names = set()
    label_orders = set()
    for index, label in enumerate(labels):
        if not isinstance(label, dict):
            errors.append({"labels": f"Entry {index} must be an object"})
            continue
        key = label.get("label_key")
        if not key or not isinstance(key, str):
            errors.append({"labels": f"Entry {index} is missing label_key"})
        elif key in label_keys:
            errors.append({"labels": f"Duplicate label_key '{key}'"})
        else:
            label_keys.add(key)
        name = label.get("name")
        if not name or not isinstance(name, str):
            errors.append({"labels": f"Entry {index} is missing name"})
        else:
            if name in label_names:
                errors.append({"labels": f"Duplicate label name '{name}'"})
            label_names.add(name)
        order = label.get("order")
        if order is not None:
            if order in label_orders:
                errors.append({"labels": f"Duplicate label order {order!r}"})
            label_orders.add(order)
        _validate_color(label.get("color"), errors, f"labels[{index}].color")

    module_keys = set()
    for index, module in enumerate(modules):
        if not isinstance(module, dict):
            errors.append({"modules": f"Entry {index} must be an object"})
            continue
        key = module.get("module_key")
        if not key or not isinstance(key, str):
            errors.append({"modules": f"Entry {index} is missing module_key"})
        elif key in module_keys:
            errors.append({"modules": f"Duplicate module_key '{key}'"})
        else:
            module_keys.add(key)
        name = module.get("name")
        if not name or not isinstance(name, str):
            errors.append({"modules": f"Entry {index} is missing name"})
        status = module.get("status")
        if status is not None and status not in PROJECT_TEMPLATE_MODULE_STATUSES:
            errors.append(
                {"modules": f"Entry {index} status {status!r} is not a valid module status"}
            )
        _validate_date_metadata(module, errors, "modules", index)

    cycle_keys = set()
    for index, cycle in enumerate(cycles):
        if not isinstance(cycle, dict):
            errors.append({"cycles": f"Entry {index} must be an object"})
            continue
        key = cycle.get("cycle_key")
        if not key or not isinstance(key, str):
            errors.append({"cycles": f"Entry {index} is missing cycle_key"})
        elif key in cycle_keys:
            errors.append({"cycles": f"Duplicate cycle_key '{key}'"})
        else:
            cycle_keys.add(key)
        name = cycle.get("name")
        if not name or not isinstance(name, str):
            errors.append({"cycles": f"Entry {index} is missing name"})
        _validate_date_metadata(cycle, errors, "cycles", index)

    for index, issue in enumerate(starter_issues):
        if not isinstance(issue, dict):
            errors.append({"starter_issues": f"Entry {index} must be an object"})
            continue
        issue_name = issue.get("name")
        if not issue_name or not isinstance(issue_name, str):
            errors.append(
                {"starter_issues": f"Entry {index} is missing name"}
            )
        issue_state = issue.get("state_key")
        if not issue_state or issue_state not in state_keys:
            errors.append(
                {
                    "starter_issues": (
                        f"Entry {index} references unknown state_key {issue_state!r}"
                    )
                }
            )
        for label_key in issue.get("label_keys", []) or []:
            if label_key not in label_keys:
                errors.append(
                    {
                        "starter_issues": (
                            f"Entry {index} references unknown label_key {label_key!r}"
                        )
                    }
                )
        module_key = issue.get("module_key")
        if module_key is not None and module_key not in module_keys:
            errors.append(
                {
                    "starter_issues": (
                        f"Entry {index} references unknown module_key {module_key!r}"
                    )
                }
            )
        cycle_key = issue.get("cycle_key")
        if cycle_key is not None and cycle_key not in cycle_keys:
            errors.append(
                {
                    "starter_issues": (
                        f"Entry {index} references unknown cycle_key {cycle_key!r}"
                    )
                }
            )
        priority = issue.get("priority")
        if priority is not None and priority not in PROJECT_TEMPLATE_ISSUE_PRIORITIES:
            errors.append(
                {
                    "starter_issues": (
                        f"Entry {index} priority {priority!r} is not valid"
                    )
                }
            )

    if errors:
        # Wrap to a list for consistency with DRF error payloads.
        raise serializers.ValidationError(errors)

    return payload


# ---------------------------------------------------------------------------
# Model serializers
# ---------------------------------------------------------------------------
class ProjectTemplateSerializer(BaseSerializer):
    """Read serializer used by the workspace catalog list endpoint."""

    workspace = serializers.SerializerMethodField()

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "template_type",
            "system_key",
            "is_system",
            "is_active",
            "payload",
            "workspace",
            "start_offset_days",
            "target_offset_days",
            "duration_days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_workspace(self, obj):
        return str(obj.workspace_id) if obj.workspace_id else None


class ProjectTemplateWriteSerializer(BaseSerializer):
    """Write serializer used when admins create or update custom templates.

    Built-in rows (is_system=True) cannot be created or updated through this
    serializer per D-09/D-11.
    """

    class Meta:
        model = ProjectTemplate
        fields = [
            "id",
            "name",
            "description",
            "template_type",
            "system_key",
            "is_system",
            "is_active",
            "payload",
            "start_offset_days",
            "target_offset_days",
            "duration_days",
        ]
        read_only_fields = [
            "id",
            "is_system",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        payload = attrs.get("payload")
        if payload is None and self.instance is not None:
            payload = self.instance.payload
        if payload is not None:
            validate_project_template_payload(payload)
        # Built-in templates cannot be created or updated through this serializer.
        if self.instance is None:
            if attrs.get("is_system"):
                raise serializers.ValidationError(
                    {"is_system": "Built-in templates cannot be created via the API"}
                )
            if attrs.get("system_key"):
                raise serializers.ValidationError(
                    {"system_key": "Custom templates cannot set a system_key"}
                )
        else:
            if self.instance.is_system:
                raise serializers.ValidationError(
                    {"is_system": "Built-in templates cannot be modified"}
                )
            if "system_key" in attrs and attrs["system_key"] != self.instance.system_key:
                raise serializers.ValidationError(
                    {"system_key": "system_key cannot be changed"}
                )
        # Custom templates must be marked CUSTOM.
        template_type = attrs.get(
            "template_type", self.instance.template_type if self.instance else None
        )
        if template_type == ProjectTemplate.TemplateType.BUILT_IN:
            raise serializers.ValidationError(
                {"template_type": "Custom templates must use template_type 'custom'"}
            )
        return attrs

    def create(self, validated_data):
        workspace_id = self.context.get("workspace_id")
        return ProjectTemplate.objects.create(
            **validated_data,
            workspace_id=workspace_id,
            is_system=False,
            system_key=None,
        )


class ProjectTemplateDuplicateSerializer(BaseSerializer):
    """Serializer used when an admin duplicates a built-in into a custom template.

    Accepts an optional ``name`` override; the caller-provided name falls back to
    the source template's name when omitted (D-07).
    """

    name = serializers.CharField(required=False, allow_blank=False, max_length=255)

    class Meta:
        model = ProjectTemplate
        fields = [
            "name",
        ]
        read_only_fields = []
