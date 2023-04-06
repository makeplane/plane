# Python imports
import re

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import Issue


def search_issues(query):
    fields = ["name", "sequence_id"]
    q = Q()
    for field in fields:
        if field == "sequence_id":
            sequences = re.findall(r"\d+\.\d+|\d+", query)
            for sequence_id in sequences:
                q |= Q(**{"sequence_id": sequence_id})
        else:
            q |= Q(**{f"{field}__icontains": query})
    return Issue.objects.filter(
        q,
    ).distinct()
