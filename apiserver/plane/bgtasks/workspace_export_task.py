# Python imports
import io
import json
import logging
import zipfile

# Third party imports
import boto3
from botocore.client import Config
from celery import shared_task

# Django imports
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.serializers.json import DjangoJSONEncoder
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

# Module imports
from plane.db.models import (
    APIToken,
    CommentReaction,
    Cycle,
    CycleFavorite,
    CycleIssue,
    CycleUserProperties,
    Estimate,
    EstimatePoint,
    FileAsset,
    Inbox,
    InboxIssue,
    Issue,
    IssueActivity,
    IssueAssignee,
    IssueAttachment,
    IssueComment,
    IssueLabel,
    IssueLink,
    IssueMention,
    IssueProperty,
    IssueReaction,
    IssueRelation,
    IssueSequence,
    IssueSubscriber,
    IssueView,
    IssueViewFavorite,
    IssueVote,
    Label,
    Module,
    ModuleFavorite,
    ModuleIssue,
    ModuleLink,
    ModuleMember,
    ModuleUserProperties,
    Notification,
    Page,
    PageFavorite,
    PageLabel,
    PageLog,
    Project,
    ProjectDeployBoard,
    ProjectFavorite,
    ProjectIdentifier,
    ProjectMember,
    ProjectMemberInvite,
    ProjectPublicMember,
    State,
    User,
    UserNotificationPreference,
    Webhook,
    Workspace,
    WorkspaceMember,
    WorkspaceMemberInvite,
    WorkspaceTheme,
    WorkspaceUserProperties,
)
from plane.license.utils.instance_value import get_email_configuration
from plane.utils.exception_logger import log_exception


def create_zip_file(files):
    # Create zip
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file in files:
            filename = file.get("filename")
            file_content = file.get("data")
            zipf.writestr(filename, file_content)

    zip_buffer.seek(0)
    return zip_buffer


def upload_to_s3(zip_file, workspace_id, slug):
    # Upload the zip to s3
    file_name = f"{workspace_id}/export-{slug}-{timezone.now()}.zip"
    expires_in = 7 * 24 * 60 * 60

    if settings.USE_MINIO:
        s3 = boto3.client(
            "s3",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        s3.upload_fileobj(
            zip_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ACL": "public-read", "ContentType": "application/zip"},
        )
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": file_name,
            },
            ExpiresIn=expires_in,
        )
        # Create the new url with updated domain and protocol
        presigned_url = presigned_url.replace(
            f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/",
            f"{settings.AWS_S3_URL_PROTOCOL}//{settings.AWS_S3_CUSTOM_DOMAIN}/",
        )
    else:
        s3 = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        s3.upload_fileobj(
            zip_file,
            settings.AWS_STORAGE_BUCKET_NAME,
            file_name,
            ExtraArgs={"ACL": "public-read", "ContentType": "application/zip"},
        )

        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": file_name,
            },
            ExpiresIn=expires_in,
        )

    return presigned_url


