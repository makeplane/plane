# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed a useful fixture for the Team Operations Dashboard frontend QA.

Idempotent: re-running drops the dashboard-qa workspace and rebuilds it.

Also configures the dedicated QA instance (signin enabled, onboarding
flag set, owner promoted to InstanceAdmin) so the frontend at
http://localhost:3100 can sign in directly instead of seeing the
\"Welcome to Plane / Set up your instance\" page (coordinator finding
``msg_81a045dda7d4``).

Usage:
    python manage.py seed_dashboard_qa
    python manage.py seed_dashboard_qa --workspace-slug acme-qa --owner-email alice@acme.so

Writes /tmp/plane-dashboard-qa-ready.json on success with the
endpoint URL, readiness probe and the QA login credentials the frontend
worker can use.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.models import (
    Cycle,
    CycleIssue,
    Issue,
    IssueAssignee,
    IssueBlocker,
    IssueLabel,
    Label,
    Module,
    ModuleIssue,
    ModuleMember,
    Project,
    ProjectMember,
    ProjectNetwork,
    State,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.license.models import Instance, InstanceAdmin, InstanceConfiguration


QA_READY_PATH = Path("/tmp/plane-dashboard-qa-ready.json")


class Command(BaseCommand):
    help = "Seed a fixture for the Dashboard QA API (port 8100)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--workspace-slug",
            default="acme-qa",
            help="Workspace slug to create (default acme-qa).",
        )
        parser.add_argument(
            "--owner-email",
            default="alice@acme.so",
            help="Workspace owner email (default alice@acme.so).",
        )
        parser.add_argument(
            "--owner-password",
            default="password123",
            help="Owner password (default password123; QA only, not prod).",
        )
        parser.add_argument(
            "--issues-per-project",
            type=int,
            default=80,
            help="Approximate issues per project (default 80).",
        )

    def handle(self, *args, **options):
        slug = options["workspace_slug"]
        owner_email = options["owner_email"]
        owner_password = options["owner_password"]
        n_issues = options["issues_per_project"]

        with transaction.atomic():
            workspace, owner = _reset_workspace(slug, owner_email, owner_password)
            members = _create_members(workspace, owner)
            projects = _create_projects(workspace, owner)
            for project in projects:
                _seed_states(project, owner)
                _seed_labels(project, owner, count=5)
                _seed_cycles(project, owner, count=2)
                _seed_modules(project, owner, members, count=2)
                _seed_issues(
                    project, owner, members, count=n_issues,
                    state_lookup={s.group: s for s in State.objects.filter(project=project)},
                )
        # Configure the dedicated QA instance so the frontend at
        # :3100 can sign in (see coordinator finding msg_81a045dda7d4).
        _configure_qa_instance(owner)

        api_url = os.environ.get("QA_API_URL", "http://localhost:8100")
        ready = {
            "endpoint": api_url,
            "health": f"{api_url}/api/health/",
            "workspace": {
                "slug": workspace.slug,
                "id": str(workspace.id),
                "name": workspace.name,
                "timezone": workspace.timezone,
            },
            "owner": {
                "email": owner.email,
                "password": owner_password,
            },
            "members": [{"email": m.email} for m in members],
            "projects": [
                {"id": str(p.id), "name": p.name, "identifier": p.identifier}
                for p in projects
            ],
            "endpoints": {
                "overview": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/overview/",
                "attention": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/attention/",
                "items": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/items/",
                "workload": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/workload/",
                "projects": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/projects/",
                "timeline": f"{api_url}/api/workspaces/{workspace.slug}/dashboard/timeline/",
            },
            "cors_origins": [
                "http://localhost:3000", "http://localhost:3001",
                "http://localhost:3002", "http://localhost:3100",
            ],
            "instance_configured": True,
            "signin_url": f"{api_url}/api/instances/admins/",
            "ui_url": "http://localhost:3100",
        }
        QA_READY_PATH.write_text(json.dumps(ready, indent=2, default=str))
        self.stdout.write(self.style.SUCCESS(
            f"Seeded workspace {workspace.slug!r} with {len(projects)} projects; "
            f"instance configured, owner promoted to InstanceAdmin."
        ))
        self.stdout.write(f"Readiness: {QA_READY_PATH}")


