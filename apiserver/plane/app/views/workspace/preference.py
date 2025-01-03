# Module imports
from ..base import BaseAPIView
from plane.db.models.workspace import WorkspaceHomePreference
from plane.app.permissions import (allow_permission, ROLE)
from plane.db.models.workspace import WorkspaceHomePreference   
from plane.db.models import Workspace

# Third party imports
from rest_framework.response import Response
from rest_framework import status


class WorkspacePreferenceViewSet(BaseAPIView):
    model = WorkspaceHomePreference
    
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug, owner=request.user)
    
        quick_links = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id, key=WorkspaceHomePreference.HomeWidgetKeys.QUICK_LINKS).exists()
        recents = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id, key=WorkspaceHomePreference.HomeWidgetKeys.RECENTS).exists()
        my_stickies = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id, key=WorkspaceHomePreference.HomeWidgetKeys.MY_STICKIES).exists()
        new_at_plane = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id, key=WorkspaceHomePreference.HomeWidgetKeys.NEW_AT_PLANE).exists()
        quick_tutorial = WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id, key=WorkspaceHomePreference.HomeWidgetKeys.QUICK_TUTORIAL).exists()

        if quick_links and recents and my_stickies and new_at_plane and quick_tutorial:
            return Response(WorkspaceHomePreference.objects.filter(user=request.user, workspace_id=workspace.id).values(), status=status.HTTP_201_CREATED)  

        home_preferences = [
            WorkspaceHomePreference.HomeWidgetKeys.QUICK_LINKS, 
            WorkspaceHomePreference.HomeWidgetKeys.RECENTS, 
            WorkspaceHomePreference.HomeWidgetKeys.MY_STICKIES,
            WorkspaceHomePreference.HomeWidgetKeys.NEW_AT_PLANE,
            WorkspaceHomePreference.HomeWidgetKeys.QUICK_TUTORIAL
        ]
        
        create = WorkspaceHomePreference.objects.create(user=request.user, workspace_id=workspace.id, key="asdfasdfasdf", is_enabled=True)
        print(create, "Print Created")
        return Response({"Created"}, status=status.HTTP_201_CREATED)