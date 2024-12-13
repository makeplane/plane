# Django imports
from django.views import View
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.utils import timezone

# Module imports
from plane.authentication.utils.host import user_ip, base_host
from plane.db.models import User
from plane.authentication.provider.oauth.oidc import OIDCOAuthProvider
from plane.authentication.adapter.saml import SAMLAdapter


class SignOutAuthEndpoint(View):
    def post(self, request):
        # Get user
        try:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save()

            # Check if the last medium of user is oidc
            if request.user.last_login_medium == "oidc":
                provider = OIDCOAuthProvider(request=request)
                logout_url = provider.logout(
                    logout_url=f"{base_host(request=request, is_app=True)}/auth/oidc/logout/"
                )
                if logout_url:
                    return HttpResponseRedirect(logout_url)

            # Check if the last medium of user is saml
            if request.user.last_login_medium == "saml":
                provider = SAMLAdapter(request=request)
                logout_url = provider.logout()
                if logout_url:
                    return HttpResponseRedirect(logout_url)

            # Logout user
            logout(request)
            return HttpResponseRedirect(base_host(request=request, is_app=True))
        except Exception:
            return HttpResponseRedirect(base_host(request=request, is_app=True))
