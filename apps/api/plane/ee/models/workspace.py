# Django imports
from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

# Module imports
from plane.db.models.base import BaseModel
from plane.db.models.workspace import WorkspaceBaseModel


class WorkspaceFeature(BaseModel):
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="features"
    )
    is_project_grouping_enabled = models.BooleanField(default=False)
    is_initiative_enabled = models.BooleanField(default=False)
    is_teams_enabled = models.BooleanField(default=False)
    is_customer_enabled = models.BooleanField(default=False)
    is_wiki_enabled = models.BooleanField(default=True)
    is_pi_enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workspace Feature"
        verbose_name_plural = "Workspace Features"
        db_table = "workspace_features"
        ordering = ("-created_at",)


class WorkspaceLicense(BaseModel):
    class PlanChoice(models.TextChoices):
        FREE = "FREE", "Free"
        PRO = "PRO", "Pro"
        ONE = "ONE", "One"
        BUSINESS = "BUSINESS", "Business"
        ENTERPRISE = "ENTERPRISE", "Enterprise"

    class RecurringIntervalChoice(models.TextChoices):
        MONTHLY = "MONTHLY", "Monthly"
        YEARLY = "YEARLY", "Yearly"
        QUARTERLY = "QUARTERLY", "Quarterly"

    # The workspace that this license is for
    workspace = models.OneToOneField(
        "db.Workspace", on_delete=models.CASCADE, related_name="license"
    )
    recurring_interval = models.CharField(
        choices=RecurringIntervalChoice.choices, max_length=255, blank=True, null=True
    )
    current_period_end_date = models.DateTimeField(null=True, blank=True)
    current_period_start_date = models.DateTimeField(null=True, blank=True)
    purchased_seats = models.IntegerField(default=0)
    free_seats = models.IntegerField(default=12)
    plan = models.CharField(choices=PlanChoice.choices, max_length=255)
    is_cancelled = models.BooleanField(default=False)
    is_offline_payment = models.BooleanField(default=False)
    # When this information was last synced from the payment gateway
    last_synced_at = models.DateTimeField(default=timezone.now)
    # trial end date
    trial_end_date = models.DateTimeField(null=True, blank=True)
    # has activated free trial
    has_activated_free_trial = models.BooleanField(default=False)
    # is payment method added
    has_added_payment_method = models.BooleanField(default=False)
    # subscription
    subscription = models.CharField(max_length=255, null=True, blank=True)
    # last payment failed date
    last_payment_failed_date = models.DateTimeField(null=True, blank=True)
    # last payment failed count
    last_payment_failed_count = models.IntegerField(default=0)
    # last license validity check date
    last_verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Workspace License"
        verbose_name_plural = "Workspace Licenses"
        db_table = "workspace_licenses"
        ordering = ("-created_at",)


class WorkspaceActivity(WorkspaceBaseModel):
    verb = models.CharField(max_length=255, verbose_name="Action", default="created")
    field = models.CharField(
        max_length=255, verbose_name="Field Name", blank=True, null=True
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    comment = models.TextField(verbose_name="Comment", blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="workspace_activities",
    )
    old_identifier = models.UUIDField(null=True)
    new_identifier = models.UUIDField(null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Workspace Activity"
        verbose_name_plural = "Workspace Activities"
        db_table = "workspace_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.verb}"


class WorkspaceCredential(BaseModel):
    source = models.CharField(max_length=60)  # importer type
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="credentials"
    )
    user = models.ForeignKey(
        "db.User", on_delete=models.CASCADE, related_name="credentials"
    )
    # Source being the type of importer where issues are imported example: jira
    source_identifier = models.CharField(max_length=255, null=True, blank=True)
    source_authorization_type = models.CharField(max_length=255, null=True, blank=True)
    source_auth_email = models.EmailField(null=True, blank=True)
    source_access_token = models.TextField(null=True, blank=True)
    source_refresh_token = models.TextField(null=True, blank=True)
    source_hostname = models.TextField(null=True, blank=True)
    # Target being Plane where issues are imported to.
    target_identifier = models.CharField(max_length=255, null=True, blank=True)
    target_authorization_type = models.CharField(max_length=255, null=True, blank=True)
    target_access_token = models.TextField(null=True, blank=True)
    target_refresh_token = models.TextField(null=True, blank=True)
    target_hostname = models.TextField(null=True, blank=True)
    # other values
    is_pat = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Workspace Credential"
        verbose_name_plural = "Workspace Credentials"
        db_table = "workspace_credentials"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.source}"


