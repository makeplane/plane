"""FamilyMember ViewSet for FamilyFlow"""

# Django imports
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.family import FamilyMemberSerializer, FamilyMemberLiteSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Family, FamilyMember


class FamilyMemberViewSet(BaseViewSet):
    """ViewSet for FamilyMember CRUD operations"""
    
    model = FamilyMember
    serializer_class = FamilyMemberSerializer
    
    search_fields = ["name", "user__email", "user__display_name"]
    filterset_fields = ["family", "role", "is_active"]
    
    def get_queryset(self):
        """Get family members for families the user belongs to"""
        # Get family_id from URL if present
        family_id = self.kwargs.get("family_id")
        
        # Base queryset: members from families the user belongs to
        base_filter = Q(
            family__members__user=self.request.user,
            family__members__is_active=True,
            family__members__deleted_at__isnull=True
        )
        
        # If family_id is in URL, filter to that family
        if family_id:
            base_filter &= Q(family_id=family_id)
        
        queryset = (
            self.filter_queryset(super().get_queryset())
            .select_related("user", "family")
            .filter(base_filter)
            .distinct()
            .order_by("family__name", "name")
        )
        
        return queryset
    
    def create(self, request):
        """Create a new family member"""
        serializer = FamilyMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        family_id = serializer.validated_data.get("family").id
        
        # Verify user is a parent member of the family
        user_membership = FamilyMember.objects.filter(
            family_id=family_id,
            user=request.user,
            role="parent",
            is_active=True,
            deleted_at__isnull=True
        ).first()
        
        if not user_membership:
            return Response(
                {"error": "Only parents can add family members"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if user is already a member of this family
        existing_member = FamilyMember.objects.filter(
            family_id=family_id,
            user=serializer.validated_data.get("user"),
            deleted_at__isnull=True
        ).first()
        
        if existing_member:
            if existing_member.deleted_at:
                # Reactivate soft-deleted member
                existing_member.is_active = True
                existing_member.deleted_at = None
                existing_member.save()
                serializer = FamilyMemberSerializer(existing_member)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "User is already a member of this family"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create new member
        member = serializer.save(created_by=request.user)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update family member"""
        instance = self.get_object()
        
        # Verify user is a parent member of the family or updating themselves
        user_membership = FamilyMember.objects.filter(
            family=instance.family,
            user=request.user,
            is_active=True,
            deleted_at__isnull=True
        ).first()
        
        if not user_membership:
            return Response(
                {"error": "You must be a member of this family to update members"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only parents can update other members (members can update themselves)
        if instance.user != request.user and user_membership.role != "parent":
            return Response(
                {"error": "Only parents can update other family members"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)

