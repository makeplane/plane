# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
import logging
import re
import time
from copy import deepcopy
from typing import Any

# Django imports
from django.db import IntegrityError

# Celery imports
from celery import shared_task

# Import your models
from plane.db.models import (
    Workspace,
    WorkspaceMember,
    Project,
    Label,
    IssueType,
    ProjectIssueType,
    Estimate,
    EstimatePoint,
    Module,
    State,
    Cycle,
    Issue,
    CycleIssue,
    ModuleIssue,
    IssueRelation,
    IssueLink,
    IssueComment,
    IssueLabel,
    Page,
    ProjectPage,
    IssueAssignee,
    IssueView,
    ProjectMember,
    Intake,
    IntakeIssue,
    Description,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    WorkspaceFeature,
    Initiative,
    InitiativeLabel,
    InitiativeLabelAssociation,
    InitiativeProject,
    InitiativeLink,
    InitiativeReaction,
    InitiativeComment,
    InitiativeCommentReaction,
    IssueWorkLog,
    EntityIssueStateActivity,
    EntityProgress,
    ProjectAttribute,
    ProjectLink,
    ProjectComment,
    ProjectFeature,
    ProjectState,
    Teamspace,
    TeamspaceLabel,
    TeamspaceMember,
    TeamspacePage,
    TeamspaceProject,
    TeamspaceView,
    TeamspaceComment,
    TeamspaceCommentReaction,
    InitiativeEpic,
    Customer,
    CustomerProperty,
    CustomerPropertyOption,
    CustomerPropertyValue,
    CustomerRequest,
    CustomerRequestIssue,
    IntakeSetting,
    IntakeForm,
    IntakeFormField,
    IntakeResponsibility,
    IntakeEmail,
    EntityUpdates,
    UpdateReaction,
    Milestone,
    MilestoneIssue,
    Workflow,
    WorkflowWorkItemType,
    WorkflowState,
    WorkflowTransition,
    WorkflowTransitionApprover,
    Automation,
    AutomationVersion,
    AutomationNode,
    AutomationEdge,
    RecurringWorkitemTask,
    Template,
    WorkitemTemplate,
    PageTemplate,
    ProjectTemplate,
    Dashboard,
    Widget,
    DashboardWidget,
    DashboardProject,
    DashboardQuickFilter,
)

logger = logging.getLogger("plane.bgtasks.copy_workspace_data")

_SKIP = object()
_CUSTOM_PROPERTY_FILTER_KEY_RE = re.compile(r"^customproperty_([a-f0-9-]+)(.*)$", re.IGNORECASE)
_PQL_CUSTOM_PROPERTY_RE = re.compile(r'cf\["([a-f0-9-]+)"\]', re.IGNORECASE)