class WorkspaceConnection(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="connections"
    )
    credential = models.ForeignKey(
        "ee.WorkspaceCredential",
        on_delete=models.CASCADE,
        related_name="connections",
        null=True,
        blank=True,
    )
    target_hostname = models.TextField(null=True, blank=True)
    source_hostname = models.TextField(null=True, blank=True)
    # IntegrationType enum
    connection_type = models.CharField(max_length=50)
    # Id of the org from integrator
    connection_id = models.CharField(max_length=255)
    connection_data = models.JSONField(default=dict)
    connection_slug = models.TextField(null=True, blank=True)
    scopes = models.JSONField(default=list)
    config = models.JSONField(default=dict)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="deleted_workspace_connections",
        null=True,
        blank=True,
    )
    disconnect_meta = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Workspace Connection"
        verbose_name_plural = "Workspace Connections"
        db_table = "workspace_connections"
        ordering = ("-created_at",)

    def delete(self, *args, **kwargs):
        credential = self.credential
        deleted_by_id = kwargs.get("deleted_by_id", None)
        disconnect_meta = kwargs.get("disconnect_meta", None)

        if deleted_by_id:
            User = get_user_model()
            user = User.objects.filter(id=deleted_by_id).first()
            if user:
                self.deleted_by = user

        if disconnect_meta:
            self.disconnect_meta = disconnect_meta

        with transaction.atomic():
            self.save(update_fields=["deleted_by", "disconnect_meta"])
            # Remove all credentials with the same workspace_id and connection_type + "-USER"
            user_connection_type = f"{self.connection_type}-USER"
            WorkspaceCredential.objects.filter(
                workspace_id=self.workspace_id, source=user_connection_type
            ).delete()

            super().delete(*args, **kwargs)
            # Deactivate the credential if no other connections reference it
            if (
                credential
                and not WorkspaceConnection.objects.filter(
                    credential=credential
                ).exists()
            ):
                credential.is_active = False
                credential.save()


class WorkspaceEntityConnection(BaseModel):
    type = models.CharField(max_length=60, blank=True, null=True)
    workspace_connection = models.ForeignKey(
        "ee.WorkspaceConnection",
        on_delete=models.CASCADE,
        related_name="entity_connections",
    )
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="entity_connections"
    )
    project = models.ForeignKey(
        "db.Project",
        on_delete=models.CASCADE,
        related_name="entity_connections",
        null=True,
        blank=True,
    )
    issue = models.ForeignKey(
        "db.Issue",
        on_delete=models.CASCADE,
        related_name="entity_connections",
        null=True,
        blank=True,
    )
    entity_type = models.CharField(max_length=30, blank=True, null=True)
    entity_id = models.CharField(max_length=255, blank=True, null=True)
    entity_slug = models.CharField(max_length=255, blank=True, null=True)
    entity_data = models.JSONField(default=dict)
    config = models.JSONField(default=dict)

    class Meta:
        verbose_name = "Workspace Entity Connection"
        verbose_name_plural = "Workspace Entity Connections"
        db_table = "workspace_entity_connections"


class WorkspaceMemberActivityModel(BaseModel):
    class WorkspaceMemberActivityType(models.TextChoices):
        JOINED = "JOINED", "JOINED"
        REMOVED = "REMOVED", "Removed"
        LEFT = "LEFT", "Left"
        ROLE_CHANGED = "ROLE_CHANGED", "Role Changed"

    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="member_activities"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="workspace_member_activities",
    )
    type = models.CharField(max_length=255, default=WorkspaceMemberActivityType.JOINED)
    workspace_member = models.ForeignKey(
        "db.WorkspaceMember", on_delete=models.CASCADE, related_name="activities"
    )
    old_value = models.TextField(verbose_name="Old Value", blank=True, null=True)
    new_value = models.TextField(verbose_name="New Value", blank=True, null=True)
    epoch = models.FloatField(null=True)

    class Meta:
        verbose_name = "Workspace Member Activity"
        verbose_name_plural = "Workspace Member Activities"
        db_table = "workspace_member_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.type}"
