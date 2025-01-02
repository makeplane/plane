# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.serializers import WorkspaceHomePreferenceSerializer
from plane.app.permissions import (allow_permission, ROLE)
from plane.db.models.workspace import WorkspaceHomePreference


class WorkspacePreferenceViewSet(BaseAPIView):
    print("Print worspace preference")

    model = WorkspaceHomePreference
        
    def get_serializer_class(self):
        return WorkspaceHomePreferenceSerializer
    
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        WorkspaceHomePreference.objects.get_or_create(user=request.user)


