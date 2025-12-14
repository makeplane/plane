"""Family ViewSet for FamilyFlow"""

# Django imports
from django.db.models import Count, OuterRef, Q
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.serializers.family import FamilySerializer, FamilyLiteSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Family
from plane.db.models.family_member import FamilyMember


class FamilyViewSet(BaseViewSet):
    """ViewSet for Family CRUD operations"""
    
    model = Family
    serializer_class = FamilySerializer
    
    search_fields = ["name"]
    filterset_fields = []
    
    def get_queryset(self):
        """Get families that the current user is a member of"""
        # Count active members for each family
        member_count = (
            FamilyMember.objects.filter(
                family=OuterRef("id"),
                is_active=True,
                deleted_at__isnull=True
            )
            .order_by()
            .annotate(count=Count("id"))
            .values("count")
        )
        
        # Filter families where user is an active member
        queryset = (
            self.filter_queryset(super().get_queryset())
            .annotate(total_members=member_count)
            .filter(
                members__user=self.request.user,
                members__is_active=True,
                members__deleted_at__isnull=True
            )
            .distinct()
            .order_by("name")
        )
        
        return queryset
    
    def create(self, request):
        """Create a new family"""
        serializer = FamilySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create family with current user as creator
        family = serializer.save(created_by=request.user)
        
        # Automatically add creator as first family member (parent)
        FamilyMember.objects.create(
            user=request.user,
            family=family,
            name=request.user.display_name or request.user.email,
            role="parent",
            created_by=request.user
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve family with member count"""
        instance = self.get_object()
        
        # Add computed fields
        instance.total_members = FamilyMember.objects.filter(
            family=instance,
            is_active=True,
            deleted_at__isnull=True
        ).count()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

