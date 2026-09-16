# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Integration endpoints (§5.7): connections, health, search and references."""

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.db.models import (
    ExternalReferenceLink,
    ExternalSystemConnection,
    IntegrationCallLog,
    IntegrationSystem,
    ResearchExternalReference,
)
from plane.research.serializers import (
    ExternalSystemConnectionSerializer,
    IntegrationCallLogSerializer,
    ResearchExternalReferenceSerializer,
)
from plane.research.services.integrations import client_for
from plane.research.utils.acl import ResearchResource
from plane.research.utils.audit import (
    ResearchAuditAction,
    ResearchResourceType,
    record_audit_event,
)
from plane.research.utils.capabilities import NAV_INTEGRATIONS
from plane.research.utils.errors import (
    ResearchErrorCode,
    research_conflict,
    research_error,
    research_not_found,
    research_permission_denied,
)
from plane.research.utils.integrations import (
    cache_key,
    filter_references,
    filter_source_items,
    get_cached,
    reference_allowed,
    set_cached,
)
from plane.research.utils.org import is_workspace_admin
from plane.research.utils.reference_targets import resolve_target
from plane.research.views.base import ResearchAPIView

SECTION = "integrations"
DEFAULT_SYSTEMS = list(IntegrationSystem.values)


def integrated_plane_resource(workspace_id, owner_id=None, visibility="DIRECT_ADVISOR"):
    return ResearchResource(
        kind="integration_target",
        workspace_id=workspace_id,
        owner_id=owner_id,
        visibility=visibility,
    )


def connection_map(workspace, *, enabled_only=False):
    query = ExternalSystemConnection.objects.filter(workspace=workspace, deleted_at__isnull=True)
    if enabled_only:
        query = query.filter(is_enabled=True)
    return {connection.system: connection for connection in query}


class ResearchIntegrationListEndpoint(ResearchAPIView):
    """``GET``/``PATCH /api/research/workspaces/<slug>/integrations/``"""

    nav_capability = NAV_INTEGRATIONS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        existing = connection_map(workspace)
        payload = []
        for system in DEFAULT_SYSTEMS:
            connection = existing.get(system)
            if connection is None:
                payload.append(
                    {
                        "system": system,
                        "display_name": system,
                        "configured": False,
                        "is_enabled": False,
                        "health_status": "UNKNOWN",
                        "credential_ref": "",
                        "has_credential": False,
                    }
                )
                continue
            data = ExternalSystemConnectionSerializer(connection).data
            data["configured"] = True
            payload.append(data)
        return Response({"results": payload, "count": len(payload)}, status=status.HTTP_200_OK)

    def patch(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        items = request.data.get("items")
        if not isinstance(items, list) or not items:
            return research_error(ResearchErrorCode.INTEGRATION_INVALID, "items must be a non-empty list.")

        updated = []
        for entry in items:
            system = str(entry.get("system") or "").upper()
            if system not in IntegrationSystem.values:
                return research_error(ResearchErrorCode.INTEGRATION_INVALID, f"Unknown system {system}.")
            defaults = {
                "display_name": str(entry.get("display_name") or system),
                "base_url": str(entry.get("base_url") or ""),
                "is_enabled": bool(entry.get("is_enabled", False)),
            }
            for field in ("auth_mode", "degraded_mode"):
                if entry.get(field):
                    defaults[field] = str(entry[field]).upper()
            if entry.get("credential_ref") is not None:
                defaults["credential_ref"] = str(entry.get("credential_ref") or "")
            for field in ("timeout_seconds", "cache_ttl_seconds"):
                if entry.get(field) is not None:
                    try:
                        defaults[field] = int(entry[field])
                    except (TypeError, ValueError):
                        return research_error(ResearchErrorCode.INTEGRATION_INVALID, f"{field} must be an integer.")
            try:
                with transaction.atomic():
                    connection, _ = ExternalSystemConnection.objects.update_or_create(
                        workspace=workspace,
                        system=system,
                        deleted_at__isnull=True,
                        defaults=defaults,
                    )
            except IntegrityError:
                return research_conflict(
                    ResearchErrorCode.INTEGRATION_CONNECTION_EXISTS,
                    "A connection for this system already exists.",
                )
            updated.append(connection)
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.INTEGRATION_CONNECTION_UPDATE,
                resource_type=ResearchResourceType.INTEGRATION,
                resource_id=connection.id,
                actor=request.user,
                metadata={
                    "system": system,
                    "is_enabled": connection.is_enabled,
                    "credential_changed": "credential_ref" in entry,
                },
                request=request,
            )
        return Response(
            {"results": ExternalSystemConnectionSerializer(updated, many=True).data, "count": len(updated)},
            status=status.HTTP_200_OK,
        )


class ResearchIntegrationHealthEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/integrations/health/`` (P1-INT-10)"""

    nav_capability = NAV_INTEGRATIONS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        existing = connection_map(workspace)
        payload = []
        for system in DEFAULT_SYSTEMS:
            connection = existing.get(system)
            if connection is None:
                payload.append(
                    {
                        "system": system,
                        "status": "UNKNOWN",
                        "configured": False,
                        "enabled": False,
                        "last_success_at": None,
                        "degraded_reason": "not_configured",
                    }
                )
                continue
            payload.append(
                {
                    "system": system,
                    "status": connection.health_status,
                    "configured": True,
                    "enabled": connection.is_enabled,
                    "last_health_at": connection.last_health_at,
                    "last_success_at": connection.last_success_at,
                    "degraded_reason": connection.last_error or ("" if connection.is_enabled else "disabled"),
                    "degraded_mode": connection.degraded_mode,
                }
            )
        return Response({"results": payload, "count": len(payload)}, status=status.HTTP_200_OK)


class ResearchIntegrationCallLogEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/integrations/call-logs/``"""

    nav_capability = NAV_INTEGRATIONS

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        if not is_workspace_admin(request.user, workspace):
            return research_permission_denied()
        query = IntegrationCallLog.objects.filter(workspace=workspace)
        if request.GET.get("system"):
            query = query.filter(system=str(request.GET["system"]).upper())
        if request.GET.get("outcome"):
            query = query.filter(outcome=str(request.GET["outcome"]).upper())
        logs = list(query.order_by("-created_at")[:200])
        return Response(
            {"results": IntegrationCallLogSerializer(logs, many=True).data, "count": len(logs)},
            status=status.HTTP_200_OK,
        )


def perform_search(request, workspace, system, *, query, params=None, plane_resource=None):
    """Run a cached, ACL filtered, logged search against one system."""
    connection = connection_map(workspace).get(system)
    client = client_for(system, connection)
    key = cache_key(workspace.id, system, client.operation, query, request.user, page=(params or {}).get("page"))
    cached = get_cached(key)
    if cached is not None:
        return cached

    result = client.search(query=query, params=params, request=request)
    items = filter_source_items(result.items, request.user, workspace.id, plane_resource=plane_resource)
    payload = result.as_payload(items=items, count=len(items))
    payload["filtered_out"] = len(result.items) - len(items)
    return set_cached(key, payload, degraded=result.degraded)


class ResearchIntegrationSearchEndpoint(ResearchAPIView):
    """``GET /api/research/workspaces/<slug>/integrations/search/``"""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        system = str(request.GET.get("system") or "").upper()
        if system not in IntegrationSystem.values:
            return research_error(ResearchErrorCode.INTEGRATION_INVALID, "Unknown system.")
        query = str(request.GET.get("q") or "")
        payload = perform_search(request, workspace, system, query=query)
        return Response(payload, status=status.HTTP_200_OK)


