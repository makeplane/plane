# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import ssl

from plane.mail.conf import get_mail_config
from plane.mail.exceptions import MailConfigurationError
from plane.mail.folders import build_folder_map, resolve_folder_name


class MailIMAPSession:
    def __init__(self, mailbox):
        self.mailbox = mailbox
        self.config = get_mail_config()
        self.client = None
        self.folder_map = None

    def _ssl_context(self):
        if self.config.imap_verify_ssl:
            return ssl.create_default_context()
        return ssl._create_unverified_context()

    def __enter__(self):
        if not self.config.master_password:
            raise MailConfigurationError("MAIL_MASTER_PASSWORD is not configured.")

        from imapclient import IMAPClient

        context = self._ssl_context()
        self.client = IMAPClient(
            self.config.imap_host,
            port=self.config.imap_port,
            ssl=self.config.imap_use_ssl,
            ssl_context=context if self.config.imap_use_ssl else None,
            timeout=self.config.imap_timeout,
            use_uid=True,
        )
        if self.config.imap_starttls and not self.config.imap_use_ssl:
            self.client.starttls(ssl_context=context)

        login_name = f"{self.mailbox.email}{self.config.master_separator}{self.config.master_user}"
        self.client.login(login_name, self.config.master_password)
        return self

    def __exit__(self, exc_type, exc, traceback):
        if not self.client:
            return
        try:
            self.client.logout()
        finally:
            self.client = None
            self.folder_map = None

    def get_folder_map(self, refresh=False):
        if refresh or self.folder_map is None:
            self.folder_map = build_folder_map(self.client.list_folders())
        return self.folder_map

    def select_folder(self, key, readonly=False):
        folder_map = self.get_folder_map()
        folder_name = resolve_folder_name(folder_map, key)
        return self.client.select_folder(folder_name, readonly=readonly)
