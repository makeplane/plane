# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Unit tests for orphaned property value cleanup when issue type changes.

Tests cover:
1. Issue._cleanup_orphaned_property_values() - cleanup on individual save()
2. _handle_issue_type_change_on_bulk_update() - cleanup on bulk update signal
3. Edge cases: type changes, shared properties, null types
"""

import pytest
from uuid import uuid4

from plane.db.models import Issue, IssueType, Workspace, WorkspaceMember, Project, ProjectMember
from plane.db.models.user import User
from plane.ee.models import IssueProperty, IssuePropertyValue, IssueTypeProperty
from plane.ee.models.issue_properties import PropertyTypeEnum
from plane.utils.permissions.base import ROLE


@pytest.fixture
def test_user(db):
    """Create and return a test user"""
    user = User.objects.create(
        email="test@example.com",
        first_name="Test",
        last_name="User",
    )
    user.set_password("testpassword")
    user.save()
    return user


@pytest.fixture
def test_workspace(db, test_user):
    """Create and return a test workspace"""
    workspace = Workspace.objects.create(
        name="Test Workspace",
        slug=f"test-workspace-{uuid4().hex[:8]}",
        owner=test_user,
    )
    WorkspaceMember.objects.create(
        workspace=workspace,
        member=test_user,
        role=ROLE.ADMIN.value,
    )
    return workspace


@pytest.fixture
def test_project(db, test_workspace, test_user):
    """Create and return a test project"""
    project = Project.objects.create(
        name="Test Project",
        identifier="TEST",
        workspace=test_workspace,
        created_by=test_user,
    )
    ProjectMember.objects.create(
        project=project,
        member=test_user,
        role=ROLE.ADMIN.value,
    )
    return project


@pytest.fixture
def issue_type_a(db, test_workspace, test_user):
    """Create Issue Type A"""
    return IssueType.objects.create(
        name="Type A",
        workspace=test_workspace,
        created_by=test_user,
        is_epic=False,
    )


@pytest.fixture
def issue_type_b(db, test_workspace, test_user):
    """Create Issue Type B"""
    return IssueType.objects.create(
        name="Type B",
        workspace=test_workspace,
        created_by=test_user,
        is_epic=False,
    )


@pytest.fixture
def property_only_on_type_a(db, test_workspace, test_user, issue_type_a):
    """Create a property that exists only on Type A"""
    # IssueTypeProperty is auto-created by IssueProperty.save() when issue_type is set
    prop = IssueProperty.objects.create(
        workspace=test_workspace,
        issue_type=issue_type_a,
        display_name="Property Only A",
        property_type=PropertyTypeEnum.TEXT,
        created_by=test_user,
    )
    return prop


@pytest.fixture
def property_only_on_type_b(db, test_workspace, test_user, issue_type_b):
    """Create a property that exists only on Type B"""
    # IssueTypeProperty is auto-created by IssueProperty.save() when issue_type is set
    prop = IssueProperty.objects.create(
        workspace=test_workspace,
        issue_type=issue_type_b,
        display_name="Property Only B",
        property_type=PropertyTypeEnum.TEXT,
        created_by=test_user,
    )
    return prop


@pytest.fixture
def property_shared_a_and_b(db, test_workspace, test_user, issue_type_a, issue_type_b):
    """Create a property that exists on both Type A and Type B"""
    # IssueTypeProperty for Type A is auto-created by IssueProperty.save() when issue_type is set
    prop = IssueProperty.objects.create(
        workspace=test_workspace,
        issue_type=issue_type_a,  # Primary type
        display_name="Shared Property",
        property_type=PropertyTypeEnum.TEXT,
        created_by=test_user,
    )
    # Also bind to Type B (only this one needs explicit creation)
    IssueTypeProperty.objects.create(
        workspace=test_workspace,
        issue_type=issue_type_b,
        property=prop,
        created_by=test_user,
    )
    return prop


@pytest.fixture
def issue_with_type_a(db, test_project, test_user, issue_type_a):
    """Create an issue with Type A"""
    return Issue.objects.create(
        project=test_project,
        name="Test Issue",
        created_by=test_user,
        type=issue_type_a,
    )


@pytest.mark.unit
class TestIssueCleanupOrphanedPropertyValues:
    """Test Issue._cleanup_orphaned_property_values() method"""

    @pytest.mark.django_db
    def test_type_change_deletes_orphaned_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        issue_type_b,
        property_only_on_type_a,
        issue_with_type_a,
    ):
        """Test that changing type A -> B deletes values for properties only on type A"""
        # Arrange - Create property value for type A property
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue_with_type_a,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Change issue type from A to B
        issue_with_type_a.type = issue_type_b
        issue_with_type_a.save()

        # Assert - Property value should be soft deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is not None

    @pytest.mark.django_db
    def test_type_change_preserves_shared_property_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        issue_type_b,
        property_shared_a_and_b,
        issue_with_type_a,
    ):
        """Test that changing type A -> B preserves values for shared properties"""
        # Arrange - Create property value for shared property
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue_with_type_a,
            property=property_shared_a_and_b,
            value_text="Shared Value",
            created_by=test_user,
        )

        # Act - Change issue type from A to B
        issue_with_type_a.type = issue_type_b
        issue_with_type_a.save()

        # Assert - Shared property value should NOT be deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is None

    @pytest.mark.django_db
    def test_type_change_to_null_deletes_all_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        property_only_on_type_a,
        issue_with_type_a,
    ):
        """Test that changing type A -> null deletes all property values"""
        # Arrange - Create property value
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue_with_type_a,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Change issue type to null
        issue_with_type_a.type = None
        issue_with_type_a.save()

        # Assert - Property value should be soft deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is not None

    @pytest.mark.django_db
    def test_null_to_type_does_not_delete_anything(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        property_only_on_type_a,
    ):
        """Test that changing null -> type A does not trigger cleanup"""
        # Arrange - Create issue with no type
        issue = Issue.objects.create(
            project=test_project,
            name="No Type Issue",
            created_by=test_user,
            type=None,
        )

        # Create a property value (edge case - shouldn't exist but let's test)
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Change issue type from null to A
        issue.type = issue_type_a
        issue.save()

        # Assert - Value should NOT be deleted (no old type to clean up from)
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is None

    @pytest.mark.django_db
    def test_same_type_does_not_trigger_cleanup(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        property_only_on_type_a,
        issue_with_type_a,
    ):
        """Test that saving without type change does not trigger cleanup"""
        # Arrange - Create property value
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue_with_type_a,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Save issue without changing type
        issue_with_type_a.name = "Updated Name"
        issue_with_type_a.save()

        # Assert - Property value should NOT be deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is None


@pytest.mark.unit
class TestBulkUpdateSignalHandler:
    """Test _handle_issue_type_change_on_bulk_update() signal handler"""

    @pytest.mark.django_db
    def test_bulk_update_type_change_deletes_orphaned_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        issue_type_b,
        property_only_on_type_a,
    ):
        """Test that bulk update changing type deletes orphaned values"""
        # Arrange - Create multiple issues with type A and property values
        issues = []
        prop_values = []
        for i in range(3):
            issue = Issue.objects.create(
                project=test_project,
                name=f"Issue {i}",
                created_by=test_user,
                type=issue_type_a,
            )
            issues.append(issue)
            prop_value = IssuePropertyValue.objects.create(
                workspace=test_workspace,
                project=test_project,
                issue=issue,
                property=property_only_on_type_a,
                value_text=f"Value {i}",
                created_by=test_user,
            )
            prop_values.append(prop_value)

        # Act - Bulk update type to B
        Issue.objects.filter(id__in=[i.id for i in issues]).update(type_id=issue_type_b.id)

        # Assert - All property values should be soft deleted
        for prop_value in prop_values:
            prop_value.refresh_from_db()
            assert prop_value.deleted_at is not None

    @pytest.mark.django_db
    def test_bulk_update_preserves_shared_property_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        issue_type_b,
        property_shared_a_and_b,
    ):
        """Test that bulk update preserves shared property values"""
        # Arrange - Create issue with shared property value
        issue = Issue.objects.create(
            project=test_project,
            name="Test Issue",
            created_by=test_user,
            type=issue_type_a,
        )
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue,
            property=property_shared_a_and_b,
            value_text="Shared Value",
            created_by=test_user,
        )

        # Act - Bulk update type to B
        Issue.objects.filter(id=issue.id).update(type_id=issue_type_b.id)

        # Assert - Shared property value should NOT be deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is None

    @pytest.mark.django_db
    def test_bulk_update_to_null_deletes_all_values(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        property_only_on_type_a,
    ):
        """Test that bulk update to null type deletes all property values"""
        # Arrange - Create issue with property value
        issue = Issue.objects.create(
            project=test_project,
            name="Test Issue",
            created_by=test_user,
            type=issue_type_a,
        )
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Bulk update type to null
        Issue.objects.filter(id=issue.id).update(type_id=None)

        # Assert - Property value should be soft deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is not None

    @pytest.mark.django_db
    def test_bulk_update_non_type_field_does_not_trigger_cleanup(
        self,
        test_workspace,
        test_project,
        test_user,
        issue_type_a,
        property_only_on_type_a,
    ):
        """Test that bulk update of non-type fields does not trigger cleanup"""
        # Arrange - Create issue with property value
        issue = Issue.objects.create(
            project=test_project,
            name="Test Issue",
            created_by=test_user,
            type=issue_type_a,
        )
        prop_value = IssuePropertyValue.objects.create(
            workspace=test_workspace,
            project=test_project,
            issue=issue,
            property=property_only_on_type_a,
            value_text="Test Value",
            created_by=test_user,
        )

        # Act - Bulk update priority (not type)
        Issue.objects.filter(id=issue.id).update(priority="high")

        # Assert - Property value should NOT be deleted
        prop_value.refresh_from_db()
        assert prop_value.deleted_at is None
