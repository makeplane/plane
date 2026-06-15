# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Mapping between user-facing mail labels and IMAP keywords.

Labels are not folders; membership is expressed as a custom IMAP keyword
(custom flag) set on a message. Label names can contain spaces or non-ASCII
characters (e.g. Cyrillic) which are not valid IMAP keyword atoms, so we derive
a deterministic ASCII-safe keyword from the label id. The same helper is used by
both the Sieve generator (which sets the keyword on delivery) and search (which
queries ``KEYWORD <kw>``) so the two always agree.
"""


def label_keyword(label):
    """Return the deterministic IMAP keyword for a MailLabel instance."""
    return f"GzL{label.id.hex[:16]}"


def resolve_label_keyword(mailbox, label_id):
    """Resolve a label id (as sent by the client) to its IMAP keyword.

    Returns ``None`` when the label does not belong to the mailbox.
    """
    if not label_id:
        return None
    from plane.mail.models import MailLabel

    label = MailLabel.objects.filter(
        mailbox=mailbox, pk=str(label_id), deleted_at__isnull=True
    ).first()
    return label_keyword(label) if label else None
