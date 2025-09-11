"""
Tests for Project and related models.

Testing framework: Django's unittest (django.test.TestCase).
These tests avoid external dependencies, validate public interfaces, and cover happy paths, edge cases, and failure conditions.
"""

import uuid
from datetime import datetime, timedelta, timezone

from django.test import TestCase
from django.db import IntegrityError, transaction
from django.contrib.auth import get_user_model


# ---- Helper factory-style creators (minimal, no external factory deps) ----

def create_workspace(name="Acme"):
    # Prefer Workspace; fall back to WorkSpace to handle naming variants.
    try:
        from plane.db.models import Workspace
        return Workspace.objects.create(name=name, slug=f"{name.lower()}-ws")
    except Exception:
        from plane.db.models import WorkSpace
        return WorkSpace.objects.create(name=name, slug=f"{name.lower()}-ws")


def create_user(email_suffix="user@example.com"):
    User = get_user_model()
    unique_email = f"{uuid.uuid4().hex[:8]}-{email_suffix}"
    # Some custom user models require username; include when present.
    field_names = {f.name for f in User._meta.get_fields() if hasattr(f, "name")}
    kwargs = {}
    if "username" in field_names:
        kwargs["username"] = unique_email
    # Some models may require full_name/name; provide best-effort defaults if present.
    for possible in ("full_name", "name"):
        if possible in field_names:
            kwargs[possible] = unique_email.split("@")[0]
            break
    return User.objects.create(email=unique_email, **kwargs)


def create_state(workspace):
    from plane.db.models import State
    field_names = {f.name for f in State._meta.fields}
    kwargs = {
        "name": "Backlog",
        "color": "#999999",
        "workspace": workspace,
    }
    if "group" in field_names:
        kwargs["group"] = "backlog"
    return State.objects.create(**kwargs)


def create_file_asset(workspace, asset_url="https://cdn.example.com/cover.png"):
    from plane.db.models import FileAsset
    field_names = {f.name for f in FileAsset._meta.fields}
    defaults = {}
    if "asset_url" in field_names:
        defaults["asset_url"] = asset_url
    if "workspace" in field_names:
        defaults["workspace"] = workspace
    if "name" in field_names:
        defaults["name"] = "cover.png"
    return FileAsset.objects.create(**defaults)


def create_project(workspace, **overrides):
    from plane.db.models import Project
    base = dict(
        name=overrides.pop("name", "Platform"),
        description=overrides.pop("description", ""),
        identifier=overrides.pop("identifier", "plat"),
        workspace=workspace,
    )
    base.update(overrides)
    return Project.objects.create(**base)


def soft_delete(instance):
    # Soft delete if model provides deleted_at (BaseModel typically does)
    if hasattr(instance, "deleted_at"):
        instance.deleted_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        instance.save(update_fields=["deleted_at"])
    return instance


# ---- Tests ----

class ProjectModelTests(TestCase):
    def test_identifier_is_stripped_and_uppercased_on_save(self):
        from plane.db.models import Project
        ws = create_workspace()
        proj = Project(name="X", identifier="  xy-1  ", workspace=ws)
        proj.save()
        proj.refresh_from_db()
        self.assertEqual(proj.identifier, "XY-1")

    def test_cover_image_url_prefers_asset_over_text(self):
        ws = create_workspace()
        proj = create_project(ws, cover_image="https://example.com/fallback.png")
        # No asset yet -> returns text cover_image
        self.assertEqual(proj.cover_image_url, "https://example.com/fallback.png")

        asset = create_file_asset(ws, asset_url="https://cdn.example.com/asset.png")
        proj.cover_image_asset = asset
        proj.save()
        self.assertEqual(proj.cover_image_url, "https://cdn.example.com/asset.png")

    def test_cover_image_url_none_when_no_asset_and_no_text(self):
        ws = create_workspace()
        proj = create_project(ws)
        self.assertIsNone(proj.cover_image_url)

    def test___str___includes_name_and_workspace(self):
        ws = create_workspace(name="Team One")
        proj = create_project(ws, name="Roadmap")
        s = str(proj)
        self.assertIn("Roadmap", s)
        self.assertIn("Team One", s)

    def test_unique_identifier_per_workspace_when_not_deleted(self):
        ws = create_workspace(name="A")
        create_project(ws, identifier="AAA")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                create_project(ws, identifier="AAA")

    def test_unique_identifier_allows_soft_deleted(self):
        ws = create_workspace(name="A2")
        p1 = create_project(ws, identifier="A2X")
        soft_delete(p1)
        # After soft delete, duplicate identifier should be permitted
        p2 = create_project(ws, identifier="A2X")
        self.assertNotEqual(p1.pk, p2.pk)

    def test_unique_name_per_workspace_when_not_deleted(self):
        ws = create_workspace(name="B")
        create_project(ws, name="Website")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                create_project(ws, name="Website")

    def test_timezone_default_and_choices_contains_utc(self):
        from plane.db.models import Project
        ws = create_workspace()
        proj = create_project(ws)
        self.assertEqual(proj.timezone, "UTC")
        field = Project._meta.get_field("timezone")
        choices = [c[0] for c in field.choices]
        self.assertIn("UTC", choices)

    def test_logo_props_default_is_dict(self):
        ws = create_workspace()
        user = create_user()
        state = create_state(ws)
        proj = create_project(ws, default_state=state, project_lead=user)
        self.assertIsInstance(proj.logo_props, dict)