def _configure_qa_instance(owner: User) -> None:
    """Mark the dedicated QA instance as set-up and the owner as admin.

    Coordinator finding ``msg_81a045dda7d4``: after ``register_instance``
    the row exists but ``is_setup_done`` is False, so the frontend at
    :3100 renders \"Welcome to Plane / Set up your instance\" instead
    of the sign-in page. We:

    1. Set ``is_setup_done=True`` and a friendly ``instance_name``.
    2. Create an ``InstanceAdmin`` row for the owner (role=20).
    3. Persist the standard ``InstanceConfiguration`` keys so the
       frontend does not show any \"configure instance\" gates
       (``ENABLE_SIGNUP``, ``EMAIL_HOST``, ``DISABLE_SIGNUP``,
       ``ENABLE_EMAIL_PASSWORD``, ``IS_GLOBAL_INSTANCE`` etc.).
    """
    from django.utils import timezone as _tz
    import secrets as _secrets

    instance = Instance.objects.first()
    if instance is None:
        # The api container's entrypoint runs ``register_instance`` before
        # the seed command, so this should be present. Fall back to
        # creating a placeholder so the seed does not crash before
        # exposing the API.
        instance = Instance.objects.create(
            instance_name="Acme QA",
            instance_id=_secrets.token_hex(12),
            current_version="0.0.0",
            last_checked_at=_tz.now(),
            is_test=True,
        )
    instance.instance_name = "Acme QA"
    instance.is_setup_done = True
    instance.is_signup_screen_visited = True
    instance.is_verified = True
    instance.is_telemetry_enabled = False
    instance.save()

    InstanceAdmin.objects.get_or_create(
        user=owner, instance=instance, defaults={"role": 20},
    )

    # Allow email + password sign-in and disable the global-signup gate
    # so the QA frontend can sign in with ``alice@acme.so``.
    standard_keys = {
        "IS_GLOBAL_INSTANCE": "0",
        "DISABLE_SIGNUP": "0",
        "ENABLE_SIGNUP": "1",
        "ENABLE_EMAIL_PASSWORD": "1",
        "ENABLE_MAGIC_LINK_LOGIN": "0",
        "ENABLE_GOOGLE_LOGIN": "0",
        "ENABLE_GITHUB_LOGIN": "0",
        "ENABLE_GITLAB_LOGIN": "0",
        "ENABLE_LDAP_LOGIN": "0",
        "EMAIL_HOST": "",
        "FILE_SIZE_LIMIT": "5242880",
    }
    for key, value in standard_keys.items():
        InstanceConfiguration.objects.update_or_create(
            key=key,
            defaults={"value": value, "category": "AUTHENTICATION"},
        )


def _reset_workspace(slug: str, owner_email: str, owner_password: str):
    """Drop existing workspace with the same slug, then rebuild.

    Idempotent: also removes the seeded roster users by known emails so
    repeated runs (e.g. ``docker compose run --rm seed_dashboard_qa``)
    do not collide on unique username constraints.
    """
    User.objects.filter(
        email__in=[owner_email] + [
            f"{name}@acme.so" for name in (
                "bob", "carol", "dave", "eve", "frank",
            )
        ],
    ).delete()
    Workspace.objects.filter(slug=slug).delete()
    owner = User.objects.create(
        email=owner_email, username=owner_email.split("@")[0],
        is_active=True, is_superuser=False, is_staff=False,
    )
    owner.set_password(owner_password)
    owner.save()
    workspace = Workspace.objects.create(
        name="Acme QA", slug=slug, owner=owner, timezone="UTC",
        created_by=owner,
    )
    WorkspaceMember.objects.create(
        workspace=workspace, member=owner, role=20, is_active=True,
    )
    return workspace, owner


def _create_members(workspace, owner):
    """Build a 6-member roster for the QA fixture (owner + 5 others)."""
    roster = [
        ("bob@acme.so", "Bob", "Builder"),
        ("carol@acme.so", "Carol", "CTO"),
        ("dave@acme.so", "Dave", "Designer"),
        ("eve@acme.so", "Eve", "Engineer"),
        ("frank@acme.so", "Frank", "Founder"),
    ]
    members = []
    for email, first, last in roster:
        user = User.objects.create(
            email=email, username=email.split("@")[0],
            is_active=True, is_superuser=False, is_staff=False,
            first_name=first, last_name=last,
        )
        user.set_password("password123")
        user.save()
        WorkspaceMember.objects.create(
            workspace=workspace, member=user, role=15, is_active=True,
        )
        members.append(user)
    members.append(owner)
    return members


