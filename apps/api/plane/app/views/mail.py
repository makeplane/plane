# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import uuid
from io import BytesIO
from pathlib import PurePosixPath

from django.core.files.storage import default_storage
from django.http import FileResponse
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from plane.app.serializers.mail import (
    MailFilterRuleSerializer,
    MailForwardingSerializer,
    MailLabelSerializer,
    MailPreferenceSerializer,
    MailSavedSearchSerializer,
    MailSignatureSerializer,
    MailTemplateSerializer,
)
from plane.bgtasks.mail_send_task import send_mail_task
from plane.mail.client import MailClient
from plane.mail.conf import get_mail_config
from plane.mail.exceptions import MailAttachmentError, MailError
from plane.mail.models import (
    MailFilterRule,
    MailForwarding,
    MailLabel,
    MailPreference,
    MailSavedSearch,
    MailSignature,
    MailTemplate,
)
from plane.mail.resolver import ResolveMailboxMixin

from .base import BaseAPIView, BaseViewSet


class MailAPIView(ResolveMailboxMixin, BaseAPIView):
    def mailbox_or_response(self):
        mailbox = self.get_mailbox()
        if mailbox is None:
            return None, Response(
                {"has_mailbox": False, "error": "No mailbox is configured for this user."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return mailbox, None

    def client_or_response(self):
        mailbox, response = self.mailbox_or_response()
        if response:
            return None, response
        return MailClient(mailbox), None

    def mail_error_response(self, error):
        return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)


class MailConfigMeEndpoint(MailAPIView):
    def get(self, request):
        mailbox = self.get_mailbox()
        if mailbox is None:
            return Response({"has_mailbox": False}, status=status.HTTP_200_OK)

        return Response(
            {
                "has_mailbox": True,
                "mailbox": {
                    "id": str(mailbox.id),
                    "email": mailbox.email,
                    "local_part": mailbox.local_part,
                    "domain": mailbox.domain.domain if mailbox.domain_id else "",
                    "quota_mb": mailbox.quota_mb,
                    "owner_id": str(mailbox.owner_id) if mailbox.owner_id else None,
                },
            },
            status=status.HTTP_200_OK,
        )


class MailFoldersEndpoint(MailAPIView):
    def get(self, request):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            return Response(client.list_folders(), status=status.HTTP_200_OK)
        except MailError as error:
            return self.mail_error_response(error)


class MailMessagesEndpoint(MailAPIView):
    def get(self, request, folder_key):
        client, response = self.client_or_response()
        if response:
            return response
        filters = {
            "q": request.GET.get("q"),
            "query": request.GET.get("query"),
            "from": request.GET.get("from"),
            "to": request.GET.get("to"),
            "unread": request.GET.get("unread"),
            "starred": request.GET.get("starred"),
        }
        try:
            return Response(
                client.list_messages(
                    folder_key=folder_key,
                    page=request.GET.get("page", 1),
                    per_page=request.GET.get("per_page", 25),
                    filters={key: value for key, value in filters.items() if value not in (None, "")},
                ),
                status=status.HTTP_200_OK,
            )
        except MailError as error:
            return self.mail_error_response(error)


class MailMessageDetailEndpoint(MailAPIView):
    def get(self, request, folder_key, uid):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            message = client.get_message(folder_key=folder_key, uid=uid)
            if message is None:
                return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)
            return Response(message, status=status.HTTP_200_OK)
        except MailError as error:
            return self.mail_error_response(error)


class MailMessageFlagsEndpoint(MailAPIView):
    def post(self, request, folder_key, uid):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            return Response(
                client.set_flags(
                    folder_key=folder_key,
                    uids=[uid],
                    read=request.data.get("read"),
                    starred=request.data.get("starred"),
                ),
                status=status.HTTP_200_OK,
            )
        except MailError as error:
            return self.mail_error_response(error)


class MailMessagesMoveEndpoint(MailAPIView):
    def post(self, request):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            return Response(
                client.move(
                    src_folder=request.data.get("src_folder", "inbox"),
                    dst_folder=request.data.get("dst_folder"),
                    uids=request.data.get("uids") or [],
                ),
                status=status.HTTP_200_OK,
            )
        except MailError as error:
            return self.mail_error_response(error)


class MailMessagesDeleteEndpoint(MailAPIView):
    def post(self, request):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            return Response(
                client.delete(
                    src_folder=request.data.get("src_folder", "inbox"),
                    uids=request.data.get("uids") or [],
                    permanent=bool(request.data.get("permanent")),
                ),
                status=status.HTTP_200_OK,
            )
        except MailError as error:
            return self.mail_error_response(error)


