# Third party imports
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from sentry_sdk import capture_exception

# Module imports
from plane.api.views import BaseViewSet
from plane.db.models import (
    GithubIssueSync,
    GithubRepositorySync,
    GithubRepository,
    WorkspaceIntegration,
    ProjectMember,
    Label,
    GithubCommentSync,
)
from plane.api.serializers import (
    GithubRepositorySerializer,
    GithubIssueSyncSerializer,
    GithubRepositorySyncSerializer,
    GithubCommentSyncSerializer,
)


class GithubRepositorySyncViewSet(BaseViewSet):
    serializer_class = GithubRepositorySyncSerializer
    model = GithubRepositorySync

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def create(self, request, slug, project_id, workspace_integration_id):
        try:
            name = request.data.get("name", False)
            url = request.data.get("url", False)
            config = request.data.get("config", {})
            repository_id = request.data.get("repository_id", False)
            owner = request.data.get("owner", False)

            if not name or not url or not repository_id or not owner:
                return Response(
                    {"error": "Name, url, and repository_id are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create repository
            repo = GithubRepository.objects.create(
                name=name,
                url=url,
                config=config,
                repository_id=repository_id,
                owner=owner,
            )

            # Get the workspace integration
            workspace_integration = WorkspaceIntegration.objects.get(
                pk=workspace_integration_id
            )

            # Create a Label for github
            label = Label.objects.filter(
                name="GitHub",
                project_id=project_id,
            ).first()

            if label is None:
                label = Label.objects.create(
                    name="GitHub",
                    project_id=project_id,
                    description="Label to sync Plane issues with GitHub issues",
                    color="#003773",
                )

            # Create repo sync
            repo_sync = GithubRepositorySync.objects.create(
                repository=repo,
                workspace_integration=workspace_integration,
                actor=workspace_integration.actor,
                credentials=request.data.get("credentials", {}),
                project_id=project_id,
                label=label,
            )

            # Add bot as a member in the project
            _ = ProjectMember.objects.create(
                member=workspace_integration.actor, role=20, project_id=project_id
            )

            # Return Response
            return Response(
                GithubRepositorySyncSerializer(repo_sync).data,
                status=status.HTTP_201_CREATED,
            )

        except WorkspaceIntegration.DoesNotExist:
            return Response(
                {"error": "Workspace Integration does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class GithubIssueSyncViewSet(BaseViewSet):
    serializer_class = GithubIssueSyncSerializer
    model = GithubIssueSync

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            repository_sync_id=self.kwargs.get("repo_sync_id"),
        )


class GithubCommentSyncViewSet(BaseViewSet):
    serializer_class = GithubCommentSyncSerializer
    model = GithubCommentSync

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_sync_id=self.kwargs.get("issue_sync_id"),
        )


class GithubAppInstallationViewSet(APIView):
    def get_jwt_token(self):
        import jwt
        from datetime import timedelta, now
        from cryptography.hazmat.primitives.serialization import load_pem_private_key
        from cryptography.hazmat.backends import default_backend

        app_id = "291184"
        secret = b"""-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAv6muOm754ZqIbUkGngGuRNFSDnSuROMN8aIjjgMa2HR+ts1c
nItXWiSvlPJaNCLmmjduTnh7KaxvPzQwCFAK61P/7ZfRNPqzaMibPeolDSKNZ+bF
lHcB/HA+XQN/OJ3UvvK9O0bnjYcpmjJJ61rV7fC+gSzEtG4UrPMihK+koKNlyA11
gehQkX/MGdCFEX94Hw1a+B6g2eXF1QRYkVh/Q0JLyHcV/TmSwPNi171V2Kn/ClRq
8xyZFE7EpzEf/hCP3TFvQD+iVfKnANdXC0nGG4k7NKvYnitI/hb5acpKr5khRap9
WEEvup03waTqUDqsiYJnx+pX60VQs/ooqns0AQIDAQABAoIBAFpL+sWU2y0qvPOf
3/o5GH1bkKk215Ok1UDt/oo9dDxeRgSho+wsya6ycfZeZ5kAiFxHmTRnFr9/ebnx
QF/qNfrAzGaHjAzFwBixylHVKjeR+8TjuFpF5y2jQ/5WU229DioX+oce1KCc+UCo
SKMVXIyJS3dYPCQ1aJBCzBRvG8SB5Z9rCSN79m8QS6ZXHsiYUQhZhi0ExYSdl8tn
hbbf+dzQ5DyDRmf+2vwSg1M+/uiEwb478pImFHpk34Yyl4r7etXm044DRldUWHr+
RZnWlXQXFFL1QIfhBQbHsAgUxAjjhH5I6ATEuJLySBVJDF+PhzowjWhqAQEp8vy6
+ogiMXECgYEA7Drjn4tfR25SGzTUmSI7HmmEoFwwRcS/nyO/igB4CZ/ODPlBe8jx
p3HrpCwEfu7TooUhkso2REvabyTTjlRl2B0Twi9mStr7UHKxJEUdeZA99YxzTjfa
DBHGBx7f/1hYJdL/GKoKb/Eh9dlx9gg8PwfotZ/lQg5P0B/MsKF+ZscCgYEAz7P1
/pG0bsNGrMKaLN+4WQpQyr1FQo/u1CL/N7ZF1qwnU8IMBcOb97AoatC2/2DvctDE
dwCZVWjDLy2lDuFkXCMy7DRx1MF8VLyXJzLaWrdun1nwR0w0JRRGJQDzaee5U4Td
jX4eXKBuy6T/Xnhh3cFYXUd/jTsF++WdRiEXpvcCgYBy87keQwDrTojPymaF2f1w
sCIkspee673fX9LuAYpoDIaFE6nE5aSKOcpUCkNpzSfZFvWea536n/q8SOxVf0ZL
4uJhhRU+6c6PeDAxGRzdsc4kteLKNi154BBAGMshg0jppwIRa3VGwc0nyFdHRPyk
I2IfN56lBTfbbA38CanrswKBgAoNh8Z+fuEtimoqMRQi7+U/XpGxf3ytQr35w6iK
pe6x/mVLaxGMWiwu1oX0/CZ4Jp7EA/5OhR1hKLFL4EVMG3NqMLjGAQxvIPlo91fq
Wi8x2aTU0ZBh29Q/mvWHikCB+rJUJ/UFOar6COLKZaHI6dO12/UH1OCdDrkWb/pI
98AZAoGBAKQkQYFrjbzcfCAYiaeWLE5k2zHT37qmLdq6CM5YJCicxhfFTYVCkiET
1YJHUgk5UWAlSNcF/fT7+LBT9cSSxNoZIl5TDLpwmYaNhgTm1R7yecGE27Q4U4Mo
EzNTJHn4jU5S8WGOjmctIaBwHNSn83n6yRdsQh7yOBztnwIBNMX8
-----END RSA PRIVATE KEY-----
"""

        due_date = now() + timedelta(minutes=10)
        expiry = int(due_date.timestamp())
        payload = {
            "iss": app_id,
            "sub": app_id,
            "exp": expiry,
            "aud": "https://github.com/login/oauth/access_token",
        }

        priv_rsakey = load_pem_private_key(secret, None, default_backend())
        token = jwt.encode(payload, priv_rsakey, algorithm="RS256")
        return token

    def post(self, request, installation_id):
        token = self.get_jwt_token()
        import requests

        url = f"https://api.github.com/app/installations/{installation_id}"
        headers = {
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github+json",
        }
        response = requests.get(url, headers=headers).json()
        return Response(response)
