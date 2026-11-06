# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Work item types, custom properties (options, type links, values), work item
templates and relation definitions, in plane-sdk's wire format.

Governance: the workspace features endpoint reports `work_item_types=true`, so the
workspace owns the type and property catalogue. Project endpoints read it, import
types into a project and remove them again; creating or editing a type or a
property inside a project is refused with code `workspace_managed`, which the MCP
server reads as "write at the workspace instead". Templates stay per project
(`states_owned_by_workspace=false`), so project templates are fully writable.
"""

import re
import uuid
from datetime import datetime, timezone as dt_timezone

from django.core.exceptions import ValidationError
from django.core.validators import URLValidator, validate_email
from django.db import IntegrityError, transaction
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response

from plane.db.models import Issue, IssueType, ProjectMember, WorkspaceMember
from plane.db.models.issue_type import ProjectIssueType
from plane.nexus.models import (
    WorkItemProperty,
    WorkItemPropertyOption,
    WorkItemPropertyValue,
    WorkItemRelationDefinition,
    WorkItemTemplate,
    WorkItemTypeProperty,
)
from plane.nexus.models.work_item_type import PROPERTY_TYPES, RELATION_TYPES
from plane.nexus.serializers.work_item_type import (
    OPTION_TYPES,
    WorkItemPropertyOptionSerializer,
    WorkItemPropertySerializer,
    WorkItemRelationDefinitionSerializer,
    WorkItemTemplateSerializer,
    WorkItemTypeSerializer,
)
from plane.utils.content_validator import validate_html_content
from plane.utils.html_processor import strip_tags
from plane.utils.permissions import (
    ProjectAdminPermission,
    ProjectEntityPermission,
    WorkspaceEntityPermission,
    WorkspaceOwnerPermission,
)

from .base import NexusAPIView
from .work_item import BUILTIN_RELATION_DEFINITIONS

WORKSPACE_MANAGED = "workspace_managed"
TEXT_FORMATS = ("single-line", "multi-line", "readonly")
DATE_FORMATS = ("MMM dd, yyyy", "dd/MM/yyyy", "MM/dd/yyyy", "yyyy/MM/dd")
MULTI_CAPABLE = ("OPTION", "CASCADING", "RELATION")


# --------------------------------------------------------------------------- helpers


class BadRequest(Exception):
    """A request the caller can correct; becomes a 400 (or `http_status`) with this message."""

    def __init__(self, message: str, code: str | None = None, http_status: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message, self.code, self.http_status = message, code, http_status


def _uuid(value) -> str | None:
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, TypeError, AttributeError):
        return None


def _str_or_none(value, field, *, allow_blank=True, max_length=255):
    if value is None:
        return None
    if not isinstance(value, str):
        raise BadRequest(f"{field} must be a string.")
    value = value.strip() if not allow_blank else value
    if not allow_blank and not value:
        raise BadRequest(f"{field} must not be empty.")
    if max_length and len(value) > max_length:
        raise BadRequest(f"{field} must be at most {max_length} characters.")
    return value


def _bool(value, field):
    if not isinstance(value, bool):
        raise BadRequest(f"{field} must be true or false.")
    return value


def _number(value, field):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise BadRequest(f"{field} must be a number.")
    return value


def _dict(value, field):
    if not isinstance(value, dict):
        raise BadRequest(f"{field} must be a JSON object.")
    return value


def _body(request) -> dict:
    if not isinstance(request.data, dict):
        raise BadRequest("Send a JSON object.")
    return request.data


def _uuid_list(value, field) -> list[str]:
    if not isinstance(value, list):
        raise BadRequest(f"{field} must be a list of ids.")
    ids = [_uuid(v) for v in value]
    if any(i is None for i in ids):
        raise BadRequest(f"{field} must contain only UUIDs.")
    return list(dict.fromkeys(ids))


def _query_bool(request, name):
    raw = request.query_params.get(name)
    if raw is None or raw == "":
        return None
    if raw.lower() in ("true", "1"):
        return True
    if raw.lower() in ("false", "0"):
        return False
    raise BadRequest(f"{name} must be true or false.")


def _conflict(message: str) -> BadRequest:
    return BadRequest(message, code="already_exists", http_status=status.HTTP_409_CONFLICT)


class _View(NexusAPIView):
    """Turns BadRequest into its response, the same way for every endpoint here."""

    def handle_exception(self, exc):
        if isinstance(exc, BadRequest):
            return self.error(exc.message, exc.code, exc.http_status)
        return super().handle_exception(exc)

    def workspace_managed(self):
        return self.error(
            "This workspace owns its work item types and properties: create and edit them in the "
            "workspace catalogue (omit project_id), then import types into the project.",
            WORKSPACE_MANAGED,
        )


class _CatalogueView(_View):
    """Workspace catalogue: every member reads, workspace admins write."""

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [WorkspaceEntityPermission()]
        return [WorkspaceOwnerPermission()]


class _ProjectView(_View):
    """Project scope: project members read, project admins and members write."""

    permission_classes = [ProjectEntityPermission]


class _ProjectCatalogueView(_View):
    """Project view onto the workspace catalogue: project members read; a write changes the
    catalogue, so it also needs a workspace admin."""

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [ProjectEntityPermission()]
        return [ProjectEntityPermission(), WorkspaceOwnerPermission()]


# --------------------------------------------------------------------------- work item types


def _types(slug):
    links = Prefetch(
        "project_issue_types",
        queryset=ProjectIssueType.objects.filter(project__deleted_at__isnull=True).order_by("created_at"),
        to_attr="linked_projects",
    )
    return IssueType.objects.filter(workspace__slug=slug).prefetch_related(links).order_by("level", "created_at")


def _project_types(slug, project_id):
    return (
        _types(slug)
        .filter(project_issue_types__project_id=project_id, project_issue_types__deleted_at__isnull=True)
        .distinct()
    )


def _type_fields(body, *, partial) -> dict:
    data = {}
    if not partial or "name" in body:
        name = _str_or_none(body.get("name"), "name", allow_blank=False)
        if name is None:
            raise BadRequest("name is required.")
        data["name"] = name
    if "description" in body:
        data["description"] = _str_or_none(body["description"], "description", max_length=None) or ""
    if "logo_props" in body:
        data["logo_props"] = _dict(body["logo_props"], "logo_props") if body["logo_props"] is not None else {}
    for flag in ("is_epic", "is_active"):
        if body.get(flag) is not None:
            data[flag] = _bool(body[flag], flag)
    if body.get("level") is not None:
        data["level"] = _number(body["level"], "level")
    for field in ("external_source", "external_id"):
        if field in body:
            data[field] = _str_or_none(body[field], field)
    return data


def _check_type_name(workspace_id, name, exclude_id=None):
    clash = IssueType.objects.filter(workspace_id=workspace_id, name=name)
    if exclude_id:
        clash = clash.exclude(pk=exclude_id)
    if clash.exists():
        raise _conflict(f'A work item type named "{name}" already exists in this workspace.')


def _projects_in(workspace, project_ids):
    from plane.db.models import Project

    found = set(
        str(pk) for pk in Project.objects.filter(workspace=workspace, pk__in=project_ids).values_list("pk", flat=True)
    )
    unknown = [pid for pid in project_ids if pid not in found]
    if unknown:
        raise BadRequest(f"Unknown project id(s) in this workspace: {', '.join(unknown)}.")
    return project_ids


def _link(issue_type, project_id):
    ProjectIssueType.objects.get_or_create(issue_type=issue_type, project_id=project_id)


def _unlink(issue_type, project_id):
    used = Issue.objects.filter(type=issue_type, project_id=project_id).count()
    if used:
        raise BadRequest(
            f'{used} work item(s) in this project use the type "{issue_type.name}". '
            "Change their type before removing it from the project.",
            code="type_in_use",
        )
    ProjectIssueType.all_objects.filter(issue_type=issue_type, project_id=project_id).delete()


def _sync_projects(issue_type, project_ids):
    current = set(
        str(pk) for pk in ProjectIssueType.objects.filter(issue_type=issue_type).values_list("project_id", flat=True)
    )
    for pid in set(project_ids) - current:
        _link(issue_type, pid)
    for pid in current - set(project_ids):
        _unlink(issue_type, pid)


def _enable_types(project_id):
    from plane.db.models import Project

    Project.objects.filter(pk=project_id, is_issue_type_enabled=False).update(is_issue_type_enabled=True)


class WorkspaceWorkItemTypeListEndpoint(_CatalogueView):
    def get(self, request, slug):
        return Response(WorkItemTypeSerializer(_types(slug), many=True).data)

    @transaction.atomic
    def post(self, request, slug):
        body = _body(request)
        workspace = self.get_workspace()
        data = _type_fields(body, partial=False)
        # An epic is a work item whose type is named "Epic" (MCP README); flag it as Plane does.
        if "is_epic" not in data and data["name"].lower() == "epic":
            data["is_epic"] = True
        _check_type_name(workspace.id, data["name"])
        project_ids = (
            _projects_in(workspace, _uuid_list(body["project_ids"], "project_ids")) if body.get("project_ids") else []
        )
        issue_type = IssueType.objects.create(workspace=workspace, **data)
        for pid in project_ids:
            _link(issue_type, pid)
            _enable_types(pid)
        return Response(WorkItemTypeSerializer(_types(slug).get(pk=issue_type.pk)).data, status=status.HTTP_201_CREATED)


class WorkspaceWorkItemTypeDetailEndpoint(_CatalogueView):
    def get(self, request, slug, type_id):
        return Response(WorkItemTypeSerializer(get_object_or_404(_types(slug), pk=type_id)).data)

    @transaction.atomic
    def patch(self, request, slug, type_id):
        issue_type = get_object_or_404(IssueType, workspace__slug=slug, pk=type_id)
        body = _body(request)
        data = _type_fields(body, partial=True)
        if "name" in data:
            _check_type_name(issue_type.workspace_id, data["name"], exclude_id=issue_type.pk)
        for field, value in data.items():
            setattr(issue_type, field, value)
        issue_type.save()
        if body.get("project_ids") is not None:
            project_ids = _projects_in(issue_type.workspace, _uuid_list(body["project_ids"], "project_ids"))
            _sync_projects(issue_type, project_ids)
            for pid in project_ids:
                _enable_types(pid)
        return Response(WorkItemTypeSerializer(_types(slug).get(pk=issue_type.pk)).data)

    @transaction.atomic
    def delete(self, request, slug, type_id):
        issue_type = get_object_or_404(IssueType, workspace__slug=slug, pk=type_id)
        used = Issue.objects.filter(type=issue_type).count()
        if used:
            return self.error(
                f'{used} work item(s) use the type "{issue_type.name}". Change their type before deleting it.',
                "type_in_use",
            )
        ProjectIssueType.all_objects.filter(issue_type=issue_type).delete()
        WorkItemTypeProperty.all_objects.filter(issue_type=issue_type).delete()
        issue_type.deleted_at = timezone.now()
        issue_type.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorkItemTypeListEndpoint(_ProjectView):
    def get(self, request, slug, project_id):
        self.get_project()
        return Response(WorkItemTypeSerializer(_project_types(slug, project_id), many=True).data)

    def post(self, request, slug, project_id):
        self.get_project()
        return self.workspace_managed()


class ProjectWorkItemTypeDetailEndpoint(_ProjectView):
    def get_permissions(self):
        if self.request.method == "DELETE":
            return [ProjectAdminPermission()]
        return [ProjectEntityPermission()]

    def get(self, request, slug, project_id, type_id):
        self.get_project()
        return Response(WorkItemTypeSerializer(get_object_or_404(_project_types(slug, project_id), pk=type_id)).data)

    def patch(self, request, slug, project_id, type_id):
        self.get_project()
        get_object_or_404(_project_types(slug, project_id), pk=type_id)
        return self.workspace_managed()

    @transaction.atomic
    def delete(self, request, slug, project_id, type_id):
        """Removes the type from this project. The workspace type itself stays."""
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        _unlink(issue_type, project_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectWorkItemTypeImportEndpoint(_ProjectView):
    permission_classes = [ProjectAdminPermission]

    @transaction.atomic
    def post(self, request, slug, project_id):
        project = self.get_project()
        ids = _uuid_list(_body(request).get("work_item_types"), "work_item_types")
        if not ids:
            raise BadRequest("work_item_types must list at least one work item type id.")
        types = {str(t.pk): t for t in IssueType.objects.filter(workspace__slug=slug, pk__in=ids)}
        unknown = [i for i in ids if i not in types]
        if unknown:
            raise BadRequest(f"Unknown work item type id(s) in this workspace: {', '.join(unknown)}.")
        for type_id in ids:
            _link(types[type_id], project.id)
        _enable_types(project.id)
        return Response(WorkItemTypeSerializer(_project_types(slug, project_id), many=True).data)


# --------------------------------------------------------------------------- type <-> property links


def _properties(slug):
    links = Prefetch(
        "type_links",
        queryset=WorkItemTypeProperty.objects.filter(issue_type__deleted_at__isnull=True),
        to_attr="active_type_links",
    )
    return (
        WorkItemProperty.objects.filter(workspace__slug=slug)
        .prefetch_related(links, "options")
        .order_by("sort_order", "created_at")
    )


def _type_properties(slug, type_id):
    return _properties(slug).filter(type_links__issue_type_id=type_id, type_links__deleted_at__isnull=True).distinct()


def _project_properties(slug, project_id):
    linked_types = ProjectIssueType.objects.filter(project_id=project_id).values("issue_type_id")
    return (
        _properties(slug)
        .filter(type_links__issue_type_id__in=linked_types, type_links__deleted_at__isnull=True)
        .distinct()
    )


def _attach(issue_type, property_ids) -> list[str]:
    ids = _uuid_list(property_ids, "properties")
    if not ids:
        raise BadRequest("properties must list at least one property id.")
    found = {
        str(pk)
        for pk in WorkItemProperty.objects.filter(workspace_id=issue_type.workspace_id, pk__in=ids).values_list(
            "pk", flat=True
        )
    }
    unknown = [i for i in ids if i not in found]
    if unknown:
        raise BadRequest(f"Unknown property id(s) in this workspace: {', '.join(unknown)}.")
    for pid in ids:
        WorkItemTypeProperty.objects.get_or_create(
            issue_type=issue_type, property_id=pid, defaults={"workspace_id": issue_type.workspace_id}
        )
    return ids


def _detach(issue_type, property_id):
    link = WorkItemTypeProperty.objects.filter(issue_type=issue_type, property_id=property_id)
    if not link.exists():
        return Response({"error": "That property is not attached to this type."}, status=status.HTTP_404_NOT_FOUND)
    link.delete(soft=False)
    return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceTypePropertyLinkEndpoint(_CatalogueView):
    def get(self, request, slug, type_id):
        """The attached property ids, as plane-sdk expects: a flat list of UUID strings."""
        issue_type = get_object_or_404(IssueType, workspace__slug=slug, pk=type_id)
        ids = WorkItemTypeProperty.objects.filter(issue_type=issue_type).values_list("property_id", flat=True)
        return Response([str(i) for i in ids])

    @transaction.atomic
    def post(self, request, slug, type_id):
        issue_type = get_object_or_404(IssueType, workspace__slug=slug, pk=type_id)
        return Response({"properties": _attach(issue_type, _body(request).get("properties"))})


class WorkspaceTypePropertyLinkDetailEndpoint(_CatalogueView):
    def delete(self, request, slug, type_id, property_id):
        issue_type = get_object_or_404(IssueType, workspace__slug=slug, pk=type_id)
        return _detach(issue_type, property_id)


class ProjectTypePropertyLinkEndpoint(_ProjectCatalogueView):
    @transaction.atomic
    def post(self, request, slug, project_id, type_id):
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        return Response({"properties": _attach(issue_type, _body(request).get("properties"))})


class ProjectTypePropertyLinkDetailEndpoint(_ProjectCatalogueView):
    def delete(self, request, slug, project_id, type_id, property_id):
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        return _detach(issue_type, property_id)


# --------------------------------------------------------------------------- properties


def _slug_name(display_name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", display_name.lower()).strip("_")[:255]


def _option_fields(body, *, partial) -> dict:
    data = {}
    if not partial or "name" in body:
        name = _str_or_none(body.get("name"), "name", allow_blank=False)
        if name is None:
            raise BadRequest("name is required.")
        data["name"] = name.strip()
    if "description" in body:
        data["description"] = _str_or_none(body["description"], "description", max_length=None) or ""
    for flag in ("is_active", "is_default"):
        if body.get(flag) is not None:
            data[flag] = _bool(body[flag], flag)
    if body.get("sort_order") is not None:
        data["sort_order"] = _number(body["sort_order"], "sort_order")
    if "logo_props" in body:
        data["logo_props"] = _dict(body["logo_props"], "logo_props") if body["logo_props"] is not None else {}
    for field in ("external_source", "external_id"):
        if field in body:
            data[field] = _str_or_none(body[field], field)
    if "parent" in body:
        data["parent"] = body["parent"]
    return data


def _save_option(prop, option, data):
    parent = data.pop("parent", ...)
    if parent is not ...:
        if parent is None:
            option.parent = None
        else:
            parent_id = _uuid(parent)
            parent_option = parent_id and prop.options.filter(pk=parent_id).first()
            if not parent_option or (option.pk and str(parent_option.pk) == str(option.pk)):
                raise BadRequest("parent must be another option of this property.")
            option.parent = parent_option
    if "name" in data and prop.options.filter(name=data["name"]).exclude(pk=option.pk).exists():
        raise _conflict(f'This property already has an option named "{data["name"]}".')
    for field, value in data.items():
        setattr(option, field, value)
    option.property = prop
    option.workspace_id = prop.workspace_id
    option.save()
    if option.is_default and not prop.is_multi:
        prop.options.exclude(pk=option.pk).filter(is_default=True).update(is_default=False)
    return option


def _property_fields(body, *, partial) -> dict:
    data = {}
    if not partial or "display_name" in body:
        display_name = _str_or_none(body.get("display_name"), "display_name", allow_blank=False)
        if display_name is None:
            raise BadRequest("display_name is required.")
        data["display_name"] = display_name.strip()
    if not partial or "property_type" in body:
        if body.get("property_type") not in PROPERTY_TYPES:
            raise BadRequest(f"property_type must be one of: {', '.join(PROPERTY_TYPES)}.")
        data["property_type"] = body["property_type"]
    if "relation_type" in body:
        if body["relation_type"] is not None and body["relation_type"] not in RELATION_TYPES:
            raise BadRequest(f"relation_type must be one of: {', '.join(RELATION_TYPES)}.")
        data["relation_type"] = body["relation_type"]
    if "description" in body:
        data["description"] = _str_or_none(body["description"], "description", max_length=None) or ""
    for flag in ("is_required", "is_active", "is_multi"):
        if body.get(flag) is not None:
            data[flag] = _bool(body[flag], flag)
    if "default_value" in body:
        value = body["default_value"] or []
        if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
            raise BadRequest("default_value must be a list of strings.")
        data["default_value"] = value
    if "settings" in body:
        data["settings"] = _dict(body["settings"], "settings") if body["settings"] is not None else {}
    if "validation_rules" in body:
        data["validation_rules"] = body["validation_rules"]
    if "logo_props" in body:
        data["logo_props"] = _dict(body["logo_props"], "logo_props") if body["logo_props"] is not None else {}
    if body.get("sort_order") is not None:
        data["sort_order"] = _number(body["sort_order"], "sort_order")
    for field in ("external_source", "external_id"):
        if field in body:
            data[field] = _str_or_none(body[field], field)
    return data


def _check_property(prop):
    """The rules plane-sdk's Create/UpdateWorkItemProperty validators enforce, on the merged row."""
    kind = prop.property_type
    settings = prop.settings or {}
    if kind == "TEXT":
        fmt = settings.get("display_format") or "single-line"
        if fmt not in TEXT_FORMATS:
            raise BadRequest(f"TEXT display_format must be one of: {', '.join(TEXT_FORMATS)}.")
        prop.settings = {"display_format": fmt}
    elif kind == "DATETIME":
        fmt = settings.get("display_format") or "MMM dd, yyyy"
        if fmt not in DATE_FORMATS:
            raise BadRequest(f"DATETIME display_format must be one of: {', '.join(DATE_FORMATS)}.")
        prop.settings = {"display_format": fmt}
    else:
        prop.settings = {}
    if kind == "RELATION":
        if not prop.relation_type:
            raise BadRequest(f"relation_type is required for RELATION properties: one of {', '.join(RELATION_TYPES)}.")
    elif prop.relation_type:
        raise BadRequest("relation_type applies to RELATION properties only.")
    if prop.is_multi and (kind not in MULTI_CAPABLE or prop.relation_type == "RICH_TEXT"):
        raise BadRequest("is_multi applies to OPTION, CASCADING and RELATION (not RICH_TEXT) properties only.")


