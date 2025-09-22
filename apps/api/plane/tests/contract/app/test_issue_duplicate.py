import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch
from plane.db.models import (
    Issue,
    IssueRelation,
    Workspace,
    Project,
    IssueLink,
)
from unittest.mock import MagicMock


@pytest.mark.contract
class TestIssueDuplicateEndpointContrasts:
    @pytest.fixture
    def base_setup(self, session_client, create_user):
        """Base setup for all tests"""
        workspace = Workspace.objects.create(
            name="Test Workspace", slug="test-workspace", owner=create_user
        )

        source_project = Project.objects.create(
            name="Source Project",
            identifier="SOURCE",
            workspace=workspace,
            created_by=create_user,
        )

        destination_project = Project.objects.create(
            name="Destination Project",
            identifier="DESTINATION",
            workspace=workspace,
            created_by=create_user,
        )

        session_client.force_authenticate(user=create_user)

        return {
            "workspace": workspace,
            "source_project": source_project,
            "destination_project": destination_project,
            "user": create_user,
        }

    @pytest.fixture
    def mock_feature_flag(self):
        """Fixture to mock the feature flag check"""

        def mock_decorator(flag_name):
            def wrapper(func):
                return func

            return wrapper

        with patch(
            "plane.payment.flags.flag_decorator.check_feature_flag", new=mock_decorator
        ) as mock:
            yield mock

    @pytest.mark.django_db
    def test_contrast_issue_duplicate(
        self, session_client, base_setup, mock_feature_flag
    ):
        """
        Contrast test between duplicating issues
        """

        issue = Issue.objects.create(
            name="Issue",
            project_id=base_setup["source_project"].id,
            workspace=base_setup["workspace"],
            created_by=base_setup["user"],
        )

        related_issue = Issue.objects.create(
            name="Related Issue",
            project_id=base_setup["source_project"].id,
            workspace=base_setup["workspace"],
            created_by=base_setup["user"],
        )

        IssueRelation.objects.create(
            issue=issue,
            related_issue=related_issue,
            relation_type="relates_to",
            project_id=base_setup["source_project"].id,
            workspace=base_setup["workspace"],
            created_by=base_setup["user"],
        )

        IssueLink.objects.create(
            issue_id=issue.id,
            title="Issue Link",
            url="https://example.com",
            project_id=base_setup["source_project"].id,
            workspace=base_setup["workspace"],
        )

        url = reverse(
            "issue-duplicate",
            kwargs={
                "slug": base_setup["workspace"].slug,
                "issue_id": str(issue.id),
            },
        )

        response = session_client.post(
            f"{url}",
            {"project_id": str(base_setup["destination_project"].id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED

        destination_project_id = response.data["project_id"]

        duplicated_issue = Issue.objects.filter(project_id=destination_project_id)

        # Assert if the issue is duplicated
        assert duplicated_issue.count() == 1
        duplicated_issue = duplicated_issue.first()

        # Assert if project level fields are set to None
        assert duplicated_issue.estimate_point_id is None
        assert duplicated_issue.parent_id is None
        assert duplicated_issue.label_issue.count() == 0
        assert duplicated_issue.issue_cycle.count() == 0
        assert duplicated_issue.issue_module.count() == 0
        assert duplicated_issue.state is None

        # Assert if issue link is duplicated
        assert duplicated_issue.issue_link.count() == 1

        assert (
            IssueRelation.objects.filter(
                issue_id=related_issue.id,
                related_issue_id=duplicated_issue.id,
                relation_type="relates_to",
                project_id=destination_project_id,
            ).count()
            == 1
        )
