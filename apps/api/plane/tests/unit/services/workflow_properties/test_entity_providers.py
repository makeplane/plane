# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for §14.4 ENTITY_REFERENCE provider registry."""

# Third Party imports
import pytest
from uuid import uuid4

# Module imports
from plane.db.models import User
from plane.services.workflow_properties import (
    display_entity,
    get_entity_provider,
    register_entity_provider,
    reset_entity_providers,
    resolve_entity,
)
from plane.services.workflow_properties.entity_providers import (
    EntityReferenceProvider,
)


@pytest.mark.unit
@pytest.mark.django_db
class TestBuiltinUserProvider:
    def test_user_provider_resolves_active_user(self, db, create_user):
        ok, reason, record = resolve_entity("user", str(create_user.id))
        assert ok
        assert reason is None
        assert record is not None
        assert str(record.id) == str(create_user.id)

    def test_user_provider_rejects_inactive_user(self, db, create_user):
        create_user.is_active = False
        create_user.save()
        ok, reason, _ = resolve_entity("user", str(create_user.id))
        assert not ok
        assert reason

    def test_user_provider_rejects_dangling_reference(self, db):
        ok, reason, _ = resolve_entity("user", str(uuid4()))
        assert not ok
        assert reason

    def test_user_provider_rejects_unknown_type(self, db):
        ok, reason, _ = resolve_entity("vendor", "anything")
        assert not ok
        assert reason

    def test_display_for_user(self, db, create_user):
        create_user.first_name = "Jane"
        create_user.last_name = "Doe"
        create_user.save()
        result = display_entity("user", str(create_user.id))
        assert result is not None
        assert "Jane" in result

    def test_display_returns_none_for_dangling(self, db):
        assert display_entity("user", str(uuid4())) is None

    def test_display_returns_none_for_unknown_type(self, db):
        assert display_entity("vendor", "anything") is None


@pytest.mark.unit
@pytest.mark.django_db
class TestRegistryAPI:
    def test_register_and_lookup(self):
        reset_entity_providers()
        provider = EntityReferenceProvider(
            entity_type="asset",
            resolve=lambda _id: object(),
        )
        register_entity_provider(provider)
        assert get_entity_provider("asset") is provider
        reset_entity_providers()

    def test_register_replaces_existing(self):
        reset_entity_providers()
        first = EntityReferenceProvider(entity_type="vendor", resolve=lambda _id: None)
        second = EntityReferenceProvider(entity_type="vendor", resolve=lambda _id: object())
        register_entity_provider(first)
        register_entity_provider(second)
        assert get_entity_provider("vendor") is second
        reset_entity_providers()

    def test_register_rejects_blank_entity_type(self):
        with pytest.raises(ValueError):
            register_entity_provider(
                EntityReferenceProvider(entity_type="", resolve=lambda _id: None)
            )

    def test_validate_returns_false_when_resolve_returns_none(self):
        provider = EntityReferenceProvider(
            entity_type="department",
            resolve=lambda _id: None,
        )
        ok, reason = provider.validate("missing")
        assert not ok
        assert "department" in reason