class ProjectBaseModelBehaviorTests(TestCase):
    def test_workspace_is_copied_from_project_on_save(self):
        # Use concrete subclass ProjectMember
        from plane.db.models import ProjectMember
        ws = create_workspace("WSX")
        user = create_user()
        proj = create_project(ws, name="Alpha", identifier="ALP")
        member = ProjectMember(project=proj, member=user)
        # Before save, workspace may be None (set on save)
        self.assertTrue(member.workspace_id is None or member.workspace_id == ws.id)
        member.save()
        self.assertEqual(member.workspace_id, ws.id)


class ProjectMemberTests(TestCase):
    def test_sort_order_decreases_relative_to_existing_members_for_same_user(self):
        from plane.db.models import ProjectMember
        ws = create_workspace("WSY")
        user = create_user()
        proj1 = create_project(ws, name="P1", identifier="P1")
        proj2 = create_project(ws, name="P2", identifier="P2")

        m1 = ProjectMember.objects.create(project=proj1, member=user)  # default 65535
        m2 = ProjectMember.objects.create(project=proj2, member=user)  # expect 65535-10000

        m1.refresh_from_db()
        m2.refresh_from_db()
        self.assertEqual(m1.sort_order, 65535)
        self.assertEqual(m2.sort_order, 55535)

    def test_unique_project_member_pair_enforced_when_not_deleted(self):
        from plane.db.models import ProjectMember
        ws = create_workspace("WSZ")
        user = create_user()
        proj = create_project(ws, name="P", identifier="PP")
        ProjectMember.objects.create(project=proj, member=user)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProjectMember.objects.create(project=proj, member=user)

    def test_unique_project_member_allows_soft_deleted(self):
        from plane.db.models import ProjectMember
        ws = create_workspace("WSQ")
        user = create_user()
        proj = create_project(ws, name="PA", identifier="PA")
        m = ProjectMember.objects.create(project=proj, member=user)
        soft_delete(m)
        # Should succeed after soft delete
        ProjectMember.objects.create(project=proj, member=user)


class ProjectIdentifierModelTests(TestCase):
    def test_unique_name_per_workspace_when_not_deleted(self):
        from plane.db.models import ProjectIdentifier
        ws = create_workspace("U1")
        proj = create_project(ws, name="T", identifier="TU")
        ProjectIdentifier.objects.create(workspace=ws, project=proj, name="TU")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProjectIdentifier.objects.create(workspace=ws, project=proj, name="TU")

    def test_unique_name_allows_soft_deleted(self):
        from plane.db.models import ProjectIdentifier
        ws = create_workspace("U2")
        proj = create_project(ws, name="T2", identifier="T2")
        pi = ProjectIdentifier.objects.create(workspace=ws, project=proj, name="T2")
        soft_delete(pi)
        # Should not raise
        ProjectIdentifier.objects.create(workspace=ws, project=proj, name="T2")


class ProjectDeployBoardTests(TestCase):
    def test_anchor_autogenerates_is_unique_and_str_contains_anchor_and_project(self):
        from plane.db.models import ProjectDeployBoard
        ws = create_workspace("DB1")
        proj = create_project(ws, name="DB P", identifier="DBP")
        board1 = ProjectDeployBoard.objects.create(project=proj)
        board2 = ProjectDeployBoard.objects.create(project=proj)
        self.assertTrue(board1.anchor and board2.anchor)
        self.assertNotEqual(board1.anchor, board2.anchor)
        s = str(board1)
        self.assertIn(board1.anchor, s)
        self.assertIn(proj.name, s)


class ProjectPublicMemberTests(TestCase):
    def test_unique_project_public_member_pair_enforced(self):
        from plane.db.models import ProjectPublicMember
        ws = create_workspace("PUB")
        user = create_user()
        proj = create_project(ws, name="Open", identifier="OPEN")
        ProjectPublicMember.objects.create(project=proj, member=user)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                ProjectPublicMember.objects.create(project=proj, member=user)

    def test_unique_project_public_member_allows_soft_deleted(self):
        from plane.db.models import ProjectPublicMember
        ws = create_workspace("PUB2")
        user = create_user(email_suffix="pub2@example.com")
        proj = create_project(ws, name="Open2", identifier="OPN2")
        ppm = ProjectPublicMember.objects.create(project=proj, member=user)
        soft_delete(ppm)
        # Should succeed after soft delete
        ProjectPublicMember.objects.create(project=proj, member=user)