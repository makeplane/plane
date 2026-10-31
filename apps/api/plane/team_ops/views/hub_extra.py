# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Hub sections beyond chat: people and private messages, the Doc Hub, the Files library, Secrets and Flows."""

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.exceptions import NotFound, ParseError
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission
from plane.app.views.base import BaseAPIView
from plane.db.models import Project, ProjectMember, User, Workspace
from plane.team_ops.models import Flow, HubAttachment, HubDoc, HubSecretAccess
from plane.team_ops.services import flows, hub, hub_files
from plane.team_ops.services import secrets as secret_service
from plane.team_ops.services.access import CALENDAR_ROLES, CalendarAccess, calendar_user_ids
from plane.team_ops.services.time_entry import parse_uuid
from plane.team_ops.views.hub import _channel_payload, _forbidden, _ids, person

MAX_TAGS = 10


def _member(request, slug):
    """The workspace and whether the caller is an admin, or `None` for someone who does not work in it."""
    workspace = Workspace.objects.get(slug=slug)
    access = CalendarAccess(request.user, workspace)
    return (workspace, access.is_admin) if access.is_calendar_user else (None, False)


class HubPeopleEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Everyone the caller can write to privately."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        users = User.objects.filter(pk__in=calendar_user_ids(workspace)).exclude(pk=request.user.pk)
        return Response({"results": [person(user) for user in users.order_by("display_name")]})


class HubDirectEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Open (or create) the private conversation with `user`."""
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        other = User.objects.filter(pk=parse_uuid(request.data.get("user"), "user")).first()
        if other is None:
            raise NotFound("Person not found.")
        channel = hub.dm_channel(workspace, request.user, other)
        return Response(_channel_payload(channel, 0, request.user, is_admin), status=status.HTTP_200_OK)


# ---- Doc Hub ----


def _tags(value):
    if value in (None, ""):
        return []
    if not isinstance(value, list) or len(value) > MAX_TAGS:
        raise ParseError(detail=f"At most {MAX_TAGS} tags.")
    cleaned = []
    for tag in value:
        tag = str(tag).strip().lower()[:30]
        if tag and tag not in cleaned:
            cleaned.append(tag)
    return cleaned


def _doc_payload(doc, full=False):
    data = {
        "id": doc.id,
        "title": doc.title,
        "tags": doc.tags,
        "project": {"id": doc.project_id, "name": doc.project.name, "identifier": doc.project.identifier}
        if doc.project_id
        else None,
        "author": person(doc.author),
        "updated_at": doc.updated_at,
        "excerpt": doc.body[:200],
    }
    if full:
        data["body"] = doc.body
    return data


def _visible_docs(workspace, user, is_admin):
    queryset = HubDoc.objects.filter(workspace=workspace).select_related("author", "project")
    if is_admin:
        return queryset
    mine = ProjectMember.objects.filter(member=user, is_active=True).values("project_id")
    return queryset.filter(Q(project__isnull=True) | Q(project_id__in=mine) | Q(author=user))


def _project_of(workspace, user, is_admin, raw):
    """The project a document or secret is tied to; only one the person belongs to (admins: any)."""
    if not raw:
        return None
    project = Project.objects.filter(workspace=workspace, pk=parse_uuid(raw, "project")).first()
    belongs = (
        project is not None and ProjectMember.objects.filter(project=project, member=user, is_active=True).exists()
    )
    if project is None or not (belongs or is_admin):
        raise ParseError(detail="Choose a project you are a member of.")
    return project


class HubDocListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Documents the caller may read. Filters: `q` (title), `tag`, `project`."""
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        queryset = _visible_docs(workspace, request.user, is_admin)
        params = request.query_params
        if params.get("q"):
            queryset = queryset.filter(title__icontains=params["q"][:100])
        if params.get("project"):
            queryset = queryset.filter(project_id=parse_uuid(params["project"], "project"))
        docs = list(queryset[:200])
        if params.get("tag"):
            wanted = params["tag"].strip().lower()
            docs = [doc for doc in docs if wanted in doc.tags]
        tags = sorted({tag for doc in docs for tag in doc.tags})
        return Response({"results": [_doc_payload(doc) for doc in docs], "tags": tags})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        data = request.data
        title = str(data.get("title", "")).strip()
        if not title or len(title) > 200:
            raise ParseError(detail="Give the document a title.")
        body = str(data.get("body", ""))
        if len(body) > 100000:
            raise ParseError(detail="The document is too long.")
        doc = HubDoc.objects.create(
            workspace=workspace,
            author=request.user,
            title=title,
            body=body,
            tags=_tags(data.get("tags")),
            project=_project_of(workspace, request.user, is_admin, data.get("project")),
        )
        return Response(_doc_payload(doc, full=True), status=status.HTTP_201_CREATED)


