# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from plane.license.utils.encryption import decrypt_data_strict, encrypt_data_strict
from .base import BaseModel


class AgentProvider(models.TextChoices):
    """Model providers whose credentials members and workspaces can bring for the agent chat."""

    ANTHROPIC = "anthropic", "Anthropic"
    OPENAI = "openai", "OpenAI"
    GOOGLE = "google", "Google"


class AgentCredentialMethod(models.TextChoices):
    API_KEY = "api_key", "API key"
    CHATGPT = "chatgpt", "ChatGPT sign-in"
    GOOGLE_ACCOUNT = "google_account", "Google account sign-in"


# Display / resolution order of the providers.
AGENT_PROVIDER_ORDER = (
    AgentProvider.ANTHROPIC.value,
    AgentProvider.OPENAI.value,
    AgentProvider.GOOGLE.value,
)

# The ACP adapter (``plane.license.models.AgentAdapter`` value) each provider's credential is used by.
AGENT_PROVIDER_ADAPTER = {
    AgentProvider.ANTHROPIC.value: "claude",
    AgentProvider.OPENAI.value: "codex",
    AgentProvider.GOOGLE.value: "gemini",
}
AGENT_ADAPTER_PROVIDER = {adapter: provider for provider, adapter in AGENT_PROVIDER_ADAPTER.items()}

# The env var an ``api_key`` credential is passed to the adapter in.
AGENT_PROVIDER_KEY_ENV = {
    AgentProvider.ANTHROPIC.value: "ANTHROPIC_API_KEY",
    AgentProvider.OPENAI.value: "OPENAI_API_KEY",
    AgentProvider.GOOGLE.value: "GEMINI_API_KEY",
}

# Admin env vars a personal/workspace credential replaces (removed before ours are added).
AGENT_PROVIDER_REPLACED_ENV = {
    AgentProvider.ANTHROPIC.value: ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN"),
    AgentProvider.OPENAI.value: ("OPENAI_API_KEY", "CODEX_HOME"),
    AgentProvider.GOOGLE.value: (
        "GEMINI_API_KEY",
        "GOOGLE_API_KEY",
        "GOOGLE_GENAI_USE_VERTEXAI",
        "GOOGLE_CLOUD_PROJECT",
        "GOOGLE_APPLICATION_CREDENTIALS",
    ),
}

# Admin env vars that count as the instance having a credential for the provider.
AGENT_PROVIDER_INSTANCE_ENV = {
    AgentProvider.ANTHROPIC.value: ("ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN"),
    AgentProvider.OPENAI.value: ("OPENAI_API_KEY", "CODEX_HOME"),
    AgentProvider.GOOGLE.value: ("GEMINI_API_KEY",),
}

# The account sign-in method each provider supports (personal only). Anthropic has none.
AGENT_PROVIDER_ACCOUNT_METHOD = {
    AgentProvider.OPENAI.value: AgentCredentialMethod.CHATGPT.value,
    AgentProvider.GOOGLE.value: AgentCredentialMethod.GOOGLE_ACCOUNT.value,
}

# Env var telling the adapter which auth method to use.
AGENT_AUTH_ENV = "PLANE_AGENT_AUTH"

AGENT_API_KEY_MIN_LENGTH = 8
AGENT_API_KEY_MAX_LENGTH = 512
AGENT_ACCOUNT_LABEL_MAX_LENGTH = 255


def validate_agent_api_key(value):
    """Return an error message for an invalid API key, or ``None`` when it is valid."""
    if not isinstance(value, str):
        return "api_key must be a string."
    if not AGENT_API_KEY_MIN_LENGTH <= len(value) <= AGENT_API_KEY_MAX_LENGTH:
        return f"api_key must be {AGENT_API_KEY_MIN_LENGTH} to {AGENT_API_KEY_MAX_LENGTH} characters."
    if any(char.isspace() for char in value):
        return "api_key must not contain whitespace."
    return None


class AgentProviderCredential(BaseModel):
    """A model-provider credential for the agent chat.

    ``user`` set: the member's personal credential (an API key or an account
    sign-in whose tokens live in the agent runner, not here). ``user`` null: the
    workspace's shared API key. ``secret`` is the Fernet-encrypted API key (empty
    for account methods); always go through ``get_secret``/``set_api_key``.
    """

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="agent_provider_credentials")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="agent_provider_credentials",
    )
    provider = models.CharField(max_length=32, choices=AgentProvider.choices)
    method = models.CharField(max_length=32, choices=AgentCredentialMethod.choices)
    secret = models.TextField(blank=True, default="")
    secret_hint = models.CharField(max_length=4, blank=True, default="")
    account_label = models.CharField(max_length=AGENT_ACCOUNT_LABEL_MAX_LENGTH, blank=True, default="")

    class Meta:
        verbose_name = "Agent Provider Credential"
        verbose_name_plural = "Agent Provider Credentials"
        db_table = "agent_provider_credentials"
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "provider"],
                condition=Q(user__isnull=True, deleted_at__isnull=True),
                name="agent_provider_credential_unique_workspace_provider",
            ),
            models.UniqueConstraint(
                fields=["workspace", "user", "provider"],
                condition=Q(user__isnull=False, deleted_at__isnull=True),
                name="agent_provider_credential_unique_user_provider",
            ),
            # Account sign-ins are personal; a workspace can only share an API key.
            models.CheckConstraint(
                condition=Q(user__isnull=False) | Q(method=AgentCredentialMethod.API_KEY),
                name="agent_provider_credential_shared_api_key_only",
            ),
            models.CheckConstraint(
                condition=Q(method=AgentCredentialMethod.API_KEY)
                | Q(provider=AgentProvider.OPENAI, method=AgentCredentialMethod.CHATGPT)
                | Q(provider=AgentProvider.GOOGLE, method=AgentCredentialMethod.GOOGLE_ACCOUNT),
                name="agent_provider_credential_valid_method",
            ),
        ]

    def __str__(self):
        scope = self.user_id or "workspace"
        return f"{self.workspace_id} {scope} {self.provider}"

    def get_secret(self):
        """Return the decrypted API key. Raises ``EncryptionError`` if it cannot be decrypted."""
        return decrypt_data_strict(self.secret)

    def set_api_key(self, api_key):
        """Make this an ``api_key`` credential holding ``api_key``.

        Raises ``ValueError`` on an invalid key and ``EncryptionError`` when it cannot be encrypted.
        """
        error = validate_agent_api_key(api_key)
        if error:
            raise ValueError(error)
        self.method = AgentCredentialMethod.API_KEY
        self.secret = encrypt_data_strict(api_key)
        self.secret_hint = api_key[-4:]
        self.account_label = ""
