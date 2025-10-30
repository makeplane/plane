# Third party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.permissions import ROLE, allow_permission
from plane.db.models import Sticky, Workspace
from plane.app.serializers import StickySerializer


class WorkspaceStickyViewSet(BaseViewSet):
    serializer_class = StickySerializer
    model = Sticky
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(owner_id=self.request.user.id)
            .select_related("workspace", "owner")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = StickySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, owner_id=request.user.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        query = request.query_params.get("query", False)
        stickies = self.get_queryset().order_by("-sort_order")
        if query:
            stickies = stickies.filter(description_stripped__icontains=query)

        return self.paginate(
            request=request,
            queryset=(stickies),
            on_results=lambda stickies: StickySerializer(stickies, many=True).data,
            default_per_page=20,
        )

    @allow_permission(allowed_roles=[], creator=True, model=Sticky, level="WORKSPACE")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @allow_permission(allowed_roles=[], creator=True, model=Sticky, level="WORKSPACE")
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
