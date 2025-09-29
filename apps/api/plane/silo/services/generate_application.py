# Python imports
from logging import getLogger

# Django imports
from django.db import models, transaction

# Third Party imports
from oauth2_provider.generators import generate_client_secret

# Module imports
from plane.silo.utils.constants import APPLICATIONS
from plane.db.models import User
from plane.authentication.models import Application
from plane.silo.models.application_secret import ApplicationSecret
from plane.utils.encryption import encrypt

logger = getLogger("plane.silo.services.generate_application")


def generate_application(
    user_id: str,
    app_key: str,
    application_model: models.Model,
    application_secret_model: models.Model,
    user_model: models.Model,
) -> str:
    """
    Generate a new application for the user
    adds the application owner to the application
    and create a new application secret
    """

    # check if application secret already exists skip if it does
    if application_secret_model.objects.filter(key=f"x-{app_key}-id").exists():
        logger.info(f"Application for {app_key} already exists, skipping...")
        return None

    # check if app_key is in APPLICATIONS
    if app_key not in APPLICATIONS:
        raise KeyError(f"Application {app_key} not found")

    app_data = APPLICATIONS[app_key]
    app_slug = app_data["slug"]
    user = user_model.objects.get(id=user_id)

    webhook_url = app_data.get("webhook_url", None)

    with transaction.atomic():
        client_secret = generate_client_secret()

        application_data = {
            "name": app_data["name"],
            "slug": app_slug,
            "description_html": app_data["description_html"],
            "short_description": app_data["short_description"],
            "company_name": user.display_name,
            "redirect_uris": app_data["redirect_uris"],
            "skip_authorization": True,
            "client_type": "confidential",
            "authorization_grant_type": "authorization-code",
            "user_id": user_id,
            "client_secret": client_secret,
            "webhook_url": webhook_url,
        }

        # check if application already exists
        application = application_model.objects.filter(slug=app_slug).first()
        if application:
            # Application already exists, update client_secret
            application.client_secret = client_secret
            application.redirect_uris = app_data["redirect_uris"]
            application.webhook_url = webhook_url
            application.save()
        else:
            application = application_model.objects.create(**application_data)

        encrypted_data = encrypt(client_secret)
        client_secret = f"{encrypted_data['iv']}:{encrypted_data['ciphertext']}:{encrypted_data['tag']}"

        application_secret_model.objects.bulk_create(
            [
                application_secret_model(
                    key=f"x-{app_key}-id", value=application.id, is_secured=False
                ),
                application_secret_model(
                    key=f"x-{app_key}-client_id",
                    value=application.client_id,
                    is_secured=False,
                ),
                application_secret_model(
                    key=f"x-{app_key}-client_secret",
                    value=client_secret,
                    is_secured=True,
                ),
            ]
        )

        return application.id


def create_applications(
    user_id: str,
    application_model: models.Model = None,
    application_secret_model: models.Model = None,
    user_model: models.Model = None,
) -> list[str]:
    """
    Create all applications in the APPLICATIONS constant
    """
    # used this to inject models from migration files avoiding circular imports
    application_model = application_model or Application
    application_secret_model = application_secret_model or ApplicationSecret
    user_model = user_model or User
    # create applications
    for app_key in APPLICATIONS.keys():
        logger.info(f"Creating application for {app_key}")
        generate_application(
            user_id,
            app_key,
            application_model,
            application_secret_model,
            user_model,
        )
