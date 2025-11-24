# Python imports
import csv
import io
import logging

# Third party imports
from celery import shared_task

# Django imports
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.db.models import Q, Case, Value, When
from django.db import models
from django.db.models.functions import Concat

# Module imports
from plane.db.models import Issue
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.analytics_plot import build_graph_plot
from plane.utils.exception_logger import log_exception
from plane.utils.issue_filters import issue_filters

row_mapping = {
    "state__name": "State",
    "state__group": "State Group",
    "labels__id": "Label",
    "assignees__id": "Assignee Name",
    "start_date": "Start Date",
    "target_date": "Due Date",
    "completed_at": "Completed At",
    "created_at": "Created At",
    "issue_count": "Issue Count",
    "priority": "Priority",
    "estimate": "Estimate",
    "issue_cycle__cycle_id": "Cycle",
    "issue_module__module_id": "Module",
}

ASSIGNEE_ID = "assignees__id"
LABEL_ID = "labels__id"
STATE_ID = "state_id"
CYCLE_ID = "issue_cycle__cycle_id"
MODULE_ID = "issue_module__module_id"


def send_export_email(email, slug, csv_buffer, rows):
    """Helper function to send export email."""
    subject = "Your Export is ready"
    html_content = render_to_string("emails/exports/analytics.html", {})
    text_content = strip_tags(html_content)

    csv_buffer.seek(0)

    (
        EMAIL_HOST,
        EMAIL_HOST_USER,
        EMAIL_HOST_PASSWORD,
        EMAIL_PORT,
        EMAIL_USE_TLS,
        EMAIL_USE_SSL,
        EMAIL_FROM,
    ) = get_email_configuration()

    connection = get_connection(
        host=EMAIL_HOST,
        port=int(EMAIL_PORT),
        username=EMAIL_HOST_USER,
        password=EMAIL_HOST_PASSWORD,
        use_tls=EMAIL_USE_TLS == "1",
        use_ssl=EMAIL_USE_SSL == "1",
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=EMAIL_FROM,
        to=[email],
        connection=connection,
    )
    msg.attach(f"{slug}-analytics.csv", csv_buffer.getvalue())
    msg.send(fail_silently=False)
    return


def get_assignee_details(slug, filters):
    """Fetch assignee details if required."""
    return (
        Issue.issue_objects.filter(
            Q(Q(assignees__avatar__isnull=False) | Q(assignees__avatar_asset__isnull=False)),
            workspace__slug=slug,
            **filters,
        )
        .annotate(
            assignees__avatar_url=Case(
                # If `avatar_asset` exists, use it to generate the asset URL
                When(
                    assignees__avatar_asset__isnull=False,
                    then=Concat(
                        Value("/api/assets/v2/static/"),
                        "assignees__avatar_asset",  # Assuming avatar_asset has an id or relevant field
                        Value("/"),
                    ),
                ),
                # If `avatar_asset` is None, fall back to using `avatar` field directly
                When(assignees__avatar_asset__isnull=True, then="assignees__avatar"),
                default=Value(None),
                output_field=models.CharField(),
            )
        )
        .distinct("assignees__id")
        .order_by("assignees__id")
        .values(
            "assignees__avatar_url",
            "assignees__display_name",
            "assignees__first_name",
            "assignees__last_name",
            "assignees__id",
        )
    )


def get_label_details(slug, filters):
    """Fetch label details if required"""
    return (
        Issue.objects.filter(
            workspace__slug=slug,
            **filters,
            labels__id__isnull=False,
            label_issue__deleted_at__isnull=True,
        )
        .distinct("labels__id")
        .order_by("labels__id")
        .values("labels__id", "labels__color", "labels__name")
    )


def get_state_details(slug, filters):
    return (
        Issue.issue_objects.filter(workspace__slug=slug, **filters)
        .distinct("state_id")
        .order_by("state_id")
        .values("state_id", "state__name", "state__color")
    )


def get_module_details(slug, filters):
    return (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            **filters,
            issue_module__module_id__isnull=False,
            issue_module__deleted_at__isnull=True,
        )
        .distinct("issue_module__module_id")
        .order_by("issue_module__module_id")
        .values("issue_module__module_id", "issue_module__module__name")
    )


