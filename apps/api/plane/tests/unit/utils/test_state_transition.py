# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.db.models import Project, ProjectMember, State, StateGroup, StateTransition
from plane.utils.state_transition import is_state_transition_allowed


@pytest.mark.unit
class TestIsStateTransitionAllowed:
    @pytest.fixture
    def workflow_context(self, workspace, create_user):
        project = Project.objects.create(name="Workflow project", identifier="WFP", workspace=workspace)
        ProjectMember.objects.create(project=project, member=create_user, role=20)

        def make_state(name, group=StateGroup.UNSTARTED.value, **kwargs):
            return State.objects.create(
                name=name, color="#000000", group=group, project=project, workspace=workspace, **kwargs
            )

        backlog = make_state("Backlog", StateGroup.BACKLOG.value)
        todo = make_state("Todo")
        in_progress = make_state("In Progress", StateGroup.STARTED.value)
        done = make_state("Done", StateGroup.COMPLETED.value)
        triage = State.all_state_objects.create(
            name="Triage",
            color="#000000",
            group=StateGroup.TRIAGE.value,
            is_triage=True,
            project=project,
            workspace=workspace,
        )

        return {
            "project": project,
            "backlog": backlog,
            "todo": todo,
            "in_progress": in_progress,
            "done": done,
            "triage": triage,
        }

    @pytest.mark.django_db
    def test_no_config_allows_everything(self, workflow_context):
        ctx = workflow_context
        assert is_state_transition_allowed(ctx["project"].id, ctx["backlog"].id, ctx["done"].id)

    @pytest.mark.django_db
    def test_same_state_always_allowed(self, workflow_context):
        ctx = workflow_context
        assert is_state_transition_allowed(ctx["project"].id, ctx["todo"].id, ctx["todo"].id)

    @pytest.mark.django_db
    def test_none_states_allowed(self, workflow_context):
        ctx = workflow_context
        assert is_state_transition_allowed(ctx["project"].id, None, ctx["todo"].id)
        assert is_state_transition_allowed(ctx["project"].id, ctx["todo"].id, None)

    @pytest.mark.django_db
    def test_configured_state_restricts_to_listed_targets(self, workflow_context):
        ctx = workflow_context
        StateTransition.objects.create(
            project=ctx["project"],
            workspace=ctx["project"].workspace,
            from_state=ctx["todo"],
            to_state=ctx["in_progress"],
        )

        assert is_state_transition_allowed(ctx["project"].id, ctx["todo"].id, ctx["in_progress"].id)
        assert not is_state_transition_allowed(ctx["project"].id, ctx["todo"].id, ctx["done"].id)
        # Other states remain unrestricted
        assert is_state_transition_allowed(ctx["project"].id, ctx["backlog"].id, ctx["done"].id)

    @pytest.mark.django_db
    def test_string_ids_accepted(self, workflow_context):
        ctx = workflow_context
        StateTransition.objects.create(
            project=ctx["project"],
            workspace=ctx["project"].workspace,
            from_state=ctx["todo"],
            to_state=ctx["in_progress"],
        )
        assert is_state_transition_allowed(ctx["project"].id, str(ctx["todo"].id), str(ctx["in_progress"].id))
        assert not is_state_transition_allowed(ctx["project"].id, str(ctx["todo"].id), str(ctx["done"].id))

    @pytest.mark.django_db
    def test_triage_source_always_allowed(self, workflow_context):
        ctx = workflow_context
        StateTransition.objects.create(
            project=ctx["project"],
            workspace=ctx["project"].workspace,
            from_state=ctx["triage"],
            to_state=ctx["done"],
        )
        # Even with config present, transitions out of triage are unrestricted
        assert is_state_transition_allowed(ctx["project"].id, ctx["triage"].id, ctx["todo"].id)

    @pytest.mark.django_db
    def test_allow_any_transition_target_bypasses_restrictions(self, workflow_context):
        ctx = workflow_context
        StateTransition.objects.create(
            project=ctx["project"],
            workspace=ctx["project"].workspace,
            from_state=ctx["todo"],
            to_state=ctx["in_progress"],
        )
        ctx["done"].allow_any_transition = True
        ctx["done"].save()

        assert is_state_transition_allowed(ctx["project"].id, ctx["todo"].id, ctx["done"].id)