class WorkspaceDataCopier:
    """
    Class to handle copying all data from one workspace to another
    """

    target_workspace = None

    def clean_data(self, data, keys):
        for key in keys:
            data.pop(key, None)
        return data

    def __init__(self, source_workspace_slug, target_workspace_slug):
        """
        Initialize with source workspace ID and target workspace details
        """
        self.source_workspace_slug = source_workspace_slug
        self.target_workspace_slug = target_workspace_slug
        self.source_workspace = Workspace.objects.get(slug=source_workspace_slug)
        self.target_workspace = Workspace.objects.get(slug=target_workspace_slug)

        logger.info(
            "Initialized workspace copy: source='%s' (id=%s) -> target='%s' (id=%s)",
            self.source_workspace_slug,
            self.source_workspace.id,
            self.target_workspace_slug,
            self.target_workspace.id,
        )

        # Initialize mapping dictionaries to track old_id -> new_id
        self.workspace_map = {}
        self.project_map = {}
        self.member_map = {}
        self.state_map = {}
        self.label_map = {}
        self.issue_type_map = {}
        self.estimate_map = {}
        self.issue_map = {}
        self.estimate_point_map = {}
        self.issue_property_map = {}
        self.issue_property_option_map = {}
        self.module_map = {}
        self.cycle_map = {}
        self.comment_map = {}
        self.page_map = {}
        self.view_map = {}
        self.project_state_map = {}
        self.initiative_map = {}
        self.initiative_label_map = {}
        self.initiative_comment_map = {}
        self.teamspace_map = {}
        self.teamspace_comment_map = {}
        self.customer_map = {}
        self.customer_property_map = {}
        self.customer_property_option_map = {}
        self.customer_request_map = {}
        self.intake_map = {}
        self.intake_form_map = {}
        self.entity_update_map = {}
        self.description_map = {}
        self.milestone_map = {}
        self.workflow_map = {}
        self.workflow_state_map = {}
        self.workflow_transition_map = {}
        self.automation_map = {}
        self.automation_version_map = {}
        self.automation_node_map = {}
        self.template_map = {}
        self.workitem_template_map = {}
        self.page_template_map = {}
        self.project_template_map = {}
        self.dashboard_map = {}
        self.widget_map = {}

    def _warn_skip(self, context: str, detail: str) -> None:
        logger.warning("[%s] %s", context, detail)

    def _log_copy_summary(
        self,
        entity_name: str,
        source_count: int,
        copied_count: int,
        skipped_count: int = 0,
        error_count: int = 0,
    ) -> None:
        parts = [f"[{entity_name}] source={source_count}, copied={copied_count}"]
        if skipped_count:
            parts.append(f"skipped={skipped_count}")
        if error_count:
            parts.append(f"errors={error_count}")
        logger.info(", ".join(parts))

    def _empty_pql_filters(self) -> dict:
        return {"json": {}, "stripped": ""}

    def _reference_maps(self) -> dict[str, dict]:
        return {
            "project": self.project_map,
            "project_id": self.project_map,
            "state": self.state_map,
            "state_id": self.state_map,
            "label": self.label_map,
            "labels": self.label_map,
            "label_id": self.label_map,
            "label_ids": self.label_map,
            "cycle": self.cycle_map,
            "cycle_id": self.cycle_map,
            "cycle_ids": self.cycle_map,
            "module": self.module_map,
            "module_id": self.module_map,
            "module_ids": self.module_map,
            "type": self.issue_type_map,
            "type_id": self.issue_type_map,
            "issue": self.issue_map,
            "issue_id": self.issue_map,
            "parent_id": self.issue_map,
            "epic_id": self.issue_map,
            "milestone": self.milestone_map,
            "milestone_id": self.milestone_map,
            "workflow": self.workflow_map,
            "workflow_id": self.workflow_map,
            "estimate_point_id": self.estimate_point_map,
            "issue_property": self.issue_property_map,
            "issue_property_id": self.issue_property_map,
            "issue_property_option": self.issue_property_option_map,
            "issue_property_option_id": self.issue_property_option_map,
            "assignee": self.member_map,
            "assignees": self.member_map,
            "assignee_id": self.member_map,
            "assignee_ids": self.member_map,
            "member": self.member_map,
            "members": self.member_map,
        }

    def _legacy_filter_reference_maps(self) -> dict[str, dict]:
        reference_maps = self._reference_maps()
        return {
            "project": reference_maps["project"],
            "state": reference_maps["state"],
            "labels": reference_maps["labels"],
            "cycle": reference_maps["cycle"],
            "module": reference_maps["module"],
            "type": reference_maps["type"],
            "milestone": reference_maps["milestone"],
            "milestone_id": reference_maps["milestone_id"],
            "workflow": reference_maps["workflow"],
            "workflow_id": reference_maps["workflow_id"],
            "assignee": reference_maps["assignee"],
            "assignees": reference_maps["assignees"],
        }

    def _explode_reference_values(self, value: Any) -> tuple[list[Any], Any]:
        if isinstance(value, list):
            return value, lambda items: items
        if isinstance(value, tuple):
            return list(value), tuple
        if isinstance(value, str) and "," in value:
            values = [item for item in value.split(",") if item != ""]
            return values, lambda items: ",".join(str(item) for item in items)
        return [value], lambda items: items[0] if items else _SKIP

    def _remap_reference_values(
        self,
        value: Any,
        mapping: dict,
        context: str,
        reference_name: str,
        *,
        allow_templates: bool = False,
    ) -> Any:
        if value in (None, "", []):
            return value
        if isinstance(value, bool):
            return value
        if isinstance(value, (dict, int, float)):
            return value

        values, restore = self._explode_reference_values(value)
        remapped_values = []

        for item in values:
            if item in (None, ""):
                continue
            if allow_templates and isinstance(item, str) and "{{" in item and "}}" in item:
                remapped_values.append(item)
                continue

            mapped_value = mapping.get(str(item))
            if mapped_value is None:
                self._warn_skip(context, f"dropping unmappable {reference_name} reference {item}")
                continue

            remapped_values.append(str(mapped_value))

        if not remapped_values:
            return _SKIP

        return restore(remapped_values)

    def _remap_custom_property_filter_leaf(self, key: str, value: Any, context: str) -> Any:
        match = _CUSTOM_PROPERTY_FILTER_KEY_RE.match(key)
        if not match:
            return key, deepcopy(value)

        property_id, suffix = match.groups()
        mapped_property_id = self.issue_property_map.get(str(property_id))
        if mapped_property_id is None:
            self._warn_skip(context, f"dropping filter with unmappable custom property {property_id}")
            return _SKIP

        remapped_key = f"customproperty_{mapped_property_id}{suffix}"
        source_property = IssueProperty.objects.filter(id=property_id).values("property_type", "relation_type").first()
        if not source_property:
            self._warn_skip(context, f"dropping filter with missing custom property metadata {property_id}")
            return _SKIP

        lookup = suffix[2:] if suffix.startswith("__") else ""
        remapped_value = deepcopy(value)

        if lookup != "isnull":
            if source_property.get("property_type") == "OPTION":
                remapped_value = self._remap_reference_values(
                    value,
                    self.issue_property_option_map,
                    context,
                    "issue_property_option",
                )
            elif source_property.get("property_type") == "RELATION" and source_property.get("relation_type") == "ISSUE":
                remapped_value = self._remap_reference_values(
                    value,
                    self.issue_map,
                    context,
                    "issue",
                )

        if remapped_value is _SKIP:
            return _SKIP

        return remapped_key, remapped_value

    def _remap_fn_leaf(self, fn_node: Any, context: str) -> Any:
        if isinstance(fn_node, list):
            remapped_items = []
            for index, item in enumerate(fn_node):
                remapped_item = self._remap_fn_leaf(item, f"{context}[{index}]")
                if remapped_item is _SKIP:
                    continue
                remapped_items.append(remapped_item)
            return remapped_items

        if isinstance(fn_node, dict):
            remapped_fn = {}
            for key, value in fn_node.items():
                remapped_value = self._remap_fn_leaf(value, f"{context}.{key}")
                if remapped_value is _SKIP:
                    continue
                remapped_fn[key] = remapped_value
            return remapped_fn or _SKIP

        if isinstance(fn_node, str) and fn_node.startswith("cf:"):
            property_id = fn_node.split(":", 1)[1]
            mapped_property_id = self.issue_property_map.get(str(property_id))
            if mapped_property_id is None:
                self._warn_skip(context, f"dropping unmappable custom property function reference {property_id}")
                return _SKIP
            return f"cf:{mapped_property_id}"

        return deepcopy(fn_node)

    def _remap_filter_leaf(self, key: str, value: Any, context: str, *, legacy: bool = False) -> Any:
        reference_maps = self._legacy_filter_reference_maps() if legacy else self._reference_maps()

        if key.startswith("customproperty_"):
            return self._remap_custom_property_filter_leaf(key, value, context)

        base_key = key.split("__", 1)[0]
        mapping = reference_maps.get(base_key)
        if mapping:
            remapped_value = self._remap_reference_values(value, mapping, context, base_key)
            if remapped_value is _SKIP:
                return _SKIP
            return key, remapped_value

        return key, deepcopy(value)

    def _remap_filter_expression(self, expression: Any, context: str, *, legacy: bool = False) -> Any:
        if expression in ({}, None, ""):
            return {}
        if not isinstance(expression, dict):
            return deepcopy(expression)

        remapped_expression = {}

        for key, value in expression.items():
            if key in {"and", "or"}:
                remapped_children = []
                for index, child in enumerate(value or []):
                    remapped_child = self._remap_filter_expression(
                        child,
                        f"{context}.{key}[{index}]",
                        legacy=legacy,
                    )
                    if remapped_child:
                        remapped_children.append(remapped_child)
                if remapped_children:
                    remapped_expression[key] = remapped_children
                elif value:
                    self._warn_skip(context, f"dropping empty '{key}' group after remapping")
                continue

            if key == "not":
                remapped_child = self._remap_filter_expression(
                    value,
                    f"{context}.not",
                    legacy=legacy,
                )
                if remapped_child:
                    remapped_expression[key] = remapped_child
                elif value:
                    self._warn_skip(context, "dropping empty 'not' group after remapping")
                continue

            if key == "fn":
                remapped_fn = self._remap_fn_leaf(value, f"{context}.fn")
                if remapped_fn is not _SKIP:
                    remapped_expression[key] = remapped_fn
                continue

            remapped_leaf = self._remap_filter_leaf(key, value, f"{context}.{key}", legacy=legacy)
            if remapped_leaf is _SKIP:
                continue

            remapped_key, remapped_value = remapped_leaf
            remapped_expression[remapped_key] = remapped_value

        return remapped_expression

    def _remap_pql_stripped(self, stripped: str, context: str) -> str:
        missing_property_reference = False

        def replace_property_reference(match):
            nonlocal missing_property_reference

            property_id = match.group(1)
            mapped_property_id = self.issue_property_map.get(str(property_id))
            if mapped_property_id is None:
                missing_property_reference = True
                self._warn_skip(context, f"dropping PQL filter with unmappable custom property {property_id}")
                return ""
            return f'cf["{mapped_property_id}"]'

        remapped_stripped = _PQL_CUSTOM_PROPERTY_RE.sub(replace_property_reference, stripped or "")
        if missing_property_reference:
            return ""
        return remapped_stripped

    def _remap_pql_editor_json(self, value: Any, context: str) -> Any:
        if isinstance(value, list):
            remapped_items = []
            for index, item in enumerate(value):
                remapped_item = self._remap_pql_editor_json(item, f"{context}[{index}]")
                if remapped_item is not _SKIP:
                    remapped_items.append(remapped_item)
            return remapped_items

        if not isinstance(value, dict):
            return deepcopy(value)

        if value.get("type") == "pqlCustomPropertyField":
            attrs = deepcopy(value.get("attrs", {}))
            field = deepcopy(attrs.get("field", {}))
            field_value = field.get("value")
            if isinstance(field_value, str) and field_value.startswith("customproperty_"):
                property_id = field_value.split("customproperty_", 1)[1]
                mapped_property_id = self.issue_property_map.get(str(property_id))
                if mapped_property_id is None:
                    self._warn_skip(
                        context,
                        f"dropping PQL editor reference to unmappable custom property {property_id}",
                    )
                    return _SKIP
                field["value"] = f"customproperty_{mapped_property_id}"
                attrs["field"] = field

            remapped_value = deepcopy(value)
            remapped_value["attrs"] = attrs
            return remapped_value

        remapped_value = {}
        for key, nested_value in value.items():
            remapped_nested_value = self._remap_pql_editor_json(nested_value, f"{context}.{key}")
            if remapped_nested_value is _SKIP:
                continue
            remapped_value[key] = remapped_nested_value
        return remapped_value

    def _remap_pql_filters(self, pql_filters: Any, context: str) -> dict:
        if not isinstance(pql_filters, dict):
            return self._empty_pql_filters()

        remapped_pql_filters = deepcopy(pql_filters)
        remapped_pql_filters["stripped"] = self._remap_pql_stripped(
            pql_filters.get("stripped", ""),
            f"{context}.stripped",
        )

        if remapped_pql_filters["stripped"] == "":
            remapped_pql_filters["json"] = {}
            return remapped_pql_filters

        remapped_pql_filters["json"] = self._remap_pql_editor_json(
            pql_filters.get("json", {}),
            f"{context}.json",
        )
        if remapped_pql_filters["json"] is _SKIP:
            remapped_pql_filters["json"] = {}
        return remapped_pql_filters

    def _automation_field_reference_map(self, field_name: str) -> Any:
        reference_maps = {
            "project_id": self.project_map,
            "state_id": self.state_map,
            "label_id": self.label_map,
            "label_ids": self.label_map,
            "cycle_id": self.cycle_map,
            "cycle_ids": self.cycle_map,
            "module_id": self.module_map,
            "module_ids": self.module_map,
            "type_id": self.issue_type_map,
            "parent_id": self.issue_map,
            "epic_id": self.issue_map,
            "issue_id": self.issue_map,
            "milestone_id": self.milestone_map,
            "assignee_id": self.member_map,
            "assignee_ids": self.member_map,
            "estimate_point_id": self.estimate_point_map,
        }

        for suffix, mapping in sorted(reference_maps.items(), key=lambda item: len(item[0]), reverse=True):
            if field_name.endswith(suffix):
                return suffix, mapping
        return None, None

    def _remap_automation_filter_expression(self, expression: Any, context: str) -> Any:
        if not isinstance(expression, dict):
            return deepcopy(expression)

        if "field" in expression:
            remapped_expression = deepcopy(expression)
            field_name = expression.get("field", "")
            suffix, mapping = self._automation_field_reference_map(field_name)
            if mapping:
                remapped_value = self._remap_reference_values(
                    expression.get("value"),
                    mapping,
                    f"{context}.value",
                    suffix,
                )
                if remapped_value is _SKIP:
                    return _SKIP
                remapped_expression["value"] = remapped_value
            return remapped_expression

        remapped_expression = {}
        for operator in ("and", "or"):
            if operator in expression:
                remapped_children = []
                for index, child in enumerate(expression.get(operator, [])):
                    remapped_child = self._remap_automation_filter_expression(
                        child,
                        f"{context}.{operator}[{index}]",
                    )
                    if remapped_child is not _SKIP:
                        remapped_children.append(remapped_child)
                if remapped_children:
                    remapped_expression[operator] = remapped_children
                continue

        if "not" in expression:
            remapped_not = self._remap_automation_filter_expression(expression.get("not"), f"{context}.not")
            if remapped_not is not _SKIP:
                remapped_expression["not"] = remapped_not

        return remapped_expression or _SKIP

    def _remap_automation_node_config(self, handler_name: str, config: Any, context: str) -> Any:
        if not isinstance(config, dict):
            return deepcopy(config)

        remapped_config = deepcopy(config)

        if handler_name == "change_property":
            property_name = config.get("property_name")
            mapping = self._reference_maps().get(property_name)
            if mapping:
                remapped_property_value = self._remap_reference_values(
                    config.get("property_value", []),
                    mapping,
                    f"{context}.property_value",
                    property_name,
                    allow_templates=True,
                )
                if remapped_property_value is _SKIP:
                    self._warn_skip(context, f"clearing unmappable change_property values for {property_name}")
                    remapped_property_value = []
                remapped_config["property_value"] = remapped_property_value

        elif handler_name == "json_filter":
            remapped_filter_expression = self._remap_automation_filter_expression(
                config.get("filter_expression", {}),
                f"{context}.filter_expression",
            )
            if remapped_filter_expression is _SKIP:
                self._warn_skip(context, "replacing empty json_filter expression with an always-true guard")
                remapped_filter_expression = {"and": []}
            remapped_config["filter_expression"] = remapped_filter_expression

        return remapped_config

    def _remap_automation_payload(self, value: Any, context: str) -> Any:
        if isinstance(value, list):
            return [self._remap_automation_payload(item, f"{context}[{index}]") for index, item in enumerate(value)]

        if not isinstance(value, dict):
            return deepcopy(value)

        handler_name = value.get("handler_name")
        remapped_value = {}
        for key, nested_value in value.items():
            if key == "config" and handler_name:
                remapped_value[key] = self._remap_automation_node_config(
                    handler_name,
                    nested_value,
                    f"{context}.config",
                )
            else:
                remapped_value[key] = self._remap_automation_payload(nested_value, f"{context}.{key}")
        return remapped_value

    def _remap_widget_config(self, config: Any, context: str) -> Any:
        if not isinstance(config, dict):
            return deepcopy(config)

        remapped_config = deepcopy(config)
        if isinstance(remapped_config.get("filters"), dict):
            remapped_config["filters"] = (
                self._remap_filter_expression(
                    remapped_config.get("filters"),
                    f"{context}.filters",
                )
                or {}
            )
        return remapped_config

    def _create_issue_view_copy(self, view, target_workspace, project_id=None):
        remapped_view = view.copy()
        remapped_view["filters"] = (
            self._remap_filter_expression(
                view.get("filters", {}),
                f"IssueView[{view.get('id')}].filters",
                legacy=True,
            )
            or {}
        )
        remapped_view["rich_filters"] = (
            self._remap_filter_expression(
                view.get("rich_filters", {}),
                f"IssueView[{view.get('id')}].rich_filters",
            )
            or {}
        )
        remapped_view["pql_filters"] = self._remap_pql_filters(
            view.get("pql_filters", {}),
            f"IssueView[{view.get('id')}].pql_filters",
        )

        new_view = IssueView.objects.create(
            workspace=target_workspace,
            project_id=project_id,
            **self.clean_data(remapped_view, ["id", "project_id", "workspace_id"]),
        )

        update_fields = {}
        if new_view.sort_order != view.get("sort_order"):
            update_fields["sort_order"] = view.get("sort_order")

        if update_fields:
            IssueView.objects.filter(id=new_view.id).update(**update_fields)

        self.view_map[str(view["id"])] = new_view.id

    def _copy_description(self, source_description_id, target_project_id, target_workspace):
        if not source_description_id:
            return None

        cached_description_id = self.description_map.get(str(source_description_id))
        if cached_description_id:
            return cached_description_id

        source_description = Description.objects.filter(id=source_description_id).values().first()
        if not source_description:
            return None

        mapped_project_id = (
            self.project_map.get(str(source_description.get("project_id")))
            if source_description.get("project_id")
            else target_project_id
        )

        new_description = Description.objects.create(
            workspace=target_workspace,
            project_id=mapped_project_id,
            **self.clean_data(source_description.copy(), ["id", "workspace_id", "project_id"]),
        )
        self.description_map[str(source_description_id)] = new_description.id
        return new_description.id

    def _remap_workitem_template_payload(self, workitem_template):
        remapped_template = workitem_template.copy()

        if remapped_template.get("state", {}).get("id"):
            remapped_state_id = self.state_map.get(str(remapped_template["state"]["id"]))
            if remapped_state_id:
                remapped_template["state"] = {
                    **remapped_template["state"],
                    "id": str(remapped_state_id),
                }
            else:
                logger.warning(
                    "[Templates] Could not remap state %s in workitem template — clearing field",
                    remapped_template["state"]["id"],
                )
                remapped_template["state"] = {}

        if remapped_template.get("type", {}).get("id"):
            remapped_type_id = self.issue_type_map.get(str(remapped_template["type"]["id"]))
            if remapped_type_id:
                remapped_template["type"] = {
                    **remapped_template["type"],
                    "id": str(remapped_type_id),
                }
            else:
                logger.warning(
                    "[Templates] Could not remap type %s in workitem template — clearing field",
                    remapped_template["type"]["id"],
                )
                remapped_template["type"] = {}

        if remapped_template.get("parent", {}).get("id"):
            remapped_parent_id = self.issue_map.get(str(remapped_template["parent"]["id"]))
            if remapped_parent_id:
                remapped_template["parent"] = {
                    **remapped_template["parent"],
                    "id": str(remapped_parent_id),
                }
            else:
                logger.warning(
                    "[Templates] Could not remap parent %s in workitem template — clearing field",
                    remapped_template["parent"]["id"],
                )
                remapped_template["parent"] = {}

        remapped_assignees = []
        for assignee in remapped_template.get("assignees") or []:
            mapped_id = self.member_map.get(str(assignee.get("id")))
            if mapped_id:
                remapped_assignees.append({**assignee, "id": str(mapped_id)})
            else:
                logger.warning(
                    "[Templates] Could not remap assignee %s in workitem template — dropping entry", assignee.get("id")
                )
        remapped_template["assignees"] = remapped_assignees

        remapped_labels = []
        for label in remapped_template.get("labels") or []:
            mapped_id = self.label_map.get(str(label.get("id")))
            if mapped_id:
                remapped_labels.append({**label, "id": str(mapped_id)})
            else:
                logger.warning(
                    "[Templates] Could not remap label %s in workitem template — dropping entry", label.get("id")
                )
        remapped_template["labels"] = remapped_labels

        remapped_modules = []
        for module in remapped_template.get("modules") or []:
            mapped_id = self.module_map.get(str(module.get("id")))
            if mapped_id:
                remapped_modules.append({**module, "id": str(mapped_id)})
            else:
                logger.warning(
                    "[Templates] Could not remap module %s in workitem template — dropping entry", module.get("id")
                )
        remapped_template["modules"] = remapped_modules

        remapped_properties = []
        for property_value in remapped_template.get("properties") or []:
            new_property_value = property_value.copy()
            mapped_property_id = self.issue_property_map.get(str(property_value.get("id")))
            if not mapped_property_id:
                logger.warning(
                    "[Templates] Could not remap property %s in workitem template — dropping entry",
                    property_value.get("id"),
                )
                continue
            new_property_value["id"] = str(mapped_property_id)
            source_property = IssueProperty.objects.filter(id=property_value.get("id")).values("property_type").first()
            property_type = source_property.get("property_type") if source_property else None
            if property_type == "OPTION":
                remapped_option_values = []
                for value in property_value.get("values", []):
                    mapped_option = self.issue_property_option_map.get(str(value))
                    if mapped_option:
                        remapped_option_values.append(str(mapped_option))
                    else:
                        logger.warning(
                            "[Templates] Could not remap property option %s in workitem template — dropping option",
                            value,
                        )
                new_property_value["values"] = remapped_option_values
            elif property_type == "RELATION":
                remapped_relation_values = []
                for value in property_value.get("values", []):
                    mapped_issue = self.issue_map.get(str(value))
                    if mapped_issue:
                        remapped_relation_values.append(str(mapped_issue))
                    else:
                        logger.warning(
                            "[Templates] Could not remap relation issue %s in workitem template"
                            " property — dropping entry",
                            value,
                        )
                new_property_value["values"] = remapped_relation_values
            remapped_properties.append(new_property_value)
        remapped_template["properties"] = remapped_properties

        return remapped_template

    def _update_project_references(self, target_workspace):
        for project in Project.objects.filter(workspace=self.source_workspace).values(
            "id", "default_state_id", "estimate_id"
        ):
            target_project_id = self.project_map.get(str(project.get("id")))
            if not target_project_id:
                continue

            update_fields = {}
            if project.get("default_state_id"):
                mapped_state_id = self.state_map.get(str(project.get("default_state_id")))
                if mapped_state_id:
                    update_fields["default_state_id"] = mapped_state_id

            if project.get("estimate_id"):
                mapped_estimate_id = self.estimate_map.get(str(project.get("estimate_id")))
                if mapped_estimate_id:
                    update_fields["estimate_id"] = mapped_estimate_id

            if update_fields:
                Project.objects.filter(id=target_project_id, workspace=target_workspace).update(**update_fields)

    def initialize_workspace_copy(self):
        steps = [
            ("Workspace Features", self._copy_workspace_feature),
            ("Workspace Members", self._copy_workspace_members),
            ("Projects & Members", self._copy_projects_and_members),
            ("Project Meta", self._copy_project_meta),
            ("States", self._copy_workspace_states),
            ("Labels", self._copy_workspace_labels),
            ("Issue Types", self._copy_workspace_issue_types),
            ("Estimates", self._copy_workspace_estimates),
            ("Project References", self._update_project_references),
            ("Issue Properties", self._copy_issue_properties),
            ("Workflows", self._copy_workflows),
            ("Modules", self._copy_modules),
            ("Cycles", self._copy_cycles),
            ("Parent Issues", self._copy_parent_issues),
            ("Child Issues", self._copy_issues),
            ("Issue Meta", self._copy_issue_meta),
            ("Cycle Issues", self._copy_cycle_issues),
            ("Module Issues", self._copy_module_issues),
            ("Pages", self._copy_pages),
            ("Project Pages", self._copy_project_pages),
            ("Intakes", self._copy_intakes),
            ("Intake Meta", self._copy_intake_meta),
            ("Milestones", self._copy_milestones),
            ("Milestone Issues", self._copy_milestone_issues),
            ("Views", self._copy_views),
            ("Project Updates", self._copy_project_updates),
            ("Automations", self._copy_automations),
            ("Templates", self._copy_templates),
            ("Recurring Work Items", self._copy_recurring_workitem_tasks),
            ("Dashboards", self._copy_dashboards),
            ("Initiative Labels", self._copy_initiative_labels),
            ("Initiatives", self._copy_initiatives),
            ("Initiative Meta", self._copy_initiative_meta),
            ("Initiative Reactions", self._copy_initiative_reactions),
            ("Teamspaces", self._copy_teamspaces),
            ("Teamspace Meta", self._copy_teamspace_meta),
            ("Customers", self._copy_customers),
            ("Customer Meta", self._copy_customer_meta),
        ]

        total_start = time.time()
        logger.info("=" * 60)
        logger.info("WORKSPACE COPY STARTED")
        logger.info("  Source: %s", self.source_workspace_slug)
        logger.info("  Target: %s", self.target_workspace_slug)
        logger.info("=" * 60)

        for index, (step_name, step_fn) in enumerate(steps, 1):
            step_start = time.time()
            logger.info("[Step %d/%d] %s ...", index, len(steps), step_name)
            try:
                step_fn(self.target_workspace)
                elapsed = time.time() - step_start
                logger.info("[Step %d/%d] %s completed (%.2fs)", index, len(steps), step_name, elapsed)
            except Exception:
                elapsed = time.time() - step_start
                logger.exception("[Step %d/%d] %s FAILED after %.2fs", index, len(steps), step_name, elapsed)
                raise

        total_elapsed = time.time() - total_start
        logger.info("=" * 60)
        logger.info("WORKSPACE COPY COMPLETED in %.2fs", total_elapsed)
        self._log_final_summary()
        logger.info("=" * 60)

    def _log_final_summary(self):
        summary_items = [
            ("Projects", self.project_map),
            ("Members", self.member_map),
            ("States", self.state_map),
            ("Labels", self.label_map),
            ("Issue Types", self.issue_type_map),
            ("Estimates", self.estimate_map),
            ("Estimate Points", self.estimate_point_map),
            ("Issue Properties", self.issue_property_map),
            ("Issue Property Options", self.issue_property_option_map),
            ("Modules", self.module_map),
            ("Cycles", self.cycle_map),
            ("Issues", self.issue_map),
            ("Comments", self.comment_map),
            ("Pages", self.page_map),
            ("Views", self.view_map),
            ("Intakes", self.intake_map),
            ("Intake Forms", self.intake_form_map),
            ("Milestones", self.milestone_map),
            ("Workflows", self.workflow_map),
            ("Automations", self.automation_map),
            ("Templates", self.template_map),
            ("Dashboards", self.dashboard_map),
            ("Widgets", self.widget_map),
            ("Initiatives", self.initiative_map),
            ("Initiative Labels", self.initiative_label_map),
            ("Teamspaces", self.teamspace_map),
            ("Customers", self.customer_map),
            ("Customer Properties", self.customer_property_map),
            ("Customer Requests", self.customer_request_map),
            ("Descriptions", self.description_map),
        ]
        logger.info("--- Copy Summary ---")
        for name, mapping in summary_items:
            count = len(mapping)
            if count > 0:
                logger.info("  %-25s %d copied", name, count)
            else:
                logger.info("  %-25s (none)", name)

    def _copy_workspace_feature(self, target_workspace):
        workspace_feature = WorkspaceFeature.objects.filter(workspace=self.source_workspace).values().first()
        if workspace_feature:
            try:
                WorkspaceFeature.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(workspace_feature, ["id", "workspace_id"]),
                )
            except IntegrityError:
                # Update the workspace feature if it already exists
                WorkspaceFeature.objects.filter(workspace=target_workspace).update(
                    is_project_grouping_enabled=workspace_feature["is_project_grouping_enabled"],
                    is_initiative_enabled=workspace_feature["is_initiative_enabled"],
                    is_teams_enabled=workspace_feature["is_teams_enabled"],
                    is_customer_enabled=workspace_feature["is_customer_enabled"],
                )

    def _copy_workspace_members(self, target_workspace):
        """
        Copy workspace members from source to target
        """
        source_members = list(
            WorkspaceMember.objects.filter(workspace_id=self.source_workspace.id, is_active=True).values()
        )

        logger.info("[Workspace Members] Copying %d active members", len(source_members))

        WorkspaceMember.objects.bulk_create(
            [
                WorkspaceMember(
                    workspace=target_workspace,
                    is_active=False,
                    **self.clean_data(member.copy(), ["id", "workspace_id", "is_active"]),
                )
                for member in source_members
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        # Users are global — member_id is the same in source and target workspaces.
        # Populate member_map with identity mappings so filter/config remappers can
        # validate assignee references without dropping them.
        for member in source_members:
            member_id = str(member["member_id"])
            self.member_map[member_id] = member["member_id"]

    def _copy_projects_and_members(self, target_workspace):
        """
        Copy projects and their related data
        """
        source_projects = Project.objects.filter(workspace=self.source_workspace).values()

        for project in source_projects:
            logger.debug("[Projects] Copying project: %s", project["name"])
            # Create new project
            try:
                new_project = Project.objects.create(
                    **self.clean_data(project.copy(), ["id", "workspace_id"]),
                    workspace=target_workspace,
                )

                ProjectMember.objects.bulk_create(
                    [
                        ProjectMember(
                            project=new_project,
                            workspace=target_workspace,
                            is_active=False,
                            **self.clean_data(
                                member.copy(),
                                ["id", "project_id", "workspace_id", "is_active"],
                            ),
                        )
                        for member in ProjectMember.objects.filter(project_id=project["id"]).values()
                    ],
                    ignore_conflicts=True,
                    batch_size=1000,
                )
                self.project_map[str(project["id"])] = new_project.id
            except IntegrityError:
                logger.warning(
                    "[Projects] Skipped duplicate project: %s (id=%s)", project.get("name", "?"), project["id"]
                )
                # Handle duplicate project creation
                continue

    def _copy_project_meta(self, target_workspace):
        for project_state in ProjectState.objects.filter(workspace=self.source_workspace).values():
            try:
                new_project_state = ProjectState.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(project_state.copy(), ["id", "workspace_id"]),
                )
                self.project_state_map[str(project_state["id"])] = new_project_state.id
            except IntegrityError:
                logger.warning("[Project Meta] Skipped duplicate project state: %s", project_state.get("name"))
                continue

        ProjectAttribute.objects.bulk_create(
            [
                ProjectAttribute(
                    project_id=self.project_map.get(str(project_attribute.get("project_id"))),
                    state_id=self.project_state_map.get(str(project_attribute.get("state_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        project_attribute,
                        ["id", "project_id", "workspace_id", "state_id"],
                    ),
                )
                for project_attribute in ProjectAttribute.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_attribute.get("project_id")))
            ]
        )

        ProjectFeature.objects.bulk_create(
            [
                ProjectFeature(
                    project_id=self.project_map.get(str(project_feature.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(project_feature.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_feature in ProjectFeature.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_feature.get("project_id")))
            ]
        )

        ProjectLink.objects.bulk_create(
            [
                ProjectLink(
                    project_id=self.project_map.get(str(project_link.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(project_link.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_link in ProjectLink.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_link.get("project_id")))
            ]
        )

        ProjectComment.objects.bulk_create(
            [
                ProjectComment(
                    project_id=self.project_map.get(str(project_comment.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(project_comment.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_comment in ProjectComment.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_comment.get("project_id")))
            ]
        )

    def _copy_workspace_states(self, target_workspace):
        """
        Copy workspace-level states (not associated with any project)
        """
        # Use the inclusive manager so triage states are copied too.
        source_states = State.all_state_objects.filter(
            workspace_id=self.source_workspace.id,
            deleted_at__isnull=True,
        ).values()

        for state in source_states:
            # Handle parent state relationship
            if self.project_map.get(str(state.get("project_id"))):
                new_state = State(
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(state.get("project_id"))),
                    **self.clean_data(state.copy(), ["id", "project_id", "workspace_id"]),
                )
                new_state.save()

                self.state_map[str(state["id"])] = new_state.id

    def _copy_workspace_labels(self, target_workspace):
        """
        Copy workspace-level labels (not associated with any project)
        """
        source_labels = Label.objects.filter(workspace_id=self.source_workspace.id).values()

        for label in source_labels:
            # Handle parent label relationship
            try:
                new_label = Label.objects.create(
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(label.get("project_id"))),
                    **self.clean_data(label.copy(), ["id", "project_id", "workspace_id"]),
                )
                self.label_map[str(label["id"])] = new_label.id
            except IntegrityError as e:
                logger.warning("[Labels] Skipped duplicate label: %s — %s", label.get("name"), e)

    def _copy_workspace_estimates(self, target_workspace):
        estimates = Estimate.objects.filter(workspace=self.source_workspace).values()
        for estimate in estimates:
            # Handle parent label relationship
            new_estimate = Estimate.objects.create(
                workspace=target_workspace,
                project_id=self.project_map.get(str(estimate.get("project_id"))),
                **self.clean_data(estimate.copy(), ["id", "project_id", "workspace_id"]),
            )
            self.estimate_map[str(estimate["id"])] = new_estimate.id

        for estimate_point in EstimatePoint.objects.filter(workspace=self.source_workspace).values():
            new_estimate_point = EstimatePoint.objects.create(
                estimate_id=self.estimate_map.get(str(estimate_point.get("estimate_id"))),
                project_id=self.project_map.get(str(estimate_point.get("project_id"))),
                workspace_id=target_workspace.id,
                **self.clean_data(
                    estimate_point.copy(),
                    ["id", "estimate_id", "project_id", "workspace_id"],
                ),
            )
            self.estimate_point_map[str(estimate_point["id"])] = new_estimate_point.id

    def _copy_workspace_issue_types(self, target_workspace):
        """
        Copy workspace-level issue types (not associated with any project)
        """
        source_types = IssueType.objects.filter(workspace=self.source_workspace).values()

        for type in source_types:
            # Handle parent label relationship
            try:
                new_type = IssueType.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(type.copy(), ["id", "workspace_id"]),
                )
                self.issue_type_map[str(type["id"])] = new_type.id
            except Exception as e:
                logger.error("[Issue Types] Failed to copy issue type '%s': %s", type.get("name", "?"), e)

        ProjectIssueType.objects.bulk_create(
            [
                ProjectIssueType(
                    project_id=self.project_map.get(str(project_type.get("project_id"))),
                    issue_type_id=self.issue_type_map.get(str(project_type.get("issue_type_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        project_type,
                        ["id", "project_id", "issue_type_id", "workspace_id"],
                    ),
                )
                for project_type in ProjectIssueType.objects.filter(workspace=self.source_workspace).values()
                if str(project_type.get("project_id")) in self.project_map
                and str(project_type.get("issue_type_id")) in self.issue_type_map
            ]
        )

    def _copy_issue_properties(self, target_workspace):
        for issue_property in IssueProperty.objects.filter(workspace=self.source_workspace).values():
            try:
                new_issue_property = IssueProperty.objects.create(
                    project_id=self.project_map.get(str(issue_property["project_id"])),
                    workspace=target_workspace,
                    issue_type_id=self.issue_type_map.get(str(issue_property["issue_type_id"])),
                    **self.clean_data(
                        issue_property.copy(),
                        ["id", "project_id", "workspace_id", "issue_type_id"],
                    ),
                )
                self.issue_property_map[str(issue_property["id"])] = new_issue_property.id
            except Exception as e:
                logger.error("[Issue Properties] Failed to copy property: %s", e)
                continue

        for option in IssuePropertyOption.objects.filter(workspace=self.source_workspace).values():
            try:
                if self.issue_property_map.get(str(option.get("property_id"))) and self.project_map.get(
                    str(option.get("project_id"))
                ):
                    new_option = IssuePropertyOption.objects.create(
                        property_id=self.issue_property_map.get(str(option.get("property_id"))),
                        workspace=target_workspace,
                        project_id=self.project_map.get(str(option.get("project_id"))),
                        **self.clean_data(
                            option.copy(),
                            ["id", "property_id", "project_id", "workspace_id"],
                        ),
                    )
                    self.issue_property_option_map[str(option["id"])] = new_option.id
            except Exception as e:
                logger.error("[Issue Properties] Failed to copy option '%s': %s", option["name"], e)
                continue

    def _copy_workflows(self, target_workspace):
        for workflow in Workflow.objects.filter(workspace=self.source_workspace).values():
            target_project_id = self.project_map.get(str(workflow.get("project_id")))
            if workflow.get("project_id") and not target_project_id:
                continue

            new_workflow = Workflow.objects.create(
                workspace=target_workspace,
                project_id=target_project_id,
                **self.clean_data(workflow.copy(), ["id", "workspace_id", "project_id"]),
            )
            self.workflow_map[str(workflow.get("id"))] = new_workflow.id

        WorkflowWorkItemType.objects.bulk_create(
            [
                WorkflowWorkItemType(
                    workflow_id=self.workflow_map.get(str(workflow_work_item_type.get("workflow_id"))),
                    work_item_type_id=self.issue_type_map.get(str(workflow_work_item_type.get("work_item_type_id")))
                    if workflow_work_item_type.get("work_item_type_id")
                    else None,
                    project_id=self.project_map.get(str(workflow_work_item_type.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        workflow_work_item_type.copy(),
                        ["id", "workspace_id", "project_id", "workflow_id", "work_item_type_id"],
                    ),
                )
                for workflow_work_item_type in WorkflowWorkItemType.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.workflow_map.get(str(workflow_work_item_type.get("workflow_id")))
                and self.project_map.get(str(workflow_work_item_type.get("project_id")))
                and (
                    workflow_work_item_type.get("work_item_type_id") is None
                    or self.issue_type_map.get(str(workflow_work_item_type.get("work_item_type_id")))
                )
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        for workflow_state in WorkflowState.objects.filter(workspace=self.source_workspace).values():
            workflow_id = (
                self.workflow_map.get(str(workflow_state.get("workflow_id")))
                if workflow_state.get("workflow_id")
                else None
            )
            state_id = self.state_map.get(str(workflow_state.get("state_id")))
            project_id = self.project_map.get(str(workflow_state.get("project_id")))

            if not state_id or not project_id:
                continue

            new_workflow_state = WorkflowState.objects.create(
                workspace=target_workspace,
                workflow_id=workflow_id,
                state_id=state_id,
                project_id=project_id,
                **self.clean_data(
                    workflow_state.copy(),
                    ["id", "workspace_id", "project_id", "workflow_id", "state_id"],
                ),
            )
            self.workflow_state_map[str(workflow_state.get("id"))] = new_workflow_state.id

        for workflow_transition in WorkflowTransition.objects.filter(workspace=self.source_workspace).values():
            workflow_state_id = self.workflow_state_map.get(str(workflow_transition.get("workflow_state_id")))
            project_id = self.project_map.get(str(workflow_transition.get("project_id")))
            transition_state_id = (
                self.state_map.get(str(workflow_transition.get("transition_state_id")))
                if workflow_transition.get("transition_state_id")
                else None
            )
            rejection_state_id = (
                self.state_map.get(str(workflow_transition.get("rejection_state_id")))
                if workflow_transition.get("rejection_state_id")
                else None
            )

            if not workflow_state_id or not project_id:
                continue

            new_workflow_transition = WorkflowTransition.objects.create(
                workspace=target_workspace,
                workflow_state_id=workflow_state_id,
                project_id=project_id,
                transition_state_id=transition_state_id,
                rejection_state_id=rejection_state_id,
                **self.clean_data(
                    workflow_transition.copy(),
                    [
                        "id",
                        "workspace_id",
                        "project_id",
                        "workflow_state_id",
                        "transition_state_id",
                        "rejection_state_id",
                    ],
                ),
            )
            self.workflow_transition_map[str(workflow_transition.get("id"))] = new_workflow_transition.id

        WorkflowTransitionApprover.objects.bulk_create(
            [
                WorkflowTransitionApprover(
                    workflow_state_id=self.workflow_state_map.get(
                        str(workflow_transition_approver.get("workflow_state_id"))
                    ),
                    workflow_transition_id=self.workflow_transition_map.get(
                        str(workflow_transition_approver.get("workflow_transition_id"))
                    ),
                    approver_id=workflow_transition_approver.get("approver_id"),
                    project_id=self.project_map.get(str(workflow_transition_approver.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        workflow_transition_approver.copy(),
                        [
                            "id",
                            "workspace_id",
                            "project_id",
                            "workflow_state_id",
                            "workflow_transition_id",
                            "approver_id",
                        ],
                    ),
                )
                for workflow_transition_approver in WorkflowTransitionApprover.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.workflow_state_map.get(str(workflow_transition_approver.get("workflow_state_id")))
                and self.workflow_transition_map.get(str(workflow_transition_approver.get("workflow_transition_id")))
                and self.project_map.get(str(workflow_transition_approver.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_modules(self, target_workspace):
        for module in Module.objects.filter(workspace=self.source_workspace).values():
            try:
                if self.project_map.get(str(module["project_id"])):
                    new_module = Module.objects.create(
                        project_id=self.project_map.get(str(module["project_id"])),
                        workspace=target_workspace,
                        **self.clean_data(module.copy(), ["id", "project_id", "workspace_id"]),
                    )
                    self.module_map[str(module["id"])] = new_module.id
            except Exception as e:
                logger.error("[Modules] Failed to copy module '%s': %s", module["name"], e)
                continue

    def _copy_cycles(self, target_workspace):
        for cycle in Cycle.objects.filter(workspace=self.source_workspace).values():
            try:
                new_cycle = Cycle.objects.create(
                    project_id=self.project_map.get(str(cycle["project_id"])),
                    workspace=target_workspace,
                    **self.clean_data(cycle.copy(), ["id", "project_id", "workspace_id"]),
                )
                self.cycle_map[str(cycle["id"])] = new_cycle.id
            except Exception as e:
                logger.error("[Cycles] Failed to copy cycle '%s': %s", cycle["name"], e)
                continue

    def _copy_parent_issues(self, target_workspace):
        for issue in Issue.objects.filter(workspace=self.source_workspace, parent__isnull=True).values():
            try:
                new_issue = Issue.objects.create(
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                    type_id=self.issue_type_map.get(str(issue.get("type_id"))),
                    estimate_point_id=self.estimate_point_map.get(str(issue.get("estimate_point_id"))),
                    state_id=self.state_map.get(str(issue.get("state_id"))),
                    **self.clean_data(
                        issue.copy(),
                        [
                            "id",
                            "project_id",
                            "workspace_id",
                            "type_id",
                            "estimate_point_id",
                            "state_id",
                        ],
                    ),
                )
                self.issue_map[str(issue["id"])] = new_issue.id
            except Exception as e:
                logger.error("[Issues] Failed to copy parent issue '%s': %s", issue["name"], e)
                continue

    def _copy_issues(self, target_workspace):
        for issue in Issue.objects.filter(workspace=self.source_workspace, parent__isnull=False).values():
            try:
                new_issue = Issue.objects.create(
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                    type_id=self.issue_type_map.get(str(issue.get("type_id"))),
                    estimate_point_id=self.estimate_point_map.get(str(issue.get("estimate_point_id"))),
                    state_id=self.state_map.get(str(issue.get("state_id"))),
                    parent_id=self.issue_map.get(str(issue.get("parent_id"))),
                    **self.clean_data(
                        issue.copy(),
                        [
                            "id",
                            "project_id",
                            "workspace_id",
                            "type_id",
                            "parent_id",
                            "state_id",
                            "estimate_point_id",
                        ],
                    ),
                )
                self.issue_map[str(issue["id"])] = new_issue.id
            except Exception as e:
                logger.error("[Issues] Failed to copy child issue '%s': %s", issue["name"], e)
                continue

    def _copy_issue_meta(self, target_workspace):
        IssueAssignee.objects.bulk_create(
            [
                IssueAssignee(
                    issue_id=self.issue_map.get(str(assignee.issue_id)),
                    assignee_id=assignee.assignee_id,
                    project_id=self.project_map.get(str(assignee.project_id)),
                    workspace_id=target_workspace.id,
                )
                for assignee in IssueAssignee.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(assignee.project_id)) and self.issue_map.get(str(assignee.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssueRelation.objects.bulk_create(
            [
                IssueRelation(
                    issue_id=self.issue_map.get(str(relation.issue_id)),
                    related_issue_id=self.issue_map.get(str(relation.related_issue_id)),
                    relation_type=relation.relation_type,
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(relation.project_id)),
                )
                for relation in IssueRelation.objects.filter(workspace=self.source_workspace)
                if self.issue_map.get(str(relation.related_issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssueLink.objects.bulk_create(
            [
                IssueLink(
                    issue_id=self.issue_map.get(str(link.issue_id)),
                    title=link.title,
                    url=link.url,
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(link.project_id)),
                )
                for link in IssueLink.objects.filter(workspace=self.source_workspace)
                if self.issue_map.get(str(link.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        issue_comments_to_update = []
        for comment in IssueComment.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(comment.get("project_id")))
            issue_id = self.issue_map.get(str(comment.get("issue_id")))
            if not project_id or not issue_id:
                continue

            issue_comment = IssueComment.objects.create(
                issue_id=issue_id,
                project_id=project_id,
                workspace=target_workspace,
                **self.clean_data(
                    comment.copy(),
                    ["id", "project_id", "workspace_id", "issue_id", "description_id", "parent_id", "source_id"],
                ),
            )
            self.comment_map[str(comment.get("id"))] = issue_comment.id

            if comment.get("parent_id"):
                issue_comments_to_update.append((issue_comment.id, comment.get("parent_id")))

        for issue_comment_id, source_parent_id in issue_comments_to_update:
            parent_id = self.comment_map.get(str(source_parent_id))
            if parent_id:
                IssueComment.objects.filter(id=issue_comment_id).update(parent_id=parent_id)

        IssueLabel.objects.bulk_create(
            [
                IssueLabel(
                    issue_id=self.issue_map.get(str(label.issue_id)),
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(label.project_id)),
                    label_id=self.label_map.get(str(label.label_id)),
                )
                for label in IssueLabel.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(label.project_id))
                and self.issue_map.get(str(label.issue_id))
                and self.label_map.get(str(label.label_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        relation_property_ids = set(
            IssueProperty.objects.filter(workspace=self.source_workspace, property_type="RELATION").values_list(
                "id", flat=True
            )
        )

        issue_property_value_batch = []
        for property_value in IssuePropertyValue.objects.filter(workspace=self.source_workspace).values():
            if not self.project_map.get(str(property_value.get("project_id"))):
                continue
            if not self.issue_map.get(str(property_value.get("issue_id"))):
                continue
            if not self.issue_property_map.get(str(property_value.get("property_id"))):
                continue

            value_uuid = property_value.get("value_uuid")
            if value_uuid and property_value.get("property_id") in relation_property_ids:
                remapped_uuid = self.issue_map.get(str(value_uuid))
                if not remapped_uuid:
                    self._warn_skip(
                        f"IssuePropertyValue[property={property_value.get('property_id')}]",
                        f"could not remap RELATION value_uuid {value_uuid} — dropping row",
                    )
                    continue
                value_uuid = remapped_uuid

            row_data = self.clean_data(
                property_value.copy(),
                ["id", "issue_id", "property_id", "workspace_id", "project_id", "value_option_id", "value_uuid"],
            )
            issue_property_value_batch.append(
                IssuePropertyValue(
                    issue_id=self.issue_map.get(str(property_value.get("issue_id"))),
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(property_value.get("project_id"))),
                    property_id=self.issue_property_map.get(str(property_value.get("property_id"))),
                    value_option_id=self.issue_property_option_map.get(
                        str(property_value.get("value_option_id")) if property_value.get("value_option_id") else None
                    ),
                    value_uuid=value_uuid,
                    **row_data,
                )
            )

        IssuePropertyValue.objects.bulk_create(issue_property_value_batch, batch_size=1000, ignore_conflicts=True)

        IssueWorkLog.objects.bulk_create(
            [
                IssueWorkLog(
                    issue_id=self.issue_map.get(str(work_log.issue_id)),
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(work_log.project_id)),
                    description=work_log.description,
                    logged_by=work_log.logged_by,
                    duration=work_log.duration,
                )
                for work_log in IssueWorkLog.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(work_log.project_id)) and self.issue_map.get(str(work_log.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        EntityIssueStateActivity.objects.bulk_create(
            [
                EntityIssueStateActivity(
                    issue_id=self.issue_map.get(str(entity_issue_state_activity.get("issue_id"))),
                    state_id=self.state_map.get(str(entity_issue_state_activity.get("state_id"))),
                    project_id=self.project_map.get(str(entity_issue_state_activity.get("project_id"))),
                    workspace=target_workspace,
                    cycle_id=self.cycle_map.get(str(entity_issue_state_activity.get("cycle_id"))),
                    estimate_point_id=self.estimate_point_map.get(
                        str(entity_issue_state_activity.get("estimate_point_id"))
                    ),
                    **self.clean_data(
                        entity_issue_state_activity,
                        [
                            "id",
                            "issue_id",
                            "state_id",
                            "project_id",
                            "cycle_id",
                            "workspace_id",
                            "estimate_point_id",
                        ],
                    ),
                )
                for entity_issue_state_activity in EntityIssueStateActivity.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.issue_map.get(str(entity_issue_state_activity.get("issue_id")))
                and self.state_map.get(str(entity_issue_state_activity.get("state_id")))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        entity_progress_batch = []
        for entity_progress in EntityProgress.objects.filter(workspace=self.source_workspace).values():
            project_id = (
                self.project_map.get(str(entity_progress.get("project_id")))
                if entity_progress.get("project_id")
                else None
            )
            cycle_id = (
                self.cycle_map.get(str(entity_progress.get("cycle_id"))) if entity_progress.get("cycle_id") else None
            )
            module_id = (
                self.module_map.get(str(entity_progress.get("module_id"))) if entity_progress.get("module_id") else None
            )

            if entity_progress.get("project_id") and not project_id:
                continue
            if entity_progress.get("cycle_id") and not cycle_id:
                continue
            if entity_progress.get("module_id") and not module_id:
                continue

            entity_progress_batch.append(
                EntityProgress(
                    project_id=project_id,
                    cycle_id=cycle_id,
                    module_id=module_id,
                    workspace=target_workspace,
                    **self.clean_data(
                        entity_progress.copy(),
                        ["id", "workspace_id", "cycle_id", "module_id", "project_id"],
                    ),
                )
            )

        EntityProgress.objects.bulk_create(entity_progress_batch, batch_size=1000, ignore_conflicts=True)

    def _copy_cycle_issues(self, target_workspace):
        CycleIssue.objects.bulk_create(
            [
                CycleIssue(
                    cycle_id=self.cycle_map.get(str(cycle_issue.cycle_id)),
                    issue_id=self.issue_map.get(str(cycle_issue.issue_id)),
                    project_id=self.project_map.get(str(cycle_issue.project_id)),
                    workspace=target_workspace,
                )
                for cycle_issue in CycleIssue.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(cycle_issue.project_id))
                and self.issue_map.get(str(cycle_issue.issue_id))
                and self.cycle_map.get(str(cycle_issue.cycle_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_module_issues(self, target_workspace):
        ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    module_id=self.module_map.get(str(module_issue.module_id)),
                    issue_id=self.issue_map.get(str(module_issue.issue_id)),
                    project_id=self.project_map.get(str(module_issue.project_id)),
                    workspace=target_workspace,
                )
                for module_issue in ModuleIssue.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(module_issue.project_id))
                and self.issue_map.get(str(module_issue.issue_id))
                and self.module_map.get(str(module_issue.module_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_pages(self, target_workspace):
        for page in Page.objects.filter(workspace=self.source_workspace).values():
            new_page = Page.objects.create(
                workspace=target_workspace,
                **self.clean_data(page.copy(), ["id", "workspace_id"]),
            )
            self.page_map[str(page["id"])] = new_page.id

    def _copy_project_pages(self, target_workspace):
        ProjectPage.objects.bulk_create(
            [
                ProjectPage(
                    project_id=self.project_map.get(str(project_page.project_id)),
                    page_id=self.page_map.get(str(project_page.page_id)),
                    workspace=target_workspace,
                )
                for project_page in ProjectPage.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(project_page.project_id)) and self.page_map.get(str(project_page.page_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_views(self, target_workspace):
        for view in IssueView.objects.filter(workspace=self.source_workspace, project__isnull=True).values():
            self._create_issue_view_copy(view, target_workspace)

        for view in IssueView.objects.filter(workspace=self.source_workspace, project__isnull=False).values():
            project_id = self.project_map.get(str(view.get("project_id")))
            if project_id:
                self._create_issue_view_copy(view, target_workspace, project_id=project_id)

    def _copy_intakes(self, target_workspace):
        for intake in Intake.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(intake.get("project_id")))
            if not project_id:
                continue

            new_intake = Intake.objects.create(
                workspace=target_workspace,
                project_id=project_id,
                **self.clean_data(intake.copy(), ["id", "workspace_id", "project_id"]),
            )
            self.intake_map[str(intake.get("id"))] = new_intake.id

    def _copy_intake_meta(self, target_workspace):
        IntakeIssue.objects.bulk_create(
            [
                IntakeIssue(
                    intake_id=self.intake_map.get(str(intake_issue.get("intake_id"))),
                    issue_id=self.issue_map.get(str(intake_issue.get("issue_id"))),
                    duplicate_to_id=self.issue_map.get(str(intake_issue.get("duplicate_to_id")))
                    if intake_issue.get("duplicate_to_id")
                    else None,
                    project_id=self.project_map.get(str(intake_issue.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        intake_issue.copy(),
                        ["id", "workspace_id", "project_id", "intake_id", "issue_id", "duplicate_to_id"],
                    ),
                )
                for intake_issue in IntakeIssue.objects.filter(workspace=self.source_workspace).values()
                if self.intake_map.get(str(intake_issue.get("intake_id")))
                and self.issue_map.get(str(intake_issue.get("issue_id")))
                and self.project_map.get(str(intake_issue.get("project_id")))
                and (
                    intake_issue.get("duplicate_to_id") is None
                    or self.issue_map.get(str(intake_issue.get("duplicate_to_id")))
                )
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        IntakeSetting.objects.bulk_create(
            [
                IntakeSetting(
                    intake_id=self.intake_map.get(str(intake_setting.get("intake_id"))),
                    project_id=self.project_map.get(str(intake_setting.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        intake_setting.copy(),
                        ["id", "workspace_id", "project_id", "intake_id"],
                    ),
                )
                for intake_setting in IntakeSetting.objects.filter(workspace=self.source_workspace).values()
                if self.intake_map.get(str(intake_setting.get("intake_id")))
                and self.project_map.get(str(intake_setting.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        IntakeResponsibility.objects.bulk_create(
            [
                IntakeResponsibility(
                    intake_id=self.intake_map.get(str(intake_responsibility.get("intake_id"))),
                    user_id=intake_responsibility.get("user_id"),
                    project_id=self.project_map.get(str(intake_responsibility.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        intake_responsibility.copy(),
                        ["id", "workspace_id", "project_id", "intake_id", "user_id"],
                    ),
                )
                for intake_responsibility in IntakeResponsibility.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.intake_map.get(str(intake_responsibility.get("intake_id")))
                and self.project_map.get(str(intake_responsibility.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        for intake_form in IntakeForm.objects.filter(workspace=self.source_workspace).values():
            intake_id = self.intake_map.get(str(intake_form.get("intake_id")))
            project_id = self.project_map.get(str(intake_form.get("project_id")))
            work_item_type_id = self.issue_type_map.get(str(intake_form.get("work_item_type_id")))

            if not intake_id or not project_id or not work_item_type_id:
                continue

            new_intake_form = IntakeForm.objects.create(
                workspace=target_workspace,
                intake_id=intake_id,
                project_id=project_id,
                work_item_type_id=work_item_type_id,
                **self.clean_data(
                    intake_form.copy(),
                    ["id", "workspace_id", "project_id", "intake_id", "work_item_type_id", "anchor"],
                ),
            )
            self.intake_form_map[str(intake_form.get("id"))] = new_intake_form.id

        IntakeFormField.objects.bulk_create(
            [
                IntakeFormField(
                    intake_form_id=self.intake_form_map.get(str(intake_form_field.get("intake_form_id"))),
                    work_item_property_id=self.issue_property_map.get(
                        str(intake_form_field.get("work_item_property_id"))
                    ),
                    project_id=self.project_map.get(str(intake_form_field.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        intake_form_field.copy(),
                        [
                            "id",
                            "workspace_id",
                            "project_id",
                            "intake_form_id",
                            "work_item_property_id",
                        ],
                    ),
                )
                for intake_form_field in IntakeFormField.objects.filter(workspace=self.source_workspace).values()
                if self.intake_form_map.get(str(intake_form_field.get("intake_form_id")))
                and self.issue_property_map.get(str(intake_form_field.get("work_item_property_id")))
                and self.project_map.get(str(intake_form_field.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        for intake_email in IntakeEmail.objects.filter(workspace=self.source_workspace).values():
            intake_id = self.intake_map.get(str(intake_email.get("intake_id")))
            project_id = self.project_map.get(str(intake_email.get("project_id")))
            work_item_id = (
                self.issue_map.get(str(intake_email.get("work_item_id"))) if intake_email.get("work_item_id") else None
            )

            if not intake_id or not project_id:
                continue

            IntakeEmail.objects.create(
                workspace=target_workspace,
                intake_id=intake_id,
                project_id=project_id,
                work_item_id=work_item_id,
                **self.clean_data(
                    intake_email.copy(),
                    ["id", "workspace_id", "project_id", "intake_id", "work_item_id", "anchor"],
                ),
            )

    def _copy_milestones(self, target_workspace):
        for milestone in Milestone.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(milestone.get("project_id")))
            if not project_id:
                continue

            description_id = self._copy_description(milestone.get("description_id"), project_id, target_workspace)
            if not description_id:
                continue

            new_milestone = Milestone.objects.create(
                workspace=target_workspace,
                project_id=project_id,
                description_id=description_id,
                **self.clean_data(
                    milestone.copy(),
                    ["id", "workspace_id", "project_id", "description_id"],
                ),
            )
            self.milestone_map[str(milestone.get("id"))] = new_milestone.id

    def _copy_milestone_issues(self, target_workspace):
        MilestoneIssue.objects.bulk_create(
            [
                MilestoneIssue(
                    milestone_id=self.milestone_map.get(str(milestone_issue.get("milestone_id"))),
                    issue_id=self.issue_map.get(str(milestone_issue.get("issue_id"))),
                    project_id=self.project_map.get(str(milestone_issue.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        milestone_issue.copy(),
                        ["id", "workspace_id", "project_id", "milestone_id", "issue_id"],
                    ),
                )
                for milestone_issue in MilestoneIssue.objects.filter(workspace=self.source_workspace).values()
                if self.milestone_map.get(str(milestone_issue.get("milestone_id")))
                and self.issue_map.get(str(milestone_issue.get("issue_id")))
                and self.project_map.get(str(milestone_issue.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_project_updates(self, target_workspace):
        pending_updates = list(EntityUpdates.objects.filter(workspace=self.source_workspace).values())

        while pending_updates:
            created_in_pass = 0
            next_pending_updates = []

            for entity_update in pending_updates:
                parent_id = entity_update.get("parent_id")
                project_id = (
                    self.project_map.get(str(entity_update.get("project_id")))
                    if entity_update.get("project_id")
                    else None
                )
                cycle_id = (
                    self.cycle_map.get(str(entity_update.get("cycle_id"))) if entity_update.get("cycle_id") else None
                )
                module_id = (
                    self.module_map.get(str(entity_update.get("module_id"))) if entity_update.get("module_id") else None
                )
                epic_id = (
                    self.issue_map.get(str(entity_update.get("epic_id"))) if entity_update.get("epic_id") else None
                )

                if entity_update.get("project_id") and not project_id:
                    continue
                if entity_update.get("cycle_id") and not cycle_id:
                    continue
                if entity_update.get("module_id") and not module_id:
                    continue
                if entity_update.get("epic_id") and not epic_id:
                    continue

                if parent_id and not self.entity_update_map.get(str(parent_id)):
                    next_pending_updates.append(entity_update)
                    continue

                new_entity_update = EntityUpdates.objects.create(
                    workspace=target_workspace,
                    project_id=project_id,
                    cycle_id=cycle_id,
                    module_id=module_id,
                    epic_id=epic_id,
                    parent_id=self.entity_update_map.get(str(parent_id)) if parent_id else None,
                    **self.clean_data(
                        entity_update.copy(),
                        ["id", "workspace_id", "project_id", "cycle_id", "module_id", "epic_id", "parent_id"],
                    ),
                )
                self.entity_update_map[str(entity_update.get("id"))] = new_entity_update.id
                created_in_pass += 1

            if created_in_pass == 0:
                if next_pending_updates:
                    logger.warning(
                        "[Project Updates] Skipped %d updates with unresolved parent references",
                        len(next_pending_updates),
                    )
                break

            pending_updates = next_pending_updates

        UpdateReaction.objects.bulk_create(
            [
                UpdateReaction(
                    update_id=self.entity_update_map.get(str(update_reaction.get("update_id"))),
                    project_id=self.project_map.get(str(update_reaction.get("project_id"))),
                    actor_id=update_reaction.get("actor_id"),
                    workspace=target_workspace,
                    **self.clean_data(
                        update_reaction.copy(),
                        ["id", "workspace_id", "project_id", "update_id", "actor_id"],
                    ),
                )
                for update_reaction in UpdateReaction.objects.filter(workspace=self.source_workspace).values()
                if self.entity_update_map.get(str(update_reaction.get("update_id")))
                and self.project_map.get(str(update_reaction.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_automations(self, target_workspace):
        source_automations = []
        for automation in Automation.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(automation.get("project_id")))
            if not project_id:
                continue

            source_automations.append(automation)
            new_automation = Automation.objects.create(
                workspace=target_workspace,
                project_id=project_id,
                current_version_id=None,
                bot_user_id=None,
                is_enabled=False,
                **self.clean_data(
                    automation.copy(),
                    ["id", "workspace_id", "project_id", "current_version_id", "bot_user_id", "is_enabled"],
                ),
            )
            self.automation_map[str(automation.get("id"))] = new_automation.id

        for automation_version in AutomationVersion.objects.filter(workspace=self.source_workspace).values():
            automation_id = self.automation_map.get(str(automation_version.get("automation_id")))
            project_id = self.project_map.get(str(automation_version.get("project_id")))
            if not automation_id or not project_id:
                continue

            new_automation_version = AutomationVersion.objects.create(
                workspace=target_workspace,
                automation_id=automation_id,
                project_id=project_id,
                configuration=self._remap_automation_payload(
                    automation_version.get("configuration", {}),
                    f"AutomationVersion[{automation_version.get('id')}].configuration",
                ),
                **self.clean_data(
                    automation_version.copy(),
                    ["id", "workspace_id", "project_id", "automation_id", "configuration"],
                ),
            )
            self.automation_version_map[str(automation_version.get("id"))] = new_automation_version.id

        for automation_node in AutomationNode.objects.filter(workspace=self.source_workspace).values():
            version_id = self.automation_version_map.get(str(automation_node.get("version_id")))
            project_id = self.project_map.get(str(automation_node.get("project_id")))
            if not version_id or not project_id:
                continue

            new_automation_node = AutomationNode.objects.create(
                workspace=target_workspace,
                version_id=version_id,
                project_id=project_id,
                config=self._remap_automation_node_config(
                    automation_node.get("handler_name"),
                    automation_node.get("config", {}),
                    f"AutomationNode[{automation_node.get('id')}].config",
                ),
                **self.clean_data(
                    automation_node.copy(),
                    ["id", "workspace_id", "project_id", "version_id", "config"],
                ),
            )
            self.automation_node_map[str(automation_node.get("id"))] = new_automation_node.id

        AutomationEdge.objects.bulk_create(
            [
                AutomationEdge(
                    version_id=self.automation_version_map.get(str(automation_edge.get("version_id"))),
                    source_node_id=self.automation_node_map.get(str(automation_edge.get("source_node_id"))),
                    target_node_id=self.automation_node_map.get(str(automation_edge.get("target_node_id"))),
                    project_id=self.project_map.get(str(automation_edge.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        automation_edge.copy(),
                        [
                            "id",
                            "workspace_id",
                            "project_id",
                            "version_id",
                            "source_node_id",
                            "target_node_id",
                        ],
                    ),
                )
                for automation_edge in AutomationEdge.objects.filter(workspace=self.source_workspace).values()
                if self.automation_version_map.get(str(automation_edge.get("version_id")))
                and self.automation_node_map.get(str(automation_edge.get("source_node_id")))
                and self.automation_node_map.get(str(automation_edge.get("target_node_id")))
                and self.project_map.get(str(automation_edge.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        for automation in source_automations:
            current_version_id = (
                self.automation_version_map.get(str(automation.get("current_version_id")))
                if automation.get("current_version_id")
                else None
            )
            if current_version_id:
                Automation.objects.filter(id=self.automation_map.get(str(automation.get("id")))).update(
                    current_version_id=current_version_id
                )

    def _copy_templates(self, target_workspace):
        for template in Template.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(template.get("project_id"))) if template.get("project_id") else None
            new_template = Template.objects.create(
                workspace=target_workspace,
                project_id=project_id,
                cover_image_asset_id=None,
                **self.clean_data(
                    template.copy(),
                    ["id", "workspace_id", "project_id", "short_id", "cover_image_asset_id"],
                ),
            )
            self.template_map[str(template.get("id"))] = new_template.id

        for project_template in ProjectTemplate.objects.filter(workspace=self.source_workspace).values():
            new_project_template = ProjectTemplate.objects.create(
                workspace=target_workspace,
                template_id=self.template_map.get(str(project_template.get("template_id")))
                if project_template.get("template_id")
                else None,
                **self.clean_data(project_template.copy(), ["id", "workspace_id", "template_id"]),
            )
            self.project_template_map[str(project_template.get("id"))] = new_project_template.id

        for page_template in PageTemplate.objects.filter(workspace=self.source_workspace).values():
            template_id = self.template_map.get(str(page_template.get("template_id")))
            project_id = (
                self.project_map.get(str(page_template.get("project_id"))) if page_template.get("project_id") else None
            )
            if not template_id:
                continue

            new_page_template = PageTemplate.objects.create(
                workspace=target_workspace,
                template_id=template_id,
                project_id=project_id,
                **self.clean_data(page_template.copy(), ["id", "workspace_id", "project_id", "template_id"]),
            )
            self.page_template_map[str(page_template.get("id"))] = new_page_template.id

        pending_workitem_templates = list(WorkitemTemplate.objects.filter(workspace=self.source_workspace).values())

        while pending_workitem_templates:
            created_in_pass = 0
            next_pending_workitem_templates = []

            for workitem_template in pending_workitem_templates:
                project_id = (
                    self.project_map.get(str(workitem_template.get("project_id")))
                    if workitem_template.get("project_id")
                    else None
                )
                template_id = (
                    self.template_map.get(str(workitem_template.get("template_id")))
                    if workitem_template.get("template_id")
                    else None
                )
                project_template_id = (
                    self.project_template_map.get(str(workitem_template.get("project_template_id")))
                    if workitem_template.get("project_template_id")
                    else None
                )
                parent_workitem_template_id = (
                    self.workitem_template_map.get(str(workitem_template.get("parent_workitem_template_id")))
                    if workitem_template.get("parent_workitem_template_id")
                    else None
                )

                if workitem_template.get("project_id") and not project_id:
                    continue
                if workitem_template.get("template_id") and not template_id:
                    continue
                if workitem_template.get("project_template_id") and not project_template_id:
                    continue
                if workitem_template.get("parent_workitem_template_id") and not parent_workitem_template_id:
                    next_pending_workitem_templates.append(workitem_template)
                    continue

                remapped_workitem_template = self._remap_workitem_template_payload(workitem_template)
                new_workitem_template = WorkitemTemplate.objects.create(
                    workspace=target_workspace,
                    project_id=project_id,
                    template_id=template_id,
                    project_template_id=project_template_id,
                    parent_workitem_template_id=parent_workitem_template_id,
                    **self.clean_data(
                        remapped_workitem_template.copy(),
                        [
                            "id",
                            "workspace_id",
                            "project_id",
                            "template_id",
                            "project_template_id",
                            "parent_workitem_template_id",
                        ],
                    ),
                )
                self.workitem_template_map[str(workitem_template.get("id"))] = new_workitem_template.id
                created_in_pass += 1

            if created_in_pass == 0:
                if next_pending_workitem_templates:
                    logger.warning(
                        "[Templates] Skipped %d workitem templates with unresolved parent references",
                        len(next_pending_workitem_templates),
                    )
                break

            pending_workitem_templates = next_pending_workitem_templates

    def _copy_recurring_workitem_tasks(self, target_workspace):
        for recurring_workitem_task in RecurringWorkitemTask.objects.filter(workspace=self.source_workspace).values():
            project_id = self.project_map.get(str(recurring_workitem_task.get("project_id")))
            workitem_blueprint_id = self.workitem_template_map.get(
                str(recurring_workitem_task.get("workitem_blueprint_id"))
            )
            if not project_id or not workitem_blueprint_id:
                continue

            new_recurring_workitem_task = RecurringWorkitemTask(
                workspace=target_workspace,
                project_id=project_id,
                workitem_blueprint_id=workitem_blueprint_id,
                periodic_task_id=None,
                **self.clean_data(
                    recurring_workitem_task.copy(),
                    ["id", "workspace_id", "project_id", "workitem_blueprint_id", "periodic_task_id"],
                ),
            )
            new_recurring_workitem_task.save(skip_scheduler=True, disable_auto_set_user=True)

    def _copy_dashboards(self, target_workspace):
        for widget in Widget.objects.filter(workspace=self.source_workspace).values():
            new_widget = Widget.objects.create(
                workspace=target_workspace,
                config=self._remap_widget_config(
                    widget.get("config", {}),
                    f"Widget[{widget.get('id')}].config",
                ),
                **self.clean_data(widget.copy(), ["id", "workspace_id", "config"]),
            )
            self.widget_map[str(widget.get("id"))] = new_widget.id

        for dashboard in Dashboard.objects.filter(workspace=self.source_workspace).values():
            new_dashboard = Dashboard.objects.create(
                workspace=target_workspace,
                filters=self._remap_filter_expression(
                    dashboard.get("filters", {}),
                    f"Dashboard[{dashboard.get('id')}].filters",
                )
                or {},
                **self.clean_data(dashboard.copy(), ["id", "workspace_id", "filters"]),
            )
            self.dashboard_map[str(dashboard.get("id"))] = new_dashboard.id

        DashboardWidget.objects.bulk_create(
            [
                DashboardWidget(
                    dashboard_id=self.dashboard_map.get(str(dashboard_widget.get("dashboard_id"))),
                    widget_id=self.widget_map.get(str(dashboard_widget.get("widget_id"))),
                    workspace=target_workspace,
                    filters=self._remap_filter_expression(
                        dashboard_widget.get("filters", {}),
                        f"DashboardWidget[{dashboard_widget.get('id')}].filters",
                    )
                    or {},
                    **self.clean_data(
                        dashboard_widget.copy(),
                        ["id", "workspace_id", "dashboard_id", "widget_id", "filters"],
                    ),
                )
                for dashboard_widget in DashboardWidget.objects.filter(workspace=self.source_workspace).values()
                if self.dashboard_map.get(str(dashboard_widget.get("dashboard_id")))
                and self.widget_map.get(str(dashboard_widget.get("widget_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        DashboardProject.objects.bulk_create(
            [
                DashboardProject(
                    dashboard_id=self.dashboard_map.get(str(dashboard_project.get("dashboard_id"))),
                    project_id=self.project_map.get(str(dashboard_project.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        dashboard_project.copy(),
                        ["id", "workspace_id", "dashboard_id", "project_id"],
                    ),
                )
                for dashboard_project in DashboardProject.objects.filter(workspace=self.source_workspace).values()
                if self.dashboard_map.get(str(dashboard_project.get("dashboard_id")))
                and self.project_map.get(str(dashboard_project.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        DashboardQuickFilter.objects.bulk_create(
            [
                DashboardQuickFilter(
                    dashboard_id=self.dashboard_map.get(str(dashboard_quick_filter.get("dashboard_id"))),
                    workspace=target_workspace,
                    filters=self._remap_filter_expression(
                        dashboard_quick_filter.get("filters", {}),
                        f"DashboardQuickFilter[{dashboard_quick_filter.get('id')}].filters",
                    )
                    or {},
                    **self.clean_data(
                        dashboard_quick_filter.copy(),
                        ["id", "workspace_id", "dashboard_id", "filters"],
                    ),
                )
                for dashboard_quick_filter in DashboardQuickFilter.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.dashboard_map.get(str(dashboard_quick_filter.get("dashboard_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_initiative_labels(self, target_workspace):
        for initiative_label in InitiativeLabel.objects.filter(workspace=self.source_workspace).values():
            try:
                new_initiative_label = InitiativeLabel.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(initiative_label.copy(), ["id", "workspace_id"]),
                )
                if new_initiative_label.sort_order != initiative_label.get("sort_order"):
                    InitiativeLabel.objects.filter(id=new_initiative_label.id).update(
                        sort_order=initiative_label.get("sort_order")
                    )
                self.initiative_label_map[str(initiative_label.get("id"))] = new_initiative_label.id
            except IntegrityError as e:
                logger.warning("[Initiative Labels] Skipped duplicate label '%s': %s", initiative_label.get("name"), e)

    def _copy_initiatives(self, target_workspace):
        for initiative in Initiative.objects.filter(workspace=self.source_workspace).values():
            new_initiative = Initiative.objects.create(
                workspace=target_workspace,
                **self.clean_data(initiative.copy(), ["id", "workspace_id"]),
            )
            self.initiative_map[str(initiative.get("id"))] = new_initiative.id

    def _copy_initiative_meta(self, target_workspace):
        InitiativeProject.objects.bulk_create(
            [
                InitiativeProject(
                    initiative_id=self.initiative_map.get(str(initiative_project.get("initiative_id"))),
                    project_id=self.project_map.get(str(initiative_project.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        initiative_project,
                        ["id", "workspace_id", "project_id", "initiative_id"],
                    ),
                )
                for initiative_project in InitiativeProject.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_project.get("initiative_id")))
                and self.project_map.get(str(initiative_project.get("project_id")))
            ],
            ignore_conflicts=True,
        )

        InitiativeEpic.objects.bulk_create(
            [
                InitiativeEpic(
                    initiative_id=self.initiative_map.get(str(initiative_epic.get("initiative_id"))),
                    workspace=target_workspace,
                    epic_id=self.issue_map.get(str(initiative_epic.get("epic_id"))),
                    **self.clean_data(
                        initiative_epic,
                        ["id", "workspace_id", "initiative_id", "epic_id"],
                    ),
                )
                for initiative_epic in InitiativeEpic.objects.filter(workspace=self.source_workspace).values()
                if self.issue_map.get(str(initiative_epic.get("epic_id")))
                and self.initiative_map.get(str(initiative_epic.get("initiative_id")))
            ],
            ignore_conflicts=True,
        )

        InitiativeLabelAssociation.objects.bulk_create(
            [
                InitiativeLabelAssociation(
                    initiative_id=self.initiative_map.get(str(initiative_label_association.get("initiative_id"))),
                    label_id=self.initiative_label_map.get(str(initiative_label_association.get("label_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        initiative_label_association.copy(),
                        ["id", "workspace_id", "initiative_id", "label_id"],
                    ),
                )
                for initiative_label_association in InitiativeLabelAssociation.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.initiative_map.get(str(initiative_label_association.get("initiative_id")))
                and self.initiative_label_map.get(str(initiative_label_association.get("label_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        InitiativeLink.objects.bulk_create(
            [
                InitiativeLink(
                    initiative_id=self.initiative_map.get(str(initiative_link.get("initiative_id"))),
                    workspace=target_workspace,
                    **self.clean_data(initiative_link.copy(), ["workspace_id", "id", "initiative_id"]),
                )
                for initiative_link in InitiativeLink.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_link.get("initiative_id")))
            ],
            ignore_conflicts=True,
        )

        for initiative_comment in InitiativeComment.objects.filter(workspace=self.source_workspace).values():
            initiative_id = self.initiative_map.get(str(initiative_comment.get("initiative_id")))
            if initiative_id:
                new_initiative_comment = InitiativeComment.objects.create(
                    initiative_id=initiative_id,
                    workspace=target_workspace,
                    **self.clean_data(initiative_comment.copy(), ["id", "initiative_id", "workspace_id"]),
                )
                self.initiative_comment_map[str(initiative_comment.get("id"))] = new_initiative_comment.id

    def _copy_initiative_reactions(self, target_workspace):
        InitiativeReaction.objects.bulk_create(
            [
                InitiativeReaction(
                    initiative_id=self.initiative_map.get(str(initiative_reaction.get("initiative_id"))),
                    workspace=target_workspace,
                    **self.clean_data(initiative_reaction.copy(), ["id", "workspace_id", "initiative_id"]),
                )
                for initiative_reaction in InitiativeReaction.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_reaction.get("initiative_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        InitiativeCommentReaction.objects.bulk_create(
            [
                InitiativeCommentReaction(
                    comment_id=self.initiative_comment_map.get(str(initiative_comment_reaction.get("comment_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        initiative_comment_reaction.copy(),
                        ["id", "workspace_id", "comment_id"],
                    ),
                )
                for initiative_comment_reaction in InitiativeCommentReaction.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.initiative_comment_map.get(str(initiative_comment_reaction.get("comment_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_teamspaces(self, target_workspace):
        for teamspace in Teamspace.objects.filter(workspace=self.source_workspace).values():
            new_teamspace = Teamspace.objects.create(
                workspace=target_workspace,
                **self.clean_data(teamspace.copy(), ["id", "workspace_id"]),
            )
            self.teamspace_map[str(teamspace.get("id"))] = new_teamspace.id

    def _copy_teamspace_meta(self, target_workspace):
        TeamspaceMember.objects.bulk_create(
            [
                TeamspaceMember(
                    team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                    workspace=target_workspace,
                    **self.clean_data(teamspace.copy(), ["id", "workspace_id", "team_space_id"]),
                )
                for teamspace in TeamspaceMember.objects.filter(workspace=self.source_workspace).values()
                if self.teamspace_map.get(str(teamspace.get("team_space_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        TeamspaceProject.objects.bulk_create(
            [
                TeamspaceProject(
                    team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                    project_id=self.project_map.get(str(teamspace.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(teamspace.copy(), ["id", "workspace_id", "team_space_id", "project_id"]),
                )
                for teamspace in TeamspaceProject.objects.filter(workspace=self.source_workspace).values()
                if self.teamspace_map.get(str(teamspace.get("team_space_id")))
                and self.project_map.get(str(teamspace.get("project_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        TeamspacePage.objects.bulk_create(
            [
                TeamspacePage(
                    team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                    page_id=self.page_map.get(str(teamspace.get("page_id"))),
                    workspace=target_workspace,
                    **self.clean_data(teamspace.copy(), ["id", "workspace_id", "team_space_id", "page_id"]),
                )
                for teamspace in TeamspacePage.objects.filter(workspace=self.source_workspace).values()
                if self.teamspace_map.get(str(teamspace.get("team_space_id")))
                and self.page_map.get(str(teamspace.get("page_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        TeamspaceView.objects.bulk_create(
            [
                TeamspaceView(
                    team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                    view_id=self.view_map.get(str(teamspace.get("view_id"))),
                    workspace=target_workspace,
                    **self.clean_data(teamspace.copy(), ["id", "workspace_id", "team_space_id", "view_id"]),
                )
                for teamspace in TeamspaceView.objects.filter(workspace=self.source_workspace).values()
                if self.teamspace_map.get(str(teamspace.get("team_space_id")))
                and self.view_map.get(str(teamspace.get("view_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        teamspace_comments_to_update = []
        for teamspace_comment in TeamspaceComment.objects.filter(workspace=self.source_workspace).values():
            team_space_id = self.teamspace_map.get(str(teamspace_comment.get("team_space_id")))
            if not team_space_id:
                continue

            new_teamspace_comment = TeamspaceComment.objects.create(
                team_space_id=team_space_id,
                workspace=target_workspace,
                **self.clean_data(teamspace_comment.copy(), ["id", "workspace_id", "team_space_id", "parent_id"]),
            )
            self.teamspace_comment_map[str(teamspace_comment.get("id"))] = new_teamspace_comment.id

            if teamspace_comment.get("parent_id"):
                teamspace_comments_to_update.append(
                    (
                        new_teamspace_comment.id,
                        teamspace_comment.get("parent_id"),
                    )
                )

        for teamspace_comment_id, source_parent_id in teamspace_comments_to_update:
            parent_id = self.teamspace_comment_map.get(str(source_parent_id))
            if parent_id:
                TeamspaceComment.objects.filter(id=teamspace_comment_id).update(parent_id=parent_id)

        TeamspaceLabel.objects.bulk_create(
            [
                TeamspaceLabel(
                    team_space_id=self.teamspace_map.get(str(teamspace_label.get("team_space_id"))),
                    label_id=self.label_map.get(str(teamspace_label.get("label_id"))),
                    workspace=target_workspace,
                    **self.clean_data(teamspace_label.copy(), ["id", "workspace_id", "team_space_id", "label_id"]),
                )
                for teamspace_label in TeamspaceLabel.objects.filter(workspace=self.source_workspace).values()
                if self.teamspace_map.get(str(teamspace_label.get("team_space_id")))
                and self.label_map.get(str(teamspace_label.get("label_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

        TeamspaceCommentReaction.objects.bulk_create(
            [
                TeamspaceCommentReaction(
                    team_space_id=self.teamspace_map.get(str(teamspace_comment_reaction.get("team_space_id"))),
                    comment_id=self.teamspace_comment_map.get(str(teamspace_comment_reaction.get("comment_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        teamspace_comment_reaction.copy(),
                        ["id", "workspace_id", "team_space_id", "comment_id"],
                    ),
                )
                for teamspace_comment_reaction in TeamspaceCommentReaction.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.teamspace_map.get(str(teamspace_comment_reaction.get("team_space_id")))
                and self.teamspace_comment_map.get(str(teamspace_comment_reaction.get("comment_id")))
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_customers(self, target_workspace):
        source_customers = list(Customer.objects.filter(workspace=self.source_workspace).values())
        created_customers = Customer.objects.bulk_create(
            [
                Customer(
                    workspace=target_workspace,
                    **self.clean_data(customer.copy(), ["id", "workspace_id"]),
                )
                for customer in source_customers
            ],
            batch_size=1000,
        )
        for source_customer, new_customer in zip(source_customers, created_customers):
            self.customer_map[str(source_customer.get("id"))] = new_customer.id

        source_customer_properties = list(CustomerProperty.objects.filter(workspace=self.source_workspace).values())
        created_customer_properties = CustomerProperty.objects.bulk_create(
            [
                CustomerProperty(
                    workspace=target_workspace,
                    **self.clean_data(customer_property.copy(), ["id", "workspace_id"]),
                )
                for customer_property in source_customer_properties
            ],
            batch_size=1000,
        )
        for source_customer_property, new_customer_property in zip(
            source_customer_properties, created_customer_properties
        ):
            self.customer_property_map[str(source_customer_property.get("id"))] = new_customer_property.id

        pending_customer_property_options = list(
            CustomerPropertyOption.objects.filter(workspace=self.source_workspace).values()
        )

        while pending_customer_property_options:
            source_batch = []
            create_batch = []
            next_pending_customer_property_options = []

            for customer_property_option in pending_customer_property_options:
                property_id = self.customer_property_map.get(str(customer_property_option.get("property_id")))
                parent_id = customer_property_option.get("parent_id")

                if not property_id:
                    continue

                if parent_id and not self.customer_property_option_map.get(str(parent_id)):
                    next_pending_customer_property_options.append(customer_property_option)
                    continue

                source_batch.append(customer_property_option)
                create_batch.append(
                    CustomerPropertyOption(
                        property_id=property_id,
                        parent_id=self.customer_property_option_map.get(str(parent_id)),
                        workspace=target_workspace,
                        **self.clean_data(
                            customer_property_option.copy(),
                            ["id", "property_id", "parent_id", "workspace_id"],
                        ),
                    )
                )

            if not create_batch:
                if next_pending_customer_property_options:
                    logger.warning(
                        "[Customers] Skipped %d customer property options with unresolved parent references",
                        len(next_pending_customer_property_options),
                    )
                break

            created_customer_property_options = CustomerPropertyOption.objects.bulk_create(
                create_batch,
                batch_size=1000,
            )
            for source_customer_property_option, new_customer_property_option in zip(
                source_batch, created_customer_property_options
            ):
                self.customer_property_option_map[str(source_customer_property_option.get("id"))] = (
                    new_customer_property_option.id
                )

            pending_customer_property_options = next_pending_customer_property_options

    def _copy_customer_meta(self, target_workspace):
        relation_property_ids = dict(
            CustomerProperty.objects.filter(workspace=self.source_workspace, property_type="RELATION").values_list(
                "id", "relation_type"
            )
        )

        customer_property_value_batch = []
        for customer_property_value in CustomerPropertyValue.objects.filter(workspace=self.source_workspace).values():
            if not self.customer_map.get(str(customer_property_value.get("customer_id"))):
                continue
            if not self.customer_property_map.get(str(customer_property_value.get("property_id"))):
                continue

            value_uuid = customer_property_value.get("value_uuid")
            source_property_id = customer_property_value.get("property_id")
            if value_uuid and source_property_id in relation_property_ids:
                relation_type = relation_property_ids[source_property_id]
                if relation_type == "ISSUE":
                    remapped_uuid = self.issue_map.get(str(value_uuid))
                    if not remapped_uuid:
                        self._warn_skip(
                            f"CustomerPropertyValue[property={source_property_id}]",
                            f"could not remap RELATION(ISSUE) value_uuid {value_uuid} — dropping row",
                        )
                        continue
                    value_uuid = remapped_uuid
                # USER relation type: user IDs are global, keep as-is

            customer_property_value_batch.append(
                CustomerPropertyValue(
                    customer_id=self.customer_map.get(str(customer_property_value.get("customer_id"))),
                    property_id=self.customer_property_map.get(str(customer_property_value.get("property_id"))),
                    value_option_id=self.customer_property_option_map.get(
                        str(customer_property_value.get("value_option_id"))
                    )
                    if customer_property_value.get("value_option_id")
                    else None,
                    value_uuid=value_uuid,
                    workspace=target_workspace,
                    **self.clean_data(
                        customer_property_value.copy(),
                        ["id", "workspace_id", "customer_id", "property_id", "value_option_id", "value_uuid"],
                    ),
                )
            )

        CustomerPropertyValue.objects.bulk_create(
            customer_property_value_batch,
            ignore_conflicts=True,
            batch_size=1000,
        )

        for customer_request in CustomerRequest.objects.filter(workspace=self.source_workspace).values():
            customer_id = self.customer_map.get(str(customer_request.get("customer_id")))
            if customer_id:
                new_customer_request = CustomerRequest.objects.create(
                    customer_id=customer_id,
                    workspace=target_workspace,
                    **self.clean_data(customer_request.copy(), ["id", "workspace_id", "customer_id"]),
                )
                self.customer_request_map[str(customer_request.get("id"))] = new_customer_request.id

        CustomerRequestIssue.objects.bulk_create(
            [
                CustomerRequestIssue(
                    customer_id=self.customer_map.get(str(customer_request_issue.get("customer_id"))),
                    customer_request_id=self.customer_request_map.get(
                        str(customer_request_issue.get("customer_request_id"))
                    )
                    if customer_request_issue.get("customer_request_id")
                    else None,
                    issue_id=self.issue_map.get(str(customer_request_issue.get("issue_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        customer_request_issue.copy(),
                        ["id", "workspace_id", "customer_id", "customer_request_id", "issue_id"],
                    ),
                )
                for customer_request_issue in CustomerRequestIssue.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.customer_map.get(str(customer_request_issue.get("customer_id")))
                and self.issue_map.get(str(customer_request_issue.get("issue_id")))
                and (
                    customer_request_issue.get("customer_request_id") is None
                    or self.customer_request_map.get(str(customer_request_issue.get("customer_request_id")))
                )
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )


@shared_task
def copy_workspace_data(source_workspace_slug, target_workspace_slug):
    try:
        copier = WorkspaceDataCopier(source_workspace_slug, target_workspace_slug)
        copier.initialize_workspace_copy()
    except Exception:
        logger.exception(
            "WORKSPACE COPY FAILED: source='%s' -> target='%s'",
            source_workspace_slug,
            target_workspace_slug,
        )
        raise
