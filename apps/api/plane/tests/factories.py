# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import factory
from uuid import uuid4
from django.utils import timezone

from plane.db.models import (
    User,
    Workspace,
    WorkspaceMember,
    Project,
    ProjectMember,
    State,
    Issue,
    IssueRelation,
)
from plane.db.models.issue import IssueRelationChoices


class UserFactory(factory.django.DjangoModelFactory):
    """Factory for creating User instances"""

    class Meta:
        model = User
        django_get_or_create = ("email",)

    id = factory.LazyFunction(uuid4)
    email = factory.Sequence(lambda n: f"user{n}@plane.so")
    password = factory.PostGenerationMethodCall("set_password", "password")
    first_name = factory.Sequence(lambda n: f"First{n}")
    last_name = factory.Sequence(lambda n: f"Last{n}")
    is_active = True
    is_superuser = False
    is_staff = False


class WorkspaceFactory(factory.django.DjangoModelFactory):
    """Factory for creating Workspace instances"""

    class Meta:
        model = Workspace
        django_get_or_create = ("slug",)

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Workspace {n}")
    slug = factory.Sequence(lambda n: f"workspace-{n}")
    owner = factory.SubFactory(UserFactory)
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class WorkspaceMemberFactory(factory.django.DjangoModelFactory):
    """Factory for creating WorkspaceMember instances"""

    class Meta:
        model = WorkspaceMember

    id = factory.LazyFunction(uuid4)
    workspace = factory.SubFactory(WorkspaceFactory)
    member = factory.SubFactory(UserFactory)
    role = 20  # Admin role by default
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class ProjectFactory(factory.django.DjangoModelFactory):
    """Factory for creating Project instances"""

    class Meta:
        model = Project
        django_get_or_create = ("name", "workspace")

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Project {n}")
    workspace = factory.SubFactory(WorkspaceFactory)
    created_by = factory.SelfAttribute("workspace.owner")
    updated_by = factory.SelfAttribute("workspace.owner")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class ProjectMemberFactory(factory.django.DjangoModelFactory):
    """Factory for creating ProjectMember instances"""

    class Meta:
        model = ProjectMember

    id = factory.LazyFunction(uuid4)
    project = factory.SubFactory(ProjectFactory)
    member = factory.SubFactory(UserFactory)
    role = 20  # Admin role by default
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class StateFactory(factory.django.DjangoModelFactory):
    """Factory for creating State instances.

    Phase 3 Wave-0 fixture: Issue.save() falls back to a project default State
    when ``state`` is None, but ProjectFactory does not seed any states. The
    contract suite needs an explicit State so IssueFactory can satisfy the
    state FK without depending on side effects in Project creation.
    """

    class Meta:
        model = State

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"State {n}")
    color = "#60646C"
    project = factory.SubFactory(ProjectFactory)
    workspace = factory.SelfAttribute("project.workspace")
    # IssueManager excludes triage-grouped states; "backlog" keeps the issue
    # visible to the manager-default queryset (per Phase 3 Pitfall 3).
    group = "backlog"
    default = False
    created_by = factory.SelfAttribute("project.created_by")
    updated_by = factory.SelfAttribute("project.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)


class IssueFactory(factory.django.DjangoModelFactory):
    """Factory for creating Issue instances.

    Wires a ``StateFactory`` SubFactory whose ``project`` is bound to the
    Issue's ``project`` so the state's FK invariant is preserved when callers
    pass an explicit project (Phase 3 Plan 03-01 Task 1, sanity Test 3).
    """

    class Meta:
        model = Issue

    id = factory.LazyFunction(uuid4)
    name = factory.Sequence(lambda n: f"Issue {n}")
    project = factory.SubFactory(ProjectFactory)
    workspace = factory.SelfAttribute("project.workspace")
    # Pin the state's project to the issue's project so we never spawn a
    # mismatched (state.project, issue.project) pair.
    state = factory.SubFactory(StateFactory, project=factory.SelfAttribute("..project"))
    created_by = factory.SelfAttribute("project.created_by")
    updated_by = factory.SelfAttribute("project.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
    # NOTE: start_date / target_date intentionally not set — many failure-case
    # tests need NULL dates (e.g., INCOMPLETE_SCHEDULE for a descendant).
    # NOTE: is_draft / archived_at intentionally not set — model defaults are
    # correct (False / None) and IssueManager filters them out.


class IssueRelationFactory(factory.django.DjangoModelFactory):
    """Factory for creating IssueRelation instances.

    Defaults to ``relation_type="blocked_by"`` per Phase 1 D-04: every
    precedence row is canonically stored as ``blocked_by``; the precedence
    graph loader filters on this exact string.
    """

    class Meta:
        model = IssueRelation

    id = factory.LazyFunction(uuid4)
    issue = factory.SubFactory(IssueFactory)
    related_issue = factory.SubFactory(
        IssueFactory, project=factory.SelfAttribute("..issue.project")
    )
    project = factory.SelfAttribute("issue.project")
    workspace = factory.SelfAttribute("issue.workspace")
    relation_type = IssueRelationChoices.BLOCKED_BY.value
    created_by = factory.SelfAttribute("issue.created_by")
    updated_by = factory.SelfAttribute("issue.updated_by")
    created_at = factory.LazyFunction(timezone.now)
    updated_at = factory.LazyFunction(timezone.now)
