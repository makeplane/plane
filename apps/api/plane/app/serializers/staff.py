# Django imports
from rest_framework import serializers

# Module imports
from plane.db.models import StaffProfile
from .base import BaseSerializer


class StaffProfileSerializer(BaseSerializer):
    """Staff profile serializer with department and user details."""

    department_detail = serializers.SerializerMethodField()
    user_detail = serializers.SerializerMethodField()
    email = serializers.CharField(source="user.email", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "workspace",
            "user",
            "staff_id",
            "department",
            "department_detail",
            "position",
            "job_grade",
            "phone",
            "date_of_joining",
            "date_of_leaving",
            "employment_status",
            "is_department_manager",
            "notes",
            "email",
            "display_name",
            "user_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "user",
            "created_at",
            "updated_at",
        ]

    def get_department_detail(self, obj):
        if not obj.department:
            return None
        return {
            "id": str(obj.department.id),
            "name": obj.department.name,
            "code": obj.department.code,
        }

    def get_user_detail(self, obj):
        if not obj.user:
            return None
        return {
            "id": str(obj.user.id),
            "display_name": obj.user.display_name,
            "email": obj.user.email,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
        }


class MyStaffProfileSerializer(BaseSerializer):
    """Lightweight serializer for current user's own staff profile — read-only."""

    department_detail = serializers.SerializerMethodField()

    class Meta:
        model = StaffProfile
        fields = ["id", "staff_id", "position", "department", "department_detail"]
        read_only_fields = ["id", "staff_id", "position", "department", "department_detail"]

    def get_department_detail(self, obj):
        if not obj.department:
            return None
        return {
            "id": str(obj.department.id),
            "name": obj.department.name,
            "code": obj.department.code,
        }


class StaffProfileCreateSerializer(serializers.Serializer):
    """Serializer for creating staff with auto User creation."""

    staff_id = serializers.CharField(max_length=8)
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    department_id = serializers.UUIDField(required=False, allow_null=True)
    position = serializers.CharField(max_length=255, required=False, default="")
    job_grade = serializers.CharField(max_length=50, required=False, default="")
    phone = serializers.CharField(max_length=20, required=False, default="")
    date_of_joining = serializers.DateField(required=False, allow_null=True)
    is_department_manager = serializers.BooleanField(required=False, default=False)
    password = serializers.CharField(max_length=128, write_only=True)
    notes = serializers.CharField(required=False, default="")
