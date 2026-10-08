# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.db import IntegrityError, transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from ..models import ProjectTimeSetting
from ..serializers import ProjectTimeSettingSerializer
from ..services import TimeTrackingError, forbidden
from .base import TimeTrackingBaseView
from .work_item import get_visible_project


def get_or_create_settings(project, user):
    setting = ProjectTimeSetting.objects.filter(project_id=project.id).first()
    if setting is not None:
        return setting
    try:
        with transaction.atomic():
            setting = ProjectTimeSetting(project=project, workspace_id=project.workspace_id)
            setting.save(created_by_id=user.id)
            return setting
    except IntegrityError:
        # created by a concurrent request
        return ProjectTimeSetting.objects.get(project_id=project.id)


class ProjectTimeSettingsEndpoint(TimeTrackingBaseView):
    def get(self, request, slug, project_id):
        access = self.get_access(request, slug)
        project = get_visible_project(access, project_id)
        setting = get_or_create_settings(project, request.user)
        return Response(ProjectTimeSettingSerializer(setting).data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id):
        access = self.get_access(request, slug)
        project = get_visible_project(access, project_id)
        if not access.can_manage_settings(project):
            raise forbidden("Only project admins can change time tracking settings.")
        serializer = ProjectTimeSettingSerializer(
            get_or_create_settings(project, request.user), data=request.data, partial=True
        )
        if not serializer.is_valid():
            field, messages = next(iter(serializer.errors.items()))
            raise TimeTrackingError("VALIDATION_ERROR", str(messages[0]), field=field)
        setting = serializer.save(updated_by_id=request.user.id)
        return Response(ProjectTimeSettingSerializer(setting).data, status=status.HTTP_200_OK)
