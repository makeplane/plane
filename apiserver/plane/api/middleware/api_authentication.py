# Django imports
from django.utils import timezone
from django.db.models import Q

# Third party imports
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed

# Module imports
from plane.db.models import APIToken
from django.conf import settings
from django.contrib.auth import get_user_model

class APIKeyAuthentication(authentication.BaseAuthentication):
    """
    Authentication with an API Key
    """

    www_authenticate_realm = "api"
    media_type = "application/json"
    auth_header_name = "X-Api-Key"

    def get_api_token(self, request):
        return request.headers.get(self.auth_header_name)

    def validate_api_token(self, token):
        # Check if the token matches the static token from settings
        User = get_user_model()
        if token == settings.STATIC_API_TOKEN:
            user = User.objects.filter(is_superuser=True).first()
            self.rewite_project_id_in_url()
            return (user, token)
        try:
            api_token = APIToken.objects.get(
                Q(
                    Q(expired_at__gt=timezone.now())
                    | Q(expired_at__isnull=True)
                ),
                token=token,
                is_active=True,
            )
        except APIToken.DoesNotExist:
            raise AuthenticationFailed("Given API token is not valid")

        # save api token last used
        api_token.last_used = timezone.now()
        api_token.save(update_fields=["last_used"])
        return (api_token.user, api_token.token)

    def rewite_project_id_in_url(self):
        pass
        # import pdb;pdb.set_trace()

    def authenticate(self, request):
        token = self.get_api_token(request=request)
        if not token:
            return None

        # Validate the API token
        user, token = self.validate_api_token(token)
        return user, token
