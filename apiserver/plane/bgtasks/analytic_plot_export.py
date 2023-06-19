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
from plane.utils.analytics_plot import build_graph_plot
from plane.utils.issue_filters import issue_filters

row_mapping = {
    "state__name": "State",
    "state__group": "State Group",
    "labels__name": "Label",
    "assignees__email": "Assignee Name",
    "start_date": "Start Date",
    "target_date": "Due Date",
    "completed_at": "Completed At",
    "created_at": "Created At",
    "issue_count": "Issue Count",
    "priority": "Priority",
    "estimate": "Estimate",
}


@shared_task
def analytic_export_task(email, data, slug):
    try:
        filters = issue_filters(data, "POST")
        queryset = Issue.issue_objects.filter(**filters, workspace__slug=slug)

        x_axis = data.get("x_axis", False)
        y_axis = data.get("y_axis", False)
        segment = data.get("segment", False)

        distribution = build_graph_plot(
            queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
        )

        key = "count" if y_axis == "issue_count" else "estimate"

        segmented = segment

        assignee_details = {}
        if x_axis in ["assignees__email"] or segment in ["assignees__email"]:
            assignee_details = (
                Issue.issue_objects.filter(workspace__slug=slug, **filters, assignees__avatar__isnull=False)
                .order_by("assignees__id")
                .distinct("assignees__id")
                .values("assignees__avatar", "assignees__email", "assignees__first_name", "assignees__last_name")
            )

        if segment:
            segment_zero = []
            for item in distribution:
                current_dict = distribution.get(item)
                for current in current_dict:
                    segment_zero.append(current.get("segment"))

            segment_zero = list(set(segment_zero))
            row_zero = (
                [
                    row_mapping.get(x_axis, "X-Axis"),
                ]
                + [
                    row_mapping.get(y_axis, "Y-Axis"),
                ]
                + segment_zero
            )
            rows = []
            for item in distribution:
                generated_row = [
                    item,
                ]

                data = distribution.get(item)
                # Add y axis values
                generated_row.append(sum(obj.get(key) for obj in data if obj.get(key, None) is not None))

                for segment in segment_zero:
                    value = [x for x in data if x.get("segment") == segment]
                    if len(value):
                        generated_row.append(value[0].get(key))
                    else:
                        generated_row.append("0")
                # x-axis replacement for names
                if x_axis in ["assignees__email"]:
                    assignee = [user for user in assignee_details if str(user.get("assignees__email")) == str(item)]
                    if len(assignee):
                        generated_row[0] = str(assignee[0].get("assignees__first_name")) + " " + str(assignee[0].get("assignees__last_name"))
                rows.append(tuple(generated_row))

            # If segment is ["assignees__email"] then replace segment_zero rows with first and last names
            if segmented in ["assignees__email"]:
                for index, segm in enumerate(row_zero[2:]):
                    # find the name of the user
                    assignee = [user for user in assignee_details if str(user.get("assignees__email")) == str(segm)]
                    if len(assignee):
                        row_zero[index] = str(assignee[0].get("assignees__first_name")) + " " + str(assignee[0].get("assignees__last_name"))

            rows = [tuple(row_zero)] + rows
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

            # Write CSV data to the buffer
            for row in rows:
                writer.writerow(row)

            subject = "Your Export is ready"

            html_content = render_to_string("emails/exports/analytics.html", {})

            text_content = strip_tags(html_content)
            csv_buffer.seek(0)
            msg = EmailMultiAlternatives(
                subject, text_content, settings.EMAIL_FROM, [email]
            )
            msg.attach(f"{slug}-analytics.csv", csv_buffer.read())
            msg.send(fail_silently=False)

        else:
            row_zero = [
                row_mapping.get(x_axis, "X-Axis"),
                row_mapping.get(y_axis, "Y-Axis"),
            ]
            rows = []
            for item in distribution:
                row =  [
                            item,
                            distribution.get(item)[0].get("count")
                            if y_axis == "issue_count"
                            else distribution.get(item)[0].get("estimate  "),
                        ]
                # x-axis replacement to names
                if x_axis in ["assignees__email"]:
                    assignee = [user for user in assignee_details if str(user.get("assignees__email")) == str(item)]
                    if len(assignee):
                        row[0] = str(assignee[0].get("assignees__first_name")) + " " + str(assignee[0].get("assignees__last_name"))

                rows.append(tuple(row))
            rows = [tuple(row_zero)] + rows
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

            # Write CSV data to the buffer
            for row in rows:
                writer.writerow(row)

            subject = "Your Export is ready"

            html_content = render_to_string("emails/exports/analytics.html", {})

            text_content = strip_tags(html_content)

            csv_buffer.seek(0)
            msg = EmailMultiAlternatives(
                subject, text_content, settings.EMAIL_FROM, [email]
            )
            msg.attach(f"{slug}-analytics.csv", csv_buffer.read())
            msg.send(fail_silently=False)

    except Exception as e:
        print(e)
        capture_exception(e)
        return
