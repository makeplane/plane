# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Feature switches the paid API exposes at workspace and project level."""

from django.db import models

from plane.db.models import BaseModel

__all__ = ["WorkspaceFeature", "ProjectFeature", "WORKSPACE_FEATURE_FIELDS", "PROJECT_FEATURE_FIELDS"]

# Every paid feature is implemented by this app, so each defaults to on.
WORKSPACE_FEATURE_FIELDS = (
    "project_grouping",
    "initiatives",
    "teams",
    "customers",
    "wiki",
    "pi",
    "work_item_types",
    "releases",
)


class WorkspaceFeature(BaseModel):
    workspace = models.OneToOneField("db.Workspace", on_delete=models.CASCADE, related_name="nexus_features")
    project_grouping = models.BooleanField(default=True)
    initiatives = models.BooleanField(default=True)
    teams = models.BooleanField(default=True)
    customers = models.BooleanField(default=True)
    wiki = models.BooleanField(default=True)
    # Plane Intelligence. Nothing here implements it.
    pi = models.BooleanField(default=False)
    work_item_types = models.BooleanField(default=True)
    releases = models.BooleanField(default=True)

    class Meta:
        db_table = "nexus_workspace_features"


# Flags with a native Project column; the rest live on ProjectFeature.
PROJECT_NATIVE_FIELDS = {
    "modules": "module_view",
    "cycles": "cycle_view",
    "views": "issue_views_view",
    "pages": "page_view",
    "intakes": "intake_view",
    "work_item_types": "is_issue_type_enabled",
}
PROJECT_FEATURE_FIELDS = (*PROJECT_NATIVE_FIELDS, "epics", "workflows", "parallel_cycles", "project_updates")


class ProjectFeature(BaseModel):
    project = models.OneToOneField("db.Project", on_delete=models.CASCADE, related_name="nexus_features")
    epics = models.BooleanField(default=True)
    workflows = models.BooleanField(default=False)
    parallel_cycles = models.BooleanField(default=False)
    project_updates = models.BooleanField(default=False)

    class Meta:
        db_table = "nexus_project_features"
