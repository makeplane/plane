# Third party imports
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import WorkspaceEntityPermission
from plane.app.serializers.department import DepartmentTreeSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import Department, Workspace


class OrgChartEndpoint(BaseAPIView):
    """
    Read-only org chart scoped to a workspace.
    Returns department tree including only:
      - Departments directly linked to this workspace
      - Their ancestor chain (up to root)
      - Their descendant chain (all children)
    Any workspace member can view.
    """

    permission_classes = [WorkspaceEntityPermission]

    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Find departments directly linked to this workspace
        linked_depts = list(Department.objects.filter(
            linked_workspace__slug=slug,
            deleted_at__isnull=True,
        ).select_related("parent"))

        if not linked_depts:
            return Response([], status=status.HTTP_200_OK)

        # 2. Collect all ancestor IDs (walk up parent chain)
        ancestor_ids: set = set()
        for dept in linked_depts:
            current = dept.parent
            while current:
                ancestor_ids.add(current.id)
                current = current.parent

        # 3. Collect all descendant IDs (recursive BFS)
        all_dept_ids = {d.id for d in linked_depts}
        frontier = all_dept_ids.copy()
        depth = 0
        while frontier and depth < 6:
            children = list(
                Department.objects.filter(
                    parent_id__in=frontier, deleted_at__isnull=True
                ).values_list("id", flat=True)
            )
            frontier = set(children) - all_dept_ids
            all_dept_ids.update(frontier)
            depth += 1

        # 4. Union: linked + ancestors + descendants
        all_ids = all_dept_ids | ancestor_ids
        linked_ids = {d.id for d in linked_depts}

        # 5. Fetch all departments in scope
        from django.db.models import Count, Q

        all_depts = (
            Department.objects.filter(id__in=all_ids, deleted_at__isnull=True)
            .select_related("manager", "linked_workspace")
            .annotate(
                staff_count=Count(
                    "staff_members",
                    filter=Q(staff_members__deleted_at__isnull=True),
                )
            )
        )

        # 6. Build scoped tree from roots in the set
        dept_id_set = {d.id for d in all_depts}
        roots = [d for d in all_depts if d.parent_id is None or d.parent_id not in dept_id_set]

        serializer = OrgChartSerializer(
            roots,
            many=True,
            context={"request": request, "linked_ids": linked_ids, "scoped_ids": dept_id_set},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrgChartSerializer(DepartmentTreeSerializer):
    """Extends DepartmentTreeSerializer with is_linked field and scoped children."""

    is_linked = serializers.SerializerMethodField()

    class Meta(DepartmentTreeSerializer.Meta):
        fields = DepartmentTreeSerializer.Meta.fields + ["is_linked"]

    def get_is_linked(self, obj):
        linked_ids = self.context.get("linked_ids", set())
        return obj.id in linked_ids

    def get_children(self, obj):
        scoped_ids = self.context.get("scoped_ids", set())
        children = obj.children.filter(
            deleted_at__isnull=True, id__in=scoped_ids
        ).order_by("sort_order", "name")
        return OrgChartSerializer(children, many=True, context=self.context).data
