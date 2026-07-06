# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .base import BaseAPIView
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.serializers import MailboxSerializer, MailAliasSerializer
from plane.mail.models import MailDomain, Mailbox, MailAlias
from plane.mail.utils import hash_mail_password


def _as_bool(value, default=True):
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


class MailboxEndpoint(BaseAPIView):
    """CRUD for virtual mailboxes served by the local Postfix/Dovecot stack.

    Mailboxes live in plane-db; Postfix checks existence here and Dovecot
    authenticates against ``password_hash`` (SHA512-CRYPT). Changes take effect
    immediately, no container restart required.
    """

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        mailboxes = Mailbox.objects.select_related("domain").all()
        return Response(
            MailboxSerializer(mailboxes, many=True).data, status=status.HTTP_200_OK
        )

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email or "@" not in email:
            return Response(
                {"error": "A valid email address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not password:
            return Response(
                {"error": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        local_part, _, domain_name = email.partition("@")
        if not local_part or not domain_name:
            return Response(
                {"error": "A valid email address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Mailbox.objects.filter(email=email).exists():
            return Response(
                {"error": "A mailbox with this address already exists"},
                status=status.HTTP_409_CONFLICT,
            )

        domain_obj, _ = MailDomain.objects.get_or_create(domain=domain_name)

        mailbox = Mailbox.objects.create(
            email=email,
            local_part=local_part,
            domain=domain_obj,
            password_hash=hash_mail_password(password),
            is_active=_as_bool(request.data.get("is_active"), default=True),
            quota_mb=int(request.data.get("quota_mb") or 0),
        )
        return Response(MailboxSerializer(mailbox).data, status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        mailbox = Mailbox.objects.get(pk=pk)

        password = request.data.get("password")
        if password:
            mailbox.password_hash = hash_mail_password(password)
        if "is_active" in request.data:
            mailbox.is_active = _as_bool(request.data.get("is_active"))
        if "quota_mb" in request.data:
            mailbox.quota_mb = int(request.data.get("quota_mb") or 0)

        mailbox.save()
        return Response(MailboxSerializer(mailbox).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        mailbox = Mailbox.objects.get(pk=pk)
        # Hard delete so Postfix/Dovecot stop serving the address immediately;
        # a soft delete would leave is_active=true and keep auth working.
        mailbox.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MailAliasEndpoint(BaseAPIView):
    """CRUD for virtual aliases (Postfix virtual_alias_maps)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        aliases = MailAlias.objects.all()
        return Response(
            MailAliasSerializer(aliases, many=True).data, status=status.HTTP_200_OK
        )

    def post(self, request):
        source = (request.data.get("source") or "").strip().lower()
        destination = (request.data.get("destination") or "").strip().lower()

        if not source or "@" not in source:
            return Response(
                {"error": "A valid source address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not destination or "@" not in destination:
            return Response(
                {"error": "A valid destination address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if MailAlias.objects.filter(source=source).exists():
            return Response(
                {"error": "An alias with this source already exists"},
                status=status.HTTP_409_CONFLICT,
            )

        alias = MailAlias.objects.create(
            source=source,
            destination=destination,
            is_active=_as_bool(request.data.get("is_active"), default=True),
        )
        return Response(MailAliasSerializer(alias).data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        alias = MailAlias.objects.get(pk=pk)
        # Hard delete so Postfix stops resolving the alias immediately.
        alias.delete(soft=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MailConfigEndpoint(BaseAPIView):
    """Returns mail-stack runtime info for the god-mode UI (domain, mode)."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request):
        mail_domain = os.environ.get("MAIL_DOMAIN", "")
        mail_local = (
            os.environ.get("MAIL_LOCAL", "").strip().lower() == "true"
            or not mail_domain
        )

        return Response(
            {"mail_domain": mail_domain, "mail_local": mail_local},
            status=status.HTTP_200_OK,
        )
