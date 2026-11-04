# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

import pytest
from django.db import connection
from django.db.models.signals import post_delete
from django.test.utils import CaptureQueriesContext
from django.utils import timezone
from freezegun import freeze_time

from plane.bgtasks.deletion_task import hard_delete, soft_delete_related_objects
from plane.db.models import Issue, IssueActivity, IssueComment, Project, State, Workspace
from plane.tests.factories import ProjectFactory


pytestmark = [pytest.mark.unit, pytest.mark.django_db(transaction=True)]


@pytest.fixture
def issue():
    """Create a live work item whose project supplies the history fixtures."""
    project = ProjectFactory()
    return Issue.objects.create(project=project, workspace=project.workspace, name="Retained work item")


def make_comment(issue, **kwargs):
    """Attach a comment to the work item's project and workspace."""
    return IssueComment.objects.create(issue=issue, project=issue.project, workspace=issue.workspace, **kwargs)


def make_activity(issue, comment=None, **kwargs):
    """Create history with optional comment linkage for the same work item."""
    return IssueActivity.objects.create(
        issue=issue, issue_comment=comment, project=issue.project, workspace=issue.workspace, **kwargs
    )


def expire(instance, settings):
    """Place one row beyond the retention cutoff without soft-deleting relatives."""
    type(instance).all_objects.filter(pk=instance.pk).update(
        deleted_at=timezone.now() - timedelta(days=settings.HARD_DELETE_AFTER_DAYS + 1)
    )


def test_purge_issue_removes_history_for_cascaded_children(issue, settings):
    """Purging a parent removes descendant history while retaining unrelated work."""
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
    """Purging a thread detaches every reply's history and keeps unrelated links."""
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
    """Workspace, project, and state cascades can remove work items with history."""
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
    """The exact retention boundary keeps both parents and their history links."""
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


@pytest.mark.parametrize("model_name", ["Issue", "IssueComment"])
def test_soft_delete_keeps_activity_and_comment_links(issue, model_name):
    """Soft deletion preserves activity rows and their work-item/comment links."""
    comment = make_comment(issue)
    activity = make_activity(issue, comment)

    parent = issue if model_name == "Issue" else comment
    soft_delete_related_objects("db", model_name, parent.pk)

    activity.refresh_from_db()
    assert activity.deleted_at is None
    assert activity.issue_id == issue.pk
    assert activity.issue_comment_id == comment.pk
    assert (Issue.all_objects.get(pk=issue.pk).deleted_at is not None) == (model_name == "Issue")
    assert IssueComment.all_objects.get(pk=comment.pk).deleted_at is not None


@pytest.mark.parametrize("delete_issue", [False, True])
def test_failed_purge_rolls_back_history_changes(issue, delete_issue):
    """A failed parent deletion rolls back history removal or link detachment."""
    comment = make_comment(issue)
    activity = make_activity(issue, comment)
    model, parent = (Issue, issue) if delete_issue else (IssueComment, comment)

    def fail_delete(**kwargs):
        """Abort the collector after parent deletion to exercise its transaction."""
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


@pytest.mark.parametrize("delete_issue", [True, False], ids=["work-items", "comments"])
def test_bulk_purge_batches_activity_cleanup(issue, delete_issue):
    """Growing a purge batch must not add per-parent history queries."""
    statement_counts = []
    model = Issue if delete_issue else IssueComment
    for batch_size in (1, 25):
        parent_ids = []
        for index in range(batch_size):
            if delete_issue:
                parent = Issue.objects.create(
                    project=issue.project, workspace=issue.workspace, name=f"Expired work item {index}"
                )
                make_activity(parent)
            else:
                parent = make_comment(issue)
                make_activity(issue, parent)
            parent_ids.append(parent.pk)

        with CaptureQueriesContext(connection) as queries:
            model.all_objects.filter(pk__in=parent_ids).delete()

        # Count collector reads too: IssueVersion links require activity IDs.
        history_sql = [query["sql"] for query in queries.captured_queries if '"issue_activities"' in query["sql"]]
        statement_counts.append(len(history_sql))
        assert not model.all_objects.filter(pk__in=parent_ids).exists()

    assert statement_counts[0] > 0
    assert statement_counts[1] == statement_counts[0], statement_counts