class ResearchSystemSearchEndpoint(ResearchAPIView):
    """Semantic entries for a system (§5.7): knowledge / lab / rd lookups."""

    system = None
    operation = None

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        query = str(request.GET.get("q") or "")
        connection = connection_map(workspace).get(self.system)
        client = client_for(self.system, connection)
        key = cache_key(
            workspace.id,
            self.system,
            self.operation or client.operation,
            query,
            request.user,
        )
        cached = get_cached(key)
        if cached is None:
            result = client.search(
                query=query,
                params={"page": request.GET.get("page")} if request.GET.get("page") else None,
                request=request,
                operation=self.operation,
            )
            items = filter_source_items(result.items, request.user, workspace.id)
            payload = result.as_payload(items=items, count=len(items))
            payload["filtered_out"] = len(result.items) - len(items)
            cached = set_cached(key, payload, degraded=result.degraded)
        return Response(cached, status=status.HTTP_200_OK)


class ResearchKnowledgeSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "RAGPORTAL"
    operation = "fetch_knowledge_entries"


class ResearchLabRunSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "SPECLABOS"
    operation = "fetch_run_records"


class ResearchLabAssetSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "SPECLABOS"
    operation = "fetch_data_assets"


class ResearchDeviceExecutionSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "SMARTACCESS"
    operation = "fetch_device_executions"


class ResearchRdProjectSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "POLY_AGENT"
    operation = "fetch_rd_projects"


class ResearchRdAnalysisSearchEndpoint(ResearchSystemSearchEndpoint):
    system = "SPEC_AGENT"
    operation = "fetch_analysis_results"


class ResearchExternalReferenceSyncEndpoint(ResearchAPIView):
    """``POST /api/research/workspaces/<slug>/external-references/<ref_id>/sync/``

    Refresh the cached metadata from the source system. The external identity
    never changes and each refresh appends to ``metadata.history``, so a result
    that is re-generated keeps every generation (P1-RD-05).
    """

    def post(self, request, slug, reference_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = ResearchExternalReferenceDetailEndpoint()._load(
            request, workspace, reference_id
        )
        if error:
            return error
        connection = connection_map(workspace).get(reference.system)
        client = client_for(reference.system, connection)
        result = client.request(
            path=f"{client.search_path}{reference.external_id}/",
            operation="refresh_reference",
            request=request,
        )
        if result.degraded:
            reference.status = ResearchExternalReference.Status.DEGRADED
            reference.save(update_fields=["status", "updated_at"])
            payload = ResearchExternalReferenceSerializer(reference).data
            payload["degraded"] = True
            payload["degraded_reason"] = result.degraded_reason
            return Response(payload, status=status.HTTP_200_OK)

        item = result.items[0] if result.items else {}
        history = list((reference.metadata or {}).get("history", []))
        if reference.summary or reference.metadata:
            history.append(
                {
                    "synced_at": reference.synced_at.isoformat() if reference.synced_at else None,
                    "summary": reference.summary,
                    "metadata": reference.metadata,
                }
            )
        metadata = dict(item.get("metadata") or {})
        metadata["history"] = history[-20:]
        reference.title = str(item.get("title") or reference.title)[:500]
        reference.summary = str(item.get("summary") or reference.summary)[:2000]
        reference.metadata = metadata
        if item.get("source_url"):
            reference.source_url = str(item["source_url"])[:500]
        if item.get("acl_hint"):
            reference.acl_hint = item["acl_hint"]
        reference.status = ResearchExternalReference.Status.ACTIVE
        reference.synced_at = timezone.now()
        reference.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_REFERENCE_UPDATE,
            resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
            resource_id=reference.id,
            actor=request.user,
            metadata={"system": reference.system, "external_id": reference.external_id, "refresh": True},
            request=request,
        )
        payload = ResearchExternalReferenceSerializer(reference).data
        payload["degraded"] = False
        payload["history_count"] = len(reference.metadata.get("history", []))
        return Response(payload, status=status.HTTP_200_OK)


