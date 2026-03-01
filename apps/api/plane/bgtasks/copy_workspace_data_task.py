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

# Django imports
from django.db import IntegrityError

# Celery imports
from celery import shared_task

# Import your models
from plane.db.models import (
    Workspace,
    WorkspaceMember,
    Project,
    Label,
    IssueType,
    ProjectIssueType,
    Estimate,
    EstimatePoint,
    Module,
    State,
    Cycle,
    Issue,
    CycleIssue,
    ModuleIssue,
    IssueRelation,
    IssueLink,
    IssueComment,
    IssueLabel,
    Page,
    ProjectPage,
    IssueAssignee,
    IssueView,
    ProjectMember,
    IssueSequence,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    WorkspaceFeature,
    Initiative,
    InitiativeProject,
    InitiativeLink,
    InitiativeComment,
    IssueWorkLog,
    EntityIssueStateActivity,
    EntityProgress,
    ProjectAttribute,
    ProjectLink,
    ProjectComment,
    ProjectFeature,
    ProjectState,
    Teamspace,
    TeamspaceMember,
    TeamspacePage,
    TeamspaceProject,
    TeamspaceView,
    TeamspaceComment,
    InitiativeEpic,
)


class WorkspaceDataCopier:
    """
    Class to handle copying all data from one workspace to another
    """

    target_workspace = None

    def clean_data(self, data, keys):
        for key in keys:
            data.pop(key, None)
        return data

    def __init__(self, source_workspace_slug, target_workspace_slug):
        """
        Initialize with source workspace ID and target workspace details
        """
        self.source_workspace_slug = source_workspace_slug
        self.target_workspace_slug = target_workspace_slug
        self.source_workspace = Workspace.objects.get(slug=source_workspace_slug)
        self.target_workspace = Workspace.objects.get(slug=target_workspace_slug)

        print("source workspace id:", self.source_workspace.id)

        # Initialize mapping dictionaries to track old_id -> new_id
        self.workspace_map = {}
        self.project_map = {}
        self.member_map = {}
        self.state_map = {}
        self.label_map = {}
        self.issue_type_map = {}
        self.estimate_map = {}
        self.issue_map = {}
        self.estimate_point_map = {}
        self.issue_property_map = {}
        self.issue_property_option_map = {}
        self.module_map = {}
        self.cycle_map = {}
        self.comment_map = {}
        self.page_map = {}
        self.view_map = {}
        self.project_state_map = {}
        self.initiative_map = {}
        self.teamspace_map = {}

    def initialize_workspace_copy(self):
        self._copy_workspace_feature(self.target_workspace)
        self._copy_workspace_members(self.target_workspace)
        self._copy_projects_and_members(self.target_workspace)
        self._copy_project_meta(self.target_workspace)
        self._copy_workspace_states(self.target_workspace)
        self._copy_workspace_labels(self.target_workspace)
        self._copy_workspace_issue_types(self.target_workspace)
        self._copy_workspace_estimates(self.target_workspace)
        self._copy_issue_properties(self.target_workspace)
        self._copy_modules(self.target_workspace)
        self._copy_cycles(self.target_workspace)
        self._copy_parent_issues(self.target_workspace)
        self._copy_issues(self.target_workspace)
        self._copy_issue_meta(self.target_workspace)
        self._copy_cycle_issues(self.target_workspace)
        self._copy_module_issues(self.target_workspace)
        self._copy_pages(self.target_workspace)
        self._copy_project_pages(self.target_workspace)
        self._copy_views(self.target_workspace)
        self._copy_initiatives(self.target_workspace)
        self._copy_initiative_meta(self.target_workspace)
        self._copy_teamspaces(self.target_workspace)
        self._copy_teamspace_meta(self.target_workspace)

    def _copy_workspace_feature(self, target_workspace):
        workspace_feature = WorkspaceFeature.objects.filter(workspace=self.source_workspace).values().first()
        if workspace_feature:
            try:
                WorkspaceFeature.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(workspace_feature, ["id", "workspace_id"]),
                )
            except IntegrityError:
                # Update the workspace feature if it already exists
                WorkspaceFeature.objects.filter(workspace=target_workspace).update(
                    is_project_grouping_enabled=workspace_feature["is_project_grouping_enabled"],
                    is_initiative_enabled=workspace_feature["is_initiative_enabled"],
                    is_teams_enabled=workspace_feature["is_teams_enabled"],
                    is_customer_enabled=workspace_feature["is_customer_enabled"],
                )

    def _copy_workspace_members(self, target_workspace):
        """
        Copy workspace members from source to target
        """
        source_members = WorkspaceMember.objects.filter(workspace_id=self.source_workspace.id, is_active=True).values()

        print("Copying workspace members")

        WorkspaceMember.objects.bulk_create(
            [
                WorkspaceMember(
                    workspace=target_workspace,
                    is_active=False,
                    **self.clean_data(member, ["id", "workspace_id", "is_active"]),
                )
                for member in source_members
            ],
            ignore_conflicts=True,
            batch_size=1000,
        )

    def _copy_projects_and_members(self, target_workspace):
        """
        Copy projects and their related data
        """
        source_projects = Project.objects.filter(workspace=self.source_workspace).values()

        for project in source_projects:
            print(f"Copying project {project['name']}")
            # Create new project
            try:
                new_project = Project.objects.create(
                    **self.clean_data(project.copy(), ["id", "workspace_id"]),
                    workspace=target_workspace,
                )

                ProjectMember.objects.bulk_create(
                    [
                        ProjectMember(
                            project=new_project,
                            workspace=target_workspace,
                            is_active=False,
                            **self.clean_data(
                                member.copy(),
                                ["id", "project_id", "workspace_id", "is_active"],
                            ),
                        )
                        for member in ProjectMember.objects.filter(project_id=project["id"]).values()
                    ],
                    ignore_conflicts=True,
                    batch_size=1000,
                )
                self.project_map[str(project["id"])] = new_project.id
            except IntegrityError:
                print(f"Duplicate project creation: {project['id']}")
                # Handle duplicate project creation
                continue

    def _copy_project_meta(self, target_workspace):
        for project_state in ProjectState.objects.filter(workspace=self.source_workspace).values():
            try:
                new_project_state = ProjectState.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(project_state.copy(), ["id", "workspace_id"]),
                )
                self.project_state_map[str(project_state["id"])] = new_project_state.id
            except IntegrityError:
                print(f"IntegrityError: {project_state.get('name')}")
                continue

        ProjectAttribute.objects.bulk_create(
            [
                ProjectAttribute(
                    project_id=self.project_map.get(str(project_attribute.get("project_id"))),
                    state_id=self.project_state_map.get(str(project_attribute.get("state_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        project_attribute,
                        ["id", "project_id", "workspace_id", "state_id"],
                    ),
                )
                for project_attribute in ProjectAttribute.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_attribute.get("project_id")))
            ]
        )

        ProjectFeature.objects.bulk_create(
            [
                ProjectFeature(
                    project_id=self.project_map.get(str(project_feature.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(project_feature.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_feature in ProjectFeature.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(project_feature.get("project_id")))
            ]
        )

        ProjectLink.objects.bulk_create(
            [
                ProjectLink(
                    project_id=self.project_map.get(project_link.get("project_id")),
                    workspace=target_workspace,
                    **self.clean_data(project_link.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_link in ProjectLink.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(project_link.get("project_id"))
            ]
        )

        ProjectComment.objects.bulk_create(
            [
                ProjectComment(
                    project_id=self.project_map.get(project_comment.get("project_id")),
                    workspace=target_workspace,
                    **self.clean_data(project_comment.copy(), ["id", "project_id", "workspace_id"]),
                )
                for project_comment in ProjectComment.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(project_comment.get("project_id"))
            ]
        )

    def _copy_workspace_states(self, target_workspace):
        """
        Copy workspace-level states (not associated with any project)
        """
        source_states = State.objects.filter(workspace_id=self.source_workspace.id).values()

        print("Copying workspace project issue states")

        for state in source_states:
            print(f"Copying state {state.get('name')}")
            # Handle parent state relationship
            if self.project_map.get(str(state.get("project_id"))):
                new_state = State(
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(state.get("project_id"))),
                    **self.clean_data(state.copy(), ["id", "project_id", "workspace_id"]),
                )
                new_state.save()

                self.state_map[str(state["id"])] = new_state.id

    def _copy_workspace_labels(self, target_workspace):
        """
        Copy workspace-level labels (not associated with any project)
        """
        source_labels = Label.objects.filter(workspace_id=self.source_workspace.id).values()

        for label in source_labels:
            # Handle parent label relationship
            try:
                new_label = Label.objects.create(
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(label.get("project_id"))),
                    **self.clean_data(label.copy(), ["id", "project_id", "workspace_id"]),
                )
                self.label_map[str(label["id"])] = new_label.id
            except IntegrityError as e:
                print(f"error creating label {label.get('name')} due to {e}")

    def _copy_workspace_estimates(self, target_workspace):
        estimates = Estimate.objects.filter(workspace=self.source_workspace).values()
        print("Copying estimates")
        for estimate in estimates:
            # Handle parent label relationship
            new_estimate = Estimate.objects.create(
                workspace=target_workspace,
                project_id=self.project_map.get(str(estimate.get("project_id"))),
                **self.clean_data(estimate.copy(), ["id", "project_id", "workspace_id"]),
            )
            self.estimate_map[str(estimate["id"])] = new_estimate.id

        for estimate_point in EstimatePoint.objects.filter(workspace=self.source_workspace).values():
            new_estimate_point = EstimatePoint.objects.create(
                estimate_id=self.estimate_map.get(str(estimate_point.get("estimate_id"))),
                project_id=self.project_map.get(str(estimate_point.get("project_id"))),
                workspace_id=target_workspace.id,
                **self.clean_data(
                    estimate_point.copy(),
                    ["id", "estimate_id", "project_id", "workspace_id"],
                ),
            )
            self.estimate_point_map[str(estimate_point["id"])] = new_estimate_point.id

    def _copy_workspace_issue_types(self, target_workspace):
        """
        Copy workspace-level issue types (not associated with any project)
        """
        source_types = IssueType.objects.filter(workspace=self.source_workspace).values()

        print("Copying issue types")
        for type in source_types:
            # Handle parent label relationship
            try:
                new_type = IssueType.objects.create(
                    workspace=target_workspace,
                    **self.clean_data(type.copy(), ["id", "workspace_id"]),
                )
                self.issue_type_map[str(type["id"])] = new_type.id
            except Exception as e:
                print(f"Error creating issue type: {e}")

        ProjectIssueType.objects.bulk_create(
            [
                ProjectIssueType(
                    project_id=self.project_map.get(str(project_type.get("project_id"))),
                    issue_type_id=self.issue_type_map.get(str(project_type.get("issue_type_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        project_type,
                        ["id", "project_id", "issue_type_id", "workspace_id"],
                    ),
                )
                for project_type in ProjectIssueType.objects.filter(workspace=self.source_workspace).values()
                if str(project_type.get("project_id")) in self.project_map
                and str(project_type.get("issue_type_id")) in self.issue_type_map
            ]
        )

    def _copy_issue_properties(self, target_workspace):
        print("Copying issue properties")
        for issue_property in IssueProperty.objects.filter(workspace=self.source_workspace).values():
            try:
                new_issue_property = IssueProperty.objects.create(
                    project_id=self.project_map.get(str(issue_property["project_id"])),
                    workspace=target_workspace,
                    issue_type_id=self.issue_type_map.get(str(issue_property["issue_type_id"])),
                    **self.clean_data(
                        issue_property.copy(),
                        ["id", "project_id", "workspace_id", "issue_type_id"],
                    ),
                )
                self.issue_property_map[str(issue_property["id"])] = new_issue_property.id
            except Exception as e:
                print(f"Error copying issue property: {e}")
                continue

        for option in IssuePropertyOption.objects.filter(workspace=self.source_workspace).values():
            try:
                if self.issue_property_map.get(str(option.get("property_id"))) and self.project_map.get(
                    str(option.get("project_id"))
                ):
                    new_option = IssuePropertyOption.objects.create(
                        property_id=self.issue_property_map.get(str(option.get("property_id"))),
                        workspace=target_workspace,
                        project_id=self.project_map.get(str(option.get("project_id"))),
                        **self.clean_data(
                            option.copy(),
                            ["id", "property_id", "project_id", "workspace_id"],
                        ),
                    )
                    self.issue_property_option_map[str(option["id"])] = new_option.id
            except Exception as e:
                print(f"Error copying issue property option {option['name']}: {e}")
                continue

    def _copy_modules(self, target_workspace):
        print("Copying Modules")
        for module in Module.objects.filter(workspace=self.source_workspace).values():
            try:
                if self.project_map.get(str(module["project_id"])):
                    new_module = Module.objects.create(
                        project_id=self.project_map.get(str(module["project_id"])),
                        workspace=target_workspace,
                        **self.clean_data(module.copy(), ["id", "project_id", "workspace_id"]),
                    )
                    self.module_map[str(module["id"])] = new_module.id
            except Exception as e:
                print(f"Error copying module {module['name']}: {e}")
                continue

    def _copy_cycles(self, target_workspace):
        print("Copying Cycles")
        for cycle in Cycle.objects.filter(workspace=self.source_workspace).values():
            try:
                new_cycle = Cycle.objects.create(
                    project_id=self.project_map.get(str(cycle["project_id"])),
                    workspace=target_workspace,
                    **self.clean_data(cycle.copy(), ["id", "project_id", "workspace_id"]),
                )
                self.cycle_map[str(cycle["id"])] = new_cycle.id
            except Exception as e:
                print(f"Error copying cycle {cycle['name']}: {e}")
                continue

    def _copy_parent_issues(self, target_workspace):
        print("Copying Parent Issues")
        for issue in Issue.objects.filter(workspace=self.source_workspace, parent__isnull=True).values():
            try:
                new_issue = Issue.objects.create(
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                    type_id=self.issue_type_map.get(str(issue.get("type_id"))),
                    estimate_point_id=self.estimate_point_map.get(str(issue.get("estimate_point_id"))),
                    state_id=self.state_map.get(str(issue.get("state_id"))),
                    **self.clean_data(
                        issue.copy(),
                        [
                            "id",
                            "project_id",
                            "workspace_id",
                            "type_id",
                            "estimate_point_id",
                            "state_id",
                        ],
                    ),
                )
                IssueSequence.objects.create(
                    issue_id=new_issue.id,
                    sequence=new_issue.sequence_id,
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                )
                self.issue_map[str(issue["id"])] = new_issue.id
            except Exception as e:
                print(f"Error copying parent issue {issue['name']} due to {e}")
                continue

    def _copy_issues(self, target_workspace):
        print("Copying Issues")
        for issue in Issue.objects.filter(workspace=self.source_workspace, parent__isnull=False).values():
            try:
                new_issue = Issue.objects.create(
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                    type_id=self.issue_type_map.get(str(issue.get("type_id"))),
                    estimate_point_id=self.estimate_point_map.get(str(issue.get("estimate_point_id"))),
                    state_id=self.state_map.get(str(issue.get("state_id"))),
                    parent_id=self.issue_map.get(str(issue.get("parent_id"))),
                    **self.clean_data(
                        issue.copy(),
                        [
                            "id",
                            "project_id",
                            "workspace_id",
                            "type_id",
                            "parent_id",
                            "state_id",
                            "estimate_point_id",
                        ],
                    ),
                )
                # Create Issue Sequence
                IssueSequence.objects.create(
                    issue_id=new_issue.id,
                    sequence=new_issue.sequence_id,
                    project_id=self.project_map.get(str(issue.get("project_id"))),
                    workspace=target_workspace,
                )
                self.issue_map[str(issue["id"])] = new_issue.id
            except Exception as e:
                print(f"Error copying issue {issue['name']} due to {e}")
                continue

    def _copy_issue_meta(self, target_workspace):
        print("Copying Issue Meta")
        IssueAssignee.objects.bulk_create(
            [
                IssueAssignee(
                    issue_id=self.issue_map.get(str(assignee.issue_id)),
                    assignee_id=assignee.id,
                    project_id=self.project_map.get(str(assignee.project_id)),
                    workspace_id=target_workspace.id,
                )
                for assignee in IssueAssignee.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(assignee.project_id)) and self.project_map.get(str(assignee.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssueRelation.objects.bulk_create(
            [
                IssueRelation(
                    issue_id=self.issue_map.get(str(relation.issue_id)),
                    related_issue_id=self.issue_map.get(str(relation.related_issue_id)),
                    relation_type=relation.relation_type,
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(relation.project_id)),
                )
                for relation in IssueRelation.objects.filter(workspace=self.source_workspace)
                if self.issue_map.get(str(relation.related_issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssueLink.objects.bulk_create(
            [
                IssueLink(
                    issue_id=self.issue_map.get(str(link.issue_id)),
                    title=link.title,
                    url=link.url,
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(link.project_id)),
                )
                for link in IssueLink.objects.filter(workspace=self.source_workspace)
                if self.issue_map.get(str(link.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        for comment in IssueComment.objects.filter(workspace=self.source_workspace).values():
            if self.project_map.get(str(comment.get("project_id"))) and self.issue_map.get(
                str(comment.get("issue_id"))
            ):
                issue_comment = IssueComment.objects.create(
                    issue_id=self.issue_map.get(str(comment.get("issue_id"))),
                    project_id=self.project_map.get(str(comment.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(comment, ["id", "project_id", "workspace_id", "issue_id"]),
                )
                self.comment_map[str(comment.get("id"))] = issue_comment.id

        IssueLabel.objects.bulk_create(
            [
                IssueLabel(
                    issue_id=self.issue_map.get(str(label.issue_id)),
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(label.project_id)),
                    label_id=self.label_map.get(str(label.label_id)),
                )
                for label in IssueLabel.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(label.project_id))
                and self.issue_map.get(str(label.issue_id))
                and self.label_map.get(str(label.label_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssuePropertyValue.objects.bulk_create(
            [
                IssuePropertyValue(
                    issue_id=self.issue_map.get(str(property_value.get("issue_id"))),
                    workspace_id=target_workspace.id,
                    project_id=self.project_map.get(str(property_value.get("project_id"))),
                    property_id=self.issue_property_map.get(str(property_value.get("property_id"))),
                    value_option_id=self.issue_property_option_map.get(
                        str(property_value.get("value_option_id")) if property_value.get("value_option_id") else None
                    ),
                    **self.clean_data(
                        property_value,
                        [
                            "issue_id",
                            "property_id",
                            "workspace_id",
                            "project_id",
                            "value_option_id",
                        ],
                    ),
                )
                for property_value in IssuePropertyValue.objects.filter(workspace=self.source_workspace).values()
                if self.project_map.get(str(property_value.get("project_id")))
                and self.issue_map.get(str(property_value.get("issue_id")))
                and self.issue_property_map.get(str(property_value.get("property_id")))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        IssueWorkLog.objects.bulk_create(
            [
                IssueWorkLog(
                    issue_id=self.issue_map.get(str(work_log.issue_id)),
                    workspace=target_workspace,
                    project_id=self.project_map.get(str(work_log.project_id)),
                    description=work_log.description,
                    logged_by=work_log.logged_by,
                    duration=work_log.duration,
                )
                for work_log in IssueWorkLog.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(work_log.project_id)) and self.issue_map.get(str(work_log.issue_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        EntityIssueStateActivity.objects.bulk_create(
            [
                EntityIssueStateActivity(
                    issue_id=self.issue_map.get(str(entity_issue_state_activity.get("issue_id"))),
                    state_id=self.state_map.get(str(entity_issue_state_activity.get("state_id"))),
                    project_id=self.project_map.get(str(entity_issue_state_activity.get("project_id"))),
                    workspace=target_workspace,
                    cycle_id=self.cycle_map.get(str(entity_issue_state_activity.get("cycle_id"))),
                    estimate_point_id=self.estimate_point_map.get(
                        str(entity_issue_state_activity.get("estimate_point_id"))
                    ),
                    **self.clean_data(
                        entity_issue_state_activity,
                        [
                            "id",
                            "issue_id",
                            "state_id",
                            "project_id",
                            "cycle_id",
                            "workspace_id",
                            "estimate_point_id",
                        ],
                    ),
                )
                for entity_issue_state_activity in EntityIssueStateActivity.objects.filter(
                    workspace=self.source_workspace
                ).values()
                if self.issue_map.get(str(entity_issue_state_activity.get("issue_id")))
                and self.state_map.get(str(entity_issue_state_activity.get("state_id")))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

        EntityProgress.objects.bulk_create(
            [
                EntityProgress(
                    project_id=self.project_map.get(str(entity_progress.get("project_id"))),
                    cycle_id=self.cycle_map.get(str(entity_progress.get("cycle_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        entity_progress,
                        ["id", "workspace_id", "cycle_id", "project_id"],
                    ),
                )
                for entity_progress in EntityProgress.objects.filter(workspace=self.source_workspace).values()
                if self.issue_map.get(str(entity_progress.get("issue_id")))
                and self.project_map.get(str(entity_progress.get("project_id")))
            ]
        )

    def _copy_cycle_issues(self, target_workspace):
        CycleIssue.objects.bulk_create(
            [
                CycleIssue(
                    cycle_id=self.cycle_map.get(str(cycle_issue.cycle_id)),
                    issue_id=self.issue_map.get(str(cycle_issue.issue_id)),
                    project_id=self.project_map.get(str(cycle_issue.project_id)),
                    workspace=target_workspace,
                )
                for cycle_issue in CycleIssue.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(cycle_issue.project_id))
                and self.issue_map.get(str(cycle_issue.issue_id))
                and self.cycle_map.get(str(cycle_issue.cycle_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_module_issues(self, target_workspace):
        ModuleIssue.objects.bulk_create(
            [
                ModuleIssue(
                    module_id=self.module_map.get(str(module_issue.module_id)),
                    issue_id=self.issue_map.get(str(module_issue.issue_id)),
                    project_id=self.project_map.get(str(module_issue.project_id)),
                    workspace=target_workspace,
                )
                for module_issue in ModuleIssue.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(module_issue.project_id))
                and self.issue_map.get(str(module_issue.issue_id))
                and self.module_map.get(str(module_issue.module_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_pages(self, target_workspace):
        print("Copying pages")
        for page in Page.objects.filter(workspace=self.source_workspace).values():
            new_page = Page.objects.create(
                workspace=target_workspace,
                **self.clean_data(page.copy(), ["id", "workspace_id"]),
            )
            self.page_map[str(page["id"])] = new_page.id

    def _copy_project_pages(self, target_workspace):
        print("Copying project pages")
        ProjectPage.objects.bulk_create(
            [
                ProjectPage(
                    project_id=self.project_map.get(str(project_page.project_id)),
                    page_id=self.page_map.get(str(project_page.page_id)),
                    workspace=target_workspace,
                )
                for project_page in ProjectPage.objects.filter(workspace=self.source_workspace)
                if self.project_map.get(str(project_page.project_id)) and self.page_map.get(str(project_page.page_id))
            ],
            batch_size=1000,
            ignore_conflicts=True,
        )

    def _copy_views(self, target_workspace):
        print("Copying views")
        for view in IssueView.objects.filter(workspace=self.source_workspace).values():
            new_view = IssueView.objects.create(
                workspace=target_workspace,
                **self.clean_data(view.copy(), ["id", "project_id", "workspace_id"]),
            )
            self.view_map[str(view["id"])] = new_view.id

    def _copy_initiatives(self, target_workspace):
        print("Copying initiatives")
        for initiative in Initiative.objects.filter(workspace=self.source_workspace).values():
            new_initiative = Initiative.objects.create(
                workspace=target_workspace,
                **self.clean_data(initiative.copy(), ["id", "workspace_id"]),
            )
            self.initiative_map[str(initiative.get("id"))] = new_initiative.id

    def _copy_initiative_meta(self, target_workspace):
        print("Copying initiative meta")

        InitiativeProject.objects.bulk_create(
            [
                InitiativeProject(
                    initiative_id=self.initiative_map.get(str(initiative_project.get("initiative_id"))),
                    project_id=self.project_map.get(str(initiative_project.get("project_id"))),
                    workspace=target_workspace,
                    **self.clean_data(
                        initiative_project,
                        ["id", "workspace_id", "project_id", "initiative_id"],
                    ),
                )
                for initiative_project in InitiativeProject.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_project.get("initiative_id")))
                and self.project_map.get(str(initiative_project.get("project_id")))
            ],
            ignore_conflicts=True,
        )

        InitiativeEpic.objects.bulk_create(
            [
                InitiativeEpic(
                    initiative_id=self.initiative_map.get(str(initiative_epic.get("initiative_id"))),
                    workspace=target_workspace,
                    epic_id=self.issue_map.get(str(initiative_epic.get("epic_id"))),
                    **self.clean_data(
                        initiative_epic,
                        ["id", "workspace_id", "initiative_id", "epic_id"],
                    ),
                )
                for initiative_epic in InitiativeEpic.objects.filter(workspace=self.source_workspace).values()
                if self.issue_map.get(str(initiative_epic.get("epic_id")))
                and self.initiative_map.get(str(initiative_epic.get("initiative_id")))
            ],
            ignore_conflicts=True,
        )

        InitiativeLink.objects.bulk_create(
            [
                InitiativeLink(
                    initiative_id=self.initiative_map.get(str(initiative_link.get("initiative_id"))),
                    workspace=target_workspace,
                    **self.clean_data(initiative_link, ["workspace_id", "id", "initiative_id"]),
                )
                for initiative_link in InitiativeLink.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_link.get("initiative_id")))
            ],
            ignore_conflicts=True,
        )

        InitiativeComment.objects.bulk_create(
            [
                InitiativeComment(
                    initiative_id=self.initiative_map.get(str(initiative_comment.get("initiative_id"))),
                    workspace=target_workspace,
                    **self.clean_data(initiative_comment, ["id", "initiative_id", "workspace_id"]),
                )
                for initiative_comment in InitiativeComment.objects.filter(workspace=self.source_workspace).values()
                if self.initiative_map.get(str(initiative_comment.get("initiative_id")))
            ],
            ignore_conflicts=True,
        )

    def _copy_teamspaces(self, target_workspace):
        print("Copying teamspaces")
        for teamspace in Teamspace.objects.filter(workspace=self.source_workspace).values():
            new_teamspace = Teamspace.objects.create(
                workspace=target_workspace,
                **self.clean_data(teamspace.copy(), ["id", "workspace_id"]),
            )
            self.teamspace_map[str(teamspace.get("id"))] = new_teamspace.id

    def _copy_teamspace_meta(self, target_workspace):
        print("Copying teamspace meta")

        TeamspaceMember.objects.bulk_create(
            TeamspaceMember(
                team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                workspace=target_workspace,
                **self.clean_data(teamspace, ["id", "workspace_id", "team_space_id"]),
            )
            for teamspace in TeamspaceMember.objects.filter(workspace=self.source_workspace).values()
            if self.teamspace_map.get(str(teamspace.get("team_space_id")))
        )

        TeamspaceProject.objects.bulk_create(
            TeamspaceProject(
                team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                project_id=self.project_map.get(str(teamspace.get("project_id"))),
                workspace=target_workspace,
                **self.clean_data(teamspace, ["id", "workspace_id", "team_space_id", "project_id"]),
            )
            for teamspace in TeamspaceProject.objects.filter(workspace=self.source_workspace).values()
            if self.teamspace_map.get(str(teamspace.get("team_space_id")))
            and self.project_map.get(str(teamspace.get("project_id")))
        )

        TeamspacePage.objects.bulk_create(
            TeamspacePage(
                team_space_id=self.teamspace_map.get(str(teamspace.get("team_space_id"))),
                page_id=self.page_map.get(str(teamspace.get("page_id"))),
                workspace=target_workspace,
                **self.clean_data(teamspace, ["id", "workspace_id", "team_space_id", "page_id"]),
            )
            for teamspace in TeamspacePage.objects.filter(workspace=self.source_workspace).values()
            if self.teamspace_map.get(str(teamspace.get("team_space_id")))
            and self.page_map.get(str(teamspace.get("page_id")))
        )

        TeamspaceView.objects.bulk_create(
            TeamspaceView(
                team_space_id=self.teamspace_map.get(teamspace.get("team_space_id")),
                view_id=self.view_map.get(str(teamspace.get("view_id"))),
                workspace=target_workspace,
                **self.clean_data(teamspace, ["id", "workspace_id", "team_space_id", "view_id"]),
            )
            for teamspace in TeamspaceView.objects.filter(workspace=self.source_workspace).values()
            if self.teamspace_map.get(teamspace.get("team_space_id"))
            and self.view_map.get(str(teamspace.get("view_id")))
        )

        TeamspaceComment.objects.bulk_create(
            TeamspaceComment(
                team_space_id=self.teamspace_map.get(teamspace.get("team_space_id")),
                workspace=target_workspace,
                **self.clean_data(teamspace, ["id", "workspace_id", "team_space_id"]),
            )
            for teamspace in TeamspaceComment.objects.filter(workspace=self.source_workspace).values()
            if self.teamspace_map.get(teamspace.get("team_space_id"))
        )


@shared_task
def copy_workspace_data(source_workspace_slug, target_workspace_slug):
    try:
        copier = WorkspaceDataCopier(source_workspace_slug, target_workspace_slug)
        copier.initialize_workspace_copy()
        print("Workspace data copied successfully.")
    except Exception:
        raise
