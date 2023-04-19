# Python imports
from enum import unique
import uuid

# Django imports
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import AbstractBaseUser, UserManager, PermissionsMixin
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

# Third party imports
from sentry_sdk import capture_exception
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False, db_index=True, primary_key=True
    )
    username = models.CharField(max_length=128, unique=True)

    # user fields
    mobile_number = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(max_length=255, null=True, blank=True, unique=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    avatar = models.CharField(max_length=255, blank=True)

    # tracking metrics
    date_joined = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Last Modified At")
    last_location = models.CharField(max_length=255, blank=True)
    created_location = models.CharField(max_length=255, blank=True)

    # the is' es
    is_superuser = models.BooleanField(default=False)
    is_managed = models.BooleanField(default=False)
    is_password_expired = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    is_password_autoset = models.BooleanField(default=False)
    is_onboarded = models.BooleanField(default=False)

    token = models.CharField(max_length=64, blank=True)

    billing_address_country = models.CharField(max_length=255, default="INDIA")
    billing_address = models.JSONField(null=True)
    has_billing_address = models.BooleanField(default=False)

    user_timezone = models.CharField(max_length=255, default="Asia/Kolkata")

    last_active = models.DateTimeField(default=timezone.now, null=True)
    last_login_time = models.DateTimeField(null=True)
    last_logout_time = models.DateTimeField(null=True)
    last_login_ip = models.CharField(max_length=255, blank=True)
    last_logout_ip = models.CharField(max_length=255, blank=True)
    last_login_medium = models.CharField(
        max_length=20,
        default="email",
    )
    last_login_uagent = models.TextField(blank=True)
    token_updated_at = models.DateTimeField(null=True)
    last_workspace_id = models.UUIDField(null=True)
    my_issues_prop = models.JSONField(null=True)
    role = models.CharField(max_length=300, null=True, blank=True)
    is_bot = models.BooleanField(default=False)
    theme = models.JSONField(default=dict)

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["username"]

    objects = UserManager()

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        db_table = "users"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.username} <{self.email}>"

    def save(self, *args, **kwargs):
        self.email = self.email.lower().strip()
        self.mobile_number = self.mobile_number

        if self.token_updated_at is not None:
            self.token = uuid.uuid4().hex + uuid.uuid4().hex
            self.token_updated_at = timezone.now()

        if self.is_superuser:
            self.is_staff = True

        super(User, self).save(*args, **kwargs)


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    try:
        if created and not instance.is_bot:
            first_name = instance.first_name.capitalize()
            to_email = instance.email
            from_email_string = f"Team Plane <team@mailer.plane.so>"

            subject = f"Welcome to Plane ✈️!"

            context = {"first_name": first_name, "email": instance.email}

            html_content = render_to_string(
                "emails/auth/user_welcome_email.html", context
            )

            text_content = strip_tags(html_content)

            msg = EmailMultiAlternatives(
                subject, text_content, from_email_string, [to_email]
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()

            # Send message on slack as well
            if settings.SLACK_BOT_TOKEN:
                client = WebClient(token=settings.SLACK_BOT_TOKEN)
                try:
                    _ = client.chat_postMessage(
                        channel="#trackers",
                        text=f"New user {instance.email} has signed up and begun the onboarding journey.",
                    )
                except SlackApiError as e:
                    print(f"Got an error: {e.response['error']}")
        return
    except Exception as e:
        capture_exception(e)
        return