class ResearchExternalReferenceListCreateEndpoint(ResearchAPIView):
    """``GET``/``POST /api/research/workspaces/<slug>/external-references/``"""

    def get(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        query = ResearchExternalReference.objects.filter(
            workspace=workspace, deleted_at__isnull=True
        ).prefetch_related("links")
        for field in ("system", "external_type", "status"):
            if request.GET.get(field):
                query = query.filter(**{field: str(request.GET[field]).upper()})
        references = filter_references(list(query.order_by("-created_at")[:200]), request.user, workspace.id)
        return Response(
            {
                "results": ResearchExternalReferenceSerializer(references, many=True).data,
                "count": len(references),
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, slug):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        system = str(request.data.get("system") or "").upper()
        external_type = str(request.data.get("external_type") or "").upper()
        external_id = str(request.data.get("external_id") or "").strip()
        title = str(request.data.get("title") or "").strip()
        source_url = str(request.data.get("source_url") or "").strip()
        if system not in IntegrationSystem.values:
            return research_error(ResearchErrorCode.EXTERNAL_REFERENCE_INVALID, "Unknown system.")
        if external_type not in ResearchExternalReference.ExternalType.values:
            return research_error(ResearchErrorCode.EXTERNAL_REFERENCE_INVALID, "Unknown external type.")
        if not external_id or not title or not source_url:
            return research_error(
                ResearchErrorCode.EXTERNAL_REFERENCE_INVALID,
                "external_id, title and source_url are required.",
            )
        if not request.data.get("acl_hint"):
            # registering a reference without an ACL hint would make it invisible
            # to everyone; require the caller to state the source permissions
            return research_error(
                ResearchErrorCode.EXTERNAL_REFERENCE_INVALID,
                "acl_hint is required: source permissions decide visibility.",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        try:
            with transaction.atomic():
                reference = ResearchExternalReference.objects.create(
                    workspace=workspace,
                    system=system,
                    external_type=external_type,
                    external_id=external_id,
                    external_parent_id=str(request.data.get("external_parent_id") or ""),
                    title=title,
                    summary=str(request.data.get("summary") or ""),
                    source_url=source_url,
                    acl_hint=request.data.get("acl_hint") or {},
                    metadata=request.data.get("metadata") or {},
                    content_hash=str(request.data.get("content_hash") or ""),
                    synced_at=timezone.now(),
                    created_by=request.user,
                )
        except IntegrityError:
            return research_conflict(
                ResearchErrorCode.EXTERNAL_REFERENCE_EXISTS,
                "This external object is already referenced.",
            )
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_REFERENCE_CREATE,
            resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
            resource_id=reference.id,
            actor=request.user,
            metadata={"system": system, "external_type": external_type, "external_id": external_id},
            request=request,
        )
        return Response(
            ResearchExternalReferenceSerializer(reference).data,
            status=status.HTTP_201_CREATED,
        )


class ResearchExternalReferenceDetailEndpoint(ResearchAPIView):
    """``GET``/``PATCH``/``DELETE /api/research/workspaces/<slug>/external-references/<ref_id>/``"""

    def _load(self, request, workspace, reference_id):
        reference = ResearchExternalReference.objects.filter(
            workspace=workspace, pk=reference_id, deleted_at__isnull=True
        ).first()
        if reference is None:
            return None, research_not_found(
                ResearchErrorCode.EXTERNAL_REFERENCE_NOT_FOUND,
                "External reference not found.",
            )
        if not reference_allowed(reference, request.user, workspace.id):
            return None, research_not_found(
                ResearchErrorCode.EXTERNAL_REFERENCE_NOT_FOUND,
                "External reference not found.",
            )
        return reference, None

    def get(self, request, slug, reference_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = self._load(request, workspace, reference_id)
        if error:
            return error
        return Response(ResearchExternalReferenceSerializer(reference).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, reference_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = self._load(request, workspace, reference_id)
        if error:
            return error
        for field in ("title", "summary", "source_url", "content_hash"):
            if field in request.data:
                setattr(reference, field, str(request.data.get(field) or ""))
        if "acl_hint" in request.data:
            reference.acl_hint = request.data.get("acl_hint") or {}
        if "metadata" in request.data:
            reference.metadata = request.data.get("metadata") or {}
        if "status" in request.data:
            target = str(request.data.get("status") or "").upper()
            if target not in ResearchExternalReference.Status.values:
                return research_error(ResearchErrorCode.EXTERNAL_REFERENCE_INVALID, "Unknown status.")
            reference.status = target
        reference.synced_at = timezone.now()
        reference.save()
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_REFERENCE_UPDATE,
            resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
            resource_id=reference.id,
            actor=request.user,
            metadata={"fields": sorted(request.data.keys())},
            request=request,
        )
        return Response(ResearchExternalReferenceSerializer(reference).data, status=status.HTTP_200_OK)

    def delete(self, request, slug, reference_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = self._load(request, workspace, reference_id)
        if error:
            return error
        reference.deleted_at = timezone.now()
        reference.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_REFERENCE_DELETE,
            resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
            resource_id=reference.id,
            actor=request.user,
            metadata={"system": reference.system, "external_id": reference.external_id},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResearchExternalReferenceLinkEndpoint(ResearchAPIView):
    """``POST``/``DELETE`` on ``/external-references/<ref_id>/links/``"""

    def post(self, request, slug, reference_id):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = ResearchExternalReferenceDetailEndpoint()._load(request, workspace, reference_id)
        if error:
            return error
        target_type = str(request.data.get("target_type") or "").upper()
        target_id = request.data.get("target_id")
        if target_type not in ExternalReferenceLink.TargetType.values or not target_id:
            return research_error(
                ResearchErrorCode.EXTERNAL_REFERENCE_INVALID,
                "target_type and target_id are required.",
            )
        target, target_error = resolve_target(request.user, workspace, target_type, target_id)
        if target is None:
            if target_error == "external_reference_invalid":
                return research_error(
                    ResearchErrorCode.EXTERNAL_REFERENCE_INVALID,
                    "Unknown link target type.",
                )
            return research_not_found(
                ResearchErrorCode.EXTERNAL_REFERENCE_LINK_NOT_FOUND,
                "The link target was not found or is not visible to you.",
            )
        link, created = ExternalReferenceLink.objects.get_or_create(
            reference=reference,
            target_type=target_type,
            target_id=target_id,
            defaults={"created_by": request.user},
        )
        if created:
            record_audit_event(
                workspace=workspace,
                action=ResearchAuditAction.INTEGRATION_REFERENCE_LINK,
                resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
                resource_id=reference.id,
                actor=request.user,
                metadata={"target_type": target_type, "target_id": str(target_id)},
                request=request,
            )
        return Response(
            ResearchExternalReferenceSerializer(reference).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, slug, reference_id, link_id=None):
        workspace, error = self.get_workspace(section=SECTION)
        if error:
            return error
        reference, error = ResearchExternalReferenceDetailEndpoint()._load(request, workspace, reference_id)
        if error:
            return error
        link = ExternalReferenceLink.objects.filter(pk=link_id, reference=reference).first()
        if link is None:
            return research_not_found(
                ResearchErrorCode.EXTERNAL_REFERENCE_LINK_NOT_FOUND,
                "Reference link not found.",
            )
        link.deleted_at = timezone.now()
        link.save(update_fields=["deleted_at", "updated_at"])
        record_audit_event(
            workspace=workspace,
            action=ResearchAuditAction.INTEGRATION_REFERENCE_UNLINK,
            resource_type=ResearchResourceType.EXTERNAL_REFERENCE,
            resource_id=reference.id,
            actor=request.user,
            metadata={"target_type": link.target_type, "target_id": str(link.target_id)},
            request=request,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
