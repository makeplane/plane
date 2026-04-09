# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.db.models import Department
from plane.license.api.views.base import BaseAPIView


class DepartmentBulkLinkCategoriesView(BaseAPIView):
    """Bulk-link departments to task categories via dept_code + category_name from Excel data."""

    def post(self, request):
        links = request.data.get("links")
        if not isinstance(links, list):
            return Response({"error": "links must be a list"}, status=status.HTTP_400_BAD_REQUEST)
        if len(links) > 500:
            return Response({"error": "Maximum 500 rows per request"}, status=status.HTTP_400_BAD_REQUEST)

        from plane.db.models import DepartmentTaskCategory, MainTaskCategory

        # Pre-build lookup maps
        dept_map = {
            d.code: d
            for d in Department.objects.filter(deleted_at__isnull=True)
        }
        category_map = {
            c.name.lower(): c
            for c in MainTaskCategory.objects.filter(deleted_at__isnull=True)
        }

        linked = []
        skipped = []

        for i, row in enumerate(links):
            dept_code = (row.get("dept_code") or "").strip()
            category_name = (row.get("category_name") or "").strip()

            if not dept_code:
                skipped.append({"row": i + 1, "reason": "Missing dept_code"})
                continue
            if not category_name:
                skipped.append({"row": i + 1, "dept_code": dept_code, "reason": "Missing category_name"})
                continue

            dept = dept_map.get(dept_code)
            if not dept:
                skipped.append({"row": i + 1, "dept_code": dept_code, "reason": "Department not found"})
                continue

            category = category_map.get(category_name.lower())
            if not category:
                skipped.append({"row": i + 1, "dept_code": dept_code, "reason": f"Category '{category_name}' not found"})
                continue

            with transaction.atomic():
                _, created = DepartmentTaskCategory.objects.get_or_create(
                    department=dept,
                    main_task_category=category,
                )

            linked.append({
                "dept_code": dept_code,
                "dept_name": dept.name,
                "category_name": category.name,
            })

        return Response(
            {
                "linked": linked,
                "skipped": skipped,
                "total_linked": len(linked),
                "total_skipped": len(skipped),
            },
            status=status.HTTP_200_OK,
        )
