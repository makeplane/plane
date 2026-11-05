# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import json
import re
from enum import Enum

# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel
from plane.license.utils.encryption import decrypt_data_strict, encrypt_data_strict

ROLE_CHOICES = ((20, "Admin"),)


class InstanceEdition(Enum):
    PLANE_COMMUNITY = "PLANE_COMMUNITY"


class Instance(BaseModel):
    # General information
    instance_name = models.CharField(max_length=255)
    whitelist_emails = models.TextField(blank=True, null=True)
    instance_id = models.CharField(max_length=255, unique=True)
    current_version = models.CharField(max_length=255)
    latest_version = models.CharField(max_length=255, null=True, blank=True)
    edition = models.CharField(max_length=255, default=InstanceEdition.PLANE_COMMUNITY.value)
    domain = models.TextField(blank=True)
    # Instance specifics
    last_checked_at = models.DateTimeField()
    namespace = models.CharField(max_length=255, blank=True, null=True)
    # telemetry and support
    is_telemetry_enabled = models.BooleanField(default=True)
    is_support_required = models.BooleanField(default=True)
    # is setup done
    is_setup_done = models.BooleanField(default=False)
    # signup screen
    is_signup_screen_visited = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_test = models.BooleanField(default=False)
    # field for validating if the current version is deprecated
    is_current_version_deprecated = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Instance"
        verbose_name_plural = "Instances"
        db_table = "instances"
        ordering = ("-created_at",)


class InstanceAdmin(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="instance_owner",
    )
    instance = models.ForeignKey(Instance, on_delete=models.CASCADE, related_name="admins")
    role = models.PositiveIntegerField(choices=ROLE_CHOICES, default=20)
    is_verified = models.BooleanField(default=False)

    class Meta:
        unique_together = ["instance", "user"]
        verbose_name = "Instance Admin"
        verbose_name_plural = "Instance Admins"
        db_table = "instance_admins"
        ordering = ("-created_at",)


class InstanceConfiguration(BaseModel):
    # The instance configuration variables
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(null=True, blank=True, default=None)
    category = models.TextField()
    is_encrypted = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Instance Configuration"
        verbose_name_plural = "Instance Configurations"
        db_table = "instance_configurations"
        ordering = ("-created_at",)


class ChangeLog(BaseModel):
    """Change Log model to store the release changelogs made in the application."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    version = models.CharField(max_length=255)
    tags = models.JSONField(default=list)
    release_date = models.DateTimeField(null=True)
    is_release_candidate = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Change Log"
        verbose_name_plural = "Change Logs"
        db_table = "changelogs"
        ordering = ("-created_at",)


class AgentAdapter(models.TextChoices):
    """First-party ACP adapters. The agent runner maps each one to a fixed binary,
    so admins pick an adapter rather than entering an arbitrary command."""

    CLAUDE = "claude", "Claude"
    CODEX = "codex", "Codex"
    DEEPSEEK = "deepseek", "DeepSeek"


class AgentPermissionLevel(models.TextChoices):
    """ACP session modes, from most to least restrictive."""

    ASK_ALL = "ask_all", "Ask for everything"
    ASK_WRITES = "ask_writes", "Ask for writes"
    YOLO = "yolo", "Never ask"


# Most restrictive first. A level's index is its rank; a higher rank grants more.
AGENT_PERMISSION_LEVEL_ORDER = (
    AgentPermissionLevel.ASK_ALL.value,
    AgentPermissionLevel.ASK_WRITES.value,
    AgentPermissionLevel.YOLO.value,
)

AGENT_ENV_KEY_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{0,63}$")
AGENT_ENV_MAX_KEYS = 64
AGENT_ENV_MAX_VALUE_LENGTH = 16384


def agent_permission_rank(level):
    return AGENT_PERMISSION_LEVEL_ORDER.index(level)


def validate_agent_env(env):
    """Validate a plaintext agent env. Returns a list of error messages (empty when valid)."""
    if not isinstance(env, dict):
        return ["env must be an object of string keys to string values"]
    errors = []
    if len(env) > AGENT_ENV_MAX_KEYS:
        errors.append(f"env may contain at most {AGENT_ENV_MAX_KEYS} keys")
    for key, value in env.items():
        if not isinstance(key, str) or not AGENT_ENV_KEY_PATTERN.fullmatch(key):
            errors.append(f"Invalid env key {key!r}: must match {AGENT_ENV_KEY_PATTERN.pattern}")
        elif not isinstance(value, str):
            errors.append(f"env value for {key} must be a string")
        elif len(value) > AGENT_ENV_MAX_VALUE_LENGTH:
            errors.append(f"env value for {key} exceeds {AGENT_ENV_MAX_VALUE_LENGTH} characters")
    return errors


class AgentDefinition(BaseModel):
    """An instance-level agent that workspace members can chat with.

    ``env`` holds the adapter's environment (API keys, model overrides) as a
    Fernet-encrypted JSON object. Always go through ``get_env``/``set_env``.
    """

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    adapter = models.CharField(max_length=32, choices=AgentAdapter.choices)
    env = models.TextField(blank=True, default="")
    default_permission_level = models.CharField(
        max_length=20,
        choices=AgentPermissionLevel.choices,
        default=AgentPermissionLevel.ASK_WRITES,
    )
    max_permission_level = models.CharField(
        max_length=20,
        choices=AgentPermissionLevel.choices,
        default=AgentPermissionLevel.ASK_WRITES,
    )
    attach_plane_mcp = models.BooleanField(default=True)
    is_enabled = models.BooleanField(default=True)
    sort_order = models.FloatField(default=65535)

    class Meta:
        verbose_name = "Agent Definition"
        verbose_name_plural = "Agent Definitions"
        db_table = "agent_definitions"
        ordering = ("sort_order", "name")

    def __str__(self):
        return self.slug

    def get_env(self):
        """Return the decrypted env. Raises ``EncryptionError`` if the stored value cannot be decrypted."""
        plaintext = decrypt_data_strict(self.env)
        return json.loads(plaintext) if plaintext else {}

    def set_env(self, env):
        """Validate and encrypt ``env``. Raises ``ValueError`` on an invalid env."""
        errors = validate_agent_env(env)
        if errors:
            raise ValueError("; ".join(errors))
        self.env = encrypt_data_strict(json.dumps(env, sort_keys=True)) if env else ""
