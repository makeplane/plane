# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.db.models.signals import post_delete
from django.utils import timezone
from freezegun import freeze_time

from plane.bgtasks.deletion_task import hard_delete, soft_delete_related_objects
from plane.db.models import Issue, IssueActivity, IssueComment, Project, State, Workspace
from plane.tests.factories import ProjectFactory


pytestmark = [pytest.mark.unit, pytest.mark.django_db(transaction=True)]


@pytest.fixture
def issue():
    project = ProjectFactory()
    return Issue.objects.create(project=project, workspace=project.workspace, name="Retained work item")


def make_comment(issue, **kwargs):
    return IssueComment.objects.create(issue=issue, project=issue.project, workspace=issue.workspace, **kwargs)


def make_activity(issue, comment=None, **kwargs):
    return IssueActivity.objects.create(
        issue=issue, issue_comment=comment, project=issue.project, workspace=issue.workspace, **kwargs
    )


def expire(instance, settings):
    type(instance).all_objects.filter(pk=instance.pk).update(
        deleted_at=timezone.now() - timedelta(days=settings.HARD_DELETE_AFTER_DAYS + 1)
    )


def test_purge_issue_removes_history_for_cascaded_children(issue, settings):
    child = Issue.objects.create(parent=issue, project=issue.project, workspace=issue.workspace, name="Child work item")
    comment = make_comment(child)
    activities = [make_activity(issue), make_activity(child, comment)]
    retained = Issue.objects.create(project=issue.project, workspace=issue.workspace, name="Unrelated work item")
    retained_activity = make_activity(retained)
    expire(issue, settings)

    hard_delete()

    assert not Issue.all_objects.filter(pk__in=[issue.pk, child.pk]).exists()
    assert not IssueComment.all_objects.filter(pk=comment.pk).exists()
    assert not IssueActivity.all_objects.filter(pk__in=[activity.pk for activity in activities]).exists()
    retained_activity.refresh_from_db()
    assert retained_activity.issue_id == retained.pk


def test_purge_comment_thread_preserves_history_and_unrelated_links(issue, settings):
    root = make_comment(issue)
    reply = make_comment(issue, parent=root)
    nested = make_comment(issue, parent=reply)
    retained = make_comment(issue)
    activities = [make_activity(issue, comment) for comment in [root, reply, nested]]
    retained_activity = make_activity(issue, retained)
    # Even soft-deleted history must not keep the expired comment alive.
    IssueActivity.all_objects.filter(pk=activities[0].pk).update(deleted_at=timezone.now())
    expire(root, settings)

    hard_delete()

    assert Issue.all_objects.filter(pk=issue.pk).exists()
    assert not IssueComment.all_objects.filter(pk__in=[root.pk, reply.pk, nested.pk]).exists()
    for activity in activities:
        activity.refresh_from_db()
        assert activity.issue_id == issue.pk
        assert activity.issue_comment_id is None
    retained_activity.refresh_from_db()
    assert retained_activity.issue_comment_id == retained.pk


@pytest.mark.parametrize("parent_model", [Project, Workspace, State])
def test_purge_parent_cascades_with_activity_history(issue, settings, parent_model):
    if parent_model is State:
        parent = State.objects.create(project=issue.project, workspace=issue.workspace, name="Expired state")
        Issue.all_objects.filter(pk=issue.pk).update(state=parent)
    else:
        parent = issue.project if parent_model is Project else issue.workspace
    activity = make_activity(issue, make_comment(issue))
    expire(parent, settings)

    hard_delete()

    assert not parent_model.all_objects.filter(pk=parent.pk).exists()
    assert not Issue.all_objects.filter(pk=issue.pk).exists()
    assert not IssueActivity.all_objects.filter(pk=activity.pk).exists()


def test_retention_boundary_keeps_issue_and_comment_history(issue, settings):
    comment = make_comment(issue)
    activity = make_activity(issue, comment)
    with freeze_time("2026-01-15 12:00:00"):
        cutoff = timezone.now() - timedelta(days=settings.HARD_DELETE_AFTER_DAYS)
        Issue.all_objects.filter(pk=issue.pk).update(deleted_at=cutoff)
        IssueComment.all_objects.filter(pk=comment.pk).update(deleted_at=cutoff)

        hard_delete()

    activity.refresh_from_db()
    assert activity.issue_id == issue.pk
    assert activity.issue_comment_id == comment.pk
    assert Issue.all_objects.filter(pk=issue.pk).exists()
    assert IssueComment.all_objects.filter(pk=comment.pk).exists()


def test_soft_delete_keeps_activity_and_comment_links(issue):
    comment = make_comment(issue)
    activity = make_activity(issue, comment)

    soft_delete_related_objects("db", "Issue", issue.pk)

    activity.refresh_from_db()
    assert activity.deleted_at is None
    assert activity.issue_id == issue.pk
    assert activity.issue_comment_id == comment.pk
    assert Issue.all_objects.get(pk=issue.pk).deleted_at is not None
    assert IssueComment.all_objects.get(pk=comment.pk).deleted_at is not None


@pytest.mark.parametrize("delete_issue", [False, True])
def test_failed_purge_rolls_back_history_changes(issue, delete_issue):
    comment = make_comment(issue)
    activity = make_activity(issue, comment)
    model, parent = (Issue, issue) if delete_issue else (IssueComment, comment)

    def fail_delete(**kwargs):
        raise RuntimeError("simulate delete failure")

    post_delete.connect(fail_delete, sender=model, weak=False)
    try:
        with pytest.raises(RuntimeError, match="simulate delete failure"):
            model.all_objects.filter(pk=parent.pk).delete()
    finally:
        post_delete.disconnect(fail_delete, sender=model)

    activity.refresh_from_db()
    assert activity.issue_id == issue.pk
    assert activity.issue_comment_id == comment.pk
    assert Issue.all_objects.filter(pk=issue.pk).exists()
    assert IssueComment.all_objects.filter(pk=comment.pk).exists()
