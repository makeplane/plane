# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Service helpers shared by the app and v1 project-create endpoints.

# The previous design inlined create-route core writes (Project,
# ProjectIdentifier, memberships, DEFAULT_STATES, model_activity.delay)
# directly inside each view. That meant partial writes could survive a
# mid-flight failure (the original "ghost-create" regression), and the
# activity dispatch was fired synchronously, so broker errors surfaced as
# 500s after a successful commit. The two endpoints also diverged on
# which models they wrote — the app path created ``ProjectIdentifier``,
# while the v1 path did not — which made it impossible to add a
# transactional template branch without re-deriving the contract on each
# route.
#
# This module owns a single ``transaction.atomic()`` boundary that wraps
# the core writes for both routes (``D-06``), and registers the activity
# dispatch through ``transaction.on_commit(..., robust=True)`` so broker
# failures no longer roll back a committed project (``D-08``). The
# template branch is layered on top in Phase 02 follow-up plans; this
# module deliberately keeps the no-template path byte-equivalent to the
# pre-refactor behavior so consumers can migrate without response-shape
# surprises.

# Django imports
from django.db import transaction

# Module imports
from plane.app.permissions import ROLE
from plane.bgtasks.webhook_task import model_activity
from plane.db.models import (
    DEFAULT_STATES,
    Project,
    ProjectIdentifier,
    ProjectMember,
    State,
)
from plane.utils.host import base_host


def create_default_project_states(*, project, actor):
    """Bulk-create the default workflow states for a freshly created
    project.

    Returns the list of ``State`` model instances (unsaved) that were
    passed to ``bulk_create`` so callers can introspect or post-process
    them. ``actor`` is the requesting user; every state is stamped with
    ``created_by=actor`` so audit trails stay consistent with the legacy
    view-level behavior.

    ``bulk_create`` is used (rather than ``State.objects.create`` per row)
    so model ``save`` hooks — which auto-assign ``sequence`` from the
    highest existing row — do not overwrite the explicit ``sequence``
    values carried by ``DEFAULT_STATES``. Without this, every new project
    would land on ``sequence=15000`` (the first row's value) for every
    default state, breaking downstream ordering consumers.
    """
    state_instances = [
        State(
            name=state["name"],
            color=state["color"],
            project=project,
            sequence=state["sequence"],
            workspace=project.workspace,
            group=state["group"],
            default=state.get("default", False),
            created_by=actor,
        )
        for state in DEFAULT_STATES
    ]
    State.objects.bulk_create(state_instances)
    return state_instances


def enqueue_project_activity_on_commit(
    *,
    project,
    request_data,
    actor,
    slug,
    request,
    is_app_origin,
):
    """Register a ``model_activity.delay`` task on the surrounding
    transaction's commit hook.

    ``transaction.on_commit(..., robust=True)`` ensures the task only
    fires after a successful commit (``D-06`` rollback path stays clean)
    and that any broker / dispatch failure during the callback is logged
    by Django rather than propagating as an unhandled exception that
    would downgrade an otherwise successful 201 into a 500 (``D-08``).

    A nested function is used instead of ``functools.partial`` because
    Django's robust on_commit logging path reads ``func.__qualname__`` to
    format the error message; partial objects don't carry that dunder
    cleanly, and the closure captures locals that are never rebound so
    late-binding isn't a hazard here.
    """

    def _dispatch_model_activity():
        model_activity.delay(
            model_name="project",
            model_id=str(project.id),
            requested_data=request_data,
            current_instance=None,
            actor_id=actor.id,
            slug=slug,
            origin=base_host(request=request, is_app=is_app_origin),
        )

    transaction.on_commit(_dispatch_model_activity, robust=True)


def create_project_with_optional_template(
    *,
    serializer,
    workspace,
    actor,
    request_data,
    slug,
    request,
    is_app_origin,
):
    """Run the core create transaction for a new ``Project``.

    ``serializer`` must already be validated (``serializer.is_valid()``
    has returned ``True``) and its ``validated_data`` must NOT contain
    ``template_id`` — the optional input is popped by each serializer's
    ``create()`` override before invoking this service. The function
    returns the persisted ``Project``.

    The whole create flow — ``Project``, ``ProjectIdentifier`` (app path
    only), admin ``ProjectMember`` rows, and ``DEFAULT_STATES`` — runs
    inside a single ``transaction.atomic()`` block so any failure rolls
    the entire project back together with no orphan rows (``D-06``).
    The activity log task is registered on the commit hook so the 201
    response is unaffected by broker dispatch errors (``D-08``).
    """
    with transaction.atomic():
        serializer.save()

        project = serializer.instance

        # App route creates a ProjectIdentifier alongside the Project; the
        # legacy v1 route did not, and Phase 02-01 keeps that divergence
        # intact. ``is_app_origin`` is the single source of truth here so
        # both views can share this helper without leaking caller-specific
        # knowledge into the serializer layer.
        if is_app_origin:
            ProjectIdentifier.objects.create(
                name=project.identifier,
                project=project,
                workspace_id=workspace.id,
            )

        # Creator is added as Administrator of the new project. The same
        # row is created by the legacy views; we keep role=ROLE.ADMIN
        # rather than the magic number 20 for readability — the enum
        # resolves to the same integer at the DB layer.
        _ = ProjectMember.objects.create(
            project_id=project.id,
            member=actor,
            role=ROLE.ADMIN.value,
        )

        # If a distinct project_lead was provided (and isn't the actor),
        # add them as Administrator too. Using ``project_lead_id`` rather
        # than ``project_lead`` avoids resolving the related User and
        # breaking UUID coercion downstream.
        if project.project_lead_id is not None and project.project_lead_id != actor.id:
            ProjectMember.objects.create(
                project_id=project.id,
                member_id=project.project_lead_id,
                role=ROLE.ADMIN.value,
            )

        create_default_project_states(project=project, actor=actor)

        enqueue_project_activity_on_commit(
            project=project,
            request_data=request_data,
            actor=actor,
            slug=slug,
            request=request,
            is_app_origin=is_app_origin,
        )

    return project