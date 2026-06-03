# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Unit tests for CapacityExportJob model.

Tests CRUD, defaults, status transitions, and model ordering.
"""

import pytest
from datetime import date, timedelta
from django.utils import timezone

from plane.db.models import CapacityExportJob, User, Workspace
from plane.tests.factories import UserFactory, WorkspaceFactory


@pytest.mark.unit
class TestCapacityExportJobModel:
    """Test suite for CapacityExportJob model."""

    @pytest.mark.django_db
    def test_create_job_with_defaults(self):
        """Creating a job with defaults sets status=queued, file_size=0, member_ids=[]."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        assert job.status == "queued"
        assert job.file_size == 0
        assert job.member_ids == []
        assert job.cross_workspace is False
        assert job.file_key is None
        assert job.file_url is None
        assert job.row_count == 0
        assert job.error_message == ""
        assert job.expires_at is None
        assert job.completed_at is None

    @pytest.mark.django_db
    def test_create_job_with_filters(self):
        """Creating a job with member_ids and cross_workspace flag."""
        user = UserFactory()
        workspace = WorkspaceFactory()
        import uuid

        member_ids = [str(uuid.uuid4()), str(uuid.uuid4())]

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
            member_ids=member_ids,
            cross_workspace=True,
        )

        assert job.member_ids == member_ids
        assert job.cross_workspace is True

    @pytest.mark.django_db
    def test_status_transitions_are_free(self):
        """Status can transition to any value (no FSM enforced at model level)."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        # Status transitions work via simple assignment
        for status in ["queued", "processing", "ready", "failed", "expired"]:
            job.status = status
            job.save()
            refreshed = CapacityExportJob.objects.get(id=job.id)
            assert refreshed.status == status

    @pytest.mark.django_db
    def test_set_file_metadata_on_ready(self):
        """When status changes to 'ready', can set file_key, file_size, row_count."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        # Simulate task completion
        job.status = "ready"
        job.file_key = "workspace-123/export-456.xlsx"
        job.file_size = 102400
        job.row_count = 1500
        job.completed_at = timezone.now()
        job.save()

        refreshed = CapacityExportJob.objects.get(id=job.id)
        assert refreshed.status == "ready"
        assert refreshed.file_key == "workspace-123/export-456.xlsx"
        assert refreshed.file_size == 102400
        assert refreshed.row_count == 1500
        assert refreshed.completed_at is not None

    @pytest.mark.django_db
    def test_set_error_on_failed(self):
        """When status changes to 'failed', can set error_message."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        job.status = "failed"
        job.error_message = "Sheet name collision: all names exhausted"
        job.completed_at = timezone.now()
        job.save()

        refreshed = CapacityExportJob.objects.get(id=job.id)
        assert refreshed.status == "failed"
        assert "Sheet name collision" in refreshed.error_message

    @pytest.mark.django_db
    def test_set_expires_at(self):
        """Can set expiry timestamp."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        expires = timezone.now() + timedelta(days=7)
        job.expires_at = expires
        job.save()

        refreshed = CapacityExportJob.objects.get(id=job.id)
        assert refreshed.expires_at == expires

    @pytest.mark.django_db
    def test_ordering_by_created_at_desc(self):
        """Jobs are ordered by created_at descending (newest first)."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        # Create 3 jobs with slight delays to ensure different timestamps
        job1 = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        # Manually adjust created_at for job1 (older)
        CapacityExportJob.objects.filter(id=job1.id).update(
            created_at=timezone.now() - timedelta(hours=2)
        )

        job2 = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 2, 1),
            date_to=date(2026, 2, 28),
        )

        job3 = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 3, 1),
            date_to=date(2026, 3, 31),
        )

        # Default ordering should be newest first
        jobs = list(CapacityExportJob.objects.all())
        assert jobs[0].id == job3.id
        assert jobs[1].id == job2.id
        assert jobs[2].id == job1.id

    @pytest.mark.django_db
    def test_multiple_jobs_per_user(self):
        """A user can have multiple jobs."""
        user = UserFactory()
        workspace1 = WorkspaceFactory()
        workspace2 = WorkspaceFactory()

        job1 = CapacityExportJob.objects.create(
            workspace=workspace1,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        job2 = CapacityExportJob.objects.create(
            workspace=workspace2,
            requested_by=user,
            date_from=date(2026, 2, 1),
            date_to=date(2026, 2, 28),
        )

        user_jobs = CapacityExportJob.objects.filter(requested_by=user)
        assert user_jobs.count() == 2
        assert job1 in user_jobs
        assert job2 in user_jobs

    @pytest.mark.django_db
    def test_multiple_jobs_per_workspace(self):
        """A workspace can have multiple jobs from different users."""
        user1 = UserFactory()
        user2 = UserFactory()
        workspace = WorkspaceFactory()

        job1 = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user1,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        job2 = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user2,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        workspace_jobs = CapacityExportJob.objects.filter(workspace=workspace)
        assert workspace_jobs.count() == 2
        assert job1 in workspace_jobs
        assert job2 in workspace_jobs

    @pytest.mark.django_db
    def test_str_representation(self):
        """Model __str__ format is correct."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        str_repr = str(job)
        assert "CapacityExportJob" in str_repr
        assert "queued" in str_repr
        assert str(user.id) in str_repr
        assert str(workspace.id) in str_repr

    @pytest.mark.django_db
    def test_no_soft_delete_on_model(self):
        """CapacityExportJob uses hard delete (no soft delete)."""
        user = UserFactory()
        workspace = WorkspaceFactory()

        job = CapacityExportJob.objects.create(
            workspace=workspace,
            requested_by=user,
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )

        job_id = job.id
        job.delete()

        # Should be completely deleted, not soft-deleted
        assert not CapacityExportJob.objects.filter(id=job_id).exists()
