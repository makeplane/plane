# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): companion data
# migration to 0126_internal_contract_project.py. It exists to repair a
# single-workspace invariant that the previous 23-field seed accidentally
# promised:
#
#   "At most one ProjectCustomField per project ever carries is_unique_key=True."
#
# Before Phase A the unique field was "合同号&项目号" (column A of the source
# spreadsheet). Phase A retires that composite as a data field and shifts the
# unique-key responsibility to "项目序号" (column L), but the existing
# seed_default_custom_fields() only inserts MISSING fields -- it never updates
# the is_unique_key flag on fields it left alone. So on every project that
# already carried the old "合同号&项目号" custom field from before Phase A, the
# Phase A seed run would have left:
#
#   - "合同号&项目号"  is_unique_key = True  (old seed, never touched)
#   - "项目序号"        is_unique_key = True  (new seed from this PR's DEFAULT_...)
#
# Both is_unique_key=True violates the invariant and breaks the advisory-lock
# uniqueness check (ProjectCustomFieldValueSerializer.validate() selects
# custom_field__is_unique_key=True without disambiguating which one to use).
#
# This migration resets "合同号&项目号" -> is_unique_key=False on every project
# where Phase A's new "项目序号" is also present, and (defensively) ensures
# "项目序号" carries is_unique_key=True whenever it exists. Both halves are
# idempotent: re-running on a workspace that already migrated is a no-op.
#
# If a project pre-Phase-A still lacks the new "项目序号" field (e.g. seed
# never reached it -- see the "seed_default_project_custom_fields never run
# against real DB" entry in docs/internal-project-custom-fields.md), the
# cleanup pass leaves it alone and trusts a later seed_default_custom_fields()
# run to add it.

from django.db import migrations


def reset_legacy_unique_key(apps, schema_editor):
    """
    For each Project that already has both fields, downgrade
    "合同号&项目号".is_unique_key to False so the workspace-wide uniqueness
    check only consults "项目序号". Skip projects that lack "项目序号" -- those
    still need the old field to keep enforcing uniqueness until they catch up.
    """
    ProjectCustomField = apps.get_model("db", "ProjectCustomField")
    # Use the historical model manager that excludes soft-deleted rows.
    legacy = ProjectCustomField.objects.filter(
        name="合同号&项目号", is_unique_key=True, deleted_at__isnull=True
    )
    legacy_with_new_pair = legacy.filter(
        project_id__in=ProjectCustomField.objects.filter(
            name="项目序号", deleted_at__isnull=True
        ).values_list("project_id", flat=True)
    )
    # Bulk-update would need explicit batch_size; an iterator is fine here
    # because the dataset is bounded by the number of legacy seed runs (one
    # per workspace), not the number of individual field rows.
    updated_ids = []
    for field in legacy_with_new_pair:
        field.is_unique_key = False
        updated_ids.append(field.pk)
    if updated_ids:
        ProjectCustomField.objects.filter(pk__in=updated_ids).update(is_unique_key=False)


def ensure_new_unique_key(apps, schema_editor):
    """
    Defensive counterpart: every "项目序号" that exists should carry
    is_unique_key=True so the post-Phase-A invariant is restored on workspaces
    whose DEFAULT_PROJECT_CUSTOM_FIELDS seed run was skipped or rolled back.
    Idempotent: sets the flag only where it is currently False.
    """
    ProjectCustomField = apps.get_model("db", "ProjectCustomField")
    ProjectCustomField.objects.filter(
        name="项目序号", is_unique_key=False, deleted_at__isnull=True
    ).update(is_unique_key=True)


def noop_reverse(apps, schema_editor):
    """
    Phase A does not have a meaningful reverse direction: restoring the old
    "合同号&项目号"-as-unique-key state would re-introduce the same two-fields-
    is_unique_key invariant violation this migration fixed. Refuse to undo.
    Leaving the body as a documented no-op so `migrate db <prev>` skips cleanly
    without raising -- Django's reverse path then just leaves the unique-key
    flag in its post-migration state, which is the intended behaviour.
    """
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("db", "0126_internal_contract_project"),
    ]

    operations = [
        migrations.RunPython(reset_legacy_unique_key, noop_reverse),
        migrations.RunPython(ensure_new_unique_key, noop_reverse),
    ]