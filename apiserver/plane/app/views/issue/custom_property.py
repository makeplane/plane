# Python imports
import json

from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.utils import timezone
from django.shortcuts import get_object_or_404

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    IssueCustomPropertySerializer
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    Project,
    IssueCustomProperty,
    IssueTypeCustomProperty,
    Workspace
)
from plane.utils.issue_filters import issue_filters
from .base import BaseAPIView

class IssueCustomPropertyUpdateAPIView(BaseAPIView):
    """
    This view handles the update of custom property values for issues.
    """

    model = IssueCustomProperty
    serializer_class = IssueCustomPropertySerializer

    def patch(self, request, slug, issue_id, pk):
        """
        Partially update a custom property value for a specific issue.
        """
        custom_property = get_object_or_404(IssueCustomProperty, pk=pk, issue_id=issue_id)
        new_value = request.data.get('value')
        if new_value is None:
            new_value = "" 
        serializer = self.serializer_class(custom_property)
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(serializer.data, cls=DjangoJSONEncoder)
        actor_id = str(request.user.id) if request.user else "Unknown"
        issue_id_str = str(issue_id) if issue_id else "Unknown issue ID"
        slug = slug=self.kwargs.get("slug")
        workspace = Workspace.objects.get(slug=slug)
        try:
            project = Project.objects.get(workspace=workspace)
            project_id_str = project.id
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)
        epoch_timestamp = int(timezone.now().timestamp())

        custom_property.value = new_value
        custom_property.save()

        issue_activity.delay(
            type="custom_property.activity.updated",
            requested_data=requested_data,
            actor_id=actor_id,
            issue_id=issue_id_str,
            project_id=project_id_str,
            current_instance=current_instance,
            epoch=epoch_timestamp,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def get(self, request, slug, issue_id, pk=None):
        """
        Retrieve the custom property details for a given issue.
        """
        if pk:
            custom_property = get_object_or_404(IssueCustomProperty, pk=pk, issue_id=issue_id)
            serializer = self.serializer_class(custom_property)
            return Response(serializer.data, status=status.HTTP_200_OK)

        custom_properties = IssueCustomProperty.objects.filter(issue_id=issue_id)
        serializer = self.serializer_class(custom_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, issue_id):
        """
        Create a new custom property for a specific issue.
        """
        key = request.data.get('key')
        value = request.data.get('value')
        issue_type_custom_property_id = request.data.get('issue_type_custom_property')
        if not key or not value or not issue_type_custom_property_id:
            return Response(
                {"error": "'key', 'value', and 'issue_type_custom_property' fields are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            issue_type_custom_property = IssueTypeCustomProperty.objects.get(id=issue_type_custom_property_id)
        except IssueTypeCustomProperty.DoesNotExist:
            return Response(
                {"error": f"The provided issue_type_custom_property (ID: {issue_type_custom_property_id}) does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            issue = Issue.objects.get(id=issue_id)
        except Issue.DoesNotExist:
            return Response(
                {"error": "The provided issue does not exist."},
                status=status.HTTP_404_NOT_FOUND
            )
        if not issue.project:
            return Response(
                {"error": "The issue must be associated with a project."},
                status=status.HTTP_400_BAD_REQUEST
            )
        custom_property = IssueCustomProperty.objects.create(
            issue=issue,
            key=key,
            value=value,
            issue_type_custom_property=issue_type_custom_property,
            project=issue.project,
        )
        serializer = self.serializer_class(custom_property)
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(serializer.data, cls=DjangoJSONEncoder)
        actor_id = str(request.user.id) if request.user else "Unknown"
        issue_id_str = str(issue_id) if issue_id else "Unknown issue ID"
        project_id_str = str(issue.project.id)
        epoch_timestamp = int(timezone.now().timestamp())
        issue_activity.delay(
            type="custom_property.activity.created",
            requested_data=requested_data,
            actor_id=actor_id,
            issue_id=issue_id_str,
            project_id=project_id_str,
            current_instance=current_instance,
            epoch=epoch_timestamp,
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)