class HubDocDetailEndpoint(BaseAPIView):
    def _doc(self, request, slug, pk):
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return None, None, False
        doc = _visible_docs(workspace, request.user, is_admin).filter(pk=pk).first()
        if doc is None:
            raise NotFound("Document not found.")
        return workspace, doc, is_admin

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        workspace, doc, _ = self._doc(request, slug, pk)
        if workspace is None:
            return _forbidden()
        return Response(_doc_payload(doc, full=True))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def patch(self, request, slug, pk):
        workspace, doc, is_admin = self._doc(request, slug, pk)
        if workspace is None:
            return _forbidden()
        if doc.author_id != request.user.id and not is_admin:
            raise ParseError(detail="You can only change your own documents.")
        data = request.data
        if "title" in data:
            title = str(data["title"]).strip()
            if not title or len(title) > 200:
                raise ParseError(detail="Give the document a title.")
            doc.title = title
        if "body" in data:
            if len(str(data["body"])) > 100000:
                raise ParseError(detail="The document is too long.")
            doc.body = str(data["body"])
        if "tags" in data:
            doc.tags = _tags(data["tags"])
        if "project" in data:
            doc.project = _project_of(workspace, request.user, is_admin, data["project"])
        doc.save()
        return Response(_doc_payload(doc, full=True))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace, doc, is_admin = self._doc(request, slug, pk)
        if workspace is None:
            return _forbidden()
        if doc.author_id != request.user.id and not is_admin:
            raise ParseError(detail="You can only delete your own documents.")
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Files ----


def _file_payload(attachment, source):
    return {
        "id": attachment.id,
        "name": attachment.name,
        "content_type": attachment.content_type,
        "size": attachment.size,
        "uploaded_by": person(attachment.uploaded_by),
        "created_at": attachment.created_at,
        "source": source,
    }


class HubFileLibraryEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Files shared with the whole workspace, and files from the channels the caller can read."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        channels = {channel.id: channel for channel in hub.channels_of(workspace, request.user)}
        queryset = (
            HubAttachment.objects.filter(workspace=workspace)
            .filter(Q(library=True) | Q(message__channel_id__in=list(channels), message__is_deleted=False))
            .select_related("uploaded_by", "message")
            .order_by("-created_at")[:300]
        )
        results = []
        for attachment in queryset:
            if attachment.library:
                source = "Library"
            else:
                source = hub.channel_name(channels[attachment.message.channel_id], request.user)
            results.append(_file_payload(attachment, source))
        return Response({"results": results})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        """Share files with everyone in the workspace."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        files = request.FILES.getlist("files")
        if not files or len(files) > hub_files.MAX_FILES_PER_MESSAGE:
            raise ParseError(detail=f"Send 1 to {hub_files.MAX_FILES_PER_MESSAGE} files.")
        for upload in files:
            hub_files.validate_upload(upload)
        stored = [
            hub_files.store_attachment(workspace=workspace, user=request.user, upload=upload, library=True)
            for upload in files
        ]
        return Response(
            {"results": [_file_payload(item, "Library") for item in stored]}, status=status.HTTP_201_CREATED
        )


class HubFileLibraryDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        """Remove a library file: its uploader or an admin."""
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        attachment = HubAttachment.objects.filter(pk=pk, workspace=workspace, library=True).first()
        if attachment is None:
            raise NotFound("File not found.")
        if attachment.uploaded_by_id != request.user.id and not is_admin:
            raise ParseError(detail="You can only remove your own files.")
        attachment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---- Secrets ----


def _secret_payload(secret, viewer):
    mine = secret.publisher_id == viewer.id
    data = {
        "id": secret.id,
        "name": secret.name,
        "description": secret.description,
        "publisher": person(secret.publisher),
        "project": {"id": secret.project_id, "name": secret.project.name} if secret.project_id else None,
        "is_publisher": mine,
        "updated_at": secret.updated_at,
    }
    if mine:
        data["shared_with"] = [
            str(user_id) for user_id in HubSecretAccess.objects.filter(secret=secret).values_list("user_id", flat=True)
        ]
    return data


class HubSecretListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Secrets the caller published or was given. The values are never in the list."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        rows = secret_service.visible(workspace, request.user)
        return Response({"results": [_secret_payload(secret, request.user) for secret in rows]})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        data = request.data
        project = _project_of(workspace, request.user, is_admin, data.get("project"))
        secret = secret_service.publish(
            workspace, request.user, data.get("name"), data.get("description"), data.get("value"), project
        )
        if data.get("users"):
            secret_service.set_access(secret, request.user, _ids(request, "users"))
        return Response(_secret_payload(secret, request.user), status=status.HTTP_201_CREATED)


class HubSecretDetailEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def patch(self, request, slug, pk):
        """Change the name, description or value. Only the publisher."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        secret = secret_service.get_published(workspace, request.user, pk)
        data = request.data
        secret_service.update(secret, request.user, data.get("name"), data.get("description"), data.get("value"))
        return Response(_secret_payload(secret, request.user))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        secret_service.get_published(workspace, request.user, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HubSecretRevealEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug, pk):
        """The value, for the publisher and the people they chose. Every reveal is logged."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        secret = secret_service.get_visible(workspace, request.user, pk)
        response = Response({"value": secret_service.reveal(secret, request.user)})
        response["Cache-Control"] = "no-store"
        return response


class HubSecretAccessEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def put(self, request, slug, pk):
        """Replace the list of people who may read the secret. Only the publisher."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        secret = secret_service.get_published(workspace, request.user, pk)
        secret_service.set_access(secret, request.user, _ids(request, "users"))
        return Response(_secret_payload(secret, request.user))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug, pk):
        """Who did what with the secret (never the value). Only the publisher."""
        workspace, _ = _member(request, slug)
        if workspace is None:
            return _forbidden()
        secret = secret_service.get_published(workspace, request.user, pk)
        rows = secret.log.select_related("user", "target")[:100]
        return Response(
            {
                "results": [
                    {
                        "action": row.action,
                        "user": person(row.user),
                        "target": person(row.target) if row.target else None,
                        "at": row.created_at,
                    }
                    for row in rows
                ]
            }
        )


