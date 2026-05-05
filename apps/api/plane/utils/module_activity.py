# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils import timezone

from plane.db.models import ModuleActivity


def log_module_activity(module, actor, verb, field=None, old_value=None, new_value=None):
    """Create a ModuleActivity record for a module mutation."""
    ModuleActivity.objects.create(
        module=module,
        actor=actor,
        verb=verb,
        field=field,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None,
        epoch=timezone.now().timestamp(),
        project_id=module.project_id,
        workspace_id=module.workspace_id,
        created_by=actor,
        updated_by=actor,
    )
