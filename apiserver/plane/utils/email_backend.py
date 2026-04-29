# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

"""
Custom SMTP Email Backend that disables SSL hostname verification.

This is needed because some SMTP providers (e.g., Brevo/Sendinblue) use
load-balanced SMTP servers whose SSL certificates are issued for regional
hostnames (e.g., smtp-relay-offshore-southamerica-east-v2.sendinblue.com)
that differ from the DNS-resolvable hostname (smtp-relay.brevo.com).

This causes Python's SSL stack to reject the connection with:
    ssl.SSLCertVerificationError: [SSL: CERTIFICATE_VERIFY_FAILED]
    certificate verify failed: Hostname mismatch

Set EMAIL_SSL_HOSTNAME_VERIFY=False in your environment to enable this fix.
"""

import ssl

from django.core.mail.backends.smtp import EmailBackend


class SMTPEmailBackend(EmailBackend):
    """
    Custom SMTP backend that allows disabling SSL hostname verification.
    """

    @property
    def ssl_context(self):
        if self.ssl_certfile or self.ssl_keyfile:
            ssl_context = ssl.SSLContext(protocol=ssl.PROTOCOL_TLS_CLIENT)
            ssl_context.load_cert_chain(self.ssl_certfile, self.ssl_keyfile)
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            return ssl_context
        else:
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            return ctx
