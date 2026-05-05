# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import ModuleActivitySerializer
from plane.db.models import ModuleActivity
from plane.app.views.base import BaseAPIView


class ModuleActivityEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, module_id):
        activities = ModuleActivity.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            module_id=module_id,
        ).select_related("actor").order_by("-created_at")
        return self.paginate(
            request=request,
            queryset=activities,
            on_results=lambda data: ModuleActivitySerializer(data, many=True).data,
        )
