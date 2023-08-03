
# Python imports
import csv
import io

# Django imports
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception

# Module imports
from plane.db.models import Issue

@shared_task
def issue_export_task(email, data, slug):
    try:
        project_ids = data.get("project_id")

        # If project_ids is empty, fetch all issues
        if not project_ids:
            issues = Issue.objects.filter(workspace__slug=slug)
        else:
            issues = Issue.objects.filter(workspace__slug=slug, project_id__in=project_ids)

        # CSV header
        header = [
            "Issue ID",
            "Name",
            "Description",
            "Priority",
            "Start Date",
            "Target Date",
            "State",
            "Project",
            "Created At"
            "Updated At"
            "Completed At"
            "Sort Order"
            "Archived At"
            "Cycle Name",
            "Cycle Start Date",
            "Cycle End Date",
            "Module Name",
            "Module Start Date",
            "Module Target Date",
            "Created By",
            "Assignee",
            "Labels"
        ]

        # Prepare the CSV data
        rows = [header]

        # Write data for each issue
        for issue in issues:
            created_by_fullname = f"{issue.created_by.first_name} {issue.created_by.last_name}" if issue.created_by else ""
            assignees_names = ", ".join([f"{assignee.first_name} {assignee.last_name}" for assignee in issue.assignees.all()])
            labels_names = ", ".join([label.name for label in issue.labels.all()])

            cycle_name, cycle_start_date, cycle_end_date = None, None, None
            if hasattr(issue, 'issue_cycle'):
                cycle_info = issue.issue_cycle
                cycle_name = cycle_info.cycle.name
                cycle_start_date = cycle_info.cycle.start_date
                cycle_end_date = cycle_info.cycle.end_date

            module_name, module_start_date, module_target_date = None, None, None
            if hasattr(issue, 'issue_module'):
                module_info = issue.issue_module
                module_name = module_info.module.name
                module_start_date = module_info.module.start_date
                module_target_date = module_info.module.target_date
            
            row = [
                str(issue.project.identifier) + "-" + str(issue.sequence_id),
                issue.name,
                issue.description_stripped,
                issue.priority,
                issue.start_date,
                issue.target_date,
                issue.state.name,
                issue.project.name,
                issue.created_at,
                issue.updated_at,
                issue.completed_at,
                issue.sort_order,
                issue.archived_at,
                cycle_name,
                cycle_start_date,
                cycle_end_date,
                module_name,
                module_start_date,
                module_target_date,
                created_by_fullname,
                assignees_names,
                labels_names
            ]
            
            rows.append(row)

        # Create CSV file in-memory
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

        # Write CSV data to the buffer
        for row in rows:
            writer.writerow(row)

        subject = "Your Issue Export is ready"

        html_content = render_to_string("emails/exports/issues.html", {})
        text_content = strip_tags(html_content)

        csv_buffer.seek(0)
        msg = EmailMultiAlternatives(
            subject, text_content, settings.EMAIL_FROM, [email]
        )
        msg.attach(f"{slug}-issues.csv", csv_buffer.read(), "text/csv")
        msg.send(fail_silently=False)

    except Exception as e:
        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return

