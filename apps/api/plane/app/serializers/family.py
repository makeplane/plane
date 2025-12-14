"""Family serializers for FamilyFlow"""

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from plane.db.models import Family, FamilyMember


class FamilySerializer(DynamicBaseSerializer):
    """Serializer for Family model"""
    
    total_members = serializers.IntegerField(read_only=True, required=False)
    all_swim_lanes = serializers.ListField(
        child=serializers.CharField(),
        read_only=True,
        required=False,
        help_text="Combined default and custom swim lanes"
    )
    
    def validate_name(self, value):
        """Validate family name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Family name cannot be empty")
        return value.strip()
    
    def validate_sprint_duration(self, value):
        """Validate sprint duration"""
        if value not in [7, 14] and value not in range(1, 31):
            raise serializers.ValidationError("Sprint duration must be between 1 and 30 days")
        return value
    
    def validate_default_swim_lanes(self, value):
        """Validate default swim lanes"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("At least one default swim lane category is required")
        return value
    
    class Meta:
        model = Family
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class FamilyLiteSerializer(BaseSerializer):
    """Lightweight serializer for Family model"""
    
    class Meta:
        model = Family
        fields = ["id", "name", "sprint_duration", "gamification_enabled"]
        read_only_fields = fields


class FamilyMemberSerializer(DynamicBaseSerializer):
    """Serializer for FamilyMember model"""
    
    family_name = serializers.CharField(source="family.name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_display_name = serializers.CharField(source="user.display_name", read_only=True)
    should_use_kid_interface = serializers.BooleanField(read_only=True)
    
    def validate_age(self, value):
        """Validate age"""
        if value is not None:
            if value < 0 or value > 120:
                raise serializers.ValidationError("Age must be between 0 and 120")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Age is required if role is child
        role = attrs.get("role", getattr(self.instance, "role", None) if self.instance else None)
        age = attrs.get("age", getattr(self.instance, "age", None) if self.instance else None)
        
        if role == "child" and (age is None or age == 0):
            raise serializers.ValidationError({"age": "Age is required for child members"})
        
        return attrs
    
    class Meta:
        model = FamilyMember
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "joined_at",
        ]


class FamilyMemberLiteSerializer(BaseSerializer):
    """Lightweight serializer for FamilyMember model"""
    
    class Meta:
        model = FamilyMember
        fields = ["id", "name", "role", "age", "avatar_url", "is_active"]
        read_only_fields = fields