def get_cycle_details(slug, filters):
    return (
        Issue.issue_objects.filter(
            workspace__slug=slug,
            **filters,
            issue_cycle__cycle_id__isnull=False,
            issue_cycle__deleted_at__isnull=True,
        )
        .distinct("issue_cycle__cycle_id")
        .order_by("issue_cycle__cycle_id")
        .values("issue_cycle__cycle_id", "issue_cycle__cycle__name")
    )


def generate_csv_from_rows(rows):
    """Generate CSV buffer from rows."""
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)
    [writer.writerow(row) for row in rows]
    return csv_buffer


def generate_segmented_rows(
    distribution,
    x_axis,
    y_axis,
    segment,
    key,
    assignee_details,
    label_details,
    state_details,
    cycle_details,
    module_details,
):
    segment_zero = list(set(item.get("segment") for sublist in distribution.values() for item in sublist))

    segmented = segment

    row_zero = [
        row_mapping.get(x_axis, "X-Axis"),
        row_mapping.get(y_axis, "Y-Axis"),
    ] + segment_zero

    rows = []
    for item, data in distribution.items():
        generated_row = [
            item,
            sum(obj.get(key) for obj in data if obj.get(key) is not None),
        ]

        for segment in segment_zero:
            value = next((x.get(key) for x in data if x.get("segment") == segment), "0")
            generated_row.append(value)

        if x_axis == ASSIGNEE_ID:
            assignee = next(
                (user for user in assignee_details if str(user[ASSIGNEE_ID]) == str(item)),
                None,
            )
            if assignee:
                generated_row[0] = f"{assignee['assignees__first_name']} {assignee['assignees__last_name']}"

        if x_axis == LABEL_ID:
            label = next((lab for lab in label_details if str(lab[LABEL_ID]) == str(item)), None)

            if label:
                generated_row[0] = f"{label['labels__name']}"

        if x_axis == STATE_ID:
            state = next((sta for sta in state_details if str(sta[STATE_ID]) == str(item)), None)

            if state:
                generated_row[0] = f"{state['state__name']}"

        if x_axis == CYCLE_ID:
            cycle = next((cyc for cyc in cycle_details if str(cyc[CYCLE_ID]) == str(item)), None)

            if cycle:
                generated_row[0] = f"{cycle['issue_cycle__cycle__name']}"

        if x_axis == MODULE_ID:
            module = next(
                (mod for mod in module_details if str(mod[MODULE_ID]) == str(item)),
                None,
            )

            if module:
                generated_row[0] = f"{module['issue_module__module__name']}"

        rows.append(tuple(generated_row))

    if segmented == ASSIGNEE_ID:
        for index, segm in enumerate(row_zero[2:]):
            assignee = next(
                (user for user in assignee_details if str(user[ASSIGNEE_ID]) == str(segm)),
                None,
            )
            if assignee:
                row_zero[index + 2] = f"{assignee['assignees__first_name']} {assignee['assignees__last_name']}"

    if segmented == LABEL_ID:
        for index, segm in enumerate(row_zero[2:]):
            label = next((lab for lab in label_details if str(lab[LABEL_ID]) == str(segm)), None)
            if label:
                row_zero[index + 2] = label["labels__name"]

    if segmented == STATE_ID:
        for index, segm in enumerate(row_zero[2:]):
            state = next((sta for sta in state_details if str(sta[STATE_ID]) == str(segm)), None)
            if state:
                row_zero[index + 2] = state["state__name"]

    if segmented == MODULE_ID:
        for index, segm in enumerate(row_zero[2:]):
            module = next((mod for mod in label_details if str(mod[MODULE_ID]) == str(segm)), None)
            if module:
                row_zero[index + 2] = module["issue_module__module__name"]

    if segmented == CYCLE_ID:
        for index, segm in enumerate(row_zero[2:]):
            cycle = next((cyc for cyc in cycle_details if str(cyc[CYCLE_ID]) == str(segm)), None)
            if cycle:
                row_zero[index + 2] = cycle["issue_cycle__cycle__name"]

    return [tuple(row_zero)] + rows


