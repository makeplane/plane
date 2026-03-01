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

# Python imports
from uuid import uuid4

# Django imports
from django.conf import settings

# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseViewSet, BaseAPIView
from plane.ee.permissions import ProjectMemberPermission
from plane.db.models import DeployBoard, Intake
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.models import IntakeForm, IntakeEmail


class ProjectInTakePublishViewSet(BaseViewSet):
    permission_classes = [ProjectMemberPermission]

    models = Intake

    def get_intake_email_domain(self):
        return settings.INTAKE_EMAIL_DOMAIN

    @check_feature_flag(FeatureFlag.INTAKE_FORM)
    @check_feature_flag(FeatureFlag.INTAKE_EMAIL)
    def regenerate(self, request, slug, project_id, type=None):
        new_anchor = uuid4().hex

        if type == "intake_email":
            # Fetch and update the IntakeEmail record
            intake_email = IntakeEmail.objects.get(project_id=project_id, workspace__slug=slug)
            intake_email.anchor = new_anchor
            intake_email.save(update_fields=["anchor"])

            # Return the full email address
            email_domain = self.get_intake_email_domain()
            anchor = f"{slug}-{new_anchor}@{email_domain}"
        else:
            # Fetch and update the DeployBoard for intake form
            deploy_board = DeployBoard.objects.get(
                entity_name=DeployBoard.DeployBoardType.INTAKE,
                project_id=project_id,
                workspace__slug=slug,
            )
            deploy_board.anchor = new_anchor
            deploy_board.save(update_fields=["anchor"])
            anchor = new_anchor

        return Response({"anchor": anchor}, status=status.HTTP_200_OK)


class IntakeFormRegenerateViewSet(BaseAPIView):
    permission_classes = [ProjectMemberPermission]

    models = IntakeForm

    def get(self, request, slug, project_id, pk):
        intake_form = self.models.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        new_anchor = uuid4().hex
        intake_form.anchor = new_anchor
        intake_form.save(update_fields=["anchor"])
        return Response({"anchor": intake_form.anchor}, status=status.HTTP_200_OK)
