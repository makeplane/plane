# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Literature helpers: ACL projection, thresholds and import parsing (P1-B1)."""

import re

from django.utils import timezone

from plane.db.models import LiteratureEntry, ResearchProjectProfile
from plane.research.utils.acl import ResearchResource
from plane.research.utils.settings import get_workspace_research_settings

LITERATURE_RESOURCE_KIND = "literature_entry"


def literature_thresholds(workspace):
    settings = get_workspace_research_settings(workspace)
    return {
        "min_included": settings.get("literature_min_included", 20),
        "max_entries": settings.get("literature_max_entries", 100),
    }


def project_org_unit(project_id, workspace_id):
    return (
        ResearchProjectProfile.objects.filter(project_id=project_id, workspace_id=workspace_id)
        .values_list("org_unit_id", flat=True)
        .first()
    )


def literature_resource(entry) -> ResearchResource:
    return ResearchResource(
        kind=LITERATURE_RESOURCE_KIND,
        workspace_id=entry.workspace_id,
        owner_id=entry.owner_id,
        org_unit_id=project_org_unit(entry.project_id, entry.workspace_id),
        visibility=entry.visibility,
        state=entry.status,
    )


def literature_counters(project_id, workspace_id=None):
    """Counters used by the pre-opening gate and the threshold panel."""
    base = {"project_id": project_id, "deleted_at__isnull": True}
    entries = LiteratureEntry.objects.filter(**base)
    included = entries.filter(status=LiteratureEntry.Status.INCLUDED)
    unannotated = included.filter(_blank("summary") | _blank("gap_notes"))
    unverifiable = included.filter(_blank("doi") & _blank("url") & _blank("venue"))
    return {
        "total": entries.count(),
        "included": included.count(),
        "collected": entries.filter(status=LiteratureEntry.Status.COLLECTED).count(),
        "screened": entries.filter(status=LiteratureEntry.Status.SCREENED).count(),
        "excluded": entries.filter(status=LiteratureEntry.Status.EXCLUDED).count(),
        "unannotated": [str(entry_id) for entry_id in unannotated.values_list("id", flat=True)[:20]],
        "unannotated_count": unannotated.count(),
        "unverifiable": [str(entry_id) for entry_id in unverifiable.values_list("id", flat=True)[:20]],
        "unverifiable_count": unverifiable.count(),
    }


def _blank(field_name):
    from django.db.models import Q

    return Q(**{f"{field_name}__isnull": True}) | Q(**{field_name: ""})


def parse_bibtex(text):
    """Minimal BibTeX reader: enough for the documented import contract.

    The parser never guesses missing values - an entry without a title is
    returned with the DOI (or the citation key) as the title so the row can be
    reviewed by the researcher afterwards.
    """
    entries = []
    for block in re.findall(r"@\w+\s*\{([^@]*)\}", text or "", flags=re.DOTALL):
        key = block.split(",", 1)[0].strip()
        fields = {}
        for match in re.finditer(r"(\w+)\s*=\s*[\{\"](.*?)[\}\"]\s*,?", block, flags=re.DOTALL):
            fields[match.group(1).lower()] = " ".join(match.group(2).split())
        title = fields.get("title") or fields.get("doi") or key
        year = fields.get("year")
        entries.append(
            {
                "title": title,
                "authors": fields.get("author", ""),
                "venue": fields.get("journal") or fields.get("booktitle", ""),
                "doi": fields.get("doi", ""),
                "url": fields.get("url", ""),
                "year": int(year) if year and year.isdigit() else None,
                "summary": fields.get("abstract", ""),
            }
        )
    return entries


def parse_doi_lines(text):
    """One DOI per line; ``title`` may follow the DOI after a separator."""
    entries = []
    for raw_line in (text or "").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        parts = re.split(r"\s*[|,\t]\s*", line, maxsplit=1)
        doi = parts[0].strip()
        if not doi:
            continue
        doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", doi, flags=re.IGNORECASE)
        title = parts[1].strip() if len(parts) > 1 and parts[1].strip() else doi
        entries.append({"title": title, "doi": doi, "url": f"https://doi.org/{doi}"})
    return entries


def default_visibility(workspace):
    return get_workspace_research_settings(workspace).get("default_report_visibility") or "DIRECT_ADVISOR"


def today():
    return timezone.localdate()
