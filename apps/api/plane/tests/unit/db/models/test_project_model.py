import re
import uuid
import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone

# Import models under test. Adjust import path if different in this repo.
# We keep relative import flexible by trying common module paths.
try:
    from plane.db.models.project import (
        Project,
        ProjectMember,
        ProjectMemberInvite,
        ProjectDeployBoard,
        ProjectPublicMember,
        ProjectBaseModel,
        ProjectNetwork,
        get_default_props,
        get_default_preferences,
        get_default_views,
    )
except Exception:  # pragma: no cover - fallback for alternate layout
    from apps.api.plane.db.models.project import (  # type: ignore
        Project,
        ProjectMember,
        ProjectMemberInvite,
        ProjectDeployBoard,
        ProjectPublicMember,
        ProjectBaseModel,
        ProjectNetwork,
        get_default_props,
        get_default_preferences,
        get_default_views,
    )

# Related FK models (best-effort minimal imports; adjust path if needed)
try:
    from plane.db.models import Workspace, WorkSpace, FileAsset, Estimate, State, Intake  # type: ignore
except Exception:  # pragma: no cover
    # Some repos use different capitalization for WorkSpace/Workspace
    Workspace = None
    WorkSpace = None
    FileAsset = None
    Estimate = None
    State = None
    Intake = None


pytestmark = pytest.mark.django_db


def make_workspace(name="Acme"):
    """
    Create a minimal Workspace/WorkSpace instance, handling either class name.
    """
    Model = Workspace or WorkSpace
    assert Model is not None, "Workspace/WorkSpace model not found in import path."
    # Try to identify minimal required fields: name is common; fallback to dynamic kwargs
    kwargs = {}
    if hasattr(Model, "_meta") and any(f.name == "name" and not f.many_to_many for f in Model._meta.get_fields()):
        kwargs["name"] = name
    if hasattr(Model, "_meta") and any(f.name == "slug" for f in Model._meta.get_fields()):
        kwargs.setdefault("slug", name.lower())
    if hasattr(Model, "_meta") and any(f.name == "organization" for f in Model._meta.get_fields()):
        # Some schemas require organization FK; create a dummy if needed
        # Avoid importing org model; instead, try nullable or set later
        pass
    return Model.objects.create(**kwargs)


def make_user(email="user@example.com"):
    User = get_user_model()
    # Ensure unique email/username if required by schema
    i = uuid.uuid4().hex[:6]
    base_email = email.split("@")[0]
    e = f"{base_email}+{i}@example.com"
    # Handle username if required by model
    fields = {"email": e}
    if hasattr(User, "USERNAME_FIELD") and User.USERNAME_FIELD \!= "email":
        # supply username if needed
        fields.setdefault("username", f"user_{i}")
    # Provide mandatory defaults if necessary
    for field in ("first_name", "last_name"):
        if any(getattr(f, "name", "") == field and not getattr(f, "blank", True) for f in User._meta.get_fields()):
            fields[field] = field
    user = User.objects.create(**fields)
    return user


def test_project_cover_image_url_prefers_asset_over_text(db):
    ws = make_workspace()
    proj = Project.objects.create(
        name="Proj",
        workspace=ws,
        identifier="ac",
    )
    # No cover set
    assert proj.cover_image_url is None

    # Set text cover
    proj.cover_image = "https://cdn.example.com/covers/1.jpg"
    assert proj.cover_image_url == "https://cdn.example.com/covers/1.jpg"

    # If FileAsset exists, it should take precedence
    if FileAsset is not None:
        asset = FileAsset.objects.create(asset_url="https://assets.example.com/a.png")  # type: ignore
        proj.cover_image_asset = asset
        assert proj.cover_image_url == "https://assets.example.com/a.png"


def test_project_str_includes_name_and_workspace(db):
    ws = make_workspace(name="Team X")
    proj = Project.objects.create(name="Roadmap", workspace=ws, identifier="rx")
    assert str(proj) == "Roadmap <Team X>"


def test_project_save_normalizes_identifier_strip_and_upper(db):
    ws = make_workspace()
    proj = Project.objects.create(name="Normalize", workspace=ws, identifier="  prj-1  ")
    # Save hook should strip and upper
    proj.refresh_from_db()
    assert proj.identifier == "PRJ-1"


