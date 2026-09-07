# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend
from django.core.mail.backends.smtp import EmailBackend as SMTPEmailBackend

# Module imports
from plane.license.utils.graph_mail import send_graph_email
from plane.license.utils.instance_value import get_graph_email_configuration


class PlaneEmailBackend(BaseEmailBackend):
    """Routes outgoing mail through Microsoft Graph when EMAIL_PROVIDER is set
    to MICROSOFT_GRAPH, otherwise delegates to Django's SMTP backend using the
    same connection kwargs Plane already builds via get_email_configuration().
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently)
        self._smtp_kwargs = kwargs

    def send_messages(self, email_messages):
        if not email_messages:
            return 0

        (
            email_provider,
            tenant_id,
            client_id,
            client_secret,
            sender,
        ) = get_graph_email_configuration()

        if email_provider != "MICROSOFT_GRAPH":
            smtp_backend = SMTPEmailBackend(fail_silently=self.fail_silently, **self._smtp_kwargs)
            return smtp_backend.send_messages(email_messages)

        if not all([tenant_id, client_id, client_secret, sender]):
            if self.fail_silently:
                return 0
            raise ImproperlyConfigured(
                "EMAIL_PROVIDER is set to MICROSOFT_GRAPH but EMAIL_GRAPH_TENANT_ID, "
                "EMAIL_GRAPH_CLIENT_ID, EMAIL_GRAPH_CLIENT_SECRET, or EMAIL_HOST_USER "
                "is not configured."
            )

        sent = 0
        for message in email_messages:
            try:
                send_graph_email(tenant_id, client_id, client_secret, sender, message)
                sent += 1
            except Exception:
                if not self.fail_silently:
                    raise
        return sent
