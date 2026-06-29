# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.serializers.mail import MailPreferenceSerializer
from plane.db.models import User
from plane.mail.models import MailDomain, Mailbox, MailPreference, MailSignature


@pytest.fixture
def mailbox(db, create_user):
    domain = MailDomain.objects.create(domain="example.com")
    return Mailbox.objects.create(
        email="test@example.com",
        local_part="test",
        domain=domain,
        owner=create_user,
        password_hash="hash",
    )


@pytest.mark.unit
@pytest.mark.django_db
def test_mail_preference_serializer_accepts_supported_values(mailbox):
    preference = MailPreference.objects.create(mailbox=mailbox)
    serializer = MailPreferenceSerializer(
        preference,
        data={
            "density": "compact",
            "theme": "dark",
            "reading_pane": "bottom",
            "messages_per_page": 50,
            "mark_read_delay_ms": 0,
            "language": "en",
        },
        partial=True,
        context={"mailbox": mailbox},
    )

    assert serializer.is_valid(), serializer.errors
    updated_preference = serializer.save()
    assert updated_preference.density == "compact"
    assert updated_preference.theme == "dark"
    assert updated_preference.reading_pane == "bottom"
    assert updated_preference.messages_per_page == 50
    assert updated_preference.mark_read_delay_ms == 0
    assert updated_preference.language == "en"


@pytest.mark.unit
@pytest.mark.django_db
def test_mail_preference_serializer_rejects_unsupported_values(mailbox):
    preference = MailPreference.objects.create(mailbox=mailbox)
    serializer = MailPreferenceSerializer(
        preference,
        data={
            "density": "dense",
            "theme": "custom",
            "reading_pane": "left",
            "messages_per_page": 75,
            "mark_read_delay_ms": 10001,
            "language": "de",
        },
        partial=True,
        context={"mailbox": mailbox},
    )

    assert not serializer.is_valid()
    assert "density" in serializer.errors
    assert "theme" in serializer.errors
    assert "reading_pane" in serializer.errors
    assert "messages_per_page" in serializer.errors
    assert "mark_read_delay_ms" in serializer.errors
    assert "language" in serializer.errors


@pytest.mark.unit
@pytest.mark.django_db
def test_mail_preference_serializer_rejects_default_signature_from_another_mailbox(mailbox):
    other_user = User.objects.create(email="other@example.com", first_name="Other", last_name="User")
    other_mailbox = Mailbox.objects.create(
        email="other@example.com",
        local_part="other",
        domain=mailbox.domain,
        owner=other_user,
        password_hash="hash",
    )
    other_signature = MailSignature.objects.create(
        mailbox=other_mailbox,
        name="Other signature",
        content_text="Regards",
        is_active=True,
    )
    preference = MailPreference.objects.create(mailbox=mailbox)
    serializer = MailPreferenceSerializer(
        preference,
        data={"default_signature": str(other_signature.id)},
        partial=True,
        context={"mailbox": mailbox},
    )

    assert not serializer.is_valid()
    assert "default_signature" in serializer.errors