def _create_projects(workspace, owner):
    """Three projects with distinct names so the projects panel has variety."""
    projects = []
    for name, identifier in [
        ("Platform", "PLT"),
        ("Mobile", "MOB"),
        ("Docs", "DOC"),
    ]:
        proj = Project.objects.create(
            workspace=workspace, name=name, identifier=identifier,
            created_by=owner, updated_by=owner,
            network=ProjectNetwork.PUBLIC.value,
        )
        for u in User.objects.filter(
            member_workspace__workspace=workspace,
            member_workspace__is_active=True,
        ):
            ProjectMember.objects.create(
                project=proj, member=u, role=20, is_active=True,
            )
        projects.append(proj)
    return projects


def _seed_states(project, owner):
    for group, name in [
        ("backlog", "Backlog"), ("unstarted", "Unstarted"),
        ("started", "Started"), ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]:
        State.objects.create(
            project=project, name=name, color="#000000", group=group,
        )


def _seed_labels(project, owner, count: int):
    for i in range(count):
        Label.objects.create(
            project=project, name=f"label-{i}", color="#000000",
            created_by=owner,
        )


def _seed_cycles(project, owner, count: int):
    today = datetime.now(timezone.utc).date()
    for i in range(count):
        Cycle.objects.create(
            project=project, name=f"Cycle {i}",
            start_date=today - timedelta(days=14 * i),
            end_date=today + timedelta(days=14),
            created_by=owner, owned_by=owner,
        )


def _seed_modules(project, owner, members, count: int):
    for i in range(count):
        mod = Module.objects.create(
            project=project, name=f"Module {i}",
            created_by=owner, workspace=project.workspace,
        )
        for u in members[:3]:
            ModuleMember.objects.create(module=mod, member=u, project=project)


def _seed_issues(project, owner, members, count: int, state_lookup):
    """Distribute ``count`` issues across states + members + dates.

    Distribution targets the dashboard shape the frontend expects:
    backlog 20%, unstarted 20%, started 30%, completed 20%, cancelled 10%.
    Adds cycles, modules, labels, assignees, blockers so every panel has
    real data.
    """
    today = datetime.now(timezone.utc).date()
    distribution = {
        "backlog": int(count * 0.2),
        "unstarted": int(count * 0.2),
        "started": int(count * 0.3),
        "completed": int(count * 0.2),
        "cancelled": count - sum(int(count * p) for p in (0.2, 0.2, 0.3, 0.2)),
    }
    labels = list(Label.objects.filter(project=project))
    cycles = list(Cycle.objects.filter(project=project))
    modules = list(Module.objects.filter(project=project))
    issues = []
    for group, n in distribution.items():
        state = state_lookup[group]
        for i in range(n):
            target = None
            created = datetime.combine(
                today - timedelta(days=(i % 60)), time(9, 0), tzinfo=timezone.utc,
            )
            if group in ("started", "backlog", "unstarted"):
                # spread target_date across overdue/today/due-soon/future
                day_offset = (i % 14) - 5  # -5..+8
                target = today + timedelta(days=day_offset)
            issue = Issue.objects.create(
                project=project, workspace=project.workspace,
                name=f"{group.title()} {i}",
                state=state, priority=("urgent" if i % 5 == 0 else "high" if i % 3 == 0 else "medium"),
                target_date=target, created_by=owner,
            )
            Issue.objects.filter(pk=issue.pk).update(created_at=created)
            if labels and i % 2 == 0:
                IssueLabel.objects.create(
                    issue=issue, label=labels[i % len(labels)],
                    project=project, workspace=project.workspace,
                )
            if members and i % 3 != 0:
                IssueAssignee.objects.create(
                    issue=issue, assignee=members[i % len(members)],
                    project=project, workspace=project.workspace,
                )
            if cycles and group == "started" and i % 4 == 0:
                CycleIssue.objects.create(
                    issue=issue, cycle=cycles[i % len(cycles)],
                    project=project, workspace=project.workspace,
                )
            if modules and group in ("started", "backlog") and i % 5 == 0:
                ModuleIssue.objects.create(
                    issue=issue, module=modules[i % len(modules)],
                    project=project, workspace=project.workspace,
                )
            if group == "completed":
                Issue.objects.filter(pk=issue.pk).update(
                    completed_at=datetime.combine(
                        today - timedelta(days=i % 30), time(9, 0),
                        tzinfo=timezone.utc,
                    ),
                )
            issues.append(issue)
    # A handful of blockers so the attention panel has something to show.
    started = [i for i in issues if i.state.group == "started"]
    for src, dst in zip(started[:10], started[10:20]):
        IssueBlocker.objects.create(
            block=dst, blocked_by=src, project=project,
            workspace=project.workspace, created_by=owner,
        )