def test_project_timezone_defaults_to_utc_and_choices_include_utc(db):
    ws = make_workspace()
    proj = Project.objects.create(name="TZ", workspace=ws, identifier="tz1")
    assert proj.timezone == "UTC"
    # Validate "UTC" present in choices
    choices = dict(Project.TIMEZONE_CHOICES)
    assert "UTC" in choices and choices["UTC"] == "UTC"


def test_project_base_model_save_sets_workspace_from_project(db):
    # Define a minimal subclass to exercise ProjectBaseModel.save
    ws = make_workspace()
    proj = Project.objects.create(name="Base", workspace=ws, identifier="b1")

    class DummyPBM(ProjectBaseModel):
        # ephemeral model; Django won't create DB table for abstract parent,
        # so we simulate behavior by instantiating a derived in-memory object.
        class Meta:
            abstract = True

    # Instead, use a concrete ProjectMemberInvite which inherits ProjectBaseModel
    inv = ProjectMemberInvite.objects.create(project=proj, workspace=None, email="i@example.com", token="t")
    inv.refresh_from_db()
    assert inv.workspace_id == proj.workspace_id


def test_project_member_initial_sort_order_logic(db):
    ws = make_workspace()
    user = make_user()
    proj1 = Project.objects.create(name="A", workspace=ws, identifier="A")
    proj2 = Project.objects.create(name="B", workspace=ws, identifier="B")

    # First membership for user: default sort_order remains 65535 (no prior records)
    pm1 = ProjectMember.objects.create(project=proj1, workspace=ws, member=user)
    assert pm1.sort_order == pytest.approx(65535)

    # Second membership for same user in same workspace: should be smallest - 10000
    pm2 = ProjectMember.objects.create(project=proj2, workspace=ws, member=user)
    assert pm2.sort_order == pytest.approx(pm1.sort_order - 10000)


def test_project_member_str_uses_member_email_and_project_name(db):
    ws = make_workspace()
    user = make_user(email="m@example.com")
    proj = Project.objects.create(name="Alpha", workspace=ws, identifier="ALP")
    pm = ProjectMember.objects.create(project=proj, workspace=ws, member=user)
    assert str(pm) == f"{user.email} <Alpha>"


def test_project_member_unique_constraint_enforced(db):
    ws = make_workspace()
    user = make_user()
    proj = Project.objects.create(name="U", workspace=ws, identifier="U")
    ProjectMember.objects.create(project=proj, workspace=ws, member=user)
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ProjectMember.objects.create(project=proj, workspace=ws, member=user)


def test_project_member_invite_str(db):
    ws = make_workspace()
    proj = Project.objects.create(name="InviteProj", workspace=ws, identifier="IP")
    inv = ProjectMemberInvite.objects.create(project=proj, workspace=ws, email="x@example.com", token="tok")
    assert str(inv) == f"{proj.name} {inv.email} {inv.accepted}"


def test_project_deploy_board_anchor_default_and_str(db):
    ws = make_workspace()
    proj = Project.objects.create(name="Deploy", workspace=ws, identifier="D")
    pdb = ProjectDeployBoard.objects.create(project=proj, workspace=ws)
    assert re.fullmatch(r"[0-9a-f]{32}", pdb.anchor), "anchor should be uuid4 hex"
    assert str(pdb) == f"{pdb.anchor} <{proj.name}>"


def test_project_public_member_uniqueness(db):
    if ProjectPublicMember is None:
        pytest.skip("ProjectPublicMember not available")
    ws = make_workspace()
    user = make_user()
    proj = Project.objects.create(name="Pub", workspace=ws, identifier="PUB")
    ProjectPublicMember.objects.create(project=proj, workspace=ws, member=user)
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            ProjectPublicMember.objects.create(project=proj, workspace=ws, member=user)


def test_default_helpers_return_expected_shapes():
    props = get_default_props()
    assert "filters" in props and "display_filters" in props
    assert isinstance(props["filters"], dict)
    assert isinstance(props["display_filters"], dict)
    # Ensure the function returns a new dict (not shared reference)
    props2 = get_default_props()
    assert props is not props2

    prefs = get_default_preferences()
    assert "pages" in prefs and isinstance(prefs["pages"], dict)

    views = get_default_views()
    assert views == {
        "list": True,
        "kanban": True,
        "calendar": True,
        "gantt": True,
        "spreadsheet": True,
    }


def test_project_network_choices_matches_enum():
    assert ProjectNetwork.choices() == [(0, "Secret"), (2, "Public")]
    # Ensure values map as expected
    assert ProjectNetwork.SECRET.value == 0
    assert ProjectNetwork.PUBLIC.value == 2