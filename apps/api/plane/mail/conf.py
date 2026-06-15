# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from dataclasses import dataclass

from plane.license.utils.instance_value import get_mail_configuration


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def _to_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class MailConfiguration:
    imap_host: str
    imap_port: int
    imap_use_ssl: bool
    imap_starttls: bool
    imap_verify_ssl: bool
    imap_timeout: int
    smtp_host: str
    smtp_port: int
    smtp_use_tls: bool
    smtp_use_ssl: bool
    master_user: str
    master_password: str
    master_separator: str
    max_attachment_bytes: int
    sieve_host: str
    sieve_port: int
    sieve_starttls: bool


def get_mail_config() -> MailConfiguration:
    (
        imap_host,
        imap_port,
        imap_use_ssl,
        imap_starttls,
        imap_verify_ssl,
        imap_timeout,
        smtp_host,
        smtp_port,
        smtp_use_tls,
        smtp_use_ssl,
        master_user,
        master_password,
        master_separator,
        max_attachment_bytes,
        sieve_host,
        sieve_port,
        sieve_starttls,
    ) = get_mail_configuration()

    return MailConfiguration(
        imap_host=imap_host or "dovecot",
        imap_port=_to_int(imap_port, 993),
        imap_use_ssl=_to_bool(imap_use_ssl, True),
        imap_starttls=_to_bool(imap_starttls, False),
        imap_verify_ssl=_to_bool(imap_verify_ssl, False),
        imap_timeout=_to_int(imap_timeout, 15),
        smtp_host=smtp_host or "postfix",
        smtp_port=_to_int(smtp_port, 587),
        smtp_use_tls=_to_bool(smtp_use_tls, True),
        smtp_use_ssl=_to_bool(smtp_use_ssl, False),
        master_user=master_user or "master",
        master_password=master_password or "",
        master_separator=master_separator or "*",
        max_attachment_bytes=_to_int(max_attachment_bytes, 25 * 1024 * 1024),
        sieve_host=sieve_host or imap_host or "dovecot",
        sieve_port=_to_int(sieve_port, 4190),
        sieve_starttls=_to_bool(sieve_starttls, True),
    )
