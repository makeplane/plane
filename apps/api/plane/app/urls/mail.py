# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.app.views.mail import (
    MailAccountEndpoint,
    MailAttachmentEndpoint,
    MailAttachmentUploadEndpoint,
    MailConfigMeEndpoint,
    MailDraftEndpoint,
    MailFilterRuleViewSet,
    MailFoldersEndpoint,
    MailForwardingEndpoint,
    MailLabelViewSet,
    MailMessageDetailEndpoint,
    MailMessageFlagsEndpoint,
    MailMessagesDeleteEndpoint,
    MailMessagesEndpoint,
    MailMessagesMoveEndpoint,
    MailPreferenceEndpoint,
    MailSavedSearchViewSet,
    MailSearchEndpoint,
    MailSendEndpoint,
    MailSessionEndpoint,
    MailSignatureViewSet,
    MailTemplateViewSet,
)

DETAIL_ACTIONS = {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}

urlpatterns = [
    path("mail/config/me/", MailConfigMeEndpoint.as_view(), name="mail-config-me"),
    path("mail/accounts/", MailAccountEndpoint.as_view(), name="mail-account"),
    path("mail/session/", MailSessionEndpoint.as_view(), name="mail-session"),
    path("mail/folders/", MailFoldersEndpoint.as_view(), name="mail-folders"),
    path("mail/folders/<str:folder_key>/messages/", MailMessagesEndpoint.as_view(), name="mail-messages"),
    path(
        "mail/folders/<str:folder_key>/messages/<int:uid>/",
        MailMessageDetailEndpoint.as_view(),
        name="mail-message-detail",
    ),
    path(
        "mail/folders/<str:folder_key>/messages/<int:uid>/flags/",
        MailMessageFlagsEndpoint.as_view(),
        name="mail-message-flags",
    ),
    path(
        "mail/folders/<str:folder_key>/messages/<int:uid>/attachments/<str:part_id>/",
        MailAttachmentEndpoint.as_view(),
        name="mail-message-attachment",
    ),
    path("mail/messages/move/", MailMessagesMoveEndpoint.as_view(), name="mail-messages-move"),
    path("mail/messages/delete/", MailMessagesDeleteEndpoint.as_view(), name="mail-messages-delete"),
    path("mail/search/", MailSearchEndpoint.as_view(), name="mail-search"),
    path("mail/send/", MailSendEndpoint.as_view(), name="mail-send"),
    path("mail/drafts/", MailDraftEndpoint.as_view(), name="mail-drafts"),
    path("mail/attachments/upload/", MailAttachmentUploadEndpoint.as_view(), name="mail-attachment-upload"),
    path(
        "mail/signatures/",
        MailSignatureViewSet.as_view({"get": "list", "post": "create"}),
        name="mail-signatures",
    ),
    path(
        "mail/signatures/<uuid:pk>/",
        MailSignatureViewSet.as_view(DETAIL_ACTIONS),
        name="mail-signature-detail",
    ),
    path("mail/templates/", MailTemplateViewSet.as_view({"get": "list", "post": "create"}), name="mail-templates"),
    path("mail/templates/<uuid:pk>/", MailTemplateViewSet.as_view(DETAIL_ACTIONS), name="mail-template-detail"),
    path("mail/filters/", MailFilterRuleViewSet.as_view({"get": "list", "post": "create"}), name="mail-filters"),
    path("mail/filters/<uuid:pk>/", MailFilterRuleViewSet.as_view(DETAIL_ACTIONS), name="mail-filter-detail"),
    path("mail/labels/", MailLabelViewSet.as_view({"get": "list", "post": "create"}), name="mail-labels"),
    path("mail/labels/<uuid:pk>/", MailLabelViewSet.as_view(DETAIL_ACTIONS), name="mail-label-detail"),
    path(
        "mail/saved-searches/",
        MailSavedSearchViewSet.as_view({"get": "list", "post": "create"}),
        name="mail-saved-searches",
    ),
    path(
        "mail/saved-searches/<uuid:pk>/",
        MailSavedSearchViewSet.as_view(DETAIL_ACTIONS),
        name="mail-saved-search-detail",
    ),
    path("mail/forwarding/", MailForwardingEndpoint.as_view(), name="mail-forwarding"),
    path("mail/preferences/", MailPreferenceEndpoint.as_view(), name="mail-preferences"),
]
