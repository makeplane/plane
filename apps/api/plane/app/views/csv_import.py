import csv
import html as html_module
import io
import re
from dateutil.parser import parse as parse_date
from django.db import transaction
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    Project,
    State,
    Issue,
    IssueAssignee,
    SupportTicket,
    ProjectMember,
    User,
)
from plane.utils.html_processor import strip_tags


def _clean_jira_markup(text):
    """Aggressively strip ALL Jira/Confluence/ADF markup from imported text.

    This is a catch-all cleaner designed to handle any format that Jira, Confluence,
    or Atlassian tools might embed into CSV exports — not just specific patterns.
    """
    if not text:
        return text

    # =====================================================================
    # PHASE 1: Remove large embedded data blocks
    # =====================================================================

    # ADF (Atlassian Document Format) blocks: {adf}...{adf}
    # These contain huge JSON blobs with signatures, tables, media, etc.
    text = re.sub(r'\{adf\}.*?\{adf\}', '', text, flags=re.DOTALL)

    # Standalone JSON objects/arrays that appear inline (ADF fragments without
    # {adf} wrappers, or leftover structured data). Match balanced braces/brackets
    # containing typical ADF keys like "type", "content", "attrs", "marks".
    text = re.sub(
        r'\{["\']type["\']:\s*["\'](?:doc|paragraph|text|expand|table|tableRow|'
        r'tableCell|mediaSingle|media|heading|bulletList|orderedList|listItem|'
        r'hardBreak|rule|codeBlock|blockquote|panel|inlineCard|mention|emoji|'
        r'taskList|taskItem|decisionList|decisionItem|applicationCard|bodiedExtension|'
        r'inlineExtension|extension|confluenceUnsupportedBlock|confluenceUnsupportedInline|'
        r'unsupportedBlock|unsupportedInline)["\'].*$',
        '', text, flags=re.DOTALL,
    )

    # =====================================================================
    # PHASE 2: Strip ALL Jira/Confluence curly-brace macros
    # =====================================================================
    # Instead of listing {color}, {quote}, {code}, etc. one by one,
    # match ANY {macro} or {macro:params} pattern. This catches:
    #   {color:#172B4D}, {color}, {quote}, {noformat}, {code:java},
    #   {panel:title=X}, {anchor:name}, {toc}, {jira:...}, {excerpt},
    #   {info}, {warning}, {note}, {tip}, {expand}, {section}, {column},
    #   and any future/custom macros.
    text = re.sub(r'\{[a-zA-Z][a-zA-Z0-9_-]*(?::[^}]*)?\}', '', text)

    # =====================================================================
    # PHASE 3: Strip wiki-syntax elements
    # =====================================================================

    # Image / attachment macros: !file.png!, !file.png|thumbnail!, !file.png|width=200!
    text = re.sub(r'!([^|!\n]+?)(?:\|[^!\n]*)?!', '', text)

    # Wiki links: [display text|http://...] or [http://...]
    text = re.sub(
        r'\[([^|\]]+)\|([^\]]+)\]',
        lambda m: f'{m.group(1).strip()} ({m.group(2).strip()})',
        text,
    )
    text = re.sub(r'\[([^\]]+)\]', r'\1', text)

    # Heading markers: h1. through h6.
    text = re.sub(r'(?m)^h[1-6]\.\s*', '', text)

    # Inline formatting (strip markers, keep content)
    text = re.sub(r'\*([^*\n]+?)\*', r'\1', text)           # *bold*
    text = re.sub(r'(?<!\w)_([^_\n]+?)_(?!\w)', r'\1', text) # _italic_
    text = re.sub(r'(?<!\w)-([^-\n]+?)-(?!\w)', r'\1', text) # -strike-
    text = re.sub(r'\+([^+\n]+?)\+', r'\1', text)           # +underline+
    text = re.sub(r'\{\{(.+?)\}\}', r'\1', text)             # {{monospace}}
    text = re.sub(r'\?\?([^?\n]+?)\?\?', r'\1', text)       # ??citation??
    text = re.sub(r'\^([^^]+?)\^', r'\1', text)              # ^superscript^
    text = re.sub(r'~([^~]+?)~', r'\1', text)                # ~subscript~

    # Bullet / numbered list markers at start of line
    text = re.sub(r'(?m)^[*#]+ ', '', text)

    # Horizontal rules
    text = re.sub(r'(?m)^-{4,}\s*$', '', text)

    # =====================================================================
    # PHASE 4: Clean URL artefacts
    # =====================================================================

    # mailto: prefix in links
    text = re.sub(r'\(mailto:([^)]+)\)', r'(\1)', text)
    text = re.sub(r'mailto:', '', text)

    # Outlook SafeLinks — unwrap to the original URL
    text = re.sub(
        r'https?://[a-z0-9]+\.safelinks\.protection\.outlook\.com/\?url=([^&]+)[^\s)]*',
        lambda m: re.sub(r'%([0-9A-Fa-f]{2})', lambda x: chr(int(x.group(1), 16)), m.group(1)),
        text,
    )

    # Duplicate parenthesized URLs: "http://url (http://url)" -> "http://url"
    text = re.sub(r'(https?://\S+)\s+\(\1\)', r'\1', text)

    # =====================================================================
    # PHASE 5: Strip any remaining HTML tags
    # =====================================================================
    text = re.sub(r'<[^>]+>', '', text)

    # =====================================================================
    # PHASE 6: Fix encoding / mojibake
    # =====================================================================
    mojibake_map = {
        '\u00e2\u0080\u0093': '\u2013',  # en-dash
        '\u00e2\u0080\u0094': '\u2014',  # em-dash
        '\u00e2\u0080\u0099': '\u2019',  # right single quote
        '\u00e2\u0080\u0098': '\u2018',  # left single quote
        '\u00e2\u0080\u009c': '\u201c',  # left double quote
        '\u00e2\u0080\u009d': '\u201d',  # right double quote
        '\u00e2\u0080\u00a6': '\u2026',  # ellipsis
        '\u00e2\u0080\u00a2': '\u2022',  # bullet
        '\u00c2\u00a0': ' ',             # non-breaking space
    }
    for bad, good in mojibake_map.items():
        text = text.replace(bad, good)

    # =====================================================================
    # PHASE 7: Final whitespace cleanup
    # =====================================================================
    text = re.sub(r'[ \t]+', ' ', text)        # collapse horizontal spaces
    text = re.sub(r' ?\n ?', '\n', text)       # trim spaces around newlines
    text = re.sub(r'\n{3,}', '\n\n', text)     # max 1 blank line
    text = re.sub(r'^\s+|\s+$', '', text)      # trim leading/trailing

    return text


class CSVImportValidateAPIEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"error": "CSV file is required under the key 'file'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Read CSV content
            csv_data = file_obj.read().decode("utf-8-sig")
            csv_file = io.StringIO(csv_data)
            reader = csv.DictReader(csv_file)
        except Exception as e:
            return Response(
                {"error": f"Failed to parse CSV file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get project & states
        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        states = list(State.objects.filter(project_id=project_id))
        default_state = next((s for s in states if s.default), None)
        if not default_state and states:
            default_state = states[0]

        # Get project members for assignee mapping
        members = ProjectMember.objects.filter(
            project_id=project_id,
            member__is_bot=False,
            member__is_active=True,
        ).select_related("member")

        member_map = {}
        for m in members:
            u = m.member
            if u.email:
                member_map[u.email.lower().strip()] = u
            if u.display_name:
                member_map[u.display_name.lower().strip()] = u
            if u.username:
                member_map[u.username.lower().strip()] = u

        valid_rows = []
        warnings = []
        total_rows = 0

        # Valid priorities list
        valid_priorities = {"none", "low", "medium", "high", "urgent"}

        for idx, row in enumerate(reader, start=1):
            total_rows += 1
            # Lowercase keys to match columns flexibly
            row_lower = {k.strip().lower(): v.strip() for k, v in row.items() if k}

            title = row_lower.get("title") or row_lower.get("name") or row_lower.get("summary")
            description_raw = row_lower.get("description") or row_lower.get("body") or row_lower.get("desc") or row_lower.get("description_html") or ""
            description = _clean_jira_markup(description_raw)
            priority_val = (row_lower.get("priority") or "none").lower()
            state_val = row_lower.get("state") or row_lower.get("status") or ""
            assignee_val = row_lower.get("assignee") or row_lower.get("assignees") or row_lower.get("owner") or row_lower.get("tech") or ""
            reporter_val = row_lower.get("reporter") or ""

            start_date_val = row_lower.get("start date") or row_lower.get("created") or row_lower.get("created at") or ""
            target_date_val = row_lower.get("due date") or row_lower.get("target date") or row_lower.get("deadline") or ""
            ticket_number_val = row_lower.get("issue key") or row_lower.get("ticket number") or row_lower.get("ticket") or ""

            if not title:
                warnings.append(f"Row {idx}: Skipped because it is missing a title/name.")
                continue

            # Validate Priority
            if priority_val not in valid_priorities:
                warnings.append(f"Row {idx}: Invalid priority '{priority_val}' reset to 'none'.")
                priority_val = "none"

            # Validate State
            mapped_state = None
            if state_val:
                state_clean = state_val.lower().strip()
                mapped_state = next((s for s in states if s.name.lower().strip() == state_clean), None)
                if not mapped_state:
                    if default_state:
                        warnings.append(
                            f"Row {idx}: State '{state_val}' not found. Mapped to default state '{default_state.name}'."
                        )
                        mapped_state = default_state
                    else:
                        warnings.append(f"Row {idx}: State '{state_val}' not found. No default state configured.")
            else:
                mapped_state = default_state

            # Validate Assignees
            mapped_assignee_ids = []
            mapped_assignee_names = []
            if assignee_val:
                parts = [p.strip() for p in assignee_val.split(",") if p.strip()]
                for part in parts:
                    part_lower = part.lower()
                    matched_user = member_map.get(part_lower)
                    if matched_user:
                        mapped_assignee_ids.append(str(matched_user.id))
                        mapped_assignee_names.append(matched_user.display_name or matched_user.username)
                    else:
                        warnings.append(f"Row {idx}: Assignee '{part}' not found in project members.")

            # Parse Dates
            start_date_parsed = None
            if start_date_val:
                try:
                    start_date_parsed = parse_date(start_date_val).date().isoformat()
                except Exception:
                    warnings.append(f"Row {idx}: Invalid Start Date '{start_date_val}'.")

            target_date_parsed = None
            if target_date_val:
                try:
                    target_date_parsed = parse_date(target_date_val).date().isoformat()
                except Exception:
                    warnings.append(f"Row {idx}: Invalid Due Date '{target_date_val}'.")

            # Parse Ticket Number
            ticket_number_parsed = None
            if ticket_number_val:
                match = re.search(r'\d+', ticket_number_val)
                if match:
                    ticket_number_parsed = int(match.group())
                else:
                    warnings.append(f"Row {idx}: Issue Key '{ticket_number_val}' does not contain a valid number.")

            # Resolve Reporter
            reporter_user_id = None
            reporter_user_name = None
            reporter_email_val = None
            if reporter_val:
                from plane.utils.reporter_utils import normalize_reporter_email
                local_part, err = normalize_reporter_email(reporter_val)
                
                if err:
                    errors.append(f"Row {idx}: {err}")
                else:
                    reporter_email_val = local_part
                    
                    # Try to match member by the derived local_part or full value
                    # (since member_map keys might be full emails, try appending domain if it's a local part)
                    reporter_lower = reporter_val.lower().strip()
                    matched_reporter = member_map.get(reporter_lower)
                    if not matched_reporter and local_part:
                        matched_reporter = member_map.get(f"{local_part}@winjit.com")
                    
                    if matched_reporter:
                        reporter_user_id = str(matched_reporter.id)
                        reporter_user_name = matched_reporter.display_name or matched_reporter.username
                        warnings.append(f"Row {idx}: Reporter matched member '{reporter_user_name}'.")
                    else:
                        warnings.append(f"Row {idx}: Reporter '{reporter_val}' not found as member. Stored as email local part '{local_part}'.")

            # Create clean HTML description
            desc_html = f"<p>{description}</p>" if description and not (description.startswith("<p>") or description.startswith("<div>")) else description

            valid_rows.append(
                {
                    "title": title,
                    "description_html": desc_html,
                    "priority": priority_val,
                    "state_id": str(mapped_state.id) if mapped_state else None,
                    "state_name": mapped_state.name if mapped_state else None,
                    "assignee_ids": mapped_assignee_ids,
                    "assignee_names": mapped_assignee_names,
                    "reporter_user_id": reporter_user_id,
                    "reporter_user_name": reporter_user_name,
                    "reporter_email": reporter_email_val,
                    "start_date": start_date_parsed,
                    "target_date": target_date_parsed,
                    "ticket_number": ticket_number_parsed,
                }
            )

        return Response(
            {
                "total_rows": total_rows,
                "valid_rows": valid_rows,
                "warnings": warnings,
                "total_valid": len(valid_rows),
                "total_warnings": len(warnings),
            },
            status=status.HTTP_200_OK,
        )


class CSVImportConfirmAPIEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN])
    def post(self, request, slug, project_id):
        rows = request.data.get("rows", [])
        create_support_tickets = request.data.get("create_support_tickets", False)

        if not rows:
            return Response(
                {"error": "No valid rows provided for confirmation"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project = Project.objects.get(pk=project_id, workspace__slug=slug)
        except Project.DoesNotExist:
            return Response(
                {"error": "Project not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Pre-fetch default state
        states = list(State.objects.filter(project_id=project_id))
        default_state = next((s for s in states if s.default), None)
        if not default_state and states:
            default_state = states[0]

        issues_created = 0
        tickets_created = 0

        with transaction.atomic():
            for row in rows:
                title = row.get("title")
                if not title:
                    continue

                description_html = row.get("description_html") or "<p></p>"
                priority = row.get("priority") or "none"
                state_id = row.get("state_id") or (str(default_state.id) if default_state else None)
                start_date = row.get("start_date")
                target_date = row.get("target_date")
                ticket_number = row.get("ticket_number")

                # Extract reporter fields
                reporter_user_id = row.get("reporter_user_id")
                reporter_email = row.get("reporter_email")

                # Create the Issue
                issue = Issue(
                    name=title,
                    description_html=description_html,
                    description_stripped=strip_tags(description_html),
                    priority=priority,
                    state_id=state_id,
                    start_date=start_date,
                    target_date=target_date,
                    project_id=project_id,
                    workspace_id=project.workspace_id,
                    reporter_id=reporter_user_id,
                    reporter_email=reporter_email,
                )
                issue.save()
                issues_created += 1

                # Create Assignees
                assignee_ids = row.get("assignee_ids", [])
                for assignee_id in assignee_ids:
                    IssueAssignee.objects.create(
                        issue=issue,
                        assignee_id=assignee_id,
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                    )

                # Create Support Ticket if enabled
                if create_support_tickets:
                    ticket = SupportTicket(
                        issue=issue,
                        source="CSV_IMPORT",
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        reporter_user_id=reporter_user_id,
                        reporter_email=reporter_email,
                    )
                    if ticket_number:
                        ticket.ticket_number = ticket_number
                    ticket.save()
                    tickets_created += 1

        return Response(
            {
                "issues_created": issues_created,
                "tickets_created": tickets_created,
            },
            status=status.HTTP_201_CREATED,
        )
