"""BacklogItem serializers for FamilyFlow"""

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from plane.db.models import BacklogItem, BacklogItemStatus, Family, FamilyMember


class BacklogItemSerializer(DynamicBaseSerializer):
    """Serializer for BacklogItem model"""
    
    family_name = serializers.CharField(source="family.name", read_only=True)
    creator_name = serializers.CharField(source="creator.name", read_only=True)
    
    def validate_title(self, value):
        """Validate title is not empty or whitespace"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty or whitespace")
        return value.strip()
    
    def validate_category(self, value):
        """Validate category exists in family's swim lanes"""
        # Get family from context or instance
        family = None
        if self.instance:
            family = self.instance.family
        elif "family" in self.initial_data:
            try:
                family = Family.objects.get(id=self.initial_data["family"])
            except Family.DoesNotExist:
                raise serializers.ValidationError("Family not found")
        
        if family:
            all_swim_lanes = family.get_all_swim_lanes()
            if value not in all_swim_lanes:
                raise serializers.ValidationError(
                    f"Category '{value}' must be one of the family's swim lanes: {', '.join(all_swim_lanes)}"
                )
        return value
    
    def validate_priority(self, value):
        """Validate priority >= 0"""
        if value < 0:
            raise serializers.ValidationError("Priority must be >= 0")
        return value
    
    def validate_story_points(self, value):
        """Validate story points are between 1-5 if provided"""
        if value is not None:
            if value < 1 or value > 5:
                raise serializers.ValidationError("Story points must be between 1 and 5")
        return value
    
    def validate_status(self, value):
        """Validate status is valid"""
        valid_statuses = [choice[0] for choice in BacklogItemStatus.choices]
        if value not in valid_statuses:
            raise serializers.ValidationError(f"Status must be one of: {', '.join(valid_statuses)}")
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Ensure creator is a member of the family
        family = attrs.get("family") or (self.instance.family if self.instance else None)
        creator = attrs.get("creator") or (self.instance.creator if self.instance else None)
        
        if family and creator:
            if not FamilyMember.objects.filter(family=family, user=creator.user, is_active=True).exists():
                raise serializers.ValidationError({
                    "creator": "Creator must be an active member of the family"
                })
        
        return attrs
    
    class Meta:
        model = BacklogItem
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]


class BacklogItemLiteSerializer(BaseSerializer):
    """Lightweight serializer for BacklogItem model"""
    
    class Meta:
        model = BacklogItem
        fields = ["id", "title", "category", "priority", "status", "story_points"]
        read_only_fields = fields

