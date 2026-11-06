# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Releases, release labels/tags/changelogs, milestones and initiatives (plane-sdk 0.3.1).

Permissions: workspace guests read, members write; deleting a release, initiative
or milestone takes its creator or an admin. Linked work items are only listed,
and only linkable, when the caller can view them (Plane's visible_issue_q: a
guest without guest_view_all_features sees only the work items they created).
Linked projects are only listed, and only linkable, when the caller can see them
(a member, or the project is public), as in Plane's project list.
"""

from uuid import UUID

from django.db import transaction
from django.db.models import Exists, F, OuterRef, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from plane.api.serializers import IssueSerializer, ProjectSerializer
from plane.api.views.issue import visible_issue_q
from plane.db.models import Issue, Project, ProjectMember
from plane.nexus.models import (
    Initiative,
    InitiativeProject,
    InitiativeWorkItem,
    Milestone,
    MilestoneWorkItem,
    Release,
    ReleaseChangelog,
    ReleaseItemLabel,
    ReleaseLabel,
    ReleaseTag,
    ReleaseWorkItem,
)
from plane.nexus.pql import PQLError, apply_pql
from plane.nexus.serializers.release import (
    InitiativeSerializer,
    MilestoneSerializer,
    MilestoneWorkItemSerializer,
    ReleaseChangelogSerializer,
    ReleaseLabelSerializer,
    ReleaseSerializer,
    ReleaseTagSerializer,
    ReleaseWorkItemSerializer,
)
from plane.utils.permissions import ProjectAdminPermission, WorkspaceOwnerPermission

from .base import NexusAPIView, NexusProjectAPIView


# ---------------------------------------------------------------- helpers


def _id_list(request, key):
    """The UUID list under `key` in the JSON body, or (None, error message)."""
    raw = request.data.get(key) if isinstance(request.data, dict) else None
    if isinstance(raw, str):
        raw = [raw]
    if not isinstance(raw, list) or not raw:
        return None, f"Send {key} as a non-empty list of ids."
    ids, bad = [], []
    for value in raw:
        try:
            ids.append(UUID(str(value)))
        except ValueError:
            bad.append(str(value))
    if bad:
        return None, f"Not valid ids in {key}: {', '.join(bad)}."
    return list(dict.fromkeys(ids)), None


def _unknown(requested, found_ids):
    found = {str(pk) for pk in found_ids}
    return [str(pk) for pk in requested if str(pk) not in found]


def _relink(model, lookup, defaults):
    """Create or revive a link row (a soft-deleted row would still hold the unique key)."""
    model.all_objects.update_or_create(**lookup, defaults={**defaults, "deleted_at": None})


class _Base(NexusAPIView):
    def visible_issues(self):
        """Work items in this workspace the caller can view, by Plane's own rule."""
        return Issue.objects.filter(
            workspace__slug=self.workspace_slug,
            id__in=Issue.objects.filter(visible_issue_q(self.request.user)).values("id"),
        )

    def visible_projects(self):
        """Projects in this workspace the caller can see: a member, or the project is public."""
        member = ProjectMember.objects.filter(project_id=OuterRef("pk"), member=self.request.user, is_active=True)
        return Project.objects.filter(workspace__slug=self.workspace_slug).filter(Exists(member) | Q(network=2))

    def pql_filtered(self, queryset):
        return apply_pql(
            queryset,
            self.request.query_params.get("pql"),
            user=self.request.user,
            workspace_slug=self.workspace_slug,
        )

    def issues_for(self, request, key):
        """Resolve the work item ids in the body, or return (None, error Response)."""
        ids, err = _id_list(request, key)
        if err:
            return None, self.error(err)
        issues = list(self.visible_issues().filter(pk__in=ids))
        missing = _unknown(ids, [issue.pk for issue in issues])
        if missing:
            return None, self.error(f"Work items not found in this workspace: {', '.join(missing)}.")
        return issues, None

    def can_delete(self, obj):
        return obj.created_by_id == self.request.user.id or WorkspaceOwnerPermission().has_permission(
            self.request, self
        )

    @staticmethod
    def invalid(serializer):
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @staticmethod
    def pql_error(exc):
        return Response({"error": str(exc), "pql": [str(exc)]}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------- releases


def _latest_release_id(workspace_slug):
    return (
        Release.objects.filter(workspace__slug=workspace_slug, status="released", is_prerelease=False)
        .order_by(F("release_date").desc(nulls_last=True), "-created_at")
        .values_list("id", flat=True)
        .first()
    )


class _ReleaseBase(_Base):
    def releases(self):
        return Release.objects.filter(workspace__slug=self.workspace_slug).prefetch_related("label_links")

    def get_release(self, release_id):
        return get_object_or_404(self.releases(), pk=release_id)

    def release_context(self, **extra):
        return {"latest_release_id": _latest_release_id(self.workspace_slug), **extra}


class ReleaseListCreateAPIEndpoint(_ReleaseBase):
    def get(self, request, slug):
        return self.paginated(
            request, self.releases().order_by("-created_at"), ReleaseSerializer, context=self.release_context()
        )

    def post(self, request, slug):
        workspace = self.get_workspace()
        serializer = ReleaseSerializer(data=request.data, context={"workspace": workspace})
        if not serializer.is_valid():
            return self.invalid(serializer)
        with transaction.atomic():
            release = serializer.save(workspace=workspace)
            ReleaseChangelog.objects.create(release=release, workspace=workspace)
        release = self.get_release(release.pk)
        return Response(ReleaseSerializer(release, context=self.release_context()).data, status=status.HTTP_201_CREATED)


class ReleaseDetailAPIEndpoint(_ReleaseBase):
    def get(self, request, slug, release_id):
        return Response(ReleaseSerializer(self.get_release(release_id), context=self.release_context()).data)

    def patch(self, request, slug, release_id):
        release = self.get_release(release_id)
        serializer = ReleaseSerializer(
            release, data=request.data, partial=True, context={"workspace": release.workspace}
        )
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(ReleaseSerializer(self.get_release(release_id), context=self.release_context()).data)

    def delete(self, request, slug, release_id):
        release = self.get_release(release_id)
        if not self.can_delete(release):
            return self.error("Only the creator or a workspace admin can delete a release.", http_status=403)
        release.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseChangelogAPIEndpoint(_ReleaseBase):
    def changelog(self, release_id):
        release = self.get_release(release_id)
        changelog, _ = ReleaseChangelog.objects.get_or_create(
            release=release, defaults={"workspace_id": release.workspace_id}
        )
        return changelog

    def get(self, request, slug, release_id):
        return Response(ReleaseChangelogSerializer(self.changelog(release_id)).data)

    def patch(self, request, slug, release_id):
        changelog = self.changelog(release_id)
        serializer = ReleaseChangelogSerializer(changelog, data=request.data, partial=True)
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(ReleaseChangelogSerializer(changelog).data)


class ReleaseWorkItemAPIEndpoint(_ReleaseBase):
    def get(self, request, slug, release_id):
        release = self.get_release(release_id)
        issues = self.visible_issues().filter(release_work_items__release=release)
        try:
            issues = self.pql_filtered(issues)
        except PQLError as exc:
            return self.pql_error(exc)
        issues = issues.select_related("project").order_by("-created_at")
        return self.paginated(request, issues, ReleaseWorkItemSerializer)

    def post(self, request, slug, release_id):
        release = self.get_release(release_id)
        issues, err = self.issues_for(request, "work_item_ids")
        if err:
            return err
        for issue in issues:
            _relink(ReleaseWorkItem, {"release": release, "issue": issue}, {"workspace_id": release.workspace_id})
        return Response(ReleaseWorkItemSerializer(issues, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, release_id):
        release = self.get_release(release_id)
        ids, err = _id_list(request, "work_item_ids")
        if err:
            return self.error(err)
        ReleaseWorkItem.all_objects.filter(release=release, issue_id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseLabelListCreateAPIEndpoint(_Base):
    def get(self, request, slug):
        labels = ReleaseLabel.objects.filter(workspace__slug=slug).order_by("sort_order", "created_at")
        return self.paginated(request, labels, ReleaseLabelSerializer)

    def post(self, request, slug):
        workspace = self.get_workspace()
        serializer = ReleaseLabelSerializer(data=request.data, context={"workspace": workspace})
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save(workspace=workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReleaseLabelDetailAPIEndpoint(_Base):
    def get_label(self, label_id):
        return get_object_or_404(ReleaseLabel, pk=label_id, workspace__slug=self.workspace_slug)

    def get(self, request, slug, label_id):
        return Response(ReleaseLabelSerializer(self.get_label(label_id)).data)

    def patch(self, request, slug, label_id):
        label = self.get_label(label_id)
        serializer = ReleaseLabelSerializer(
            label, data=request.data, partial=True, context={"workspace": label.workspace}
        )
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug, label_id):
        self.get_label(label_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseItemLabelAPIEndpoint(_ReleaseBase):
    """The labels one release carries; attaching never creates palette labels."""

    def get(self, request, slug, release_id):
        release = self.get_release(release_id)
        labels = ReleaseLabel.objects.filter(release_links__release=release).order_by("sort_order", "created_at")
        return self.paginated(request, labels, ReleaseLabelSerializer)

    def post(self, request, slug, release_id):
        release = self.get_release(release_id)
        ids, err = _id_list(request, "label_ids")
        if err:
            return self.error(err)
        labels = list(ReleaseLabel.objects.filter(workspace_id=release.workspace_id, pk__in=ids))
        missing = _unknown(ids, [label.pk for label in labels])
        if missing:
            return self.error(f"Release labels not found in this workspace: {', '.join(missing)}.")
        for label in labels:
            _relink(ReleaseItemLabel, {"release": release, "label": label}, {})
        return Response(ReleaseLabelSerializer(labels, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, release_id):
        release = self.get_release(release_id)
        ids, err = _id_list(request, "label_ids")
        if err:
            return self.error(err)
        ReleaseItemLabel.all_objects.filter(release=release, label_id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReleaseTagListCreateAPIEndpoint(_Base):
    def get(self, request, slug):
        tags = ReleaseTag.objects.filter(workspace__slug=slug).order_by("-created_at")
        return self.paginated(request, tags, ReleaseTagSerializer)

    def post(self, request, slug):
        workspace = self.get_workspace()
        serializer = ReleaseTagSerializer(data=request.data, context={"workspace": workspace})
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save(workspace=workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReleaseTagDetailAPIEndpoint(_Base):
    def get_tag(self, tag_id):
        return get_object_or_404(ReleaseTag, pk=tag_id, workspace__slug=self.workspace_slug)

    def get(self, request, slug, tag_id):
        return Response(ReleaseTagSerializer(self.get_tag(tag_id)).data)

    def patch(self, request, slug, tag_id):
        tag = self.get_tag(tag_id)
        serializer = ReleaseTagSerializer(tag, data=request.data, partial=True, context={"workspace": tag.workspace})
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug, tag_id):
        # Releases keep existing; their tag is cleared (SET_NULL).
        self.get_tag(tag_id).delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- milestones


class _MilestoneBase(NexusProjectAPIView, _Base):
    def milestones(self):
        return Milestone.objects.filter(workspace__slug=self.workspace_slug, project_id=self.project_id)

    def get_milestone(self, milestone_id):
        return get_object_or_404(self.milestones(), pk=milestone_id)


class MilestoneListCreateAPIEndpoint(_MilestoneBase):
    def get(self, request, slug, project_id):
        self.get_project()
        return self.paginated(request, self.milestones().order_by("-created_at"), MilestoneSerializer)

    def post(self, request, slug, project_id):
        project = self.get_project()
        serializer = MilestoneSerializer(data=request.data)
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save(project=project, workspace_id=project.workspace_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MilestoneDetailAPIEndpoint(_MilestoneBase):
    def get(self, request, slug, project_id, milestone_id):
        return Response(MilestoneSerializer(self.get_milestone(milestone_id)).data)

    def patch(self, request, slug, project_id, milestone_id):
        milestone = self.get_milestone(milestone_id)
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug, project_id, milestone_id):
        milestone = self.get_milestone(milestone_id)
        if milestone.created_by_id != request.user.id and not ProjectAdminPermission().has_permission(request, self):
            return self.error("Only the creator or a project admin can delete a milestone.", http_status=403)
        milestone.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MilestoneWorkItemAPIEndpoint(_MilestoneBase):
    def get(self, request, slug, project_id, milestone_id):
        milestone = self.get_milestone(milestone_id)
        try:
            issues = self.pql_filtered(self.visible_issues().filter(project_id=milestone.project_id))
        except PQLError as exc:
            return self.pql_error(exc)
        links = (
            MilestoneWorkItem.objects.filter(milestone=milestone, issue__in=issues)
            .select_related("issue")
            .order_by("-created_at")
        )
        return self.paginated(request, links, MilestoneWorkItemSerializer)

    def post(self, request, slug, project_id, milestone_id):
        milestone = self.get_milestone(milestone_id)
        ids, err = _id_list(request, "issues")
        if err:
            return self.error(err)
        issues = list(Issue.objects.filter(project_id=milestone.project_id, pk__in=ids))
        missing = _unknown(ids, [issue.pk for issue in issues])
        if missing:
            return self.error(f"Work items not found in this project: {', '.join(missing)}.")
        for issue in issues:
            # One milestone per work item: adding it here moves it from any other.
            _relink(
                MilestoneWorkItem,
                {"issue": issue},
                {"milestone": milestone, "project_id": milestone.project_id, "workspace_id": milestone.workspace_id},
            )
        links = MilestoneWorkItem.objects.filter(milestone=milestone, issue_id__in=ids).select_related("issue")
        return Response(MilestoneWorkItemSerializer(links, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, project_id, milestone_id):
        milestone = self.get_milestone(milestone_id)
        ids, err = _id_list(request, "issues")
        if err:
            return self.error(err)
        MilestoneWorkItem.all_objects.filter(milestone=milestone, issue_id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------- initiatives


class _InitiativeBase(_Base):
    def initiatives(self):
        return Initiative.objects.filter(workspace__slug=self.workspace_slug)

    def get_initiative(self, initiative_id):
        return get_object_or_404(self.initiatives(), pk=initiative_id)


class InitiativeListCreateAPIEndpoint(_InitiativeBase):
    def get(self, request, slug):
        return self.paginated(request, self.initiatives().order_by("-created_at"), InitiativeSerializer)

    def post(self, request, slug):
        workspace = self.get_workspace()
        serializer = InitiativeSerializer(data=request.data, context={"workspace": workspace})
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save(workspace=workspace)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InitiativeDetailAPIEndpoint(_InitiativeBase):
    def get(self, request, slug, initiative_id):
        return Response(InitiativeSerializer(self.get_initiative(initiative_id)).data)

    def patch(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        serializer = InitiativeSerializer(
            initiative, data=request.data, partial=True, context={"workspace": initiative.workspace}
        )
        if not serializer.is_valid():
            return self.invalid(serializer)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        if not self.can_delete(initiative):
            return self.error("Only the creator or a workspace admin can delete an initiative.", http_status=403)
        initiative.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeProjectAPIEndpoint(_InitiativeBase):
    def get(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        projects = self.visible_projects().filter(nexus_initiative_links__initiative=initiative).order_by("name")
        return self.paginated(request, projects, ProjectSerializer)

    def post(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        ids, err = _id_list(request, "project_ids")
        if err:
            return self.error(err)
        projects = list(self.visible_projects().filter(pk__in=ids))
        missing = _unknown(ids, [project.pk for project in projects])
        if missing:
            return self.error(f"Projects not found in this workspace: {', '.join(missing)}.")
        for project in projects:
            _relink(
                InitiativeProject,
                {"initiative": initiative, "project": project},
                {"workspace_id": initiative.workspace_id},
            )
        return Response(ProjectSerializer(projects, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        ids, err = _id_list(request, "project_ids")
        if err:
            return self.error(err)
        InitiativeProject.all_objects.filter(initiative=initiative, project_id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitiativeWorkItemAPIEndpoint(_InitiativeBase):
    def get(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        issues = self.visible_issues().filter(nexus_initiative_links__initiative=initiative)
        try:
            issues = self.pql_filtered(issues)
        except PQLError as exc:
            return self.pql_error(exc)
        issues = issues.order_by("-created_at")
        return self.paginated(request, issues, IssueSerializer)

    def post(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        issues, err = self.issues_for(request, "work_item_ids")
        if err:
            return err
        for issue in issues:
            _relink(
                InitiativeWorkItem,
                {"initiative": initiative, "issue": issue},
                {"workspace_id": initiative.workspace_id},
            )
        return Response(IssueSerializer(issues, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, slug, initiative_id):
        initiative = self.get_initiative(initiative_id)
        ids, err = _id_list(request, "work_item_ids")
        if err:
            return self.error(err)
        InitiativeWorkItem.all_objects.filter(initiative=initiative, issue_id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
