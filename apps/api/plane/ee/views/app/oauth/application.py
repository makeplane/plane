# standard imports
from django.db.models import (
    BooleanField,
    Case,
    Exists,
    OuterRef,
    Q,
    Value,
    When,
    Subquery,
)
from django.utils import timezone

# third-party imports
from oauth2_provider.generators import generate_client_secret
from rest_framework import status
from rest_framework.response import Response

# local imports
from plane.app.permissions import WorkSpaceAdminPermission, WorkspaceOwnerPermission
from plane.authentication.models import (
    Application,
    ApplicationOwner,
    WorkspaceAppInstallation,
    ApplicationCategory,
)
from plane.authentication.serializers import (
    ApplicationOwnerSerializer,
    ApplicationSerializer,
    WorkspaceAppInstallationSerializer,
    ApplicationCategorySerializer,
)
from plane.db.models import Workspace
from plane.ee.views.base import BaseAPIView
from plane.authentication.bgtasks.send_app_uninstall_webhook import send_app_uninstall_webhook


class OAuthApplicationEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        client_secret = generate_client_secret()
        request.data["client_secret"] = client_secret
        request.data["skip_authorization"] = request.data.get(
            "skip_authorization", False
        )
        request.data["client_type"] = request.data.get(
            "client_type", Application.CLIENT_CONFIDENTIAL
        )
        request.data["authorization_grant_type"] = request.data.get(
            "authorization_grant_type", Application.GRANT_AUTHORIZATION_CODE
        )
        request.data["user"] = request.user.id
        request.data["created_by"] = request.user.id
        request.data["updated_by"] = request.user.id

        # create the bot user and add to application

        serialised_application = ApplicationSerializer(data=request.data)
        if serialised_application.is_valid():
            app = serialised_application.save()
            # create the application owner
            app_owner = ApplicationOwnerSerializer(
                data={
                    "user": request.user.id,
                    "application": app.id,
                    "workspace": workspace.id,
                }
            )
            if app_owner.is_valid():
                app_owner.save()

            return Response(
                {**serialised_application.data, "client_secret": client_secret},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            serialised_application.errors, status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, slug, pk):
        # Define allowed fields for update
        ALLOWED_FIELDS = {
            "name",
            "short_description",
            "description_html",
            "logo_asset",
            "company_name",
            "webhook_url",
            "redirect_uris",
            "allowed_origins",
            "attachments",
            "categories",
            "privacy_policy_url",
            "terms_of_service_url",
            "contact_email",
            "support_url",
            "setup_url",
            "configuration_url",
            "video_url",
            "is_mentionable",
            "website",
        }

        # Filter the request data to only include allowed fields
        update_data = {
            key: value for key, value in request.data.items() if key in ALLOWED_FIELDS
        }

        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()

        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ApplicationSerializer(
            application,
            data={**update_data, "updated_by": request.user.id},
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request, slug, pk=None):
        try:
            if not pk:
                # Get all applications that is either owned by workspace
                # OR published
                applications = (
                    Application.objects.filter(
                        Q(application_owners__workspace__slug=slug)
                        | Q(published_at__isnull=False)
                    )
                    .select_related("logo_asset")
                    .prefetch_related("attachments", "categories")
                )
                # Annotate with ownership information
                applications = applications.annotate(
                    is_owned=Case(
                        When(
                            application_owners__workspace__slug=slug, then=Value(True)
                        ),
                        default=Value(False),
                        output_field=BooleanField(),
                    )
                )

                # Left join with WorkspaceAppInstallation to check installation status
                applications = applications.annotate(
                    is_installed=Exists(
                        WorkspaceAppInstallation.objects.filter(
                            application_id=OuterRef("id"),
                            workspace__slug=slug,
                            status=WorkspaceAppInstallation.Status.INSTALLED,
                        )
                    ),
                    installation_id=Subquery(
                        WorkspaceAppInstallation.objects.filter(
                            application_id=OuterRef("id"),
                            workspace__slug=slug,
                            status=WorkspaceAppInstallation.Status.INSTALLED,
                        ).values("id")[:1]
                    ),
                )

                serialised_applications = ApplicationSerializer(applications, many=True)
                return Response(serialised_applications.data, status=status.HTTP_200_OK)

            # Single application case
            application = (
                Application.objects.filter(
                    id=pk, application_owners__workspace__slug=slug
                )
                .select_related(
                    "logo_asset",
                )
                .first()
            )

            if not application:
                return Response(
                    {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Add ownership and installation info
            application.is_owned = application.application_owners.filter(
                workspace__slug=slug
            ).exists()
            application_installation = WorkspaceAppInstallation.objects.filter(
                application=application,
                workspace__slug=slug,
                status=WorkspaceAppInstallation.Status.INSTALLED,
            ).first()
            application.is_installed = application_installation is not None
            application.installation_id = (
                application_installation.id if application_installation else None
            )

            serialised_application = ApplicationSerializer(application)
            return Response(serialised_application.data, status=status.HTTP_200_OK)

        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Application.DoesNotExist:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OAuthApplicationRegenerateSecretEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def patch(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        client_secret = generate_client_secret()
        serializer = ApplicationSerializer(
            application,
            data={"client_secret": client_secret, "updated_by": request.user.id},
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {**serializer.data, "client_secret": client_secret},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OAuthApplicationCheckSlugEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug):
        app_slug = request.data.get("app_slug")
        if not app_slug:
            return Response(
                {"error": "Slug is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        if Application.objects.filter(slug=app_slug).exists():
            return Response(
                {"error": "Slug already exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(status=status.HTTP_200_OK)


class OAuthApplicationInstallEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def post(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)

        if not pk:
            return Response(
                {"error": "App ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # create or update workspace installation
        workspace_application = WorkspaceAppInstallation.objects.filter(
            workspace=workspace, application=pk
        ).first()
        if not workspace_application:
            workspace_application_serialiser = WorkspaceAppInstallationSerializer(
                data={
                    "workspace": workspace.id,
                    "application": pk,
                    "installed_by": request.user.id,
                }
            )
        else:
            workspace_application_serialiser = WorkspaceAppInstallationSerializer(
                workspace_application,
                data={
                    "installed_by": request.user.id,
                    "status": WorkspaceAppInstallation.Status.PENDING,
                },
                partial=True,
            )

        if workspace_application_serialiser.is_valid():
            workspace_application_serialiser.save()
        else:
            return Response(
                workspace_application_serialiser.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            workspace_application_serialiser.data, status=status.HTTP_200_OK
        )


class OAuthApplicationPublishEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def post(self, request, slug, pk):
        application = Application.objects.filter(
            id=pk, application_owners__workspace__slug=slug
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        # check if user has permission to publish the application
        workspace_application_owner = ApplicationOwner.objects.filter(
            workspace__slug=slug,
            application=application,
            user=request.user,
            deleted_at__isnull=True,
        ).first()
        if not workspace_application_owner:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
        serializer = ApplicationSerializer(
            application,
            data={
                "publish_requested_at": timezone.now(),
                "published_by": request.user.id,
            },
            partial=True,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OAuthApplicationClientIdEndpoint(BaseAPIView):
    def get(self, request, client_id):
        application = Application.objects.filter(
            client_id=client_id, deleted_at__isnull=True
        ).first()
        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serialised_application = ApplicationSerializer(application)
        return Response(serialised_application.data, status=status.HTTP_200_OK)


class OAuthApplicationCategoryEndpoint(BaseAPIView):
    def get(self, request):
        application_categories = ApplicationCategory.objects.filter(is_active=True)
        serializer = ApplicationCategorySerializer(application_categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class OAuthApplicationDetailEndpoint(BaseAPIView):
    permission_classes = [WorkspaceOwnerPermission]

    def delete(self, request, slug, pk):
        workspace = Workspace.objects.get(slug=slug)
        workspace_app_installation = WorkspaceAppInstallation.objects.filter(
            id=pk, workspace=workspace
        ).first()
        if not workspace_app_installation:
            return Response(
                {"error": "Installation not found"}, status=status.HTTP_404_NOT_FOUND
            )
        # get the webhook url and application id
        webhook_url = workspace_app_installation.webhook.url if workspace_app_installation.webhook else None
        application_id = workspace_app_installation.application.id

        # Delete the workspace app installation (cleanup is handled in the model's delete method)
        workspace_app_installation.delete()

        # send webhook within the transaction
        if webhook_url:
            send_app_uninstall_webhook.delay(
                webhook_url, workspace.id, application_id, workspace_app_installation.id
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

class OAuthPublishedApplicationBySlugEndpoint(BaseAPIView):
    permission_classes = [WorkSpaceAdminPermission]

    def get(self, request, slug, app_slug):
        application = (
            Application.objects.filter(slug=app_slug, published_at__isnull=False)
            .select_related(
                "logo_asset",
            )
            .first()
        )

        if not application:
            return Response(
                {"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Add ownership and installation info
        application.is_owned = application.application_owners.filter(
            workspace__slug=slug
        ).exists()

        application_installation = WorkspaceAppInstallation.objects.filter(
            application=application,
            workspace__slug=slug,
            status=WorkspaceAppInstallation.Status.INSTALLED,
        ).first()

        application.is_installed = application_installation is not None
        application.installation_id = (
            application_installation.id if application_installation else None
        )

        serialised_application = ApplicationSerializer(application)
        return Response(serialised_application.data, status=status.HTTP_200_OK)
