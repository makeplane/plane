# Python imports
import csv
import io
import boto3
from botocore.client import Config
from io import BytesIO

# Third party imports
from celery import shared_task

# Django imports
from django.conf import settings
from openpyxl import Workbook

# Module imports
from plane.db.models import ExporterHistory
from plane.ee.models import IssueWorkLog
from plane.utils.exception_logger import log_exception


def dateTimeConverter(time):
    if time:
        return time.strftime("%a, %d %b %Y %I:%M:%S %Z%z")


def dateConverter(time):
    if time:
        return time.strftime("%a, %d %b %Y")


def create_csv_file(data):
    # Create a StringIO buffer and write CSV data to it
    csv_buffer = io.StringIO()
    csv_writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)

    for row in data:
        csv_writer.writerow(row)

    csv_buffer.seek(0)

    # Convert the StringIO buffer to BytesIO
    bytes_csv_buffer = io.BytesIO(csv_buffer.getvalue().encode("utf-8"))
    bytes_csv_buffer.seek(0)
    return bytes_csv_buffer


def create_xlsx_file(data):
    # Create a BytesIO buffer and write XLSX data to it
    xlsx_buffer = io.BytesIO()
    workbook = Workbook()
    sheet = workbook.active

    for row in data:
        sheet.append(row)

    workbook.save(xlsx_buffer)
    xlsx_buffer.seek(0)
    return xlsx_buffer


def upload_to_s3(files, workspace_id, token_id, slug, provider):
    expires_in = 7 * 24 * 60 * 60
    file_name, file_obj = files[0]
    file_obj = BytesIO(file_obj.read())

    if settings.USE_MINIO:
        upload_s3 = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        upload_s3.upload_fileobj(
            file_obj,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ContentType": f"application/{provider}"},
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
            file_obj,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ContentType": f"application/{provider}"},
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


def generate_table_row(worklog):
    return [
        worklog["project__name"],
        (
            f"{worklog['project__identifier']} {worklog['issue__sequence_id']} {worklog['issue__name']}"
        ),
        (
            f"{worklog['logged_by__first_name']} {worklog['logged_by__last_name']}"
            if worklog["logged_by__first_name"] and worklog["logged_by__last_name"]
            else ""
        ),
        dateConverter(worklog["created_at"]),
        worklog["duration"],
        worklog["description"],
    ]


def update_table_row(rows, row):
    rows.append(row)


def generate_csv(header, workspace_id, worklogs, files):
    """
    Generate CSV export for all the passed issues.
    """
    rows = [header]
    for worklog in worklogs:
        row = generate_table_row(worklog)

        update_table_row(rows, row)
    csv_file = create_csv_file(rows)
    files.append((f"{workspace_id}.csv", csv_file))


def generate_xlsx(header, workspace_id, worklogs, files):
    rows = [header]
    for worklog in worklogs:
        row = generate_table_row(worklog)
        update_table_row(rows, row)
    xlsx_file = create_xlsx_file(rows)
    files.append((f"{workspace_id}.xlsx", xlsx_file))


@shared_task
def worklogs_export_task(provider, workspace_id, user_id, token_id, slug, filters):
    try:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "processing"
        exporter_instance.save(update_fields=["status"])

        worklogs = (
            IssueWorkLog.objects.filter(
                project__project_projectmember__member_id=user_id,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .filter(**filters)
            .order_by("created_at")
            .select_related("logged_by", "issue", "project", "workspace")
            .values(
                "id",
                "duration",
                "description",
                "project",
                "workspace",
                "logged_by__first_name",
                "logged_by__last_name",
                "issue__name",
                "issue__sequence_id",
                "project__identifier",
                "created_at",
                "project__name",
            )
            .order_by("project__identifier", "issue__sequence_id")
            .distinct()
        )

        # CSV header
        header = [
            "Project",
            "Issue",
            "Logged by",
            "Logged On",
            "Duration",
            "Description",
        ]

        EXPORTER_MAPPER = {"csv": generate_csv, "xlsx": generate_xlsx}

        files = []
        exporter = EXPORTER_MAPPER.get(provider)
        if exporter is not None:
            exporter(header, workspace_id, worklogs, files)

        upload_to_s3(files, workspace_id, token_id, slug, provider)

    except Exception as e:
        exporter_instance = ExporterHistory.objects.get(token=token_id)
        exporter_instance.status = "failed"
        exporter_instance.reason = str(e)
        exporter_instance.save(update_fields=["status", "reason"])
        log_exception(e)
        return
