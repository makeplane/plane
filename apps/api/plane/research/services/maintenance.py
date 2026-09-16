# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Workspace housekeeping used by the deployment scripts.

The deployment keeps exactly two workspaces. Retiring an old one means
removing its research rows first (they are ``PROTECT``ed on purpose) and then
hard-deleting the workspace itself, because a soft-deleted workspace would
keep its slug reserved and hide half of its rows from the admin UI.

Django cannot order those deletions for us (``PROTECT`` blocks the cascade),
so the helpers below walk the research tables child-first with SQL, using the
shortest foreign key path back to the workspace.
"""

from django.apps import apps
from django.db import connection, transaction

RESEARCH_TABLE_PREFIX = "research_"


def research_models():
    """Every research table, including those without a workspace column."""
    return [
        model
        for model in apps.get_app_config("db").get_models()
        if model._meta.db_table.startswith(RESEARCH_TABLE_PREFIX)
    ]


def _workspace_condition(model, workspace, seen=None):
    """SQL condition selecting the rows of ``model`` that belong to ``workspace``."""
    seen = seen or frozenset()
    if model in seen:
        return None
    seen = seen | {model}

    try:
        model._meta.get_field("workspace")
    except Exception:  # noqa: BLE001 - no direct column, try the parents
        pass
    else:
        return "workspace_id = %s", [str(workspace.id)]

    for field in model._meta.get_fields():
        if not getattr(field, "many_to_one", False) or getattr(field, "auto_created", False):
            continue
        parent = field.related_model
        if parent is None or parent is model:
            continue
        # Only walk research tables: every other relation (users, file assets,
        # ...) would produce a condition that does not describe this workspace.
        if not parent._meta.db_table.startswith(RESEARCH_TABLE_PREFIX):
            continue
        parent_condition = _workspace_condition(parent, workspace, seen)
        if parent_condition is None:
            continue
        parent_sql, parent_params = parent_condition
        column = field.column
        parent_table = parent._meta.db_table
        return (
            f'{column} IN (SELECT id FROM "{parent_table}" WHERE {parent_sql})',
            parent_params,
        )
    return None


def _deletion_order(models, conditions):
    """Order models so that children are deleted before their parents."""
    remaining = set(models)
    ordered = []
    while remaining:
        referenced = {
            field.related_model
            for model in remaining
            for field in model._meta.get_fields()
            if getattr(field, "many_to_one", False)
            for _ in (None,)
            if field.related_model in remaining
        }
        leaves = [model for model in remaining if model not in referenced]
        if not leaves:
            # circular reference: fall back to the declared order
            leaves = list(remaining)
        leaves.sort(key=lambda item: item._meta.db_table)
        for model in leaves:
            remaining.discard(model)
            if conditions.get(model) is not None:
                ordered.append(model)
    return ordered


def workspace_counts(workspace):
    """Row counts per research model, for the dry-run report."""
    counts = {}
    for model in research_models():
        condition = _workspace_condition(model, workspace)
        if condition is None:
            continue
        sql, params = condition
        table = model._meta.db_table
        with connection.cursor() as cursor:
            cursor.execute(f'SELECT COUNT(*) FROM "{table}" WHERE {sql}', params)
            count = cursor.fetchone()[0]
        if count:
            counts[model.__name__] = count
    return counts


def purge_research_rows(workspace):
    """Delete every research row of ``workspace``, children first."""
    models = research_models()
    conditions = {model: _workspace_condition(model, workspace) for model in models}
    deleted = {}
    skipped = []
    with transaction.atomic():
        for model in _deletion_order(models, conditions):
            condition = conditions[model]
            sql, params = condition
            table = model._meta.db_table
            try:
                with connection.cursor() as cursor:
                    cursor.execute(f'DELETE FROM "{table}" WHERE {sql}', params)
                    count = cursor.rowcount
            except Exception as error:  # noqa: BLE001 - reported instead of hidden
                skipped.append(f"{table}: {error}")
                continue
            if count:
                deleted[model.__name__] = count
    if skipped:
        deleted["_skipped"] = skipped
    return deleted


def purge_workspace(workspace):
    """Hard-delete one workspace and everything below it.

    Returns ``(deleted, remaining)``: ``remaining`` is non-empty when a
    research table could not be cleared, in which case the workspace itself is
    left untouched so the operator sees what blocked it.
    """
    from plane.db.models import Profile

    research_deleted = purge_research_rows(workspace)
    remaining = workspace_counts(workspace)
    if remaining:
        return research_deleted, remaining
    Profile.objects.filter(last_workspace_id=workspace.id).update(last_workspace_id=None)
    workspace.delete(soft=False)
    return research_deleted, {}
