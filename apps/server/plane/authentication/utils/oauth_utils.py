def is_pkce_required(client_id: str) -> bool:
    from plane.authentication.models import Application

    if Application.objects.filter(
        client_id=client_id, client_type=Application.CLIENT_PUBLIC
    ).exists():
        return True
    return False


def update_bot_user_type(
    application_model=None,
    workspace_app_installation_model=None,
):
    """
    This function updates the bot user type for all app installations,
    based on the application is_mentionable field.
    """
    from django.db import transaction

    from plane.db.models.user import BotTypeEnum

    if not application_model:
        from plane.authentication.models import Application

        application_model = Application
    if not workspace_app_installation_model:
        from plane.authentication.models import WorkspaceAppInstallation

        workspace_app_installation_model = WorkspaceAppInstallation

    with transaction.atomic():
        for application in application_model.objects.all():
            workspace_app_installations = (
                workspace_app_installation_model.objects.filter(application=application)
            )
            for workspace_app_installation in workspace_app_installations:
                bot_user = workspace_app_installation.app_bot
                if bot_user:
                    bot_user.bot_type = (
                        BotTypeEnum.APP_BOT.value
                        if application.is_mentionable
                        else None
                    )
                    bot_user.save()


def add_app_bots_to_existing_projects(
    workspace_app_installation_model=None, project_model=None, project_member_model=None
):
    from django.db import transaction

    from plane.app.permissions.base import ROLE

    if not workspace_app_installation_model:
        from plane.authentication.models import WorkspaceAppInstallation

        workspace_app_installation_model = WorkspaceAppInstallation
    if not project_model:
        from plane.db.models.project import Project

        project_model = Project
    if not project_member_model:
        from plane.db.models.project import ProjectMember

        project_member_model = ProjectMember

    with transaction.atomic():
        installations = workspace_app_installation_model.objects.filter(
            status="installed",
            deleted_at__isnull=True,
        )
        for installation in installations:
            bot_user = installation.app_bot

            existing_project_ids = project_member_model.objects.filter(
                workspace=installation.workspace,
                member=bot_user,
                deleted_at__isnull=True,
            ).values_list("project_id", flat=True)

            missing_projects = (
                project_model.objects.filter(
                    workspace=installation.workspace,
                    deleted_at__isnull=True,
                )
                .exclude(id__in=existing_project_ids)
                .values_list("id", flat=True)
            )

            # let's bulk create project members
            project_members = []
            for project_id in missing_projects:
                project_members.append(
                    project_member_model(
                        project_id=project_id,
                        workspace=installation.workspace,
                        member=installation.app_bot,
                        role=ROLE.MEMBER.value,
                    )
                )
            project_member_model.objects.bulk_create(
                project_members, ignore_conflicts=True
            )
