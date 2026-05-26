# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import csv
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
            description = row_lower.get("description") or row_lower.get("body") or row_lower.get("desc") or row_lower.get("description_html") or ""
            priority_val = (row_lower.get("priority") or "none").lower()
            state_val = row_lower.get("state") or row_lower.get("status") or ""
            assignee_val = row_lower.get("assignee") or row_lower.get("assignees") or row_lower.get("owner") or row_lower.get("tech") or ""
            
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
