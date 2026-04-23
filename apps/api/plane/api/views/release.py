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

from rest_framework.response import Response
from rest_framework import status

from plane.api.views.base import ScopedBaseViewSet
from plane.db.models import (
    Release,
    ReleaseTag,
    ReleaseLabel,
    ReleaseLabelAssociation,
    ReleaseComment,
    ReleaseLink,
    ReleaseWorkItem,
    Workspace,
    Issue,
)
from plane.permissions import can, ReleasePermissions
from plane.api.serializers import (
    ReleaseSerializer,
    ReleaseTagSerializer,
    ReleaseLabelSerializer,
    ReleaseCommentSerializer,
    ReleaseLinkSerializer,
)
from plane.api.permissions import ReleasesFeatureFlagPermission
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    RELEASES_READ_SCOPE,
    RELEASES_WRITE_SCOPE,
    RELEASES_TAGS_READ_SCOPE,
    RELEASES_TAGS_WRITE_SCOPE,
    RELEASES_LABELS_READ_SCOPE,
    RELEASES_LABELS_WRITE_SCOPE,
    RELEASES_WORK_ITEMS_READ_SCOPE,
    RELEASES_WORK_ITEMS_WRITE_SCOPE,
    RELEASES_COMMENTS_READ_SCOPE,
    RELEASES_COMMENTS_WRITE_SCOPE,
    RELEASES_LINKS_READ_SCOPE,
    RELEASES_LINKS_WRITE_SCOPE,
)


class ReleaseViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseSerializer
    model = Release
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return Release.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @can(ReleasePermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def list(self, request, slug):
        releases = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=releases,
            on_results=lambda releases: ReleaseSerializer(releases, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, pk):
        release = self.get_queryset().get(id=pk)
        return Response(ReleaseSerializer(release).data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, pk):
        release = self.get_queryset().get(id=pk)
        serializer = ReleaseSerializer(release, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, pk):
        release = self.get_queryset().get(id=pk)
        release.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Label management on a release
    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def get_labels(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        labels = ReleaseLabel.objects.filter(
            release_label_associations__release=release, release_label_associations__deleted_at__isnull=True
        )
        return self.paginate(
            request=request,
            queryset=labels,
            on_results=lambda labels: ReleaseLabelSerializer(labels, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def add_labels(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        label_ids = request.data.get("label_ids", [])

        existing_label_ids = ReleaseLabelAssociation.objects.filter(
            release=release, label_id__in=label_ids
        ).values_list("label_id", flat=True)

        existing_label_ids = [str(uuid_id) for uuid_id in existing_label_ids]
        new_label_ids = set(label_ids) - set(existing_label_ids)

        for label_id in new_label_ids:
            label = ReleaseLabel.objects.get(id=label_id, workspace__slug=slug)
            ReleaseLabelAssociation.objects.create(release=release, label=label, workspace_id=release.workspace_id)

        new_labels = ReleaseLabel.objects.filter(id__in=label_ids)
        serializer = ReleaseLabelSerializer(new_labels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def remove_labels(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        label_ids = request.data.get("label_ids", [])
        for label_id in label_ids:
            label = ReleaseLabel.objects.get(id=label_id, workspace__slug=slug)
            ReleaseLabelAssociation.objects.filter(release=release, label=label).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseTagViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseTagSerializer
    model = ReleaseTag
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_TAGS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_TAGS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [RELEASES_TAGS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_TAGS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [RELEASES_TAGS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return ReleaseTag.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @can(ReleasePermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseTagSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def list(self, request, slug):
        tags = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=tags,
            on_results=lambda tags: ReleaseTagSerializer(tags, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, pk):
        tag = self.get_queryset().get(id=pk)
        return Response(ReleaseTagSerializer(tag).data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, pk):
        tag = self.get_queryset().get(id=pk)
        serializer = ReleaseTagSerializer(
            tag, data=request.data, partial=True, context={"workspace_id": tag.workspace_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, pk):
        tag = self.get_queryset().get(id=pk)
        tag.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseLabelViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseLabelSerializer
    model = ReleaseLabel
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_LABELS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_LABELS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [RELEASES_LABELS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_LABELS_WRITE_SCOPE]],
        "PUT": [[WRITE_SCOPE], [RELEASES_LABELS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return ReleaseLabel.objects.filter(workspace__slug=self.kwargs.get("slug")).order_by("sort_order")

    @can(ReleasePermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ReleaseLabelSerializer(data=request.data, context={"workspace_id": workspace.id})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def list(self, request, slug):
        labels = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=labels,
            on_results=lambda labels: ReleaseLabelSerializer(labels, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.VIEW, resource_param="pk")
    def retrieve(self, request, slug, pk):
        label = self.get_queryset().get(id=pk)
        return Response(ReleaseLabelSerializer(label).data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="pk")
    def partial_update(self, request, slug, pk):
        label = self.get_queryset().get(id=pk)
        serializer = ReleaseLabelSerializer(
            label, data=request.data, partial=True, context={"workspace_id": label.workspace_id}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.DELETE, resource_param="pk")
    def destroy(self, request, slug, pk):
        label = self.get_queryset().get(id=pk)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseWorkItemsViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseSerializer
    model = Release
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_READ_SCOPE, RELEASES_WORK_ITEMS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_WORK_ITEMS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_WORK_ITEMS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return Release.objects.filter(workspace__slug=self.kwargs.get("slug"))

    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def get_work_items(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        work_items = Issue.objects.filter(
            release_work_items__release=release, release_work_items__deleted_at__isnull=True
        )
        return self.paginate(
            request=request,
            queryset=work_items,
            on_results=lambda work_items: [
                {"id": str(wi.id), "project_id": str(wi.project_id), "name": str(wi.name)} for wi in work_items
            ],
            default_per_page=20,
        )

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def add_work_items(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        work_item_ids = request.data.get("work_item_ids", [])

        existing_work_item_ids = ReleaseWorkItem.objects.filter(
            release=release, work_item_id__in=work_item_ids
        ).values_list("work_item_id", flat=True)

        existing_work_item_ids = [str(uuid_id) for uuid_id in existing_work_item_ids]
        new_work_item_ids = set(work_item_ids) - set(existing_work_item_ids)

        for work_item_id in new_work_item_ids:
            work_item = Issue.objects.get(id=work_item_id, workspace__slug=slug)
            ReleaseWorkItem.objects.create(release=release, work_item=work_item, workspace_id=release.workspace_id)

        return Response({"message": "Work items added successfully"}, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def remove_work_items(self, request, slug, release_id):
        release = self.get_queryset().get(id=release_id)
        work_item_ids = request.data.get("work_item_ids", [])
        for work_item_id in work_item_ids:
            work_item = Issue.objects.get(id=work_item_id, workspace__slug=slug)
            ReleaseWorkItem.objects.filter(release=release, work_item=work_item).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseCommentViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseCommentSerializer
    model = ReleaseComment
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_READ_SCOPE, RELEASES_COMMENTS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_COMMENTS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_COMMENTS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_COMMENTS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return ReleaseComment.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            release_id=self.kwargs.get("release_id"),
        )

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def create(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        release = Release.objects.get(id=release_id, workspace=workspace)
        serializer = ReleaseCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, release_id=release.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def list(self, request, slug, release_id):
        comments = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=comments,
            on_results=lambda comments: ReleaseCommentSerializer(comments, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def retrieve(self, request, slug, release_id, pk):
        comment = self.get_queryset().get(id=pk)
        return Response(ReleaseCommentSerializer(comment).data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def partial_update(self, request, slug, release_id, pk):
        comment = self.get_queryset().get(id=pk)
        serializer = ReleaseCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def destroy(self, request, slug, release_id, pk):
        comment = self.get_queryset().get(id=pk)
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseLinkViewSet(ScopedBaseViewSet):
    use_read_replica = True

    serializer_class = ReleaseLinkSerializer
    model = ReleaseLink
    permission_classes = [*ScopedBaseViewSet.permission_classes, ReleasesFeatureFlagPermission]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [RELEASES_READ_SCOPE, RELEASES_LINKS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_LINKS_WRITE_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_LINKS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [RELEASES_WRITE_SCOPE, RELEASES_LINKS_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return ReleaseLink.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            release_id=self.kwargs.get("release_id"),
        )

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def create(self, request, slug, release_id):
        workspace = Workspace.objects.get(slug=slug)
        release = Release.objects.get(id=release_id, workspace=workspace)
        serializer = ReleaseLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, release_id=release.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def list(self, request, slug, release_id):
        links = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=links,
            on_results=lambda links: ReleaseLinkSerializer(links, many=True).data,
            default_per_page=20,
        )

    @can(ReleasePermissions.VIEW, resource_param="release_id")
    def retrieve(self, request, slug, release_id, pk):
        link = self.get_queryset().get(id=pk)
        return Response(ReleaseLinkSerializer(link).data, status=status.HTTP_200_OK)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def partial_update(self, request, slug, release_id, pk):
        link = self.get_queryset().get(id=pk)
        serializer = ReleaseLinkSerializer(link, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @can(ReleasePermissions.EDIT, resource_param="release_id")
    def destroy(self, request, slug, release_id, pk):
        link = self.get_queryset().get(id=pk)
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
