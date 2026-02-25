# Django imports
from rest_framework import serializers

# Module imports
from plane.db.models import Department
from .base import BaseSerializer


class DepartmentSerializer(BaseSerializer):
    """Flat department serializer for CRUD operations."""

    staff_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Department
        fields = [
            "id",
            "workspace",
            "name",
            "code",
            "short_name",
            "dept_code",
            "description",
            "parent",
            "level",
            "manager",
            "linked_project",
            "sort_order",
            "is_active",
            "staff_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]


class DepartmentTreeSerializer(BaseSerializer):
    """Nested tree serializer for department hierarchy."""

    children = serializers.SerializerMethodField()
    staff_count = serializers.IntegerField(read_only=True, default=0)
    manager_detail = serializers.SerializerMethodField()
    linked_project_detail = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "code",
            "short_name",
            "dept_code",
            "name",
            "description",
            "level",
            "parent",
            "manager",
            "manager_detail",
            "linked_project",
            "linked_project_detail",
            "staff_count",
            "sort_order",
            "is_active",
            "children",
        ]

    def get_children(self, obj):
        # Use prefetched children if available
        children = obj.children.filter(deleted_at__isnull=True).order_by("sort_order", "name")
        return DepartmentTreeSerializer(children, many=True, context=self.context).data

    def get_manager_detail(self, obj):
        if not obj.manager:
            return None
        return {
            "id": str(obj.manager.id),
            "display_name": obj.manager.display_name,
            "email": obj.manager.email,
        }

    def get_linked_project_detail(self, obj):
        if not obj.linked_project:
            return None
        return {
            "id": str(obj.linked_project.id),
            "name": obj.linked_project.name,
            "identifier": obj.linked_project.identifier,
        }
