# Python imports
import re

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import Issue


def search_issues(query, queryset):
    fields = ["name", "sequence_id", "project__identifier"]
    q = Q()
    q_and = Q()  # Q object for AND conditions

    for field in fields:
        if field in ["sequence_id", "project__identifier"]:
            # Condition to check sequence
            if field == "sequence_id":
                sequences = re.findall(r"\d+\.\d+|\d+", query)
                for sequence_id in sequences:
                    q_and &= Q(**{"sequence_id": int(sequence_id)})
            # Condition to check identifier
            if field == "project__identifier":
                identifiers = query.split("-")
                if identifiers:
                    q_and &= Q(**{"project__identifier": identifiers[0]})
        else:
            q |= Q(**{f"{field}__icontains": query})

    final_q = q_and | q

    return queryset.filter(
        final_q,
    ).distinct()
