"""Backlog ViewSet for FamilyFlow"""

# Django imports
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

# Module imports
from plane.app.serializers.backlog_item import BacklogItemSerializer, BacklogItemLiteSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import BacklogItem, Family, FamilyMember


class BacklogItemViewSet(BaseViewSet):
    """ViewSet for BacklogItem CRUD operations within a family"""
    
    model = BacklogItem
    serializer_class = BacklogItemSerializer
    
    search_fields = ["title", "description"]
    filterset_fields = ["category", "status", "is_template"]
    
    def get_queryset(self):
        """
        Get backlog items for the specified family.
        Filter by category and status if provided in query parameters.
        Ensure the requesting user is a member of the family.
        """
        family_id = self.kwargs.get("family_id")
        if not family_id:
            return BacklogItem.objects.none()
        
        # Ensure the requesting user is a member of this family
        if not FamilyMember.objects.filter(
            family_id=family_id,
            user=self.request.user,
            is_active=True,
            deleted_at__isnull=True
        ).exists():
            return BacklogItem.objects.none()
        
        queryset = (
            self.filter_queryset(super().get_queryset())
            .filter(family_id=family_id)
            .select_related("family", "creator", "creator__user")
            .order_by("-priority", "-created_at")
        )
        
        # Additional filtering by category and status (already handled by filterset_fields, but explicit here)
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    def create(self, request, family_id=None):
        """Create a new backlog item"""
        # Ensure the family exists and user is a member
        try:
            family = Family.objects.get(id=family_id, deleted_at__isnull=True)
        except Family.DoesNotExist:
            return Response({"error": "Family not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create the creator FamilyMember
        try:
            creator = FamilyMember.objects.get(
                family=family,
                user=request.user,
                is_active=True,
                deleted_at__isnull=True
            )
        except FamilyMember.DoesNotExist:
            return Response(
                {"error": "You must be a member of this family to create backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only parents can create backlog items (per spec requirement)
        if creator.role != "parent":
            return Response(
                {"error": "Only parents can create backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = BacklogItemSerializer(data={**request.data, "family": family.id, "creator": creator.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, family_id=None, *args, **kwargs):
        """Update a backlog item (only by parents)"""
        instance = self.get_object()
        
        # Verify user is a parent member of the family
        try:
            member = FamilyMember.objects.get(
                family_id=family_id,
                user=request.user,
                is_active=True,
                deleted_at__isnull=True
            )
        except FamilyMember.DoesNotExist:
            return Response(
                {"error": "You must be a member of this family to update backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only parents can update backlog items
        if member.role != "parent":
            return Response(
                {"error": "Only parents can update backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def destroy(self, request, family_id=None, *args, **kwargs):
        """Delete a backlog item (only by parents)"""
        instance = self.get_object()
        
        # Verify user is a parent member of the family
        try:
            member = FamilyMember.objects.get(
                family_id=family_id,
                user=request.user,
                is_active=True,
                deleted_at__isnull=True
            )
        except FamilyMember.DoesNotExist:
            return Response(
                {"error": "You must be a member of this family to delete backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only parents can delete backlog items
        if member.role != "parent":
            return Response(
                {"error": "Only parents can delete backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request, family_id=None):
        """
        Reorder backlog items by updating their priority values.
        Expects a list of item IDs in the desired order (first = highest priority).
        """
        # Verify user is a parent member of the family
        try:
            member = FamilyMember.objects.get(
                family_id=family_id,
                user=request.user,
                is_active=True,
                deleted_at__isnull=True
            )
        except FamilyMember.DoesNotExist:
            return Response(
                {"error": "You must be a member of this family to reorder backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only parents can reorder backlog items
        if member.role != "parent":
            return Response(
                {"error": "Only parents can reorder backlog items"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        item_ids = request.data.get("item_ids", [])
        if not isinstance(item_ids, list):
            return Response(
                {"error": "item_ids must be a list of backlog item IDs"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify all items belong to this family
        items = BacklogItem.objects.filter(id__in=item_ids, family_id=family_id)
        if items.count() != len(item_ids):
            return Response(
                {"error": "Some backlog items not found or do not belong to this family"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update priorities: first item in list gets highest priority (len(list)), last gets 0
        # This ensures higher priority = higher number (for ordering)
        priority_map = {}
        for index, item_id in enumerate(item_ids):
            # Reverse order: first item gets highest priority number
            priority_map[str(item_id)] = len(item_ids) - index
        
        # Bulk update priorities
        items_to_update = []
        for item in items:
            new_priority = priority_map.get(str(item.id), item.priority)
            if item.priority != new_priority:
                item.priority = new_priority
                items_to_update.append(item)
        
        if items_to_update:
            BacklogItem.objects.bulk_update(items_to_update, ["priority"])
        
        return Response(
            {"message": f"Reordered {len(items_to_update)} backlog items"},
            status=status.HTTP_200_OK
        )

