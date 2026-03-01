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

"""Work Item CSV Import Endpoint."""

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import allow_permission, ROLE
from plane.app.views.base import BaseAPIView
from plane.db.models import Workspace, Project, FileAsset
from plane.ee.models import ImportJob, ImportReport
from plane.bgtasks.import_task import csv_import_task


class ProjectWorkItemImportEndpoint(BaseAPIView):
    """
    Import work items from CSV into a project.

    Triggers a background job to process the CSV file.
    """

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, project_id):
        """
        Start a work item import from CSV.

        Request body:
            asset_id: UUID of the uploaded CSV file asset

        Returns:
            job_id: UUID of the import job for status polling
        """
        asset_id = request.data.get("asset_id")
        if not asset_id:
            return Response(
                {"error": "asset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate workspace and project
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response(
                {"error": "Workspace not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        project = Project.objects.filter(id=project_id, workspace=workspace).first()
        if not project:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate asset exists and is uploaded
        asset = FileAsset.objects.filter(
            id=asset_id,
            workspace=workspace,
            is_uploaded=True,
        ).first()
        if not asset:
            return Response(
                {"error": "Asset not found or not uploaded"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create import report and job
        report = ImportReport.objects.create()
        job = ImportJob.objects.create(
            source="CSV",
            workspace=workspace,
            project=project,
            initiator=request.user,
            report=report,
            status=ImportJob.JobStatus.QUEUED,
            config={"asset_id": str(asset_id)},
        )

        # Trigger background import task
        csv_import_task.delay(
            job_id=str(job.id),
            schema_type="issue",
            file_key=asset.asset.name,
            workspace_id=str(workspace.id),
            project_id=str(project.id),
            initiator_id=str(request.user.id),
        )

        return Response(
            {
                "message": "Import started. Poll the job status for progress.",
                "job_id": str(job.id),
            },
            status=status.HTTP_202_ACCEPTED,
        )
