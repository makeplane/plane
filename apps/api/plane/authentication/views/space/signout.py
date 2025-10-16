# Django imports
from django.views import View
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.utils import timezone

# Module imports
from plane.authentication.utils.host import base_host, user_ip
from plane.db.models import User
from plane.utils.path_validator import get_safe_redirect_url


class SignOutAuthSpaceEndpoint(View):
    def post(self, request):
        next_path = request.POST.get("next_path")

        # Get user
        try:
            user = User.objects.get(pk=request.user.id)
            user.last_logout_ip = user_ip(request=request)
            user.last_logout_time = timezone.now()
            user.save()
            # Log the user out
            logout(request)
            url = get_safe_redirect_url(base_url=base_host(request=request, is_space=True), next_path=next_path)
            return HttpResponseRedirect(url)
        except Exception:
            url = get_safe_redirect_url(base_url=base_host(request=request, is_space=True), next_path=next_path)
            return HttpResponseRedirect(url)
