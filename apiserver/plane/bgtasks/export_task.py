# Python imports
import csv
import io
import json
import zipfile

import boto3
from botocore.client import Config

# Third party imports
from celery import shared_task


# Django imports
from django.conf import settings
from django.utils import timezone
from openpyxl import Workbook
from django.db.models import Value
from django.db.models.functions import Coalesce
from django.db.models import Q
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import OuterRef, Func, F, Count
from django.db.models.functions import Concat
from django.db import models


# Module imports
from plane.db.models import ExporterHistory, Issue, FileAsset
from plane.utils.exception_logger import log_exception


def dateTimeConverter(time):
    if time:
        return time.strftime("%a, %d %b %Y %I:%M:%S %Z%z")


def dateConverter(time):
    if time:
        return time.strftime("%a, %d %b %Y")


def create_csv_file(data):
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

    for row in data:
        csv_writer.writerow(row)

    csv_buffer.seek(0)
    return csv_buffer.getvalue()


def create_json_file(data):
    return json.dumps(data)


def create_xlsx_file(data):
    workbook = Workbook()
    sheet = workbook.active

    for row in data:
        sheet.append(row)

    xlsx_buffer = io.BytesIO()
    workbook.save(xlsx_buffer)
    xlsx_buffer.seek(0)
    return xlsx_buffer.getvalue()


def create_zip_file(files):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for filename, file_content in files:
            zipf.writestr(filename, file_content)

    zip_buffer.seek(0)
    return zip_buffer


def upload_to_s3(zip_file, workspace_id, token_id, slug):
    file_name = (
        f"{workspace_id}/export-{slug}-{token_id[:6]}-{str(timezone.now().date())}.zip"
    )
    expires_in = 7 * 24 * 60 * 60

    if settings.USE_MINIO:
        upload_s3 = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        upload_s3.upload_fileobj(
            zip_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ACL": "public-read", "ContentType": "application/zip"},
        )

        # Generate presigned url for the uploaded file with different base
        presign_s3 = boto3.client(
            "s3",
            endpoint_url=f"{settings.AWS_S3_URL_PROTOCOL}//{str(settings.AWS_S3_CUSTOM_DOMAIN).replace('/uploads', '')}/",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )

        presigned_url = presign_s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": file_name},
            ExpiresIn=expires_in,
        )
    else:
        # If endpoint url is present, use it
        if settings.AWS_S3_ENDPOINT_URL:
            s3 = boto3.client(
                "s3",
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
            )
        else:
            s3 = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
            )

        # Upload the file to S3
        s3.upload_fileobj(
            zip_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ContentType": "application/zip"},
        )

        # Generate presigned url for the uploaded file
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.AWS_STORAGE_BUCKET_NAME, "Key": file_name},
            ExpiresIn=expires_in,
        )

    exporter_instance = ExporterHistory.objects.get(token=token_id)

    # Update the exporter instance with the presigned url
    if presigned_url:
        exporter_instance.url = presigned_url
        exporter_instance.status = "completed"
        exporter_instance.key = file_name
    else:
        exporter_instance.status = "failed"

    exporter_instance.save(update_fields=["status", "url", "key"])


def generate_table_row(issue):
    return [
        f"""{issue["project_identifier"]}-{issue["sequence_id"]}""",
        issue["project_name"],
        issue["name"],
        issue["description"],
        issue["state_name"],
        dateConverter(issue["start_date"]),
        dateConverter(issue["target_date"]),
        issue["priority"],
        issue["created_by"],
        ", ".join(issue["labels"]) if issue["labels"] else "",
        issue.get("cycle_name", ""),
        issue.get("cycle_start_date", ""),
        issue.get("cycle_end_date", ""),
        ", ".join(issue.get("module_name", "")) if issue.get("module_name") else "",
        dateTimeConverter(issue["created_at"]),
        dateTimeConverter(issue["updated_at"]),
        dateTimeConverter(issue["completed_at"]),
        dateTimeConverter(issue["archived_at"]),
        ", ".join(
            [
                f"{comment['comment']} ({comment['created_at']} by {comment['created_by']})"
                for comment in issue["comments"]
            ]
        )
        if issue["comments"]
        else "",
        issue["estimate"] if issue["estimate"] else "",
        ", ".join(issue["link"]) if issue["link"] else "",
        ", ".join(issue["assignees"]) if issue["assignees"] else "",
        issue["attachment_count"] if issue["attachment_count"] else "",
        ", ".join(issue["attachment_links"]) if issue["attachment_links"] else "",
    ]


