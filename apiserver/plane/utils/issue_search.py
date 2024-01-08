# Python imports
import re

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import Issue


def search_issues(query, queryset):
    fields = ["name", "sequence_id"]
    q = Q()
    for field in fields:
        if field == "sequence_id" and len(query) <= 20:
            sequences = re.findall(r"[A-Za-z0-9]{1,12}-\d+", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})
    return queryset.filter(
        q,
    ).distinct()
