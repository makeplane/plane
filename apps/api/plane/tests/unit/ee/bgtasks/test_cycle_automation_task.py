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

from uuid import uuid4

import pytest

from plane.db.models import Workspace, Project, WorkspaceMember, Cycle, User, BotTypeEnum
from plane.ee.bgtasks.cycle_automation_task import _build_cycle_name, _get_next_cycle_sequence


@pytest.fixture
def workspace(db, create_user):
    workspace = Workspace.objects.create(
        name="Test Workspace",
        slug=f"test-workspace-{uuid4().hex[:6]}",
        id=uuid4(),
        owner=create_user,
    )
    WorkspaceMember.objects.create(workspace=workspace, member=create_user, role=20)
    return workspace


@pytest.fixture
def project(db, workspace, create_user):
    return Project.objects.create(
        name="Test Project",
        identifier=f"TP{uuid4().hex[:4].upper()}",
        workspace=workspace,
        created_by=create_user,
        timezone="UTC",
    )


@pytest.fixture
def bot_user(db):
    return User.objects.create(
        username=f"cycle-automation-bot-{uuid4().hex}",
        display_name="Cycle Automation Bot",
        first_name="Cycle",
        last_name="Automation Bot",
        is_bot=True,
        bot_type=BotTypeEnum.CYCLE_AUTOMATION_BOT,
        email=f"cycle-automation-bot-{uuid4().hex}@plane.so",
        password=uuid4().hex,
        is_password_autoset=True,
    )


def _create_cycle(project, workspace, owned_by, name, created_by=None):
    return Cycle.objects.create(
        project=project,
        workspace=workspace,
        owned_by=owned_by,
        created_by=created_by or owned_by,
        name=name,
    )


@pytest.mark.unit
class TestCycleAutomationNaming:
    @pytest.mark.django_db
    def test_build_cycle_name(self):
        assert _build_cycle_name("Cycle", 2) == "Cycle - 2"
        assert _build_cycle_name("  Sprint  ", 1) == "Sprint - 1"

    @pytest.mark.django_db
    def test_next_sequence_no_prior_cycles(self, project, workspace, bot_user):
        assert _get_next_cycle_sequence("Cycle", project.id, bot_user.id) == 1

    @pytest.mark.django_db
    def test_next_sequence_existing_base_title(self, project, workspace, bot_user):
        _create_cycle(project, workspace, bot_user, "Cycle")
        _create_cycle(project, workspace, bot_user, "Cycle")
        assert _get_next_cycle_sequence("Cycle", project.id, bot_user.id) == 3

    @pytest.mark.django_db
    def test_next_sequence_existing_suffixes(self, project, workspace, bot_user):
        _create_cycle(project, workspace, bot_user, "Cycle - 1")
        _create_cycle(project, workspace, bot_user, "Cycle - 2")
        assert _get_next_cycle_sequence("Cycle", project.id, bot_user.id) == 3

    @pytest.mark.django_db
    def test_next_sequence_ignores_manual_cycles(self, project, workspace, bot_user):
        manual_user = User.objects.create(
            username=f"user-{uuid4().hex}",
            email=f"user-{uuid4().hex}@plane.so",
            display_name="Manual User",
            first_name="Manual",
            last_name="User",
            password=uuid4().hex,
        )
        _create_cycle(project, workspace, manual_user, "Cycle - 7", created_by=manual_user)
        assert _get_next_cycle_sequence("Cycle", project.id, bot_user.id) == 1