def generate_json_row(issue):
    return {
        "ID": f"""{issue["project_identifier"]}-{issue["sequence_id"]}""",
        "Project": issue["project_name"],
        "Name": issue["name"],
        "Description": issue["description"],
        "State": issue["state_name"],
        "Start Date": dateConverter(issue["start_date"]),
        "Target Date": dateConverter(issue["target_date"]),
        "Priority": issue["priority"],
        "Created By": (f"{issue['created_by']}" if issue["created_by"] else ""),
        "Assignee": issue["assignees"],
        "Labels": issue["labels"],
        "Cycle Name": issue["cycle_name"],
        "Cycle Start Date": issue["cycle_start_date"],
        "Cycle End Date": issue["cycle_end_date"],
        "Module Name": issue["module_name"],
        "Created At": dateTimeConverter(issue["created_at"]),
        "Updated At": dateTimeConverter(issue["updated_at"]),
        "Completed At": dateTimeConverter(issue["completed_at"]),
        "Archived At": dateTimeConverter(issue["archived_at"]),
        "Comments": issue["comments"],
        "Estimate": issue["estimate"],
        "Link": issue["link"],
        "Subscribers Count": issue["subscribers_count"],
        "Attachment Count": issue["attachment_count"],
        "Attachment Links": issue["attachment_links"],
    }


def update_json_row(rows, row):
    matched_index = next(
        (
            index
            for index, existing_row in enumerate(rows)
            if existing_row["ID"] == row["ID"]
        ),
        None,
    )

    if matched_index is not None:
        existing_assignees, existing_labels = (
            rows[matched_index]["Assignee"],
            rows[matched_index]["Labels"],
        )
        assignee, label = row["Assignee"], row["Labels"]

        if assignee is not None and (
            existing_assignees is None or label not in existing_assignees
        ):
            rows[matched_index]["Assignee"] += f", {assignee}"
        if label is not None and (
            existing_labels is None or label not in existing_labels
        ):
            rows[matched_index]["Labels"] += f", {label}"
    else:
        rows.append(row)


def update_table_row(rows, row):
    matched_index = next(
        (index for index, existing_row in enumerate(rows) if existing_row[0] == row[0]),
        None,
    )

    if matched_index is not None:
        existing_assignees, existing_labels = rows[matched_index][7:9]
        assignee, label = row[7:9]

        if assignee is not None and (
            existing_assignees is None or label not in existing_assignees
        ):
            rows[matched_index][8] += f", {assignee}"
        if label is not None and (
            existing_labels is None or label not in existing_labels
        ):
            rows[matched_index][8] += f", {label}"
    else:
        rows.append(row)


def generate_csv(header, project_id, issues, files):
    """
    Generate CSV export for all the passed issues.
    """
    rows = [header]
    for issue in issues:
        row = generate_table_row(issue)
        update_table_row(rows, row)
    csv_file = create_csv_file(rows)
    files.append((f"{project_id}.csv", csv_file))


def generate_json(header, project_id, issues, files):
    rows = []
    for issue in issues:
        row = generate_json_row(issue)
        update_json_row(rows, row)
    json_file = create_json_file(rows)
    files.append((f"{project_id}.json", json_file))


def generate_xlsx(header, project_id, issues, files):
    rows = [header]
    for issue in issues:
        print(issue, "Issue from xlsx")
        row = generate_table_row(issue)
        print(row, "Row")
        update_table_row(rows, row)
    xlsx_file = create_xlsx_file(rows)
    files.append((f"{project_id}.xlsx", xlsx_file))


