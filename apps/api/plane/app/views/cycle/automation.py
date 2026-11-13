# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Cycle automation: the project's rules, and the manual "move all <states> to <state>" of a cycle."""

# Python imports
import uuid

# Django imports
from django.db import transaction
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Cycle, CycleAutomationRule, CycleAutomationTrigger, Project, State
from plane.utils.cycle_automation import cycle_work_item_ids, record_baseline
from plane.utils.host import base_host
from plane.utils.work_item_bulk_update import MAX_WORK_ITEMS, BulkUpdateError, bulk_update_work_items

RULE_FIELDS = ("trigger", "from_state_ids", "to_state_id", "is_enabled", "sort_order")


def serialize_rule(rule):
    return {
        "id": str(rule.id),
        "project_id": str(rule.project_id),
        "trigger": rule.trigger,
        "from_state_ids": [str(state_id) for state_id in rule.from_state_ids],
        "to_state_id": str(rule.to_state_id) if rule.to_state_id else None,
        "is_enabled": rule.is_enabled,
        "enabled_at": rule.enabled_at,
        "sort_order": rule.sort_order,
        "created_at": rule.created_at,
        "updated_at": rule.updated_at,
    }


def _state_ids(project_id, values):
    """The ids of ``values`` that are states of the project, or None when any is not."""
    if not isinstance(values, list):
        return None
    try:
        ids = list(dict.fromkeys(str(uuid.UUID(str(value))) for value in values))
    except (ValueError, TypeError, AttributeError):
        return None
    found = {str(i) for i in State.objects.filter(project_id=project_id, pk__in=ids).values_list("id", flat=True)}
    return ids if set(ids) <= found else None


def _validate_rule(project_id, data, partial):
    unknown = sorted(set(data) - set(RULE_FIELDS))
    if unknown:
        return None, {"non_field_errors": [f"Unknown fields: {unknown}"]}
    errors, clean = {}, {}
    if "trigger" in data or not partial:
        if data.get("trigger") not in CycleAutomationTrigger.values:
            errors["trigger"] = [f"Must be one of {list(CycleAutomationTrigger.values)}."]
        clean["trigger"] = data.get("trigger")
    if "from_state_ids" in data or not partial:
        ids = _state_ids(project_id, data.get("from_state_ids", []))
        if not ids:
            errors["from_state_ids"] = ["Pass one or more states of this project."]
        clean["from_state_ids"] = ids or []
    if "to_state_id" in data or not partial:
        ids = _state_ids(project_id, [data.get("to_state_id")])
        if not ids:
            errors["to_state_id"] = ["Pass a state of this project."]
        clean["to_state_id"] = ids[0] if ids else None
    if "is_enabled" in data:
        if not isinstance(data["is_enabled"], bool):
            errors["is_enabled"] = ["Must be a boolean."]
        clean["is_enabled"] = data["is_enabled"]
    if "sort_order" in data:
        if not isinstance(data["sort_order"], (int, float)) or isinstance(data["sort_order"], bool):
            errors["sort_order"] = ["Must be a number."]
        clean["sort_order"] = data["sort_order"]
    return clean, errors


def _save_rule(rule, clean):
    # rule.pk is set before the first save (uuid default): use _state.adding
    was_enabled = not rule._state.adding and rule.is_enabled
    old_trigger = None if rule._state.adding else rule.trigger
    for key, value in clean.items():
        setattr(rule, key, value)
    if str(rule.to_state_id) in {str(i) for i in rule.from_state_ids}:
        return {"to_state_id": ["The target state cannot be one of the source states."]}
    with transaction.atomic():
        enabling = rule.is_enabled and not was_enabled
        if enabling:
            rule.enabled_at = timezone.now()
        rule.save()
        trigger_changed = old_trigger is not None and old_trigger != rule.trigger
        if trigger_changed:
            # runs are per (cycle, rule): those of the old trigger must not block the new one
            rule.runs.all().delete()
        # cycles that already started or completed are not moved when a rule is turned on, or when the trigger of
        # an enabled rule changes (a "completed" rule would otherwise move last week's sprint)
        if enabling or (rule.is_enabled and trigger_changed):
            record_baseline(rule)
    return None


class CycleAutomationRuleEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def get(self, request, slug, project_id):
        rules = CycleAutomationRule.objects.filter(workspace__slug=slug, project_id=project_id)
        return Response([serialize_rule(rule) for rule in rules], status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        clean, errors = _validate_rule(project_id, request.data, partial=False)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        rule = CycleAutomationRule(project=project, workspace_id=project.workspace_id)
        errors = _save_rule(rule, clean)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(serialize_rule(rule), status=status.HTTP_201_CREATED)


class CycleAutomationRuleDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def patch(self, request, slug, project_id, rule_id):
        rule = CycleAutomationRule.objects.get(pk=rule_id, workspace__slug=slug, project_id=project_id)
        clean, errors = _validate_rule(project_id, request.data, partial=True)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        errors = _save_rule(rule, clean)
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(serialize_rule(rule), status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def delete(self, request, slug, project_id, rule_id):
        rule = CycleAutomationRule.objects.get(pk=rule_id, workspace__slug=slug, project_id=project_id)
        rule.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CycleBulkMoveStateEndpoint(BaseAPIView):
    """Move every work item of a cycle in ``from_state_ids`` to ``to_state_id``. ``dry_run`` answers the count only."""

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, cycle_id):
        cycle = Cycle.objects.get(pk=cycle_id, workspace__slug=slug, project_id=project_id)
        from_ids = _state_ids(project_id, request.data.get("from_state_ids", []))
        if not from_ids:
            return Response(
                {"from_state_ids": ["Pass one or more states of this project."]}, status=status.HTTP_400_BAD_REQUEST
            )
        ids = cycle_work_item_ids(cycle, from_ids)
        if request.data.get("dry_run") is True:
            return Response({"count": len(ids)}, status=status.HTTP_200_OK)
        if not ids:
            return Response({"updated": [], "unchanged": []}, status=status.HTTP_200_OK)
        result = {"updated": [], "unchanged": []}
        try:
            with transaction.atomic():
                for start in range(0, len(ids), MAX_WORK_ITEMS):
                    chunk = bulk_update_work_items(
                        cycle.project,
                        ids[start : start + MAX_WORK_ITEMS],
                        {"state": request.data.get("to_state_id")},
                        actor_id=request.user.id,
                        origin=base_host(request=request, is_app=True),
                    )
                    result["updated"] += chunk["updated"]
                    result["unchanged"] += chunk["unchanged"]
        except BulkUpdateError as e:
            return Response(e.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)