def generate_non_segmented_rows(
    distribution,
    x_axis,
    y_axis,
    key,
    assignee_details,
    label_details,
    state_details,
    cycle_details,
    module_details,
):
    rows = []
    for item, data in distribution.items():
        row = [item, data[0].get("count" if y_axis == "issue_count" else "estimate")]

        if x_axis == ASSIGNEE_ID:
            assignee = next(
                (user for user in assignee_details if str(user[ASSIGNEE_ID]) == str(item)),
                None,
            )
            if assignee:
                row[0] = f"{assignee['assignees__first_name']} {assignee['assignees__last_name']}"

        if x_axis == LABEL_ID:
            label = next((lab for lab in label_details if str(lab[LABEL_ID]) == str(item)), None)

            if label:
                row[0] = f"{label['labels__name']}"

        if x_axis == STATE_ID:
            state = next((sta for sta in state_details if str(sta[STATE_ID]) == str(item)), None)

            if state:
                row[0] = f"{state['state__name']}"

        if x_axis == CYCLE_ID:
            cycle = next((cyc for cyc in cycle_details if str(cyc[CYCLE_ID]) == str(item)), None)

            if cycle:
                row[0] = f"{cycle['issue_cycle__cycle__name']}"

        if x_axis == MODULE_ID:
            module = next(
                (mod for mod in module_details if str(mod[MODULE_ID]) == str(item)),
                None,
            )

            if module:
                row[0] = f"{module['issue_module__module__name']}"

        rows.append(tuple(row))

    row_zero = [row_mapping.get(x_axis, "X-Axis"), row_mapping.get(y_axis, "Y-Axis")]
    return [tuple(row_zero)] + rows


@shared_task
def analytic_export_task(email, data, slug):
    try:
        filters = issue_filters(data, "POST")
        queryset = Issue.issue_objects.filter(**filters, workspace__slug=slug)

        x_axis = data.get("x_axis", False)
        y_axis = data.get("y_axis", False)
        segment = data.get("segment", False)

        distribution = build_graph_plot(queryset, x_axis=x_axis, y_axis=y_axis, segment=segment)
        key = "count" if y_axis == "issue_count" else "estimate"

        assignee_details = (
            get_assignee_details(slug, filters) if x_axis == ASSIGNEE_ID or segment == ASSIGNEE_ID else {}
        )

        label_details = get_label_details(slug, filters) if x_axis == LABEL_ID or segment == LABEL_ID else {}

        state_details = get_state_details(slug, filters) if x_axis == STATE_ID or segment == STATE_ID else {}

        cycle_details = get_cycle_details(slug, filters) if x_axis == CYCLE_ID or segment == CYCLE_ID else {}

        module_details = get_module_details(slug, filters) if x_axis == MODULE_ID or segment == MODULE_ID else {}

        if segment:
            rows = generate_segmented_rows(
                distribution,
                x_axis,
                y_axis,
                segment,
                key,
                assignee_details,
                label_details,
                state_details,
                cycle_details,
                module_details,
            )
        else:
            rows = generate_non_segmented_rows(
                distribution,
                x_axis,
                y_axis,
                key,
                assignee_details,
                label_details,
                state_details,
                cycle_details,
                module_details,
            )

        csv_buffer = generate_csv_from_rows(rows)
        send_export_email(email, slug, csv_buffer, rows)
        logging.getLogger("plane.worker").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def export_analytics_to_csv_email(data, headers, keys, email, slug):
    try:
        """
        Prepares a CSV from data and sends it as an email attachment.

        Parameters:
        - data: List of dictionaries (e.g. from .values())
        - headers: List of CSV column headers
        - keys: Keys to extract from each data item (dict)
        - email: Email address to send to
        - slug: Used for the filename
        """
        # Prepare rows: header + data rows
        rows = [headers]
        for item in data:
            row = [item.get(key, "") for key in keys]
            rows.append(row)

        # Generate CSV buffer
        csv_buffer = generate_csv_from_rows(rows)

        # Send email with CSV attachment
        send_export_email(email=email, slug=slug, csv_buffer=csv_buffer, rows=rows)
    except Exception as e:
        log_exception(e)
        return
