# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Django imports
from django.conf import settings
from django.utils import timezone

# Module imports
from plane.db.models.workspace import Workspace
from plane.db.models.api import APIToken
from plane.ee.models.workspace import WorkspaceCredential
from plane.ee.views.api import BaseServiceAPIView
from plane.ee.serializers import WorkspaceCredentialAPISerializer


class WorkspaceCredentialAPIView(BaseServiceAPIView):
    def _refresh_credential_token(self, credential):
        """
        Refresh the target access token for a given credential if it is not an OAuth credential

        Args:
            credential (WorkspaceCredential): Credential to refresh

        Returns:
            WorkspaceCredential: Updated credential
        """
        if credential.target_access_token and not credential.target_authorization_type:
            try:
                # Check existing token
                api_token = APIToken.objects.filter(
                    token=credential.target_access_token, is_active=True
                ).first()

                # Generate new token if current token is invalid or expired
                if not api_token or (
                    api_token.expired_at and api_token.expired_at <= timezone.now()
                ):
                    # Create new API token
                    new_api_token = APIToken.objects.create(
                        description=f"Refreshed service token for {credential.target_access_token}",
                        user=credential.user,
                        workspace=credential.workspace,
                        expired_at=timezone.now() + timezone.timedelta(days=7),
                        is_service=True,
                    )

                    # Update credential with new token
                    credential.target_access_token = new_api_token.token
                    credential.save()

                    print(f"Refreshed access token for credential {credential.id}")

            except Exception as e:
                print(f"Error refreshing token for credential {credential.id}: {e}")

        return credential

    def get(self, request, pk=None):
        if not pk:
            filters = {**request.query_params.dict(), "is_active": True}

            credentials = (
                WorkspaceCredential.objects.filter(**filters)
                .order_by("-created_at")
                .select_related("workspace", "user")
            )

            # Refresh tokens for all credentials
            refreshed_credentials = []
            for credential in credentials:
                try:
                    refreshed_credential = self._refresh_credential_token(credential)
                    refreshed_credentials.append(refreshed_credential)
                except Exception as e:
                    print(f"Error processing credential {credential.id}: {e}")
                    # Optionally, you can choose to skip or handle the error differently

            serializer = WorkspaceCredentialAPISerializer(
                refreshed_credentials, many=True
            )
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Case 2: Retrieve specific credential
        credential = WorkspaceCredential.objects.filter(pk=pk).first()

        if not credential:
            return Response(
                {"error": "Credential not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Refresh token for specific credential
        try:
            credential = self._refresh_credential_token(credential)
        except Exception as e:
            print(f"Error refreshing credential {pk}: {e}")

        serializer = WorkspaceCredentialAPISerializer(credential)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()

        serializer = WorkspaceCredentialAPISerializer(
            credential, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        workspace_id = request.data.get("workspace_id")
        user_id = request.data.get("user_id")
        source = request.data.get("source")

        # Create a new data dictionary with mapped fields
        data = request.data.copy()
        data["workspace"] = workspace_id
        data["user"] = user_id

        credential = WorkspaceCredential.objects.filter(
            workspace_id=workspace_id,
            user_id=user_id,
            source=source,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if not credential:
            serializer = WorkspaceCredentialAPISerializer(data={**request.data})
        else:
            serializer = WorkspaceCredentialAPISerializer(
                credential, data=request.data, partial=True
            )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        if not credential:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = WorkspaceCredentialAPISerializer(
            credential, data={"is_active": False}, partial=True
        )
        if serializer.is_valid():
            serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyWorkspaceCredentialAPIView(BaseServiceAPIView):
    def get(self, request):
        # Extract `source` from query params
        source = request.query_params.get("source", "")
        user_id = request.query_params.get("user_id", None)
        workspace_id = request.query_params.get("workspace_id", None)

        # Fetch credentials using a service function
        credentials = WorkspaceCredential.objects.filter(
            workspace_id=workspace_id, user_id=user_id, source=source, is_active=True
        ).first()

        # Determine if OAuth is enabled for the given source
        is_oauth_enabled = False
        if source == "linear":
            is_oauth_enabled = getattr(settings, "LINEAR_OAUTH_ENABLED", "0") == "1"
        elif source == "jira":
            is_oauth_enabled = getattr(settings, "JIRA_OAUTH_ENABLED", "0") == "1"
        elif source == "jira_server":
            is_oauth_enabled = (
                getattr(settings, "JIRA_SERVER_OAUTH_ENABLED", "0") == "1"
            )
        elif source == "asana":
            is_oauth_enabled = getattr(settings, "ASANA_OAUTH_ENABLED", "0") == "1"

        # Return appropriate response based on credentials
        if not credentials:
            return Response(
                {"isAuthenticated": False, "isOAuthEnabled": is_oauth_enabled},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"isAuthenticated": True, "isOAuthEnabled": is_oauth_enabled},
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        credential = WorkspaceCredential.objects.filter(pk=pk).first()
        token = request.data.get("token", None)

        serializer = WorkspaceCredentialAPISerializer(
            credential, data={"token": token}, partial=True
        )

        if serializer.is_valid():
            serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