def _save_property(prop, data):
    if "display_name" in data:
        clash = WorkItemProperty.objects.filter(workspace_id=prop.workspace_id, display_name=data["display_name"])
        if clash.exclude(pk=prop.pk).exists():
            raise _conflict(f'A property named "{data["display_name"]}" already exists in this workspace.')
        data["name"] = _slug_name(data["display_name"])
    if prop.pk and "property_type" in data and data["property_type"] != prop.property_type:
        if prop.values.exists():
            raise BadRequest("This property has values on work items; its property_type cannot change.")
    for field, value in data.items():
        setattr(prop, field, value)
    _check_property(prop)
    prop.save()
    return prop


def _property_response(slug, prop, **context):
    return WorkItemPropertySerializer(_properties(slug).get(pk=prop.pk), context=context).data


class WorkspacePropertyListEndpoint(_CatalogueView):
    def get(self, request, slug):
        return Response(WorkItemPropertySerializer(_properties(slug), many=True).data)

    @transaction.atomic
    def post(self, request, slug):
        body = _body(request)
        workspace = self.get_workspace()
        data = _property_fields(body, partial=False)
        options = body.get("options") or []
        if not isinstance(options, list) or not all(isinstance(o, dict) for o in options):
            raise BadRequest("options must be a list of option objects.")
        if options and data["property_type"] not in OPTION_TYPES:
            raise BadRequest("options apply to OPTION and CASCADING properties only.")
        prop = _save_property(WorkItemProperty(workspace=workspace), data)
        for one in options:
            _save_option(prop, WorkItemPropertyOption(), _option_fields(one, partial=False))
        return Response(_property_response(slug, prop), status=status.HTTP_201_CREATED)


