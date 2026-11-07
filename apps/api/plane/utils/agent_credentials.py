# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Resolution of the model-provider credential an agent chat runs with.

Precedence when a chat starts: the member's personal credential, then the
workspace's shared API key, then the God-mode admin's agent ``env``.
"""

# Django imports
from django.db.models import Q

# Module imports
from plane.db.models import AgentCredentialMethod, AgentProviderCredential
from plane.db.models.agent_provider import (
    AGENT_ADAPTER_PROVIDER,
    AGENT_AUTH_ENV,
    AGENT_PROVIDER_INSTANCE_ENV,
    AGENT_PROVIDER_KEY_ENV,
    AGENT_PROVIDER_ORDER,
    AGENT_PROVIDER_REPLACED_ENV,
)
from plane.license.models import AgentDefinition
from plane.license.utils.encryption import EncryptionError
from plane.utils.exception_logger import log_exception

CREDENTIAL_SOURCE_PERSONAL = "personal"
CREDENTIAL_SOURCE_WORKSPACE = "workspace"
CREDENTIAL_SOURCE_INSTANCE = "instance"


def resolve_agent_credential(workspace, user, adapter):
    """Return ``(credential, source)`` for an agent with ``adapter``.

    ``credential`` is ``None`` (source ``"instance"``) when neither the member nor
    the workspace has one, or the adapter has no provider (e.g. DeepSeek).
    """
    provider = AGENT_ADAPTER_PROVIDER.get(adapter)
    if provider is None:
        return None, CREDENTIAL_SOURCE_INSTANCE
    rows = AgentProviderCredential.objects.filter(
        Q(user__isnull=True) | Q(user=user), workspace=workspace, provider=provider
    )
    personal = shared = None
    for row in rows:
        if row.user_id is None:
            shared = row
        else:
            personal = row
    if personal is not None:
        return personal, CREDENTIAL_SOURCE_PERSONAL
    if shared is not None:
        return shared, CREDENTIAL_SOURCE_WORKSPACE
    return None, CREDENTIAL_SOURCE_INSTANCE


def build_agent_env(admin_env, credential):
    """Return the adapter env for ``credential`` layered over the admin's ``admin_env``.

    Without a credential the admin env is returned unchanged. Otherwise the
    provider's credential vars are dropped from it and replaced by
    ``PLANE_AGENT_AUTH`` (plus the key var for an API key). Raises
    ``EncryptionError`` when the stored key cannot be decrypted.
    """
    if credential is None:
        return dict(admin_env)
    replaced = AGENT_PROVIDER_REPLACED_ENV[credential.provider]
    env = {key: value for key, value in admin_env.items() if key not in replaced}
    env[AGENT_AUTH_ENV] = credential.method
    if credential.method == AgentCredentialMethod.API_KEY:
        env[AGENT_PROVIDER_KEY_ENV[credential.provider]] = credential.get_secret()
    return env


def instance_configured_providers():
    """Providers for which some enabled agent's admin env carries a credential."""
    configured = set()
    for agent in AgentDefinition.objects.filter(is_enabled=True, adapter__in=list(AGENT_ADAPTER_PROVIDER)):
        provider = AGENT_ADAPTER_PROVIDER[agent.adapter]
        if provider in configured:
            continue
        try:
            env = agent.get_env()
        except EncryptionError as e:
            log_exception(e)
            continue
        if any(env.get(key) for key in AGENT_PROVIDER_INSTANCE_ENV[provider]):
            configured.add(provider)
    return configured


def provider_entries(workspace, user, is_admin, providers=AGENT_PROVIDER_ORDER):
    """The member-facing state of each provider in ``providers``. Never includes a secret."""
    rows = AgentProviderCredential.objects.filter(
        Q(user__isnull=True) | Q(user=user), workspace=workspace, provider__in=list(providers)
    )
    personal = {}
    shared = {}
    for row in rows:
        (shared if row.user_id is None else personal)[row.provider] = row
    configured = instance_configured_providers()

    entries = []
    for provider in providers:
        own = personal.get(provider)
        workspace_row = shared.get(provider)
        entries.append(
            {
                "provider": provider,
                "personal": (
                    {
                        "method": own.method,
                        "secret_hint": own.secret_hint,
                        "account_label": own.account_label,
                        "updated_at": own.updated_at,
                    }
                    if own
                    else None
                ),
                "workspace": (
                    {
                        "method": workspace_row.method,
                        "secret_hint": workspace_row.secret_hint,
                        "updated_at": workspace_row.updated_at,
                    }
                    if workspace_row
                    else None
                ),
                "instance_configured": provider in configured,
                "can_manage_workspace": is_admin,
            }
        )
    return entries
