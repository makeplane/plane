# Testing library/framework: pytest + pytest-django + factory_boy
import pytest
import pytz
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone

# Prefer existing FactoryBoy factories defined in the repo
from plane.tests.factories import WorkspaceFactory, UserFactory, ProjectFactory

# Import models and helpers under test
from plane.db.models.project import (
    Project,
    ProjectMember,
    ProjectMemberInvite,
    ProjectIdentifier,
    ProjectDeployBoard,
    ProjectPublicMember,
    ROLE,
    ROLE_CHOICES,
    ProjectNetwork,
    get_default_props,
    get_default_preferences,
    get_default_views,
)

# FileAsset is optional in some environments; guard import
try:
    from plane.db.models.asset import FileAsset
except Exception:
    FileAsset = None


@pytest.mark.django_db
class TestProjectModel:
    def test_identifier_is_stripped_and_uppercased_on_save(self):
        ws = WorkspaceFactory()
        proj = Project.objects.create(
            name="Alpha",
            identifier="  al-1 ",
            workspace=ws,
        )
        proj.refresh_from_db()
        assert proj.identifier == "AL-1"

    def test_cover_image_url_resolution_and_precedence(self):
        ws = WorkspaceFactory()
        proj = ProjectFactory(workspace=ws)

        # No cover data
        proj.cover_image = None
        proj.cover_image_asset = None
        assert proj.cover_image_url is None

        # Text cover image
        proj.cover_image = "https://cdn.example.com/cover.jpg"
        assert proj.cover_image_url == "https://cdn.example.com/cover.jpg"

        # FileAsset should take precedence when present
        if FileAsset:
            asset = FileAsset.objects.create(asset_url="https://assets.example.com/a.png")
            proj.cover_image_asset = asset
            assert proj.cover_image_url == "https://assets.example.com/a.png"

    def test___str___format(self):
        ws = WorkspaceFactory(name="Team Rocket")
        proj = ProjectFactory(name="Gamma", identifier="GMM", workspace=ws)
        assert str(proj) == "Gamma <Team Rocket>"

    def test_timezone_default_and_choices_include_utc(self):
        ws = WorkspaceFactory()
        proj = ProjectFactory(workspace=ws, timezone="UTC")
        assert proj.timezone == "UTC"
        assert ("UTC", "UTC") in Project.TIMEZONE_CHOICES
        assert "UTC" in pytz.common_timezones

    def test_archive_close_in_validators_bounds(self):
        ws = WorkspaceFactory()
        proj = Project(name="Delta", identifier="DLT", workspace=ws, archive_in=0, close_in=12)
        # Valid
        proj.full_clean()

        # Invalid negative
        proj.archive_in = -1
        with pytest.raises(ValidationError):
            proj.full_clean()

        # Invalid > 12
        proj.archive_in = 0
        proj.close_in = 13
        with pytest.raises(ValidationError):
            proj.full_clean()

    def test_unique_identifier_and_name_per_workspace_with_soft_delete(self):
        ws = WorkspaceFactory()
        p1 = Project.objects.create(name="Echo", identifier="ECH", workspace=ws)

        # Duplicates while not soft-deleted -> IntegrityError
        with pytest.raises(IntegrityError):
            Project.objects.create(name="Echo", identifier="ECH2", workspace=ws)
        with pytest.raises(IntegrityError):
            Project.objects.create(name="Foxtrot", identifier="ECH", workspace=ws)

        # Soft-delete first, then allow duplicates for the constrained fields
        p1.deleted_at = timezone.now()
        p1.save(update_fields=["deleted_at"])

        Project.objects.create(name="Echo", identifier="ECHX", workspace=ws)
        Project.objects.create(name="Zulu", identifier="ECH", workspace=ws)

    def test_network_choices_and_enum(self):
        assert Project.NETWORK_CHOICES == ((0, "Secret"), (2, "Public"))
        assert ProjectNetwork.choices() == [(0, "Secret"), (2, "Public")]


@pytest.mark.django_db
class TestProjectBaseAndMembers:
    def test_projectbasemodel_sets_workspace_on_save_for_invite(self):
        ws = WorkspaceFactory()
        proj = ProjectFactory(workspace=ws)
        inv = ProjectMemberInvite.objects.create(project=proj, email="invitee@example.com", token="tok")
        inv.refresh_from_db()
        assert inv.workspace_id == proj.workspace_id
        assert str(inv) == f"{proj.name} invitee@example.com {inv.accepted}"

    def test_projectmember_sort_order_initialization(self):
        ws = WorkspaceFactory()
        user = UserFactory()
        proj_a = ProjectFactory(workspace=ws)
        proj_b = ProjectFactory(workspace=ws)

        # First membership => default 65535
        m1 = ProjectMember.objects.create(project=proj_a, member=user)
        assert pytest.approx(m1.sort_order) == 65535

        # Second membership for same user in same workspace => smallest - 10000
        m2 = ProjectMember.objects.create(project=proj_b, member=user)
        assert m2.sort_order == m1.sort_order - 10000

    def test_projectmember_defaults_role_props_and_str(self):
        ws = WorkspaceFactory()
        user = UserFactory()
        proj = ProjectFactory(workspace=ws)

        member = ProjectMember.objects.create(project=proj, member=user)

        # Role defaults
        assert member.role == ROLE.GUEST.value == 5
        assert ROLE_CHOICES == ((20, "Admin"), (15, "Member"), (5, "Guest"))

        # Default props/preferences
        assert member.view_props == get_default_props()
        assert member.default_props == get_default_props()
        assert member.preferences == get_default_preferences()

        assert str(member) == f"{user.email} <{proj.name}>"


@pytest.mark.django_db
class TestProjectIdentifierAndDeployBoard:
    def test_project_identifier_unique_with_soft_delete(self):
        ws = WorkspaceFactory()
        proj = ProjectFactory(workspace=ws, identifier="MU", name="Mu")
        pid1 = ProjectIdentifier.objects.create(project=proj, workspace=ws, name="MU")

        with pytest.raises(IntegrityError):
            ProjectIdentifier.objects.create(project=proj, workspace=ws, name="MU")

        pid1.deleted_at = timezone.now()
        pid1.save(update_fields=["deleted_at"])

        # Now allowed after soft-delete
        ProjectIdentifier.objects.create(project=proj, workspace=ws, name="MU")

    def test_deploy_board_defaults_and_str(self):
        ws = WorkspaceFactory()
        proj = ProjectFactory(workspace=ws)
        board = ProjectDeployBoard.objects.create(project=proj)

        assert isinstance(board.anchor, str) and len(board.anchor) >= 32
        assert board.views == get_default_views()
        assert str(board) == f"{board.anchor} <{proj.name}>"

    def test_get_default_views_contents(self):
        assert get_default_views() == {
            "list": True,
            "kanban": True,
            "calendar": True,
            "gantt": True,
            "spreadsheet": True,
        }


@pytest.mark.django_db
class TestProjectPublicMember:
    def test_unique_constraint_on_public_member(self):
        ws = WorkspaceFactory()
        user = UserFactory()
        proj = ProjectFactory(workspace=ws)

        pm1 = ProjectPublicMember.objects.create(project=proj, member=user)
        assert pm1.pk is not None

        with pytest.raises(IntegrityError):
            ProjectPublicMember.objects.create(project=proj, member=user)