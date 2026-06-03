# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Project copy helpers — part 1: project-level entity copies.
Covers: estimates, states, labels, modules, cycles.
Part 2 (issue-level): copy_project_issue_helpers.py
"""

import uuid

from plane.db.models import (
    Cycle,
    Estimate,
    EstimatePoint,
    Label,
    Module,
    State,
)

BATCH = 100


def copy_estimates(source_project, new_project):
    """Returns (estimate_id_map, estimate_point_id_map)."""
    estimate_id_map = {}
    estimate_point_id_map = {}

    for est in Estimate.objects.filter(project=source_project):
        old_est_id = est.id
        est.pk = uuid.uuid4()
        est.id = est.pk
        est.project = new_project
        est.workspace = new_project.workspace
        estimate_id_map[old_est_id] = est.pk

        points = list(EstimatePoint.objects.filter(estimate_id=old_est_id))
        est.save(disable_auto_set_user=True)

        new_points = []
        for pt in points:
            old_pt_id = pt.id
            new_pt_id = uuid.uuid4()
            new_points.append(
                EstimatePoint(
                    id=new_pt_id,
                    estimate=est,
                    project=new_project,
                    workspace=new_project.workspace,
                    key=pt.key,
                    description=pt.description,
                    value=pt.value,
                )
            )
            estimate_point_id_map[old_pt_id] = new_pt_id
        EstimatePoint.objects.bulk_create(new_points, batch_size=BATCH)

    return estimate_id_map, estimate_point_id_map


def copy_states(source_project, new_project):
    """Returns state_id_map."""
    state_id_map = {}
    new_states = []
    for st in State.all_state_objects.filter(project=source_project):
        new_id = uuid.uuid4()
        state_id_map[st.id] = new_id
        new_states.append(
            State(
                id=new_id,
                name=st.name,
                description=st.description,
                color=st.color,
                sequence=st.sequence,
                group=st.group,
                default=st.default,
                is_triage=st.is_triage,
                is_system=st.is_system,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    State.objects.bulk_create(new_states, batch_size=BATCH)
    return state_id_map


def copy_labels(source_project, new_project):
    """Returns label_id_map. Creates new labels; two-pass to preserve parent hierarchy."""
    label_id_map = {}
    source_labels = list(Label.objects.filter(project=source_project))
    new_labels = []
    for lbl in source_labels:
        new_id = uuid.uuid4()
        label_id_map[lbl.id] = new_id
        new_labels.append(
            Label(
                id=new_id,
                name=lbl.name,
                description=lbl.description,
                color=lbl.color,
                sort_order=lbl.sort_order,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    Label.objects.bulk_create(new_labels, batch_size=BATCH)

    # Pass 2: remap parent FK for nested labels
    children = [lbl for lbl in source_labels if lbl.parent_id]
    if children:
        updated = []
        for lbl in children:
            new_id = label_id_map[lbl.id]
            new_parent_id = label_id_map.get(lbl.parent_id)
            if new_parent_id:
                updated.append(Label(id=new_id, parent_id=new_parent_id))
        for i in range(0, len(updated), BATCH):
            Label.objects.bulk_update(updated[i : i + BATCH], ["parent_id"], batch_size=BATCH)

    return label_id_map


def copy_modules(source_project, new_project):
    """Returns module_id_map."""
    module_id_map = {}
    new_modules = []
    for mod in Module.objects.filter(project=source_project):
        new_id = uuid.uuid4()
        module_id_map[mod.id] = new_id
        new_modules.append(
            Module(
                id=new_id,
                name=mod.name,
                description=mod.description,
                description_text=mod.description_text,
                description_html=mod.description_html,
                start_date=mod.start_date,
                target_date=mod.target_date,
                status=mod.status,
                logo_props=mod.logo_props,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    Module.objects.bulk_create(new_modules, batch_size=BATCH)
    return module_id_map


def copy_cycles(source_project, new_project, fallback_user):
    """Returns cycle_id_map. owned_by uses fallback_user (job initiator)."""
    cycle_id_map = {}
    new_cycles = []
    for cyc in Cycle.objects.filter(project=source_project):
        new_id = uuid.uuid4()
        cycle_id_map[cyc.id] = new_id
        new_cycles.append(
            Cycle(
                id=new_id,
                name=cyc.name,
                description=cyc.description,
                start_date=cyc.start_date,
                end_date=cyc.end_date,
                owned_by=fallback_user,
                logo_props=cyc.logo_props,
                project=new_project,
                workspace=new_project.workspace,
            )
        )
    Cycle.objects.bulk_create(new_cycles, batch_size=BATCH)
    return cycle_id_map
