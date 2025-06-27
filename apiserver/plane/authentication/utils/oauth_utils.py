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