class WorkspacePropertyDetailEndpoint(_CatalogueView):
    def get(self, request, slug, property_id):
        return Response(WorkItemPropertySerializer(get_object_or_404(_properties(slug), pk=property_id)).data)

    @transaction.atomic
    def patch(self, request, slug, property_id):
        prop = get_object_or_404(WorkItemProperty, workspace__slug=slug, pk=property_id)
        _save_property(prop, _property_fields(_body(request), partial=True))
        return Response(_property_response(slug, prop))

    def delete(self, request, slug, property_id):
        get_object_or_404(WorkItemProperty, workspace__slug=slug, pk=property_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPropertyListEndpoint(_ProjectView):
    """Every property attached to a type imported into the project."""

    def get(self, request, slug, project_id):
        self.get_project()
        return Response(WorkItemPropertySerializer(_project_properties(slug, project_id), many=True).data)

    def post(self, request, slug, project_id):
        self.get_project()
        return self.workspace_managed()


class ProjectPropertyDetailEndpoint(_ProjectView):
    def get(self, request, slug, project_id, property_id):
        self.get_project()
        prop = get_object_or_404(_properties(slug), pk=property_id)
        return Response(WorkItemPropertySerializer(prop).data)

    def patch(self, request, slug, project_id, property_id):
        self.get_project()
        get_object_or_404(WorkItemProperty, workspace__slug=slug, pk=property_id)
        return self.workspace_managed()

    delete = patch


class ProjectTypePropertyListEndpoint(_ProjectView):
    """The properties attached to one type imported into the project."""

    def get(self, request, slug, project_id, type_id):
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        props = _type_properties(slug, issue_type.pk)
        return Response(WorkItemPropertySerializer(props, many=True, context={"issue_type_id": issue_type.pk}).data)

    def post(self, request, slug, project_id, type_id):
        self.get_project()
        get_object_or_404(_project_types(slug, project_id), pk=type_id)
        return self.workspace_managed()


class ProjectTypePropertyDetailEndpoint(_ProjectView):
    def get(self, request, slug, project_id, type_id, property_id):
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        prop = get_object_or_404(_type_properties(slug, issue_type.pk), pk=property_id)
        return Response(WorkItemPropertySerializer(prop, context={"issue_type_id": issue_type.pk}).data)

    def patch(self, request, slug, project_id, type_id, property_id):
        self.get_project()
        issue_type = get_object_or_404(_project_types(slug, project_id), pk=type_id)
        get_object_or_404(_type_properties(slug, issue_type.pk), pk=property_id)
        return self.workspace_managed()

    delete = patch


# --------------------------------------------------------------------------- options


def _options(slug, property_id):
    prop = get_object_or_404(WorkItemProperty, workspace__slug=slug, pk=property_id)
    return prop, prop.options.all()


class WorkspaceOptionListEndpoint(_CatalogueView):
    def get(self, request, slug, property_id):
        _, options = _options(slug, property_id)
        return Response(WorkItemPropertyOptionSerializer(options, many=True).data)

    @transaction.atomic
    def post(self, request, slug, property_id):
        prop, _ = _options(slug, property_id)
        if prop.property_type not in OPTION_TYPES:
            raise BadRequest("Only OPTION and CASCADING properties have options.")
        option = _save_option(prop, WorkItemPropertyOption(), _option_fields(_body(request), partial=False))
        return Response(WorkItemPropertyOptionSerializer(option).data, status=status.HTTP_201_CREATED)


class WorkspaceOptionDetailEndpoint(_CatalogueView):
    def get(self, request, slug, property_id, option_id):
        _, options = _options(slug, property_id)
        return Response(WorkItemPropertyOptionSerializer(get_object_or_404(options, pk=option_id)).data)

    @transaction.atomic
    def patch(self, request, slug, property_id, option_id):
        prop, options = _options(slug, property_id)
        option = get_object_or_404(options, pk=option_id)
        _save_option(prop, option, _option_fields(_body(request), partial=True))
        return Response(WorkItemPropertyOptionSerializer(option).data)

    def delete(self, request, slug, property_id, option_id):
        _, options = _options(slug, property_id)
        get_object_or_404(options, pk=option_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectOptionListEndpoint(_ProjectCatalogueView):
    def get(self, request, slug, project_id, property_id):
        self.get_project()
        _, options = _options(slug, property_id)
        return Response(WorkItemPropertyOptionSerializer(options, many=True).data)

    def post(self, request, slug, project_id, property_id):
        self.get_project()
        _options(slug, property_id)
        return self.workspace_managed()


class ProjectOptionDetailEndpoint(_ProjectCatalogueView):
    def get(self, request, slug, project_id, property_id, option_id):
        self.get_project()
        _, options = _options(slug, property_id)
        return Response(WorkItemPropertyOptionSerializer(get_object_or_404(options, pk=option_id)).data)

    def patch(self, request, slug, project_id, property_id, option_id):
        self.get_project()
        _, options = _options(slug, property_id)
        get_object_or_404(options, pk=option_id)
        return self.workspace_managed()

    def delete(self, request, slug, project_id, property_id, option_id):
        self.get_project()
        _, options = _options(slug, property_id)
        get_object_or_404(options, pk=option_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- values

DATETIME_FORMATS = ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S")


def _one_value(prop, raw, issue) -> dict:
    """The column values for one stored value of `prop`, or BadRequest naming the expected type."""
    kind, relation = prop.property_type, prop.relation_type
    if kind == "RELATION" and relation == "RICH_TEXT":
        if not isinstance(raw, dict) or not isinstance(raw.get("description_html"), str):
            raise BadRequest('Rich text value must be an object: {"description_html": "<p>...</p>"}.')
        ok, error, clean = validate_html_content(raw["description_html"])
        if not ok:
            raise BadRequest(error or "Invalid HTML.")
        return {"value_text": clean if clean is not None else raw["description_html"]}
    if isinstance(raw, (dict, list)):
        raise BadRequest(f"A {kind} value must be a single scalar.")
    if kind in ("TEXT", "URL", "EMAIL", "FILE"):
        if not isinstance(raw, str):
            raise BadRequest(f"A {kind} value must be a string.")
        if kind == "URL":
            try:
                URLValidator()(raw)
            except ValidationError:
                raise BadRequest("The value is not a valid URL.") from None
        if kind == "EMAIL":
            try:
                validate_email(raw)
            except ValidationError:
                raise BadRequest("The value is not a valid email address.") from None
        return {"value_text": raw}
    if kind == "DATETIME":
        if not isinstance(raw, str):
            raise BadRequest("A DATETIME value must be a YYYY-MM-DD or YYYY-MM-DD HH:MM:SS string.")
        for fmt in DATETIME_FORMATS:
            try:
                parsed = datetime.strptime(raw.strip(), fmt)
            except ValueError:
                continue
            return {"value_text": raw.strip(), "value_datetime": parsed.replace(tzinfo=dt_timezone.utc)}
        raise BadRequest("A DATETIME value must be a YYYY-MM-DD or YYYY-MM-DD HH:MM:SS string.")
    if kind == "DECIMAL":
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            raise BadRequest("A DECIMAL value must be a number, not a string.")
        return {"value_decimal": float(raw)}
    if kind == "BOOLEAN":
        if not isinstance(raw, bool):
            raise BadRequest("A BOOLEAN value must be true or false.")
        return {"value_boolean": raw}
    if kind in OPTION_TYPES:
        option_id = _uuid(raw)
        option = option_id and prop.options.filter(pk=option_id).first()
        if not option:
            raise BadRequest("The value must be the id of one of this property's options.")
        return {"value_option": option}
    if kind == "RELATION":
        target = _uuid(raw)
        if not target:
            raise BadRequest(f"A RELATION ({relation}) value must be an id.")
        if relation == "ISSUE" and not Issue.objects.filter(workspace_id=issue.workspace_id, pk=target).exists():
            raise BadRequest("The value must be the id of a work item in this workspace.")
        if (
            relation == "USER"
            and not WorkspaceMember.objects.filter(
                workspace_id=issue.workspace_id, member_id=target, is_active=True
            ).exists()
        ):
            raise BadRequest("The value must be the id of a member of this workspace.")
        return {"value_uuid": target}
    raise BadRequest(f"{kind} properties are computed and cannot be set.")


def _value_detail(prop, row) -> dict:
    kind = prop.property_type
    detail = None
    if kind == "RELATION" and prop.relation_type == "RICH_TEXT":
        value = str(row.id)
        html = row.value_text or ""
        detail = {"id": str(row.id), "description_html": html, "description_stripped": strip_tags(html)}
    elif kind in ("TEXT", "URL", "EMAIL", "FILE", "DATETIME"):
        value = row.value_text
    elif kind == "DECIMAL":
        value = row.value_decimal
    elif kind == "BOOLEAN":
        value = row.value_boolean
    elif kind in OPTION_TYPES:
        value = str(row.value_option_id) if row.value_option_id else None
    else:
        value = str(row.value_uuid) if row.value_uuid else None
    return {
        "id": str(row.id),
        "property_id": str(row.property_id),
        "issue_id": str(row.issue_id),
        "value": value,
        "value_type": kind if kind != "RELATION" else f"RELATION:{prop.relation_type}",
        "value_detail": detail,
        "external_id": row.external_id,
        "external_source": row.external_source,
        "created_at": row.created_at,
        "updated_at": row.updated_at,
    }


class WorkItemPropertyValueEndpoint(_ProjectView):
    """One property's value(s) on one work item. A multi-value property reads and writes a list."""

    def _target(self, slug, project_id, issue_id, property_id):
        self.get_project()
        issue = get_object_or_404(Issue, workspace__slug=slug, project_id=project_id, pk=issue_id)
        prop = get_object_or_404(WorkItemProperty, workspace__slug=slug, pk=property_id)
        return issue, prop, WorkItemPropertyValue.objects.filter(issue=issue, property=prop).order_by("created_at")

    def _render(self, prop, rows, http_status=status.HTTP_200_OK):
        if prop.is_multi:
            return Response([_value_detail(prop, row) for row in rows], status=http_status)
        return Response(_value_detail(prop, rows[0]), status=http_status)

    def get(self, request, slug, project_id, issue_id, property_id):
        _, prop, rows = self._target(slug, project_id, issue_id, property_id)
        rows = list(rows)
        if not rows:
            return Response(
                {"error": "This property has no value on this work item."}, status=status.HTTP_404_NOT_FOUND
            )
        return self._render(prop, rows)

    @transaction.atomic
    def post(self, request, slug, project_id, issue_id, property_id):
        issue, prop, existing = self._target(slug, project_id, issue_id, property_id)
        return self._write(request, issue, prop, existing)

    @transaction.atomic
    def patch(self, request, slug, project_id, issue_id, property_id):
        issue, prop, existing = self._target(slug, project_id, issue_id, property_id)
        if not existing.exists():
            return Response(
                {"error": "This property has no value on this work item."}, status=status.HTTP_404_NOT_FOUND
            )
        return self._write(request, issue, prop, existing)

    def _write(self, request, issue, prop, existing):
        body = _body(request)
        if "value" not in body:
            raise BadRequest("value is required.")
        if not prop.is_active:
            raise BadRequest("This property is inactive.")
        raw = body["value"]
        extra = {f: _str_or_none(body.get(f), f) for f in ("external_id", "external_source") if f in body}
        if prop.is_multi:
            values = raw if isinstance(raw, list) else [raw]
            columns = [_one_value(prop, v, issue) for v in dict.fromkeys(values)]
            existing.delete(soft=False)
            rows = [
                WorkItemPropertyValue.objects.create(
                    workspace_id=issue.workspace_id,
                    project_id=issue.project_id,
                    issue=issue,
                    property=prop,
                    **c,
                    **extra,
                )
                for c in columns
            ]
            return self._render(prop, rows)
        if isinstance(raw, list):
            raise BadRequest("This property holds a single value; send one value, not a list.")
        columns = _one_value(prop, raw, issue)
        row = existing.first() or WorkItemPropertyValue(
            workspace_id=issue.workspace_id, project_id=issue.project_id, issue=issue, property=prop
        )
        for field in ("value_text", "value_boolean", "value_decimal", "value_datetime", "value_uuid", "value_option"):
            setattr(row, field, columns.get(field))
        for field, value in extra.items():
            setattr(row, field, value)
        row.save()
        existing.exclude(pk=row.pk).delete(soft=False)
        return self._render(prop, [row])

    def delete(self, request, slug, project_id, issue_id, property_id):
        _, _, rows = self._target(slug, project_id, issue_id, property_id)
        rows.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------------------------------- templates


def _template_fields(body, *, partial) -> dict:
    data = {}
    if not partial or "name" in body:
        name = _str_or_none(body.get("name"), "name", allow_blank=False)
        if name is None:
            raise BadRequest("name is required.")
        data["name"] = name.strip()
    for field in ("description_html", "short_description"):
        if field in body:
            data[field] = _str_or_none(body[field], field, max_length=None) or ""
    if "description" in body and "short_description" not in body:
        data["short_description"] = _str_or_none(body["description"], "description", max_length=None) or ""
    if data.get("description_html"):
        ok, error, clean = validate_html_content(data["description_html"])
        if not ok:
            raise BadRequest(error or "Invalid HTML.")
        if clean is not None:
            data["description_html"] = clean
    if "template_data" in body and body["template_data"] is not None:
        data["template_data"] = _dict(body["template_data"], "template_data")
    if "logo_props" in body:
        data["logo_props"] = _dict(body["logo_props"], "logo_props") if body["logo_props"] is not None else {}
    return data


def _save_template(template, body, *, partial):
    data = _template_fields(body, partial=partial)
    if partial and "template_data" in data:
        # Updates merge into what is there, so a caller passes only what changes.
        data["template_data"] = {**(template.template_data or {}), **data["template_data"]}
    for field, value in data.items():
        setattr(template, field, value)
    template.save()
    return template


class _TemplateKind:
    """Which kind of template an endpoint serves. One table holds all three kinds,
    told apart by template_type, so a page template id never resolves on a work
    item route."""

    template_type = "WORK_ITEM"

    def templates(self, slug):
        return WorkItemTemplate.objects.filter(workspace__slug=slug, template_type=self.template_type)


class _WorkspaceTemplateView(_TemplateKind, _View):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [WorkspaceEntityPermission()]
        return [WorkspaceOwnerPermission()]


class WorkspaceTemplateListEndpoint(_WorkspaceTemplateView):
    def get(self, request, slug):
        """The workspace's templates and those of every project the caller belongs to."""
        member_of = ProjectMember.objects.filter(workspace__slug=slug, member=request.user, is_active=True).values(
            "project_id"
        )
        templates = self.templates(slug).filter(
            Q(project__isnull=True) | Q(project_id__in=member_of, project__deleted_at__isnull=True)
        )
        return Response(WorkItemTemplateSerializer(templates, many=True).data)

    def post(self, request, slug):
        template = _save_template(
            WorkItemTemplate(workspace=self.get_workspace(), template_type=self.template_type),
            _body(request),
            partial=False,
        )
        return Response(WorkItemTemplateSerializer(template).data, status=status.HTTP_201_CREATED)


class WorkspaceTemplateDetailEndpoint(_WorkspaceTemplateView):
    def _template(self, slug, template_id):
        return get_object_or_404(self.templates(slug), project__isnull=True, pk=template_id)

    def get(self, request, slug, template_id):
        return Response(WorkItemTemplateSerializer(self._template(slug, template_id)).data)

    def patch(self, request, slug, template_id):
        template = _save_template(self._template(slug, template_id), _body(request), partial=True)
        return Response(WorkItemTemplateSerializer(template).data)

    def delete(self, request, slug, template_id):
        self._template(slug, template_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class _ProjectTemplateView(_TemplateKind, _View):
    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [ProjectEntityPermission()]
        return [ProjectAdminPermission()]


class ProjectTemplateListEndpoint(_ProjectTemplateView):
    def get(self, request, slug, project_id):
        self.get_project()
        templates = self.templates(slug).filter(project_id=project_id)
        return Response(WorkItemTemplateSerializer(templates, many=True).data)

    def post(self, request, slug, project_id):
        project = self.get_project()
        template = _save_template(
            WorkItemTemplate(workspace_id=project.workspace_id, project=project, template_type=self.template_type),
            _body(request),
            partial=False,
        )
        return Response(WorkItemTemplateSerializer(template).data, status=status.HTTP_201_CREATED)


class ProjectTemplateDetailEndpoint(_ProjectTemplateView):
    def _template(self, slug, project_id, template_id):
        self.get_project()
        return get_object_or_404(self.templates(slug), project_id=project_id, pk=template_id)

    def get(self, request, slug, project_id, template_id):
        return Response(WorkItemTemplateSerializer(self._template(slug, project_id, template_id)).data)

    def patch(self, request, slug, project_id, template_id):
        template = _save_template(self._template(slug, project_id, template_id), _body(request), partial=True)
        return Response(WorkItemTemplateSerializer(template).data)

    def delete(self, request, slug, project_id, template_id):
        self._template(slug, project_id, template_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspacePageTemplateListEndpoint(WorkspaceTemplateListEndpoint):
    template_type = "PAGE"


class WorkspacePageTemplateDetailEndpoint(WorkspaceTemplateDetailEndpoint):
    template_type = "PAGE"


class ProjectPageTemplateListEndpoint(ProjectTemplateListEndpoint):
    template_type = "PAGE"


class ProjectPageTemplateDetailEndpoint(ProjectTemplateDetailEndpoint):
    template_type = "PAGE"


# A project template is what creates projects, so it only exists at the workspace.
class WorkspaceProjectTemplateListEndpoint(WorkspaceTemplateListEndpoint):
    template_type = "PROJECT"


class WorkspaceProjectTemplateDetailEndpoint(WorkspaceTemplateDetailEndpoint):
    template_type = "PROJECT"


# --------------------------------------------------------------------------- relation definitions


def _definition_fields(body, *, partial) -> dict:
    data = {}
    if not partial or "name" in body:
        name = _str_or_none(body.get("name"), "name", allow_blank=False)
        if name is None:
            raise BadRequest("name is required.")
        data["name"] = name.strip()
    for field in ("outward", "inward"):
        if body.get(field) is not None:
            data[field] = _str_or_none(body[field], field).strip()
    if body.get("color") is not None:
        data["color"] = _str_or_none(body["color"], "color", max_length=32)
    for flag in ("is_default", "is_active"):
        if body.get(flag) is not None:
            data[flag] = _bool(body[flag], flag)
    if body.get("sort_order") is not None:
        data["sort_order"] = _number(body["sort_order"], "sort_order")
    return data


def _save_definition(definition, data):
    if "name" in data:
        clash = WorkItemRelationDefinition.objects.filter(workspace_id=definition.workspace_id, name=data["name"])
        if clash.exclude(pk=definition.pk).exists():
            raise _conflict(f'A relation definition named "{data["name"]}" already exists in this workspace.')
    for field, value in data.items():
        setattr(definition, field, value)
    # Unlabelled directions read as the relation's name.
    definition.outward = definition.outward or definition.name
    definition.inward = definition.inward or definition.name
    try:
        with transaction.atomic():
            definition.save()
    except IntegrityError:
        raise _conflict(f'A relation definition named "{definition.name}" already exists in this workspace.') from None
    return definition


def _builtin_definitions(workspace_id, flags) -> list[dict]:
    """CE's relates_to and duplicate, in the definition shape, with their stable ids.

    They are not rows, so the list never showed them, and the work-item-relations
    endpoint needs a definition id and label to create one: they could not be found.
    Both are default and active, so a filter that excludes either hides them.
    """
    if flags.get("is_default") is False or flags.get("is_active") is False:
        return []
    return [
        {
            **definition,
            "is_default": True,
            "is_active": True,
            "is_built_in": True,
            "color": "",
            "sort_order": float(order),
            "workspace": str(workspace_id),
            "created_at": None,
            "updated_at": None,
        }
        for order, definition in enumerate(BUILTIN_RELATION_DEFINITIONS.values())
    ]


def _first_page(request) -> bool:
    cursor = request.query_params.get("cursor")
    if not cursor:
        return True
    try:
        return int(cursor.split(":")[1]) == 0
    except (IndexError, ValueError):
        return False


class RelationDefinitionListEndpoint(_CatalogueView):
    def get(self, request, slug):
        definitions = WorkItemRelationDefinition.objects.filter(workspace__slug=slug)
        flags = {}
        for flag in ("is_default", "is_active"):
            value = _query_bool(request, flag)
            if value is not None:
                flags[flag] = value
                definitions = definitions.filter(**{flag: value})
        response = self.paginated(
            request, definitions.order_by("sort_order", "created_at"), WorkItemRelationDefinitionSerializer
        )
        builtins = _builtin_definitions(self.get_workspace().id, flags)
        if response.status_code == 200 and builtins:
            data = response.data
            data["total_count"] = data.get("total_count", 0) + len(builtins)
            data["total_results"] = data.get("total_results", 0) + len(builtins)
            if _first_page(request):
                data["results"] = builtins + list(data["results"])
                data["count"] = data.get("count", 0) + len(builtins)
        return response

    def post(self, request, slug):
        definition = WorkItemRelationDefinition(workspace=self.get_workspace())
        _save_definition(definition, _definition_fields(_body(request), partial=False))
        return Response(WorkItemRelationDefinitionSerializer(definition).data, status=status.HTTP_201_CREATED)


class RelationDefinitionDetailEndpoint(_CatalogueView):
    def _definition(self, slug, definition_id):
        return get_object_or_404(WorkItemRelationDefinition, workspace__slug=slug, pk=definition_id)

    def get(self, request, slug, definition_id):
        return Response(WorkItemRelationDefinitionSerializer(self._definition(slug, definition_id)).data)

    def patch(self, request, slug, definition_id):
        definition = self._definition(slug, definition_id)
        _save_definition(definition, _definition_fields(_body(request), partial=True))
        return Response(WorkItemRelationDefinitionSerializer(definition).data)

    def delete(self, request, slug, definition_id):
        self._definition(slug, definition_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)
