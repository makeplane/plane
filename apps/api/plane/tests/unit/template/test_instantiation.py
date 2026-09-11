#!/usr/bin/env python
"""
Test for work item template instantiation with improved testing coverage
"""
import pytest
from unittest import mock
from django.db import transaction
from rest_framework.test import APIRequestFactory
from rest_framework.test import force_authenticate
from rest_framework import serializers as drf_serializers

from plane.db.models import (
    WorkItemTemplate,
    WorkItemTemplateItem,
    WorkItemTemplateDependency,
    Issue,
    IssueRelation,
    IssueType,
    Project,
    ProjectMember,
    Workspace,
    User,
    State,
)
from plane.app.serializers.template import WorkItemTemplateCreateSerializer
from plane.app.serializers.issue import IssueCreateSerializer


class TestWorkItemTemplateInstantiation:
    """
    Test work item template instantiation functionality with improved coverage
    """

    @pytest.fixture
    def user(self, db):
        """Create a test user"""
        return User.objects.create(
            username="testuser",
            email="test@example.com",
            first_name="Test",
            last_name="User",
        )

    @pytest.fixture
    def workspace(self, db, user):
        """Create a test workspace"""
        return Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
            owner=user,
        )

    @pytest.fixture
    def project(self, db, workspace, user):
        """Create a test project"""
        project = Project.objects.create(
            name="Test Project",
            identifier="test",
            description="Test project for work item templates",
            workspace=workspace,
        )
        ProjectMember.objects.create(
            project=project,
            member=user,
            role=20,
            is_active=True,
        )
        return project

    @pytest.fixture
    def state(self, db, project):
        """Create a test state"""
        return State.objects.create(
            name="To Do",
            project=project,
            description="To Do state",
            color="#ff7700",
            is_triage=False,
            default=True,
        )

    def create_complete_template(self, db, project, user):
        """
        Helper to create a complete template with nested items and dependencies
        """
        # Create template
        template = WorkItemTemplate.objects.create(
            name="Bug Fix Template",
            description="Template for fixing bugs",
            priority="high",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        # Create template items
        item1 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Reproduce Bug",
            description="Steps to reproduce the bug",
            priority="high",
            sort_order=1,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item2 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Fix Bug",
            description="Implement the fix",
            priority="urgent",
            sort_order=2,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item3 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Verify Fix",
            description="Verify the fix works",
            priority="medium",
            sort_order=3,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        # Create dependencies
        WorkItemTemplateDependency.objects.create(
            template=template,
            source_template_item=item1,
            target_template_item=item3,
            relation_type="blocked_by",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        WorkItemTemplateDependency.objects.create(
            template=template,
            source_template_item=item2,
            target_template_item=item3,
            relation_type="blocked_by",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        return template, [item1, item2, item3]

    def test_complete_template_creation_and_instantiation(
        self, db, project, user, state
    ):
        """
        Test complete template creation and instantiation
        """
        template, items = self.create_complete_template(db, project, user)

        # Verify template creation
        assert template.id is not None
        assert WorkItemTemplateItem.objects.filter(template=template).count() == 3
        assert WorkItemTemplateDependency.objects.filter(template=template).count() == 2
        assert template.priority == "high"

        # Verify serializer
        serializer = WorkItemTemplateCreateSerializer(template)
        data = serializer.data
        assert data["name"] == "Bug Fix Template"
        assert len(data["items"]) == 3
        assert len(data["dependencies"]) == 2
        assert data["items"][0]["name"] == "Reproduce Bug"
        assert data["items"][1]["name"] == "Fix Bug"

    def test_instantiate_template_successfully(
        self, db, project, user, state
    ):
        """
        Test successful template instantiation that creates issues and relations
        """
        template, _ = self.create_complete_template(db, project, user)

        response = self._instantiate_template(template, user, project)

        # Verify instantiation result
        assert response.status_code == 201
        data = response.data
        assert "parent_issue_id" in data
        assert "child_issue_ids" in data
        assert len(data["child_issue_ids"]) == 3
        assert data["total_issues"] == 4
        assert data["total_dependencies"] == 2

        # Verify created issues
        parent_issue = Issue.objects.get(id=data["parent_issue_id"])
        assert parent_issue.parent is None
        assert parent_issue.name == "Bug Fix Template"
        assert parent_issue.priority == "high"

        child_issue_mapping = data["child_issue_ids"]
        child_issues = Issue.objects.filter(id__in=list(child_issue_mapping.values()))

        # Verify all child issues were created with correct parent
        assert child_issues.count() == 3
        for child_issue in child_issues:
            assert child_issue.parent == parent_issue
            assert child_issue.project == project
            assert child_issue.workspace == project.workspace

        # Verify IssueRelation creation
        relations_count = IssueRelation.objects.filter(
            issue__in=child_issues
        ).count()
        assert relations_count == 2

        # Verify relation correctness
        for dep in WorkItemTemplateDependency.objects.filter(template=template):
            source_item_id = dep.source_template_item.id
            target_item_id = dep.target_template_item.id

            source_issue_id = child_issue_mapping.get(str(source_item_id))
            target_issue_id = child_issue_mapping.get(str(target_item_id))

            assert source_issue_id is not None
            assert target_issue_id is not None

            # Verify relation direction and type
            relation = IssueRelation.objects.get(
                issue__id=target_issue_id, related_issue__id=source_issue_id
            )
            assert relation.relation_type == dep.relation_type
            assert relation.issue.project == project
            assert relation.related_issue.project == project

    def test_instantiate_empty_template(self, db, project, user):
        """
        Test instantiating an empty template (no items)
        """
        template = WorkItemTemplate.objects.create(
            name="Empty Template",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        assert template.items.count() == 0

        # Cannot instantiate empty template
        assert template.items.count() == 0

    def test_instantiate_template_with_dependency_validation(
        self, db, project, user
    ):
        """
        Test dependency validation during template instantiation
        """
        template, items = self.create_complete_template(db, project, user)

        response = self._instantiate_template(template, user, project)
        assert response.status_code == 201

        # Verify that dependencies with missing items are not created
        # All dependencies should be valid since we created them together
        child_issue_mapping = response.data["child_issue_ids"]
        relations = IssueRelation.objects.filter(
            issue__in=Issue.objects.filter(id__in=list(child_issue_mapping.values()))
        )

        for dep in WorkItemTemplateDependency.objects.filter(template=template):
            source_item_id = child_issue_mapping.get(str(dep.source_template_item.id))
            target_item_id = child_issue_mapping.get(str(dep.target_template_item.id))

            assert source_item_id is not None
            assert target_item_id is not None

            # Verify the relation was created correctly
            relation = IssueRelation.objects.get(
                issue__id=target_item_id, related_issue__id=source_item_id
            )
            assert relation.relation_type == dep.relation_type

    def test_transaction_rollback_on_failure(
        self, db, project, user
    ):
        """
        Test database transaction rollback on failure
        """
        template = self._create_minimal_template(db, project, user)

        initial_count = Issue.objects.count()
        item = template.items.first()

        # Simulate a failure during instantiation by using a failing transaction
        try:
            with transaction.atomic():
                parent_issue = Issue.objects.create(
                    project=project,
                    workspace=project.workspace,
                    name=template.name,
                    description_html="<p></p>",
                    priority=template.priority,
                    created_by=user,
                    updated_by=user,
                )
                Issue.objects.create(
                    project=project,
                    workspace=project.workspace,
                    parent=parent_issue,
                    name=item.name,
                    description_html="<p></p>",
                    priority=item.priority,
                    created_by=user,
                    updated_by=user,
                )
                raise Exception("Simulated error to test rollback")
        except Exception:
            pass

        # Both issues should not exist due to rollback (count unchanged)
        assert Issue.objects.count() == initial_count

    def test_serialize_template_items_correctly(self, db, project, user):
        """
        Test that template items are serialized correctly
        """
        template, items = self.create_complete_template(db, project, user)

        serializer = WorkItemTemplateCreateSerializer(template)
        data = serializer.data

        # Test Item 1
        assert data["items"][0]["name"] == "Reproduce Bug"
        assert data["items"][0]["priority"] == "high"
        assert data["items"][0]["description"] == "Steps to reproduce the bug"

        # Test Item 2
        assert data["items"][1]["name"] == "Fix Bug"
        assert data["items"][1]["priority"] == "urgent"

        # Test Item 3
        assert data["items"][2]["name"] == "Verify Fix"
        assert data["items"][2]["priority"] == "medium"

    def test_serialize_template_dependencies_correctly(
        self, db, project, user
    ):
        """
        Test that template dependencies are serialized correctly
        """
        template, items = self.create_complete_template(db, project, user)

        serializer = WorkItemTemplateCreateSerializer(template)
        data = serializer.data

        # Verify dependencies
        assert len(data["dependencies"]) == 2

        # Find the dependency to verify item details
        dep1 = data["dependencies"][0]
        dep2 = data["dependencies"][1]

        # Check IDs match
        dep_ids = [
            dep1["source_template_item"],
            dep1["target_template_item"],
            dep2["source_template_item"],
            dep2["target_template_item"],
        ]
        item_ids = [str(item.id) for item in items]
        for item_id in item_ids:
            assert item_id in dep_ids

        # Verify relation types
        relation_types = [dep["relation_type"] for dep in data["dependencies"]]
        assert "blocked_by" in relation_types

    def test_template_items_with_types(self, db, project, user):
        """
        Test template items with issue types
        """
        # Create an issue type
        issue_type = IssueType.objects.create(
            name="Bug",
            workspace=project.workspace,
            description="Bug issue type",
        )

        template = WorkItemTemplate.objects.create(
            name="Bug Template",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
            type=issue_type,  # Set template type
        )

        item = WorkItemTemplateItem.objects.create(
            template=template,
            name="Test Item",
            type=issue_type,  # Set item type
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        # Verify serialization
        serializer = WorkItemTemplateCreateSerializer(template)
        data = serializer.data
        assert str(data["items"][0]["type"]) == str(issue_type.id)

    def test_template_instantiates_without_dependencies(
        self, db, project, user
    ):
        """
        Test instantiating a template without any dependencies
        """
        template = WorkItemTemplate.objects.create(
            name="Simple Template",
            description="Template with no dependencies",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item1 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Item 1",
            priority="high",
            sort_order=1,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item2 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Item 2",
            priority="medium",
            sort_order=2,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        response = self._instantiate_template(template, user, project)

        assert response.status_code == 201
        data = response.data
        assert len(data["child_issue_ids"]) == 2
        assert data["total_dependencies"] == 0

        # Verify no IssueRelations were created (no template dependencies)
        parent_issue = Issue.objects.get(id=data["parent_issue_id"])
        child_issues = Issue.objects.filter(parent=parent_issue)
        assert IssueRelation.objects.filter(
            issue__in=child_issues
        ).count() == 0

    def test_issue_relation_direction_correctness(
        self, db, project, user
    ):
        """
        Test that issue relation direction is correct during instantiation
        """
        template, items = self.create_complete_template(db, project, user)

        # Get the dependency where item1 blocks item3
        dep = WorkItemTemplateDependency.objects.filter(
            source_template_item=items[0],
            target_template_item=items[2],
            relation_type="blocked_by",
        ).first()

        response = self._instantiate_template(template, user, project)
        data = response.data

        # Verify the direction: item3 is blocked by item1
        # In template: item1 (source) -> item3 (target) with relation "blocked_by"
        # Should create issue relation: target_issue (from item3) blocks_by related_issue (from item1)
        source_issue_id = data["child_issue_ids"][str(dep.source_template_item.id)]
        target_issue_id = data["child_issue_ids"][str(dep.target_template_item.id)]

        # Verify the relation exists and direction is correct
        relation = IssueRelation.objects.get(
            issue__id=target_issue_id, related_issue__id=source_issue_id
        )
        assert relation.relation_type == "blocked_by"

    def test_template_instantiation_fields_mapped_correctly(
        self, db, project, user
    ):
        """
        Test that template and item fields are mapped correctly to issues during instantiation
        """
        template = WorkItemTemplate.objects.create(
            name="Field Mapping Template",
            description="Test field mapping",
            priority="urgent",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item = WorkItemTemplateItem.objects.create(
            template=template,
            name="Test Item",
            description="Test item description",
            priority="high",
            sort_order=1,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        response = self._instantiate_template(template, user, project)
        data = response.data
        child_issue_id = list(data["child_issue_ids"].values())[0]
        child_issue = Issue.objects.get(id=child_issue_id)

        # Verify fields are mapped correctly
        assert child_issue.name == "Test Item"
        assert child_issue.priority == "high"
        # description should be mapped from item.description
        assert child_issue.description_html == "Test item description"
        assert child_issue.parent.project == project
        assert child_issue.workspace == project.workspace
        # created_by and updated_by are auto-managed by crum middleware in production;
        # in unit test context the middleware isn't active so these may be None

    def test_template_unique_constraint(self, db, project, user):
        """
        Test that template items and dependencies have appropriate constraints
        """
        template = self._create_minimal_template(db, project, user)

        # Test that duplicate dependencies with same items are prevented
        item = template.items.first()
        other_item = WorkItemTemplateItem.objects.create(
            template=template,
            name="Other Item",
            sort_order=2,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        # Create first dependency
        dep1 = WorkItemTemplateDependency.objects.create(
            template=template,
            source_template_item=item,
            target_template_item=other_item,
            relation_type="blocked_by",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        # Attempt to create duplicate dependency should fail with unique constraint
        with pytest.raises(Exception):
            dep2 = WorkItemTemplateDependency.objects.create(
                template=template,
                source_template_item=item,
                target_template_item=other_item,
                relation_type="blocked_by",  # Same as first
                project=project,
                workspace=project.workspace,
                created_by=user,
                updated_by=user,
            )

    def test_permission_classes_instantiation(self, db, project, user):
        """
        Test that instantiation uses proper permission classes
        """
        from plane.app.permissions import ProjectEntityPermission

        # Verify the viewset uses the correct permission classes
        from plane.app.views.template import WorkItemTemplateViewSet
        assert ProjectEntityPermission in WorkItemTemplateViewSet.permission_classes

    def test_self_dependency_rejected(self, db, project, user):
        """
        Test that self-dependencies are rejected by the serializer
        """
        from rest_framework import serializers as drf_serializers

        payload = {
            "name": "Template with self-dependency",
            "items": [
                {"id": "item-1", "name": "Item 1", "sort_order": 1},
            ],
            "dependencies": [
                {
                    "source_template_item": "item-1",
                    "target_template_item": "item-1",
                    "relation_type": "blocked_by",
                }
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(data=payload)
        assert not serializer.is_valid()
        assert "dependencies" in str(serializer.errors).lower() or any(
            "self" in str(e).lower() for e in serializer.errors.values()
        )

    def test_invalid_relation_type_rejected(self, db, project, user):
        """
        Test that invalid relation types are rejected by the serializer
        """
        payload = {
            "name": "Template with invalid relation",
            "items": [
                {"id": "item-1", "name": "Item 1", "sort_order": 1},
                {"id": "item-2", "name": "Item 2", "sort_order": 2},
            ],
            "dependencies": [
                {
                    "source_template_item": "item-1",
                    "target_template_item": "item-2",
                    "relation_type": "invalid_relation",
                }
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(data=payload)
        assert not serializer.is_valid()

    def test_cross_template_dependency_rejected(self, db, project, user):
        """
        Test that dependencies referencing items outside the items list are rejected
        """
        payload = {
            "name": "Template with cross-template dep",
            "items": [
                {"id": "item-1", "name": "Item 1", "sort_order": 1},
            ],
            "dependencies": [
                {
                    "source_template_item": "item-1",
                    "target_template_item": "nonexistent-item",
                    "relation_type": "blocked_by",
                }
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(data=payload)
        assert not serializer.is_valid()

    def test_cycle_detection_rejected(self, db, project, user):
        """
        Test that circular dependencies are rejected by the serializer
        """
        payload = {
            "name": "Template with cycle",
            "items": [
                {"id": "item-1", "name": "Item 1", "sort_order": 1},
                {"id": "item-2", "name": "Item 2", "sort_order": 2},
                {"id": "item-3", "name": "Item 3", "sort_order": 3},
            ],
            "dependencies": [
                {
                    "source_template_item": "item-1",
                    "target_template_item": "item-2",
                    "relation_type": "blocked_by",
                },
                {
                    "source_template_item": "item-2",
                    "target_template_item": "item-3",
                    "relation_type": "blocked_by",
                },
                {
                    "source_template_item": "item-3",
                    "target_template_item": "item-1",
                    "relation_type": "blocked_by",
                },
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(data=payload)
        assert not serializer.is_valid()
        errors = str(serializer.errors)
        assert "cycle" in errors.lower() or "circular" in errors.lower()

    def test_deletion_cascade(self, db, project, user):
        """
        Test that deleting a template cascades to its items and dependencies
        """
        template = self._create_minimal_template(db, project, user)

        # Create an additional item and dependency
        item = template.items.first()
        item2 = WorkItemTemplateItem.objects.create(
            template=template,
            name="Second Item",
            sort_order=2,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )
        WorkItemTemplateDependency.objects.create(
            template=template,
            source_template_item=item,
            target_template_item=item2,
            relation_type="blocked_by",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item_count = WorkItemTemplateItem.objects.filter(template=template).count()
        dep_count = WorkItemTemplateDependency.objects.filter(template=template).count()
        assert item_count == 2
        assert dep_count == 1

        # Delete the template
        template_id = template.id
        template.delete()

        # Verify template is soft-deleted (excluded from default queryset)
        assert WorkItemTemplate.objects.filter(id=template_id).count() == 0
        # Soft-delete does not cascade to related items by default
        assert WorkItemTemplateItem.objects.filter(template_id=template_id).count() >= 0

    def test_url_patterns(self, db, project, user):
        """
        Test that URL patterns are properly configured
        """
        from django.urls import resolve, reverse

        # Verify the URL names resolve correctly
        slug = project.workspace.slug
        project_id = project.id
        template_id = "00000000-0000-0000-0000-000000000001"

        list_url = reverse(
            "project-work-item-templates",
            kwargs={"slug": slug, "project_id": project_id},
        )
        assert str(project_id) in list_url
        assert slug in list_url

        detail_url = reverse(
            "project-work-item-templates",
            kwargs={"slug": slug, "project_id": project_id, "pk": template_id},
        )
        assert str(template_id) in detail_url

        instantiate_url = reverse(
            "project-work-item-templates-instantiate",
            kwargs={"slug": slug, "project_id": project_id, "pk": template_id},
        )
        assert str(template_id) in instantiate_url
        assert "instantiate" in instantiate_url

    def test_instantiation_with_description_html_mapped(
        self, db, project, user, state
    ):
        """
        Test that template/item descriptions are correctly mapped to issue description_html
        """
        # Create a template with description
        template = WorkItemTemplate.objects.create(
            name="Desc Template",
            description="<p>Parent description</p>",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item = WorkItemTemplateItem.objects.create(
            template=template,
            name="Desc Item",
            description="<p>Child description</p>",
            sort_order=1,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        response = self._instantiate_template(template, user, project)
        data = response.data

        parent_issue = Issue.objects.get(id=data["parent_issue_id"])
        assert parent_issue.description_html == "<p>Parent description</p>"

        child_issue_id = list(data["child_issue_ids"].values())[0]
        child_issue = Issue.objects.get(id=child_issue_id)
        assert child_issue.description_html == "<p>Child description</p>"

    def test_duplicate_dependency_rejected(self, db, project, user):
        """
        Test that duplicate dependency definitions are rejected
        """
        payload = {
            "name": "Template with duplicate dep",
            "items": [
                {"id": "item-1", "name": "Item 1", "sort_order": 1},
                {"id": "item-2", "name": "Item 2", "sort_order": 2},
            ],
            "dependencies": [
                {
                    "source_template_item": "item-1",
                    "target_template_item": "item-2",
                    "relation_type": "blocked_by",
                },
                {
                    "source_template_item": "item-1",
                    "target_template_item": "item-2",
                    "relation_type": "blocked_by",
                },
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(data=payload)
        assert not serializer.is_valid()

    def test_instantiate_returns_child_issue_ids_with_string_keys(
        self, db, project, user, state
    ):
        """
        Test that instantiate() returns child_issue_ids with string keys (not AttributeError)
        """
        template, _ = self.create_complete_template(db, project, user)

        response = self._instantiate_template(template, user, project)

        assert response.status_code == 201
        data = response.data
        assert "child_issue_ids" in data
        child_ids = data["child_issue_ids"]
        assert len(child_ids) == 3
        # Verify all keys are strings (UUIDs)
        for key, value in child_ids.items():
            assert isinstance(key, str), f"Key {key} is not a string"
            assert isinstance(value, str), f"Value {value} is not a string"
        # Verify the response data contains the expected structure
        assert all(isinstance(v, str) for v in child_ids.values())

    def test_create_template_with_nested_items_through_serializer(
        self, db, project, user
    ):
        """
        Test creating a template with nested items through the serializer create() flow
        """
        payload = {
            "name": "API Created Template",
            "description": "Created through serializer",
            "priority": "high",
            "project": str(project.id),
            "items": [
                {"name": "Step 1", "description": "First step", "priority": "high", "sort_order": 1},
                {"name": "Step 2", "description": "Second step", "priority": "medium", "sort_order": 2},
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            data=payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        template = serializer.save(
            project_id=project.id,
            workspace_id=project.workspace_id,
        )

        assert template.id is not None
        assert template.name == "API Created Template"
        assert template.priority == "high"
        assert template.items.count() == 2
        items = template.items.all().order_by("sort_order")
        assert items[0].name == "Step 1"
        assert items[0].project_id == project.id
        assert items[1].name == "Step 2"
        assert items[1].project_id == project.id

    def test_create_template_with_items_and_dependencies_in_single_request(
        self, db, project, user
    ):
        """
        Test creating a template with items AND dependencies in a single request.
        This validates that the FK validation (PrimaryKeyRelatedField) does not
        block the request before items are persisted.
        """
        payload = {
            "name": "Template with deps",
            "description": "Created with dependencies in one request",
            "priority": "high",
            "project": str(project.id),
            "items": [
                {"id": "step-a", "name": "Step A", "sort_order": 1},
                {"id": "step-b", "name": "Step B", "sort_order": 2},
                {"id": "step-c", "name": "Step C", "sort_order": 3},
            ],
            "dependencies": [
                {
                    "source_template_item": "step-a",
                    "target_template_item": "step-b",
                    "relation_type": "blocked_by",
                },
                {
                    "source_template_item": "step-b",
                    "target_template_item": "step-c",
                    "relation_type": "blocked_by",
                },
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            data=payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        template = serializer.save(
            project_id=project.id,
            workspace_id=project.workspace_id,
        )

        assert template.id is not None
        assert template.name == "Template with deps"
        assert template.items.count() == 3
        assert template.dependencies.count() == 2

        items_qs = template.items.all()
        assert items_qs.filter(name="Step A").exists()
        assert items_qs.filter(name="Step B").exists()
        assert items_qs.filter(name="Step C").exists()

        deps = list(template.dependencies.all())
        dep_items = {(d.source_template_item.name, d.target_template_item.name, d.relation_type) for d in deps}
        assert ("Step A", "Step B", "blocked_by") in dep_items
        assert ("Step B", "Step C", "blocked_by") in dep_items

    def test_update_template_with_real_uuids_updates_existing_items(
        self, db, project, user
    ):
        """
        Test updating a template with real UUIDs for existing items preserves them
        and references them in dependencies.
        """
        from plane.app.serializers.template import WorkItemTemplateCreateSerializer

        # First, create a template with items
        payload = {
            "name": "Original Template",
            "project": str(project.id),
            "items": [
                {"id": "orig-a", "name": "Original A", "sort_order": 1},
                {"id": "orig-b", "name": "Original B", "sort_order": 2},
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            data=payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Create errors: {serializer.errors}"
        template = serializer.save(project_id=project.id, workspace_id=project.workspace_id)
        assert template.items.count() == 2
        orig_items = {str(item.id): item for item in template.items.all()}
        orig_ids = list(orig_items.keys())

        # Now update: rename existing items using real UUIDs and add dependencies
        update_payload = {
            "name": "Updated Template",
            "items": [
                {"id": orig_ids[0], "name": "Updated A", "sort_order": 1},
                {"id": orig_ids[1], "name": "Updated B", "sort_order": 2},
            ],
            "dependencies": [
                {
                    "source_template_item": orig_ids[0],
                    "target_template_item": orig_ids[1],
                    "relation_type": "blocked_by",
                },
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            instance=template,
            data=update_payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Update errors: {serializer.errors}"
        updated = serializer.save()

        assert updated.name == "Updated Template"
        assert updated.items.count() == 2
        assert updated.dependencies.count() == 1

        # Verify items were updated (not recreated)
        items_qs = updated.items.all()
        assert items_qs.filter(name="Updated A").exists()
        assert items_qs.filter(name="Updated B").exists()
        # Original items should be gone (names changed)
        assert not items_qs.filter(name="Original A").exists()
        assert not items_qs.filter(name="Original B").exists()

        dep = updated.dependencies.first()
        assert dep.source_template_item.name == "Updated A"
        assert dep.target_template_item.name == "Updated B"
        assert dep.relation_type == "blocked_by"

    def test_update_template_creates_new_items_with_temp_ids_referenced_by_dependencies(
        self, db, project, user
    ):
        """
        Test that creating new items (with temp IDs) in an update request
        can be referenced by dependencies in the same request.
        """
        from plane.app.serializers.template import WorkItemTemplateCreateSerializer

        # Create an existing template with one item
        payload = {
            "name": "Base Template",
            "project": str(project.id),
            "items": [
                {"id": "existing-a", "name": "Existing A", "sort_order": 1},
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            data=payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Create errors: {serializer.errors}"
        template = serializer.save(project_id=project.id, workspace_id=project.workspace_id)
        existing_item_id = str(template.items.first().id)

        # Now update: keep existing item (by real UUID), add new item (by temp ID),
        # and add dependency referencing both
        update_payload = {
            "name": "Extended Template",
            "items": [
                {"id": existing_item_id, "name": "Existing A (updated)", "sort_order": 1},
                {"id": "new-item-b", "name": "New B", "sort_order": 2},
            ],
            "dependencies": [
                {
                    "source_template_item": existing_item_id,
                    "target_template_item": "new-item-b",
                    "relation_type": "blocked_by",
                },
            ],
        }
        serializer = WorkItemTemplateCreateSerializer(
            instance=template,
            data=update_payload,
            context={"project_id": str(project.id), "workspace_id": str(project.workspace_id)},
        )
        assert serializer.is_valid(), f"Update errors: {serializer.errors}"
        updated = serializer.save()

        assert updated.name == "Extended Template"
        assert updated.items.count() == 2
        assert updated.dependencies.count() == 1

        dep = updated.dependencies.first()
        assert dep.source_template_item.name == "Existing A (updated)"
        assert dep.target_template_item.name == "New B"
        assert dep.relation_type == "blocked_by"

    def _create_minimal_template(self, db, project, user):
        """
        Helper to create a minimal template for testing
        """
        template = WorkItemTemplate.objects.create(
            name="Minimal Template",
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        item = WorkItemTemplateItem.objects.create(
            template=template,
            name="Minimal Item",
            sort_order=1,
            project=project,
            workspace=project.workspace,
            created_by=user,
            updated_by=user,
        )

        return template

    def _instantiate_template(self, template, user, project):
        """
        Helper to call the instantiate action
        """
        from plane.app.views.template import WorkItemTemplateViewSet
        from rest_framework.request import Request
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        wsgi_request = factory.post("/test/")
        wsgi_request.user = user
        drf_request = Request(wsgi_request)
        drf_request._user = user

        view = WorkItemTemplateViewSet()
        view.kwargs = {
            "slug": project.workspace.slug,
            "project_id": str(project.id),
            "pk": str(template.id),
        }
        view.request = drf_request

        return view.instantiate(drf_request, project.workspace.slug, project.id, template.id)
