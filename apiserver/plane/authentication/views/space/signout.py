# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.views import View
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.utils import timezone

# Module imports
from plane.authentication.utils.host import base_host, user_ip
from plane.db.models import User


class SignOutAuthSpaceEndpoint(View):

    def post(self, request):
        # Get user
        try:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save()
            # Log the user out
            logout(request)
            url = urljoin(
                base_host(request=request, is_space=True),
                "accounts/sign-in?" + urlencode({"success": "true"}),
            )
            return HttpResponseRedirect(url)
        except Exception:
            return HttpResponseRedirect(
                base_host(request=request, is_space=True), "accounts/sign-in"
            )