@shared_task
def workspace_export(workspace_id, email):
    # Get the workspace
    workspace = Workspace.objects.get(pk=workspace_id)
    slug = workspace.slug
    # Store all files
    files = []

    # Users that need to be exported
    emails = WorkspaceMember.objects.filter(
        workspace_id=workspace_id
    ).values_list("member__email", flat=True)
    users = User.objects.filter(email__in=emails).values()

    users_json = json.dumps(list(users), cls=DjangoJSONEncoder)
    files.append({"filename": "users.json", "data": users_json})

    workspace = list(Workspace.objects.filter(pk=workspace_id).values())
    workspace_json = json.dumps(workspace, cls=DjangoJSONEncoder)
    files.append({"filename": "workspaces.json", "data": workspace_json})

    models = {
        # Workspace
        WorkspaceMemberInvite: "workspace_member_invites.json",
        WorkspaceMember: "workspace_members.json",
        WorkspaceTheme: "workspace_themes.json",
        WorkspaceUserProperties: "workspace_user_properties.json",
        # Projects
        Project: "projects.json",
        ProjectDeployBoard: "project_deploy_boards.json",
        ProjectFavorite: "project_favorites.json",
        ProjectIdentifier: "project_identifier.json",
        ProjectMember: "project_members.json",
        ProjectMemberInvite: "project_member_invites.json",
        ProjectPublicMember: "project_public_members.json",
        # APIToken
        APIToken: "api_tokens.json",
        # Assets
        FileAsset: "file_assets.json",
        # States
        State: "states.json",
        # Issues
        Issue: "issues.json",
        IssueAssignee: "issue_assignees.json",
        Label: "labels.json",
        IssueLabel: "issue_labels.json",
        IssueLink: "issue_links.json",
        IssueMention: "issue_mention.json",
        IssueVote: "issue_votes.json",
        IssueSubscriber: "issue_subscribers.json",
        IssueProperty: "issue_properties.json",
        IssueSequence: "issue_sequences.json",
        IssueReaction: "issue_reactions.json",
        IssueRelation: "issue_relations.json",
        IssueAttachment: "issue_attachments.json",
        IssueActivity: "issue_activities.json",
        CommentReaction: "comment_reactions.json",
        IssueComment: "issue_comments.json",
        # Cycles
        Cycle: "cycles.json",
        CycleIssue: "cycle_issues.json",
        CycleFavorite: "cycle_favorites.json",
        CycleUserProperties: "cycle_user_properties.json",
        # Modules
        Module: "modules.json",
        ModuleIssue: "module_issues.json",
        ModuleFavorite: "module_favorites.json",
        ModuleLink: "module_links.json",
        ModuleMember: "module_members.json",
        ModuleUserProperties: "module_user_properties.json",
        # Page
        Page: "pages.json",
        PageLog: "page_logs.json",
        PageLabel: "page_labels.json",
        PageFavorite: "page_favorites.json",
        # Estimate
        Estimate: "estimates.json",
        EstimatePoint: "estimate_points.json",
        # Webhook
        Webhook: "webhooks.json",
        # Views
        IssueView: "views.json",
        IssueViewFavorite: "view_favorites.json",
        # Notification
        Notification: "notifications.json",
        UserNotificationPreference: "user_notification_preferences.json",
        # Inbox
        Inbox: "inboxes.json",
        InboxIssue: "inbox_issues.json",
    }

    # Loop through the models
    for model in models:
        file_name = models[model]
        files.append(
            {
                "filename": file_name,
                "data": json.dumps(
                    list(
                        model.objects.filter(
                            workspace_id=workspace_id
                        ).values()
                    ),
                    cls=DjangoJSONEncoder,
                ),
            }
        )

    # Create zip
    zip_buffer = create_zip_file(files)

    # Get the presigned url
    url = upload_to_s3(
        workspace_id=workspace_id, slug=slug, zip_file=zip_buffer
    )

    # Send mail
    try:
        (
            EMAIL_HOST,
            EMAIL_HOST_USER,
            EMAIL_HOST_PASSWORD,
            EMAIL_PORT,
            EMAIL_USE_TLS,
            EMAIL_FROM,
        ) = get_email_configuration()

        # Send the mail
        subject = "Your Plane Export Link"
        context = {"url": url, "email": email}

        html_content = render_to_string(
            "emails/exports/workspace_exports.html", context
        )
        text_content = strip_tags(html_content)

        connection = get_connection(
            host=EMAIL_HOST,
            port=int(EMAIL_PORT),
            username=EMAIL_HOST_USER,
            password=EMAIL_HOST_PASSWORD,
            use_tls=EMAIL_USE_TLS == "1",
        )

        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=EMAIL_FROM,
            to=[email],
            connection=connection,
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logging.getLogger("plane").info("Email sent successfully.")
        return
    except Exception as e:
        log_exception(e)
        return