@shared_task
def issue_export_task(provider, workspace_id, project_ids, token_id, multiple, slug):
    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        workspace_issues = (
            Issue.objects.filter(
                workspace__id=workspace_id,
                project_id__in=project_ids,
                project__project_projectmember__member=exporter_instance.initiated_by_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related(
                "project",
                "workspace",
                "state",
                "parent",
                "created_by",
                "estimate_point",
            )
            .prefetch_related(
                "labels",
                "issue_cycle__cycle",
                "issue_module__module",
                "issue_comments",
                "assignees",
                "issue_subscribers",
                "issue_link",
            )
        )

        issues_data = []

        for issue in workspace_issues:
            issue_data = {
                "id": issue.id,
                "project_identifier": issue.project.identifier,
                "project_name": issue.project.name,
                "project_id": issue.project.id,
                "sequence_id": issue.sequence_id,
                "name": issue.name,
                "description": issue.description_stripped,
                "priority": issue.priority,
                "start_date": issue.start_date,
                "target_date": issue.target_date,
                "state_name": issue.state.name if issue.state else None,
                "created_at": issue.created_at,
                "updated_at": issue.updated_at,
                "completed_at": issue.completed_at,
                "archived_at": issue.archived_at,
                "module_name": [
                    module.module.name for module in issue.issue_module.all()
                ]
                if issue.issue_module.exists()
                else None,
                "created_by": f"{issue.created_by.first_name} {issue.created_by.last_name}",
                "labels": [
                    label.name
                    for label in issue.labels.all().distinct()
                    if issue.labels.exists()
                ],
                "comments": [
                    {
                        "comment": comment.comment_stripped,
                        "created_at": dateConverter(comment.created_at),
                        "created_by": f"{comment.created_by.first_name} {comment.created_by.last_name}",
                    }
                    for comment in issue.issue_comments.all().distinct()
                ]
                if issue.issue_comments.exists()
                else None,
                "estimate": issue.estimate_point.estimate.name
                if issue.estimate_point
                else "",
                "link": [
                    link.url
                    for link in issue.issue_link.all().distinct()
                    if issue.issue_link.exists()
                ],
                "assignees": [
                    f"{assignee.first_name} {assignee.last_name}"
                    for assignee in issue.assignees.all().distinct()
                ]
                if issue.assignees.exists()
                else None,
                "subscribers_count": issue.issue_subscribers.count(),
                "attachment_count": FileAsset.objects.filter(
                    issue_id=issue.id,
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                ).count(),
                "attachment_links": [
                    f"/api/assets/v2/workspaces/{issue.workspace.slug}/projects/{issue.project_id}/issues/{issue.id}/attachments/{asset.id}/"
                    for asset in FileAsset.objects.filter(
                        issue_id=issue.id,
                        entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                    )
                ],
            }

            # Get prefetched cycles and modules
            cycles = list(issue.issue_cycle.all())

            # Update cycle data
            for cycle in cycles:
                issue_data["cycle_name"] = cycle.cycle.name
                issue_data["cycle_start_date"] = dateConverter(cycle.cycle.start_date)
                issue_data["cycle_end_date"] = dateConverter(cycle.cycle.end_date)

            issues_data.append(issue_data)

            # CSV header
        header = [
            "ID",
            "Project",
            "Name",
            "Description",
            "State",
            "Start Date",
            "Target Date",
            "Priority",
            "Created By",
            "Labels",
            "Cycle Name",
            "Cycle Start Date",
            "Cycle End Date",
            "Module Name",
            "Created At",
            "Updated At",
            "Completed At",
            "Archived At",
            "Comments",
            "Estimate",
            "Link",
            "Assignees",
            "Subscribers Count",
            "Attachment Count",
            "Attachment Links",
        ]

        EXPORTER_MAPPER = {
            "csv": generate_csv,
            "json": generate_json,
            "xlsx": generate_xlsx,
        }

        files = []
        if multiple:
            for project_id in project_ids:
                issues = issues_data.filter(project__id=project_id)
                exporter = EXPORTER_MAPPER.get(provider)
                if exporter is not None:
                    exporter(header, project_id, issues, files)

        else:
            exporter = EXPORTER_MAPPER.get(provider)
            if exporter is not None:
                exporter(header, workspace_id, issues_data, files)

        zip_buffer = create_zip_file(files)
        upload_to_s3(zip_buffer, workspace_id, token_id, slug)

    except Exception as e:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "failed"
        exporter_instance.reason = str(e)
        exporter_instance.save(update_fields=["status", "reason"])
        log_exception(e)
        return