class MailSearchEndpoint(MailAPIView):
    def get(self, request):
        client, response = self.client_or_response()
        if response:
            return response
        filters = {
            "folder_key": request.GET.get("folder_key"),
            "from": request.GET.get("from"),
            "to": request.GET.get("to"),
            "unread": request.GET.get("unread"),
            "starred": request.GET.get("starred"),
        }
        try:
            return Response(
                client.search(
                    query=request.GET.get("q") or request.GET.get("query") or "",
                    filters={key: value for key, value in filters.items() if value not in (None, "")},
                    page=request.GET.get("page", 1),
                    per_page=request.GET.get("per_page", 25),
                ),
                status=status.HTTP_200_OK,
            )
        except MailError as error:
            return self.mail_error_response(error)


class MailSendEndpoint(MailAPIView):
    def post(self, request):
        mailbox, response = self.mailbox_or_response()
        if response:
            return response
        send_mail_task.delay(str(mailbox.id), request.data, str(request.user.id))
        return Response({"queued": True}, status=status.HTTP_202_ACCEPTED)


class MailDraftEndpoint(MailAPIView):
    def post(self, request):
        return self._save(request)

    def put(self, request):
        return self._save(request)

    def _save(self, request):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            return Response(client.save_draft(request.data), status=status.HTTP_200_OK)
        except MailError as error:
            return self.mail_error_response(error)


class MailAttachmentEndpoint(MailAPIView):
    def get(self, request, folder_key, uid, part_id):
        client, response = self.client_or_response()
        if response:
            return response
        try:
            attachment = client.attachment(folder_key=folder_key, uid=uid, part_id=part_id)
        except MailAttachmentError as error:
            return Response({"error": str(error)}, status=status.HTTP_404_NOT_FOUND)
        except MailError as error:
            return self.mail_error_response(error)

        return FileResponse(
            BytesIO(attachment["content"]),
            as_attachment=True,
            filename=attachment["filename"],
            content_type=attachment["content_type"],
        )


class MailAttachmentUploadEndpoint(MailAPIView):
    def post(self, request):
        mailbox, response = self.mailbox_or_response()
        if response:
            return response

        upload = request.FILES.get("file")
        if upload is None:
            return Response({"error": "file is required"}, status=status.HTTP_400_BAD_REQUEST)

        max_size = get_mail_config().max_attachment_bytes
        if upload.size > max_size:
            return Response({"error": "Attachment exceeds maximum size."}, status=status.HTTP_400_BAD_REQUEST)

        filename = PurePosixPath(upload.name).name
        key = f"mail-attachments/{mailbox.id}/{uuid.uuid4().hex}/{filename}"
        saved_key = default_storage.save(key, upload)
        return Response(
            {
                "key": saved_key,
                "filename": filename,
                "content_type": upload.content_type or "application/octet-stream",
                "size": upload.size,
            },
            status=status.HTTP_201_CREATED,
        )


class ScopedMailViewSet(ResolveMailboxMixin, BaseViewSet):
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if self.get_mailbox() is None:
            raise PermissionDenied("No mailbox is configured for this user.")

    def get_queryset(self):
        return super().get_queryset().filter(mailbox=self.get_mailbox())

    def perform_create(self, serializer):
        serializer.save(mailbox=self.get_mailbox())


class MailSignatureViewSet(ScopedMailViewSet):
    model = MailSignature
    serializer_class = MailSignatureSerializer


class MailTemplateViewSet(ScopedMailViewSet):
    model = MailTemplate
    serializer_class = MailTemplateSerializer


class MailFilterRuleViewSet(ScopedMailViewSet):
    model = MailFilterRule
    serializer_class = MailFilterRuleSerializer


class MailLabelViewSet(ScopedMailViewSet):
    model = MailLabel
    serializer_class = MailLabelSerializer


class MailSavedSearchViewSet(ScopedMailViewSet):
    model = MailSavedSearch
    serializer_class = MailSavedSearchSerializer


class MailSingletonEndpoint(MailAPIView):
    model = None
    serializer_class = None
    defaults = {}

    def get_object(self):
        mailbox = self.require_mailbox()
        obj, _ = self.model.objects.get_or_create(mailbox=mailbox, defaults=self.defaults)
        return obj

    def get(self, request):
        try:
            serializer = self.serializer_class(self.get_object())
            return Response(serializer.data, status=status.HTTP_200_OK)
        except MailError as error:
            return self.mail_error_response(error)

    def patch(self, request):
        try:
            obj = self.get_object()
            serializer = self.serializer_class(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except MailError as error:
            return self.mail_error_response(error)

    def put(self, request):
        return self.patch(request)


class MailForwardingEndpoint(MailSingletonEndpoint):
    model = MailForwarding
    serializer_class = MailForwardingSerializer


class MailPreferenceEndpoint(MailSingletonEndpoint):
    model = MailPreference
    serializer_class = MailPreferenceSerializer