# ---- Flows ----


class FlowListEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """Flows of the projects the caller belongs to (admins: all), each with everyone's progress."""
        workspace, is_admin = _member(request, slug)
        if workspace is None:
            return _forbidden()
        rows = flows.visible_flows(workspace, request.user, is_admin)
        return Response({"results": [flows.describe(flow) for flow in rows], "can_manage": is_admin})

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def post(self, request, slug):
        workspace, is_admin = _member(request, slug)
        if workspace is None or not is_admin:
            return _forbidden()
        project = flows.project_for(workspace, request.data.get("project"))
        flow = flows.save_flow(workspace, project, request.data.get("name"), request.data.get("stages"))
        return Response(flows.describe(flow), status=status.HTTP_201_CREATED)


class FlowDetailEndpoint(BaseAPIView):
    def _flow(self, workspace, pk):
        flow = Flow.objects.filter(workspace=workspace, pk=pk).select_related("project").first()
        if flow is None:
            raise NotFound("Flow not found.")
        return flow

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def put(self, request, slug, pk):
        workspace, is_admin = _member(request, slug)
        if workspace is None or not is_admin:
            return _forbidden()
        flow = self._flow(workspace, pk)
        flows.save_flow(workspace, flow.project, request.data.get("name"), request.data.get("stages"), flow=flow)
        return Response(flows.describe(flow))

    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def delete(self, request, slug, pk):
        workspace, is_admin = _member(request, slug)
        if workspace is None or not is_admin:
            return _forbidden()
        self._flow(workspace, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FlowProjectMembersEndpoint(BaseAPIView):
    @allow_permission(CALENDAR_ROLES, level="WORKSPACE")
    def get(self, request, slug):
        """People who can be put into a flow of a project (admins only): `?project=<id>`."""
        workspace, is_admin = _member(request, slug)
        if workspace is None or not is_admin:
            return _forbidden()
        project = flows.project_for(workspace, request.query_params.get("project"))
        ids = calendar_user_ids(workspace) & set(
            ProjectMember.objects.filter(project=project, is_active=True).values_list("member_id", flat=True)
        )
        users = User.objects.filter(pk__in=ids).order_by("display_name")
        return Response({"results": [person(user) for user in users]})
