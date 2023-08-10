# Python imports
import csv
import io
import json
import boto3
import zipfile
from datetime import datetime, date

# Django imports
from django.conf import settings

# Third party imports
from celery import shared_task
from sentry_sdk import capture_exception
from botocore.client import Config
from openpyxl import Workbook
from openpyxl.styles import NamedStyle
from openpyxl.utils.datetime import to_excel

# Module imports
from plane.db.models import Issue, ExporterHistory, Project


# def format_datetime(dt):
#     if isinstance(dt, (datetime, datetime.date)):
#         return dt.strftime("%Y-%m-%d %H:%M:%S") if isinstance(dt, datetime) else dt.strftime("%Y-%m-%d")


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


def create_csv_file(data):
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

    for row in data:
        csv_writer.writerow(row)

    csv_buffer.seek(0)
    return csv_buffer.getvalue()


def create_json_file(data):
    return json.dumps(data, cls=DateTimeEncoder)


def create_xlsx_file(data):
    workbook = Workbook()
    sheet = workbook.active

    no_timezone_style = NamedStyle(name="no_timezone_style")
    no_timezone_style.number_format = "yyyy-mm-dd hh:mm:ss"

    for row in data:
        sheet.append(row)

    for column_cells in sheet.columns:
        for cell in column_cells:
            if isinstance(cell.value, datetime):
                cell.style = no_timezone_style
                cell.value = to_excel(cell.value.replace(tzinfo=None))

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


def upload_to_s3(zip_file, workspace_id, token_id):
    s3 = boto3.client(
        "s3",
        region_name="ap-south-1",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )
    file_name = f"{workspace_id}/issues-{datetime.now().date()}.zip"

    s3.upload_fileobj(
        zip_file,
        settings.AWS_S3_BUCKET_NAME,
        file_name,
        ExtraArgs={"ACL": "public-read", "ContentType": "application/zip"},
    )

    expires_in = 8 * 24 * 60 * 60
    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_S3_BUCKET_NAME, "Key": file_name},
        ExpiresIn=expires_in,
    )

    exporter_instance = ExporterHistory.objects.get(token=token_id)

    if presigned_url:
        exporter_instance.url = presigned_url
        exporter_instance.status = "completed"
    else:
        exporter_instance.status = "failed"

    exporter_instance.save(update_fields=["status","url"])

def generate_table_row(issue):
    (
        project_identifier,
        sequence_id,
        name,
        description,
        priority,
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
    return [
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
        created_at,
        updated_at,
        completed_at,
        archived_at,
    ]


def generate_json_row(issue):
    (
        project_identifier,
        sequence_id,
        name,
        description,
        priority,
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
    return {
        "ID": f"{project_identifier}-{sequence_id}",
        "Project": project_name,
        "Name": name,
        "Description": description,
        "State": state_name,
        "Priority": priority,
        "Created By": created_by_fullname,
        "Assignee": assignees_names,
        "Labels": labels_names,
        "Cycle Name": cycle_name,
        "Cycle Start Date": cycle_start_date,
        "Cycle End Date": cycle_end_date,
        "Module Name": module_name,
        "Module Start Date": module_start_date,
        "Module Target Date": module_target_date,
        "Created At": created_at,
        "Updated At": updated_at,
        "Completed At": completed_at,
        "Archived At": archived_at,
    }


def generate_csv(header, project_id, issues, files):
    rows = [header]
    for issue in issues:
        row = generate_table_row(issue)
        rows.append(row)
    project_name = Project.objects.get(id=project_id).name
    csv_file = create_csv_file(rows)
    files.append((f"{project_name}.csv", csv_file))


def generate_json(header, project_id, issues, files):
    rows = []
    for issue in issues:
        row = generate_json_row(issue)
        rows.append(row)
    project_name = Project.objects.get(id=project_id).name
    json_file = create_json_file(rows)
    files.append((f"{project_name}.json", json_file))


def generate_xlsx(header, project_id, issues, files):
    rows = [header]
    for issue in issues:
        row = generate_table_row(issue)
        rows.append(row)
    project_name = Project.objects.get(id=project_id).name
    xlsx_file = create_xlsx_file(rows)
    files.append((f"{project_name}.xlsx", xlsx_file))


@shared_task
def issue_export_task(provider, workspace_id, project_ids, token_id, multiple):
    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        issues = (
            Issue.objects.filter(workspace__id=workspace_id, project_id__in=project_ids)
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
            "ID",
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
            "Created At",
            "Updated At",
            "Completed At",
            "Archived At",
        ]

        EXPORTER_MAPPER = {
            "csv": generate_csv,
            "json": generate_json,
            "xlsx": generate_xlsx,
        }

        files = []
        if multiple == "True":
            for project_id in project_ids:
                issues = issues.filter(project__id=project_id)
                exporter = EXPORTER_MAPPER.get(provider)
                if exporter is not None:
                    exporter(
                        header,
                        project_id,
                        issues,
                        files,
                    )

        else:
            exporter = EXPORTER_MAPPER.get(provider)
            if exporter is not None:
                exporter(
                    header,
                    project_ids[0],
                    issues,
                    files,
                )

        zip_buffer = create_zip_file(files)
        upload_to_s3(zip_buffer, workspace_id, token_id)

    except Exception as e:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "failed"
        exporter_instance.reason = str(e)
        exporter_instance.save(update_fields=["status","reason"])

        # Print logs if in DEBUG mode
        if settings.DEBUG:
            print(e)
        capture_exception(e)
        return
