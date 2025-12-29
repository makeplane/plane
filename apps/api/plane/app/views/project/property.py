# Django imports
from django.db import IntegrityError
from django.db.models import Prefetch

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, ProjectBasePermission, allow_permission
from plane.app.serializers import (
    IssuePropertySerializer,
    IssuePropertyValueSerializer,
    IssuePropertyLiteSerializer,
)
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.db.models import (
    IssueProperty,
    IssuePropertyValue,
    Issue,
    ProjectMember,
)


class IssuePropertyViewSet(BaseViewSet):
    """
    ViewSet for managing IssueProperty (custom field definitions) within a project.
    Supports full CRUD operations for project admins.
    """

    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return (
            self.filter_queryset(
                super()
                .get_queryset()
                .filter(workspace__slug=self.kwargs.get("slug"))
                .filter(project_id=self.kwargs.get("project_id"))
                .filter(project__project_projectmember__member=self.request.user)
                .filter(project__project_projectmember__is_active=True)
                .select_related("project", "workspace", "created_by", "updated_by")
                .distinct()
            )
            .order_by("sort_order", "-created_at")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id):
        """List all custom field definitions for a project"""
        # Filter by is_active if specified
        is_active = request.GET.get("is_active")
        queryset = self.get_queryset()

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        serializer = IssuePropertySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def retrieve(self, request, slug, project_id, pk):
        """Get a single custom field definition"""
        issue_property = self.get_object()
        serializer = IssuePropertySerializer(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN])
    def create(self, request, slug, project_id):
        """Create a new custom field definition"""
        try:
            serializer = IssuePropertySerializer(
                data=request.data,
                context={"project_id": project_id},
            )
            if serializer.is_valid():
                serializer.save(project_id=project_id)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError:
            return Response(
                {"error": "Property with this name or key already exists in the project"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @allow_permission([ROLE.ADMIN])
    def partial_update(self, request, slug, project_id, pk):
        """Update a custom field definition (partial update)"""
        issue_property = self.get_object()

        # Prevent changing the key after creation (for API stability)
        if "key" in request.data:
            return Response(
                {"error": "Property key cannot be modified after creation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssuePropertySerializer(
            instance=issue_property,
            data=request.data,
            context={"project_id": project_id},
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN])
    def destroy(self, request, slug, project_id, pk):
        """Delete a custom field definition (soft delete)"""
        issue_property = self.get_object()

        # This will cascade delete all IssuePropertyValue records for this property
        issue_property.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class IssuePropertyValueViewSet(BaseViewSet):
    """
    ViewSet for managing IssuePropertyValue (custom field values) for specific issues.
    """

    serializer_class = IssuePropertyValueSerializer
    model = IssuePropertyValue
    permission_classes = [ProjectBasePermission]

    def get_queryset(self):
        return (
            self.filter_queryset(
                super()
                .get_queryset()
                .filter(workspace__slug=self.kwargs.get("slug"))
                .filter(project_id=self.kwargs.get("project_id"))
                .filter(issue_id=self.kwargs.get("issue_id"))
                .filter(project__project_projectmember__member=self.request.user)
                .filter(project__project_projectmember__is_active=True)
                .select_related("property", "issue", "project", "workspace")
                .distinct()
            )
            .order_by("property__sort_order")
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def list(self, request, slug, project_id, issue_id):
        """List all custom field values for an issue"""
        queryset = self.get_queryset()
        serializer = IssuePropertyValueSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def create(self, request, slug, project_id, issue_id):
        """Create or update a custom field value for an issue"""
        property_id = request.data.get("property_id")

        if not property_id:
            return Response(
                {"error": "property_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify property exists and belongs to the project
        try:
            issue_property = IssueProperty.objects.get(
                id=property_id,
                project_id=project_id,
                deleted_at__isnull=True,
            )
        except IssueProperty.DoesNotExist:
            return Response(
                {"error": "Property not found in this project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify issue exists
        try:
            issue = Issue.objects.get(
                id=issue_id,
                project_id=project_id,
            )
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if value already exists (upsert behavior)
        existing_value = IssuePropertyValue.objects.filter(
            issue_id=issue_id,
            property_id=property_id,
            deleted_at__isnull=True,
        ).first()

        if existing_value:
            # Update existing value
            serializer = IssuePropertyValueSerializer(
                instance=existing_value,
                data=request.data,
                context={"project_id": project_id},
                partial=True,
            )
        else:
            # Create new value
            serializer = IssuePropertyValueSerializer(
                data=request.data,
                context={"project_id": project_id},
            )

        if serializer.is_valid():
            serializer.save(
                issue_id=issue_id,
                property_id=property_id,
                project_id=project_id,
            )
            return Response(
                serializer.data,
                status=status.HTTP_200_OK if existing_value else status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def destroy(self, request, slug, project_id, issue_id, pk):
        """Delete a custom field value"""
        property_value = self.get_object()
        property_value.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BulkIssuePropertyValueEndpoint(BaseAPIView):
    """
    Endpoint for bulk operations on custom field values for an issue.
    Allows setting multiple custom field values at once.
    """

    permission_classes = [ProjectBasePermission]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id):
        """
        Bulk create/update custom field values for an issue.
        Request body: {"custom_fields": {"property_key": value, ...}}
        """
        custom_fields = request.data.get("custom_fields", {})

        if not custom_fields or not isinstance(custom_fields, dict):
            return Response(
                {"error": "custom_fields must be a non-empty object with key-value pairs"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify issue exists
        try:
            issue = Issue.objects.get(
                id=issue_id,
                project_id=project_id,
            )
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get all properties for this project by key
        properties = IssueProperty.objects.filter(
            project_id=project_id,
            key__in=custom_fields.keys(),
            deleted_at__isnull=True,
        )
        property_map = {prop.key: prop for prop in properties}

        # Validate all keys exist
        invalid_keys = set(custom_fields.keys()) - set(property_map.keys())
        if invalid_keys:
            return Response(
                {"error": f"Unknown property keys: {', '.join(invalid_keys)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get existing values for this issue
        existing_values = IssuePropertyValue.objects.filter(
            issue_id=issue_id,
            property__key__in=custom_fields.keys(),
            deleted_at__isnull=True,
        )
        existing_map = {ev.property.key: ev for ev in existing_values}

        results = []
        errors = []

        for key, value in custom_fields.items():
            prop = property_map[key]

            # Prepare data for serializer
            data = {"value": value, "property": prop.id}

            if key in existing_map:
                # Update existing
                serializer = IssuePropertyValueSerializer(
                    instance=existing_map[key],
                    data=data,
                    context={"project_id": project_id},
                    partial=True,
                )
            else:
                # Create new
                serializer = IssuePropertyValueSerializer(
                    data=data,
                    context={"project_id": project_id},
                )

            if serializer.is_valid():
                serializer.save(
                    issue_id=issue_id,
                    property_id=prop.id,
                    project_id=project_id,
                )
                results.append({key: serializer.data})
            else:
                errors.append({key: serializer.errors})

        if errors:
            return Response(
                {"results": results, "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"results": results}, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        """
        Get all custom field values for an issue in a flat format.
        Response: {"custom_fields": {"property_key": value, ...}}
        """
        # Verify issue exists
        try:
            issue = Issue.objects.get(
                id=issue_id,
                project_id=project_id,
            )
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Get all property values for this issue
        property_values = IssuePropertyValue.objects.filter(
            issue_id=issue_id,
            deleted_at__isnull=True,
        ).select_related("property")

        # Build flat response keyed by property key
        custom_fields = {}
        for pv in property_values:
            custom_fields[pv.property.key] = pv.value

        return Response({"custom_fields": custom_fields}, status=status.HTTP_200_OK)
