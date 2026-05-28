# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.signals.project import create_default_view_on_project_creation
from plane.db.signals.workspace import auto_add_admin_to_all_projects

__all__ = ["create_default_view_on_project_creation", "auto_add_admin_to_all_projects"]
