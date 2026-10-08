# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Factories and a small fixture world for the time tracking tests."""

# Python imports
from dataclasses import dataclass, field
from datetime import timedelta
from uuid import uuid4

# Third party imports
import factory
from django.utils import timezone
from rest_framework.test import APIClient

# Module imports
from plane.db.models import Issue, Project, ProjectMember, State, User, Workspace, WorkspaceMember
from plane.time_tracking.models import ProjectTimeSetting, TimeEntry

ADMIN, MEMBER, GUEST = 20, 15, 5


class StateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = State

    name = factory.Sequence(lambda n: f"State {n}")
    group = "backlog"
    default = True


class IssueFactory(factory.django.DjangoModelFactory):
    """Minimal work item; ``Issue.save()`` assigns the sequence id and the project's default state."""

    class Meta:
        model = Issue

    name = factory.Sequence(lambda n: f"Work item {n}")
    workspace = factory.SelfAttribute("project.workspace")


class TimeEntryFactory(factory.django.DjangoModelFactory):
    """A completed, duration-only manual entry of 1 hour today, unless overridden."""

    class Meta:
        model = TimeEntry

    workspace = factory.SelfAttribute("project.workspace")
    spent_on = factory.LazyFunction(lambda: timezone.now().date())
    duration_seconds = 3600
    source = TimeEntry.Source.MANUAL
    created_by = factory.SelfAttribute("user")

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # BaseModel.save() replaces created_by with the request user unless it's passed explicitly
        created_by = kwargs.pop("created_by", None)
        entry = model_class(*args, **kwargs)
        entry.save(created_by_id=created_by.id if created_by else None)
        return entry

    @classmethod
    def running(cls, started_ago=timedelta(minutes=30), **kwargs):
        started_at = timezone.now() - started_ago
        return cls(
            started_at=started_at,
            spent_on=started_at.date(),
            duration_seconds=None,
            source=TimeEntry.Source.TIMER,
            **kwargs,
        )


class ProjectTimeSettingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProjectTimeSetting

    workspace = factory.SelfAttribute("project.workspace")
    default_billable = False


def make_user(name, tz="UTC"):
    user = User.objects.create(
        email=f"{name}-{uuid4().hex[:6]}@plane.so",
        username=f"{name}_{uuid4().hex[:6]}",
        first_name=name.capitalize(),
        display_name=name.capitalize(),
        user_timezone=tz,
    )
    # tests authenticate with force_authenticate; skip the (slow) password hashing
    user.set_unusable_password()
    user.save()
    return user


def make_member(workspace, user, ws_role, project=None, project_role=None):
    WorkspaceMember.objects.get_or_create(workspace=workspace, member=user, defaults={"role": ws_role})
    if project is not None and project_role is not None:
        ProjectMember.objects.create(workspace=workspace, project=project, member=user, role=project_role)
    return user


def make_project(workspace, name, identifier, network=2, creator=None):
    project = Project.objects.create(
        name=name, identifier=identifier, workspace=workspace, network=network, created_by=creator
    )
    StateFactory(project=project, workspace=workspace, name="Backlog", group="backlog", default=True)
    return project


def client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@dataclass
class World:
    """The cast from the QA script (plan Appendix D), plus a project admin and an outsider.

    - ana: workspace Admin; Admin of WEB and SEC
    - pia: workspace Member; Admin of WEB
    - ben: workspace Member; Member of WEB
    - cal: workspace Member; not in any project
    - gil: workspace Guest; Guest of WEB
    - WEB is Public, SEC is Secret
    """

    workspace: Workspace
    ana: User
    pia: User
    ben: User
    cal: User
    gil: User
    web: Project
    sec: Project
    web_1: Issue
    web_2: Issue
    sec_1: Issue
    extra: dict = field(default_factory=dict)

    @property
    def slug(self):
        return self.workspace.slug


def build_world():
    ana = make_user("ana")
    workspace = Workspace.objects.create(name="Acme", slug=f"acme-{uuid4().hex[:6]}", owner=ana)
    web = make_project(workspace, "Website", "WEB", network=2, creator=ana)
    sec = make_project(workspace, "Secret", "SEC", network=0, creator=ana)

    make_member(workspace, ana, ADMIN, web, ADMIN)
    ProjectMember.objects.create(workspace=workspace, project=sec, member=ana, role=ADMIN)
    pia = make_member(workspace, make_user("pia"), MEMBER, web, ADMIN)
    ben = make_member(workspace, make_user("ben"), MEMBER, web, MEMBER)
    cal = make_member(workspace, make_user("cal"), MEMBER)
    gil = make_member(workspace, make_user("gil"), GUEST, web, GUEST)

    return World(
        workspace=workspace,
        ana=ana,
        pia=pia,
        ben=ben,
        cal=cal,
        gil=gil,
        web=web,
        sec=sec,
        web_1=IssueFactory(project=web, name="Fix login"),
        web_2=IssueFactory(project=web, name="Add search"),
        sec_1=IssueFactory(project=sec, name="Top secret"),
    )
