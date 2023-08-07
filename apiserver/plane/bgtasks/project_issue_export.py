# Python imports
import csv
import io

# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Issue

@shared_task
def issue_export_task(email, data, slug, exporter_name):
    try:

        project_ids = data.get("project_id", [])
        issues_filter = {"workspace__slug": slug}

        if project_ids:
            issues_filter["project_id__in"] = project_ids

        issues = (
                Issue.objects.filter(**issues_filter)
                .select_related("project", "workspace", "state", "parent", "created_by")
                .prefetch_related(
                    "assignees", "labels", "issue_cycle__cycle", "issue_module__module"
                )
                .values_list(
                    "project__identifier",
                    "sequence_id",
                    "name",
                    "description_stripped",
                    "priority",
                    "start_date",
                    "target_date",
                    "state__name",
                    "project__name",
                    "created_at",
                    "updated_at",
                    "completed_at",
                    "archived_at",
                    "issue_cycle__cycle__name",
                    "issue_cycle__cycle__start_date",
                    "issue_cycle__cycle__end_date",
                    "issue_module__module__name",
                    "issue_module__module__start_date",
                    "issue_module__module__target_date",
                    "created_by__first_name",
                    "created_by__last_name",
                    "assignees__first_name",
                    "assignees__last_name",
                    "labels__name",
                )
            )

        # CSV header
        header = [
            "Issue ID",
            "Project",
            "Name",
            "Description",
            "State",
            "Priority",
            "Created By",
            "Assignee",
            "Labels",
            "Cycle Name",
            "Cycle Start Date",
            "Cycle End Date",
            "Module Name",
            "Module Start Date",
            "Module Target Date",
            "Created At"
            "Updated At"
            "Completed At"
            "Archived At"
        ]

        # Prepare the CSV data
        rows = [header]

        # Write data for each issue
        for issue in issues:
            (
                project_identifier,
                sequence_id,
                name,
                description,
                priority,
                start_date,
                target_date,
                state_name,
                project_name,
                created_at,
                updated_at,
                completed_at,
                archived_at,
                cycle_name,
                cycle_start_date,
                cycle_end_date,
                module_name,
                module_start_date,
                module_target_date,
                created_by_first_name,
                created_by_last_name,
                assignees_first_names,
                assignees_last_names,
                labels_names,
            ) = issue
            
            created_by_fullname = (
                f"{created_by_first_name} {created_by_last_name}"
                if created_by_first_name and created_by_last_name
                else ""
            )

            assignees_names = ""
            if assignees_first_names and assignees_last_names:
                assignees_names = ", ".join(
                    [
                        f"{assignees_first_name} {assignees_last_name}"
                        for assignees_first_name, assignees_last_name in zip(
                            assignees_first_names, assignees_last_names
                        )
                    ]
                )

            labels_names = ", ".join(labels_names) if labels_names else ""

            row = [
                f"{project_identifier}-{sequence_id}",
                project_name,
                name,
                description,
                state_name,
                priority,
                created_by_fullname,
                assignees_names,
                labels_names,
                cycle_name,
                cycle_start_date,
                cycle_end_date,
                module_name,
                module_start_date,
                module_target_date,
                start_date,
                target_date,
                created_at,
                updated_at,
                completed_at,
                archived_at,
            ]
            rows.append(row)

        # Create CSV file in-memory
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

        # Write CSV data to the buffer
        for row in rows:
            writer.writerow(row)

        subject = "Your Issue Export is ready"

        context = {
            "username": exporter_name,
        }

        html_content = render_to_string("emails/exports/issues.html", context)
        text_content = strip_tags(html_content)

        csv_buffer.seek(0)
        msg = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_FROM, [email]
        )
        msg.attach(f"{slug}-issues-{timezone.now().date()}.csv", csv_buffer.read(), "text/csv")
        msg.send(fail_silently=False)

    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
