# Python imports
import os
import uuid
import json
import random
import string

# Django imports
from django.contrib.auth import login
from django.shortcuts import redirect
from django.views import View
from django.utils import timezone
from django.core.validators import validate_email
from django.contrib.auth.hashers import make_password
from django.http.response import JsonResponse

# Third party imports
from rest_framework.permissions import AllowAny
from rest_framework import status

# Module imports
from plane.db.models import (
    User,
    WorkspaceMemberInvite,
    Profile,
)
from plane.settings.redis import redis_instance
from plane.license.models import Instance
from plane.license.utils.instance_value import get_configuration_value
from plane.bgtasks.event_tracking_task import auth_events
from plane.bgtasks.magic_link_code_task import magic_link


class MagicGenerateEndpoint(View):

    def post(self, request):
        email = request.POST.get("email", False)
        if not email:
            return JsonResponse(
                {"error": "Please provide a valid email address"},
                status=400,
            )

        # Clean up the email
        email = email.strip().lower()
        validate_email(email)

        # check if the email exists not
        if not User.objects.filter(email=email).exists():
            # Create a user
            _ = User.objects.create(
                email=email,
                username=uuid.uuid4().hex,
                password=make_password(uuid.uuid4().hex),
                is_password_autoset=True,
            )

        ## Generate a random token
        token = (
            "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
            + "-"
            + "".join(random.choices(string.ascii_lowercase, k=4))
        )

        ri = redis_instance()

        key = "magic_" + str(email)

        # Check if the key already exists in python
        if ri.exists(key):
            data = json.loads(ri.get(key))

            current_attempt = data["current_attempt"] + 1

            if data["current_attempt"] > 2:
                return JsonResponse(
                    {
                        "error": "Max attempts exhausted. Please try again later."
                    },
                    status=400,
                )

            value = {
                "current_attempt": current_attempt,
                "email": email,
                "token": token,
            }
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        else:
            value = {"current_attempt": 0, "email": email, "token": token}
            expiry = 600

            ri.set(key, json.dumps(value), ex=expiry)

        # If the smtp is configured send through here
        current_site = request.META.get("HTTP_ORIGIN")
        magic_link.delay(email, key, token, current_site)

        return JsonResponse({"key": key}, status=status.HTTP_200_OK)


class MagicSignInEndpoint(View):
    permission_classes = [
        AllowAny,
    ]

    def post(self, request):
        # Check if the instance configuration is done
        instance = Instance.objects.first()
        if instance is None or not instance.is_setup_done:
            return JsonResponse(
                {"error": "Instance is not configured"},
                status=400,
            )

        user_token = request.POST.get("token", "").strip()
        key = request.POST.get("key", "").strip().lower()

        if not key or user_token == "":
            return JsonResponse(
                {"error": "User token and key are required"},
                status=400,
            )

        (ENABLE_SIGNUP,) = get_configuration_value(
            [
                {
                    "key": "ENABLE_SIGNUP",
                    "default": os.environ.get("ENABLE_SIGNUP"),
                },
            ]
        )
        ri = redis_instance()

        if ri.exists(key):
            data = json.loads(ri.get(key))

            token = data["token"]
            email = data["email"]

            if str(token) == str(user_token):
                user = User.objects.filter(email=email).first()
                # Signin
                if user:
                    # Send event
                    auth_events.delay(
                        user=user.id,
                        email=email,
                        user_agent=request.META.get("HTTP_USER_AGENT"),
                        ip=request.META.get("REMOTE_ADDR"),
                        event_name="Sign in",
                        medium="Magic link",
                        first_time=False,
                    )

                    user.is_active = True
                    user.is_email_verified = True
                    user.last_active = timezone.now()
                    user.last_login_time = timezone.now()
                    user.last_login_ip = request.META.get("REMOTE_ADDR")
                    user.last_login_uagent = request.META.get(
                        "HTTP_USER_AGENT"
                    )
                    user.token_updated_at = timezone.now()
                    user.save()

                    login(request=request, user=user)
                    return redirect(request.session.get("referer"))

                # Signup
                else:
                    # Check if signup is enabled or not
                    if (
                        ENABLE_SIGNUP == "0"
                        and not WorkspaceMemberInvite.objects.filter(
                            email=email,
                        ).exists()
                    ):
                        return JsonResponse(
                            {
                                "error": "New account creation is disabled. Please contact your site administrator"
                            },
                            status=400,
                        )

                    user = User.objects.create(
                        email=email, username=uuid.uuid4().hex
                    )
                    user.set_password(uuid.uuid4().hex)
                    # settings last actives for the user
                    user.is_password_autoset = False
                    user.last_active = timezone.now()
                    user.last_login_time = timezone.now()
                    user.last_login_ip = request.META.get("REMOTE_ADDR")
                    user.last_login_uagent = request.META.get(
                        "HTTP_USER_AGENT"
                    )
                    user.token_updated_at = timezone.now()
                    user.last_login_medium = "email"
                    user.save()

                    # Create profile
                    _ = Profile.objects.create(user=user)

                    login(request=request, user=user)
                    return redirect(request.session.get("referer"))

            else:
                return JsonResponse(
                    {
                        "error": "Your login code was incorrect. Please try again."
                    },
                    status=400,
                )

        else:
            return JsonResponse(
                {"error": "The magic code/link has expired please try again"},
                status=400,
            )
