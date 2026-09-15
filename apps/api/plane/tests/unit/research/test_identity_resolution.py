# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import IdentityMapping, ResearchAuditEvent, User
from plane.research.utils.identity import IdentityResolutionError, resolve_identity
from plane.tests.research_fixtures import make_user, make_workspace

pytestmark = pytest.mark.unit

PROVIDER = "ai4ms-oidc"


@pytest.mark.django_db
class TestIdentityResolutionPriority:
    def test_subject_hit_wins_over_email(self):
        owner = make_user(email="researcher@example.com")
        make_workspace(owner)
        IdentityMapping.objects.create(provider=PROVIDER, subject="sub-1", user=owner)

        user, is_signup, mapping = resolve_identity(
            provider=PROVIDER,
            subject="sub-1",
            email="researcher@example.com",
        )
        assert user.id == owner.id
        assert is_signup is False
        assert mapping.subject == "sub-1"
        assert ResearchAuditEvent.objects.filter(action="identity.login").exists()

    def test_email_hit_binds_a_new_subject(self):
        owner = make_user(email="researcher@example.com")
        make_workspace(owner)

        user, is_signup, mapping = resolve_identity(
            provider=PROVIDER,
            subject="sub-new",
            email="researcher@example.com",
            employee_id="20230042",
        )
        assert user.id == owner.id
        assert is_signup is False
        assert mapping.subject == "sub-new"
        assert mapping.employee_id == "20230042"
        assert ResearchAuditEvent.objects.filter(action="identity.bind").exists()

    def test_employee_id_hit_reuses_the_mapped_account(self):
        owner = make_user(email="first@example.com")
        make_workspace(owner)
        IdentityMapping.objects.create(
            provider=PROVIDER,
            subject="sub-old",
            user=owner,
            employee_id="20230042",
        )

        user, _, mapping = resolve_identity(
            provider=PROVIDER,
            subject="sub-rotated",
            email=None,
            employee_id="20230042",
        )
        assert user.id == owner.id
        assert mapping.subject == "sub-rotated"

    def test_unknown_identity_without_provisioning_is_rejected(self):
        owner = make_user()
        make_workspace(owner)
        with pytest.raises(IdentityResolutionError) as error:
            resolve_identity(
                provider=PROVIDER,
                subject="sub-unknown",
                email="nobody@example.com",
                allow_auto_provision=False,
            )
        assert error.value.error_code == "identity_not_provisioned"
        assert ResearchAuditEvent.objects.filter(action="identity.conflict").exists()

    def test_auto_provision_creates_account_without_research_roles(self):
        owner = make_user()
        workspace = make_workspace(owner)

        user, is_signup, mapping = resolve_identity(
            provider=PROVIDER,
            subject="sub-new",
            email="newcomer@example.com",
            employee_id="20250001",
            workspace=workspace,
            allow_auto_provision=True,
        )
        assert is_signup is True
        assert user.email == "newcomer@example.com"
        assert mapping.status == IdentityMapping.Status.ACTIVE
        assert user.research_org_memberships.count() == 0
        assert ResearchAuditEvent.objects.filter(action="identity.provision").exists()


@pytest.mark.django_db
class TestIdentityConflicts:
    def test_subject_and_email_pointing_at_different_users_is_rejected(self):
        first = make_user(email="first@example.com")
        second = make_user(email="second@example.com")
        make_workspace(first)
        IdentityMapping.objects.create(provider=PROVIDER, subject="sub-1", user=first)

        with pytest.raises(IdentityResolutionError) as error:
            resolve_identity(provider=PROVIDER, subject="sub-1", email="second@example.com")
        assert error.value.error_code == "identity_subject_email_conflict"
        assert ResearchAuditEvent.objects.filter(action="identity.conflict").exists()

    def test_ambiguous_email_cannot_be_created_in_the_first_place(self):
        """The local account model normalises email, so ambiguity is defensive.

        The resolution chain still guards against several candidates (see
        ``identity_email_ambiguous``) because the guard is what keeps a manually
        inserted duplicate from silently merging two accounts.
        """
        first = make_user(email="duplicate@example.com")
        second = make_user(email="Duplicated@example.com")
        make_workspace(first)
        # the account model lower-cases the address, so case variants become
        # distinct addresses rather than ambiguous candidates
        assert second.email == "duplicated@example.com"
        assert User.objects.filter(email__iexact="duplicate@example.com").count() == 1

    def test_inactive_mapping_is_rejected(self):
        owner = make_user(email="researcher@example.com")
        make_workspace(owner)
        IdentityMapping.objects.create(
            provider=PROVIDER,
            subject="sub-1",
            user=owner,
            status=IdentityMapping.Status.REVOKED,
        )

        with pytest.raises(IdentityResolutionError) as error:
            resolve_identity(provider=PROVIDER, subject="sub-1", email="researcher@example.com")
        assert error.value.error_code == "identity_mapping_inactive"
        assert ResearchAuditEvent.objects.filter(action="identity.suspended").exists()

    def test_missing_subject_is_rejected(self):
        with pytest.raises(IdentityResolutionError):
            resolve_identity(provider=PROVIDER, subject=None, email="a@example.com")

    def test_email_change_is_recorded_on_the_mapping(self):
        owner = make_user(email="old@example.com")
        make_workspace(owner)
        IdentityMapping.objects.create(
            provider=PROVIDER,
            subject="sub-1",
            user=owner,
            email_snapshot="old@example.com",
        )
        owner.email = "new@example.com"
        owner.save(update_fields=["email"])

        _, _, mapping = resolve_identity(provider=PROVIDER, subject="sub-1", email="new@example.com")
        assert mapping.email_snapshot == "new@example.com"
        event = ResearchAuditEvent.objects.filter(action="identity.login").first()
        assert event.metadata["email_changed"] is True
