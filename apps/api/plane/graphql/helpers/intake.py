# Python imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q
from django.utils import timezone

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import Intake, IntakeIssue, Project
from plane.ee.models import IntakeSetting
from plane.graphql.types.intake.base import IntakeSettingsType, IntakeWorkItemStatusType


# ====== check if the intake is enabled for the project ======
def is_project_intakes_enabled(
    workspace_slug: str, project_id: str, raise_exception: bool = True
):
    try:
        project = Project.objects.filter(
            workspace__slug=workspace_slug, id=project_id
        ).first()

        if not project.intake_view:
            if raise_exception:
                message = "Project intakes are not enabled"
                error_extensions = {"code": "INTAKE_NOT_ENABLED", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return project.intake_view
    except Project.DoesNotExist:
        if raise_exception:
            message = "Project not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return False
    except Exception as e:
        if raise_exception:
            message = e.message or "Error checking if project intakes are enabled"
            error_extensions = e.extensions or {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def is_project_intakes_enabled_async(
    workspace_slug: str, project_id: str, raise_exception: bool = True
):
    return is_project_intakes_enabled(
        workspace_slug=workspace_slug,
        project_id=project_id,
        raise_exception=raise_exception,
    )


# ====== check if the intake is enabled for the project with settings ======
def project_intakes_settings(
    workspace_slug: str, project_id: str, raise_exception: bool = True
):
    try:
        intake = get_intake(workspace_slug=workspace_slug, project_id=project_id)
        intake_id = intake.id

        project_intake_settings = IntakeSetting.objects.filter(
            workspace__slug=workspace_slug, project_id=project_id, intake_id=intake_id
        ).first()

        if not project_intake_settings:
            if raise_exception:
                message = "Intake in app is not enabled"
                error_extensions = {
                    "code": "INTAKE_IN_APP_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)
            return None
        return project_intake_settings
    except IntakeSetting.DoesNotExist:
        if raise_exception:
            message = "Intake setting not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return None
    except Exception as e:
        if raise_exception:
            message = e.message or "Error checking if project intakes are enabled"
            error_extensions = e.extensions or {
                "code": "SOMETHING_WENT_WRONG",
                "statusCode": 400,
            }
            raise GraphQLError(message, extensions=error_extensions)
        return None


@sync_to_async
def project_intakes_settings_async(
    workspace_slug: str, project_id: str, raise_exception: bool = True
):
    return project_intakes_settings(
        workspace_slug=workspace_slug,
        project_id=project_id,
        raise_exception=raise_exception,
    )


# ====== check if the project settings are enabled by settings key ======
def is_project_settings_enabled_by_settings_key(
    workspace_slug: str,
    project_id: str,
    raise_exception: bool = True,
    settings_key: Optional[IntakeSettingsType] = IntakeSettingsType.IN_APP,
):
    project_intake_settings = project_intakes_settings(
        workspace_slug=workspace_slug,
        project_id=project_id,
        raise_exception=raise_exception,
    )
    if project_intake_settings is None:
        return False

    return getattr(project_intake_settings, settings_key.value)


@sync_to_async
def is_project_settings_enabled_by_settings_key_async(
    workspace_slug: str,
    project_id: str,
    raise_exception: bool = True,
    settings_key: Optional[IntakeSettingsType] = IntakeSettingsType.IN_APP,
):
    return is_project_settings_enabled_by_settings_key(
        workspace_slug=workspace_slug,
        project_id=project_id,
        settings_key=settings_key,
        raise_exception=raise_exception,
    )


# ====== get the intake ======
def get_intake(workspace_slug: str, project_id: str):
    try:
        project_intake = Intake.objects.filter(
            workspace__slug=workspace_slug, project_id=project_id
        ).first()
        if project_intake is None:
            message = "Intake not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return project_intake
    except Intake.DoesNotExist:
        message = "Intake not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_intake_async(workspace_slug: str, project_id: str):
    return get_intake(workspace_slug=workspace_slug, project_id=project_id)


# ====== get the intake work item base query ======
def intake_work_item_base_query(
    workspace_slug: str, project_id: str, user_id: Optional[str] = None
):
    try:
        intake = get_intake(workspace_slug=workspace_slug, project_id=project_id)
        intake_id = intake.id

        intake_work_item_base_query = IntakeIssue.objects.filter(
            workspace__slug=workspace_slug,
            project_id=project_id,
            intake_id=intake_id,
        )

        # INFO: when user_id is provided, we filter the intake work items by the user id
        if user_id:
            intake_work_item_base_query = intake_work_item_base_query.filter(
                created_by_id=user_id
            )

        return intake_work_item_base_query
    except Exception:
        message = "Error getting intake work item base query"
        error_extensions = {
            "code": "SOMETHING_WENT_WRONG",
            "statusCode": 400,
        }
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def intake_work_item_base_query_async(workspace_slug: str, project_id: str):
    return intake_work_item_base_query(
        workspace_slug=workspace_slug, project_id=project_id
    )


# ====== get the intake work items ======
def get_intake_work_items(
    workspace_slug: str,
    project_id: str,
    user_id: Optional[str] = None,
    filters: Optional[JSON] = {},
    orderBy: Optional[str] = "-created_at",
    is_snoozed_work_items_required: Optional[bool] = False,
):
    base_query = intake_work_item_base_query(
        workspace_slug=workspace_slug, project_id=project_id, user_id=user_id
    )

    if is_snoozed_work_items_required:
        base_query = base_query.filter(
            (
                Q(snoozed_till__gte=timezone.now())
                & Q(status=IntakeWorkItemStatusType.SNOOZED.value)
            )
            | Q(snoozed_till__isnull=True)
        )

    intakes = (
        base_query.filter(**filters)
        .select_related("workspace", "project", "issue")
        .order_by(orderBy, "-created_at")
        .distinct()
    )

    return list(intakes)


@sync_to_async
def get_intake_work_items_async(
    workspace_slug: str,
    project_id: str,
    user_id: Optional[str] = None,
    filters: Optional[JSON] = {},
    orderBy: Optional[str] = "-created_at",
    is_snoozed_work_items_required: Optional[bool] = False,
):
    return get_intake_work_items(
        workspace_slug=workspace_slug,
        project_id=project_id,
        user_id=user_id,
        filters=filters,
        orderBy=orderBy,
        is_snoozed_work_items_required=is_snoozed_work_items_required,
    )


# ====== get the intake work item ======
def get_intake_work_item(
    workspace_slug: str,
    project_id: str,
    intake_work_item_id: str,
    user_id: Optional[str] = None,
):
    base_query = intake_work_item_base_query(
        workspace_slug=workspace_slug, project_id=project_id, user_id=user_id
    )

    try:
        return base_query.get(id=intake_work_item_id)
    except IntakeIssue.DoesNotExist:
        message = "Intake work item not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_intake_work_item_async(
    workspace_slug: str,
    project_id: str,
    intake_work_item_id: str,
    user_id: Optional[str] = None,
):
    return get_intake_work_item(
        workspace_slug=workspace_slug,
        project_id=project_id,
        intake_work_item_id=intake_work_item_id,
        user_id=user_id,
    )
