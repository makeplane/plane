# Django imports
from django.db.models import Count, Q
from rest_framework import serializers

# Module imports
from plane.db.models import Department
from .base import BaseSerializer


class DepartmentSerializer(BaseSerializer):
    """Flat department serializer for CRUD operations."""

    staff_count = serializers.IntegerField(read_only=True, default=0)
    linked_workspace_detail = serializers.SerializerMethodField()
    code = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    short_name = serializers.CharField(max_length=10, required=False, allow_blank=True, allow_null=True, default=None)
    dept_code = serializers.CharField(max_length=4, required=False, allow_blank=True, allow_null=True, default=None)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "code",
            "short_name",
            "dept_code",
            "description",
            "dept_type",
            "parent",
            "level",
            "manager",
            "linked_workspace",
            "linked_workspace_detail",
            "sort_order",
            "is_active",
            "staff_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_dept_code(self, value):
        return value or None

    def validate_short_name(self, value):
        return value or None

    def get_linked_workspace_detail(self, obj):
        if not obj.linked_workspace:
            return None
        return {
            "id": str(obj.linked_workspace.id),
            "name": obj.linked_workspace.name,
            "slug": obj.linked_workspace.slug,
        }


class DepartmentTreeSerializer(BaseSerializer):
    """Nested tree serializer for department hierarchy."""

    children = serializers.SerializerMethodField()
    staff_count = serializers.IntegerField(read_only=True, default=0)
    manager_detail = serializers.SerializerMethodField()
    linked_workspace_detail = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "code",
            "short_name",
            "dept_code",
            "name",
            "description",
            "dept_type",
            "level",
            "parent",
            "manager",
            "manager_detail",
            "linked_workspace",
            "linked_workspace_detail",
            "staff_count",
            "sort_order",
            "is_active",
            "children",
        ]

    def get_children(self, obj):
        children = (
            obj.children.filter(deleted_at__isnull=True)
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
            .order_by("sort_order", "name")
        )
        return DepartmentTreeSerializer(children, many=True, context=self.context).data

    def get_manager_detail(self, obj):
        if not obj.manager:
            return None
        return {
            "id": str(obj.manager.id),
            "display_name": obj.manager.display_name,
            "email": obj.manager.email,
        }

    def get_linked_workspace_detail(self, obj):
        if not obj.linked_workspace:
            return None
        return {
            "id": str(obj.linked_workspace.id),
            "name": obj.linked_workspace.name,
            "slug": obj.linked_workspace.slug,
        }
