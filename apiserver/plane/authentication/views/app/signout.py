# Python imports
from urllib.parse import urlencode, urljoin

# Django imports
from django.views import View
from django.contrib.auth import logout
from django.http import HttpResponseRedirect

# Module imports
from plane.authentication.utils.host import base_host


class SignOutAuthEndpoint(View):

    def post(self, request):
        logout(request)
        url = urljoin(
            base_host(request=request),
            "accounts/sign-in?" + urlencode({"success": "true"}),
        )
        return HttpResponseRedirect(url)
