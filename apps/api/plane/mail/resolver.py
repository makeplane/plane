# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.mail.exceptions import MailboxNotConfiguredError
from plane.mail.models import Mailbox


def resolve_mailbox_for_user(user):
    if not user or not user.is_authenticated:
        return None

    mailbox = Mailbox.objects.filter(owner=user, is_active=True).select_related("domain", "owner").first()
    if mailbox:
        return mailbox

    user_email = (getattr(user, "email", "") or "").strip()
    if not user_email:
        return None

    return (
        Mailbox.objects.filter(email__iexact=user_email, is_active=True)
        .select_related("domain", "owner")
        .first()
    )


class ResolveMailboxMixin:
    _resolved_mailbox = None

    def get_mailbox(self):
        if self._resolved_mailbox is None:
            self._resolved_mailbox = resolve_mailbox_for_user(self.request.user)
        return self._resolved_mailbox

    def require_mailbox(self):
        mailbox = self.get_mailbox()
        if mailbox is None:
            raise MailboxNotConfiguredError("No mailbox is configured for this user.")
        return mailbox
