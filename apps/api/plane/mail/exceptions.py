# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.


class MailError(Exception):
    """Base exception for the live mail client."""


class MailboxNotConfiguredError(MailError):
    """The authenticated user has no mailbox attached to the instance."""


class MailConfigurationError(MailError):
    """Required IMAP/SMTP configuration is missing or invalid."""


class MailFolderError(MailError):
    """A requested mail folder is unknown or cannot be used for this action."""


class MailAttachmentError(MailError):
    """Attachment lookup or validation failed."""
