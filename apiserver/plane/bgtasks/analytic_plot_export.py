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
    "assignees__email": "Assignee Email",
    "start_date": "Start Date",
    "target_date": "Due Date",
    "completed_at": "Completed At",
    "created_at": "Created At",
    "issue_count": "Issue Count",
    "effort": "Effort",
}


@shared_task
def analytic_export_task(email, data, slug):
    try:
        filters = issue_filters(data, "POST")
        queryset = Issue.objects.filter(**filters, workspace__slug=slug)

        x_axis = data.get("x_axis", False)
        y_axis = data.get("y_axis", False)
        segment = data.get("segment", False)

        distribution = build_graph_plot(
            queryset=queryset, x_axis=x_axis, y_axis=y_axis, segment=segment
        )

        key = "count" if y_axis == "issue_count" else "effort"

        if segment:
            row_zero = [
                row_mapping.get(x_axis, "X-Axis"),
            ]
            segment_zero = []
            for item in distribution:
                current_dict = distribution.get(item)
                for current in current_dict:
                    segment_zero.append(current.get("segment"))

            segment_zero = list(set(segment_zero))
            row_zero = row_zero + segment_zero

            rows = []
            for item in distribution:
                generated_row = []
                data = distribution.get(item)
                for segment in segment_zero[1:]:
                    value = [x for x in data if x.get("segment") == segment]
                    if len(value):
                        generated_row.append(value[0].get(key))
                    else:
                        generated_row.append("")

                rows.append(tuple(generated_row))

            rows = [tuple(row_zero)] + rows
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

            # Write CSV data to the buffer
            for row in rows:
                writer.writerow(row)

            subject = "Your Export is ready"

            html_content = render_to_string("emails/exports/analytics.html", {})

            text_content = strip_tags(html_content)

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
                rows.append(
                    tuple(
                        [
                            item,
                            distribution.get(item)[0].get("count")
                            if y_axis == "issue_count"
                            else distribution.get(item)[0].get("effort"),
                        ]
                    )
                )

            rows = [tuple(row_zero)] + rows
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

            # Write CSV data to the buffer
            for row in rows:
                writer.writerow(row)

            subject = "Your Export is ready"

            html_content = render_to_string("emails/exports/analytics.html", {})

            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject, text_content, settings.EMAIL_FROM, [email]
            )
            msg.attach(f"{slug}-analytics.csv", csv_buffer.read())
            msg.send(fail_silently=False)


    except Exception as e:
        print(e)
        capture_exception(e)
        return
