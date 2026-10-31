# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Secrets in the Hub: stored encrypted, readable only by the publisher and the people the publisher chose.

Workspace admins get no special access: if the publisher did not allow them, they cannot read the value.
Every reveal, change and change of access is written to a log the publisher can read, without the value.
"""

# Python imports
import base64
import hashlib
import os

# Django imports
from django.conf import settings
from django.db.models import Q

# Third party imports
from cryptography.fernet import Fernet, InvalidToken
from rest_framework.exceptions import NotFound, ParseError

# Module imports
from plane.team_ops.models import HubSecret, HubSecretAccess, HubSecretLog
from plane.team_ops.services.access import calendar_user_ids
from plane.team_ops.services.notifications import notify

MAX_VALUE = 20000


def _fernet():
    """The key is `TEAM_OPS_SECRET_KEY` (a Fernet key) when set; otherwise one derived from Django's SECRET_KEY."""
    configured = os.environ.get("TEAM_OPS_SECRET_KEY")
    if configured:
        return Fernet(configured.encode())
    digest = hashlib.sha256(f"team-ops-secrets:{settings.SECRET_KEY}".encode()).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(value):
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token):
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        raise ParseError(detail="The secret cannot be read with the current key.")


def write_log(secret, user, action, target_id=None):
    HubSecretLog.objects.create(secret=secret, user=user, action=action, target_id=target_id)


def readers(secret):
    return set(HubSecretAccess.objects.filter(secret=secret).values_list("user_id", flat=True)) | {secret.publisher_id}


def visible(workspace, user):
    """Secrets the person published or was given access to. Others do not show up at all."""
    # Through the access model's own manager: a joined lookup would still see access that was taken back.
    granted = HubSecretAccess.objects.filter(user=user).values("secret_id")
    return (
        HubSecret.objects.filter(workspace=workspace)
        .filter(Q(publisher=user) | Q(pk__in=granted))
        .select_related("publisher", "project")
    )


def get_visible(workspace, user, pk):
    secret = visible(workspace, user).filter(pk=pk).first()
    if secret is None:
        raise NotFound("Secret not found.")  # the same answer for "missing" and "not yours"
    return secret


def get_published(workspace, user, pk):
    secret = HubSecret.objects.filter(workspace=workspace, pk=pk, publisher=user).first()
    if secret is None:
        raise NotFound("Secret not found.")
    return secret


def check_value(value):
    if not isinstance(value, str) or not value or len(value) > MAX_VALUE:
        raise ParseError(detail=f"A secret value is needed, at most {MAX_VALUE} characters.")


def publish(workspace, user, name, description, value, project=None):
    name = (name or "").strip()
    if not name or len(name) > 200:
        raise ParseError(detail="Give the secret a name.")
    check_value(value)
    secret = HubSecret.objects.create(
        workspace=workspace,
        publisher=user,
        project=project,
        name=name,
        description=(description or "")[:2000],
        ciphertext=encrypt(value),
    )
    write_log(secret, user, HubSecretLog.Action.CREATE)
    return secret


def reveal(secret, user):
    write_log(secret, user, HubSecretLog.Action.REVEAL)
    return decrypt(secret.ciphertext)


def update(secret, user, name=None, description=None, value=None):
    if name is not None:
        if not name.strip() or len(name) > 200:
            raise ParseError(detail="Give the secret a name.")
        secret.name = name.strip()
    if description is not None:
        secret.description = description[:2000]
    if value is not None:
        check_value(value)
        secret.ciphertext = encrypt(value)
    secret.save()
    write_log(secret, user, HubSecretLog.Action.UPDATE)
    return secret


def set_access(secret, publisher, user_ids):
    """Replace the list of people allowed to read the secret. Newly allowed people are told."""
    allowed = calendar_user_ids(secret.workspace) - {publisher.id}
    wanted = set(user_ids)
    if not wanted <= allowed:
        raise ParseError(detail="You can only share a secret with colleagues in this workspace.")
    current = set(HubSecretAccess.objects.filter(secret=secret).values_list("user_id", flat=True))
    for user_id in wanted - current:
        HubSecretAccess.objects.create(secret=secret, user_id=user_id)
        write_log(secret, publisher, HubSecretLog.Action.GRANT, user_id)
    for user_id in current - wanted:
        for row in HubSecretAccess.objects.filter(secret=secret, user_id=user_id):
            row.delete(soft=False)
        write_log(secret, publisher, HubSecretLog.Action.REVOKE, user_id)
    notify(
        secret.workspace,
        wanted - current,
        "SECRET",
        f'{publisher.display_name} shared the secret "{secret.name}" with you',
        link="team-ops/hub?section=secrets",
        actor=publisher,
    )
