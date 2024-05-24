# Python imports
import random
import string
import uuid

import pytz
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    UserManager,
)

# Django imports
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

# Module imports
from ..mixins import TimeAuditModel


def get_default_onboarding():
    return {
        "profile_complete": False,
        "workspace_create": False,
        "workspace_invite": False,
        "workspace_join": False,
    }


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        primary_key=True,
    )
    username = models.CharField(max_length=128, unique=True)
    # user fields
    mobile_number = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(
        max_length=255, null=True, blank=True, unique=True
    )

    # identity
    display_name = models.CharField(max_length=255, default="")
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    avatar = models.TextField(blank=True)
    cover_image = models.URLField(blank=True, null=True, max_length=800)

    # tracking metrics
    date_joined = models.DateTimeField(
        auto_now_add=True, verbose_name="Created At"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Created At"
    )
    updated_at = models.DateTimeField(
        auto_now=True, verbose_name="Last Modified At"
    )
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

    # random token generated
    token = models.CharField(max_length=64, blank=True)

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
    # my_issues_prop = models.JSONField(null=True)

    is_bot = models.BooleanField(default=False)

    # timezone
    USER_TIMEZONE_CHOICES = tuple(zip(pytz.all_timezones, pytz.all_timezones))
    user_timezone = models.CharField(
        max_length=255, default="UTC", choices=USER_TIMEZONE_CHOICES
    )

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

        if not self.display_name:
            self.display_name = (
                self.email.split("@")[0]
                if len(self.email.split("@"))
                else "".join(
                    random.choice(string.ascii_letters) for _ in range(6)
                )
            )

        if self.is_superuser:
            self.is_staff = True

        super(User, self).save(*args, **kwargs)


class Profile(TimeAuditModel):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        primary_key=True,
    )
    # User
    user = models.OneToOneField(
        "db.User", on_delete=models.CASCADE, related_name="profile"
    )
    # General
    theme = models.JSONField(default=dict)
    # Onboarding
    is_tour_completed = models.BooleanField(default=False)
    onboarding_step = models.JSONField(default=get_default_onboarding)
    use_case = models.TextField(blank=True, null=True)
    role = models.CharField(max_length=300, null=True, blank=True)  # job role
    is_onboarded = models.BooleanField(default=False)
    # Last visited workspace
    last_workspace_id = models.UUIDField(null=True)
    # address data
    billing_address_country = models.CharField(max_length=255, default="INDIA")
    billing_address = models.JSONField(null=True)
    has_billing_address = models.BooleanField(default=False)
    company_name = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "Profile"
        verbose_name_plural = "Profiles"
        db_table = "profiles"
        ordering = ("-created_at",)


class Account(TimeAuditModel):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        primary_key=True,
    )
    user = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, related_name="accounts"
    )
    provider_account_id = models.CharField(max_length=255)
    provider = models.CharField(
        choices=(("google", "Google"), ("github", "Github")),
    )
    access_token = models.TextField()
    access_token_expired_at = models.DateTimeField(null=True)
    refresh_token = models.TextField(null=True, blank=True)
    refresh_token_expired_at = models.DateTimeField(null=True)
    last_connected_at = models.DateTimeField(default=timezone.now)
    id_token = models.TextField(blank=True)
    metadata = models.JSONField(default=dict)

    class Meta:
        unique_together = ["provider", "provider_account_id"]
        verbose_name = "Account"
        verbose_name_plural = "Accounts"
        db_table = "accounts"
        ordering = ("-created_at",)


@receiver(post_save, sender=User)
def create_user_notification(sender, instance, created, **kwargs):
    # create preferences
    if created and not instance.is_bot:
        # Module imports
        from plane.db.models import UserNotificationPreference

        UserNotificationPreference.objects.create(
            user=instance,
            property_change=False,
            state_change=False,
            comment=False,
            mention=False,
            issue_completed=False,
        )
