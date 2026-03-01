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

# Module imports
from plane.db.models import (
    Workspace,
    Project,
    ProjectMember,
    Label,
    IssueType,
    ProjectIssueType,
    Estimate,
    EstimatePoint,
    Module,
    ModuleLink,
    ModuleIssue,
    State,
    Cycle,
    CycleIssue,
    Issue,
    IssueRelation,
    IssueLink,
    IssueLabel,
    Page,
    ProjectPage,
    PageLabel,
    IssueView,
    Intake,
    IntakeIssue,
    Description,
)
from plane.ee.models import (
    ProjectState,
    ProjectAttribute,
    ProjectFeature,
    ProjectLink,
    IssueProperty,
    IssuePropertyOption,
    IssuePropertyValue,
    IssueWorkLog,
    Workflow,
    WorkflowTransition,
    Automation,
    AutomationVersion,
    AutomationNode,
    AutomationEdge,
    IntakeSetting,
    IntakeForm,
    IntakeFormField,
    CycleSettings,
    Milestone,
    MilestoneIssue,
    WorkitemTemplate,
)
from plane.utils.exception_logger import log_exception


class ProjectDataCopier:
    """
    Class to handle copying all data from one project to another workspace
    """

    def clean_data(self, data, keys):
        """Remove specified keys from dictionary"""
        for key in keys:
            data.pop(key, None)
        return data

    def __init__(
        self,
        source_project_id,
        target_workspace_id,
        new_project_name,
        new_project_identifier,
    ):
        """
        Initialize with source project and target workspace details
        """
        self.source_project = Project.objects.get(id=source_project_id)
        self.source_workspace = self.source_project.workspace
        self.target_workspace = Workspace.objects.get(id=target_workspace_id)
        self.workspace_owner = self.target_workspace.owner
        self.new_project_name = new_project_name
        self.new_project_identifier = new_project_identifier
        self.new_project = None

        print(f"Source project: {self.source_project.name} ({self.source_project.id})")
        print(f"Target workspace: {self.target_workspace.name} ({self.target_workspace.id})")

        # Initialize mapping dictionaries to track old_id -> new_id
        self.project_map = {}
        self.state_map = {}
        self.label_map = {}
        self.estimate_map = {}
        self.estimate_point_map = {}
        self.issue_type_map = {}
        self.project_state_map = {}
        self.issue_property_map = {}
        self.issue_property_option_map = {}
        self.module_map = {}
        self.cycle_map = {}
        self.issue_map = {}
        self.page_map = {}
        self.view_map = {}
        self.intake_map = {}
        self.intake_form_map = {}
        self.automation_map = {}
        self.automation_version_map = {}
        self.automation_node_map = {}
        self.workflow_map = {}
        self.workflow_transition_map = {}
        self.milestone_map = {}
        self.description_map = {}

    def initialize_project_copy(self):
        """Main entry point for copying project data"""
        print("Starting project copy...")

        # Phase 1: Core Project Structure
        self._copy_project()
        self._create_project_member()
        self._copy_states()
        self._copy_labels()
        self._copy_estimates()

        # Phase 2: Issue Types & Enterprise Project Extensions
        self._copy_issue_types()
        self._copy_project_issue_types()
        self._copy_project_states()
        self._copy_project_attributes()
        self._copy_project_features()
        self._copy_project_links()
        self._copy_issue_properties()
        self._copy_issue_property_options()

        # Phase 3: Containers (Modules, Cycles, Milestones)
        self._copy_modules()
        self._copy_module_links()
        self._copy_cycles()
        self._copy_cycle_settings()
        self._copy_milestones()

        # Phase 4: Automation & Workflows
        self._copy_automations()
        self._copy_workflows()

        # Phase 5: Issues & Epics (Hierarchical)
        self._copy_parent_issues()
        self._copy_child_issues()

        # Phase 6: Issue Associations
        self._copy_issue_labels()
        self._copy_issue_links()
        self._copy_issue_relations()
        self._copy_issue_property_values()
        self._copy_issue_worklogs()

        # Phase 7: Container-Issue Associations
        self._copy_cycle_issues()
        self._copy_module_issues()
        self._copy_milestone_issues()

        # Phase 8: Pages & Documentation
        self._copy_pages()
        self._copy_project_pages()
        self._copy_page_labels()

        # Phase 9: Views & Intake
        self._copy_views()
        self._copy_intakes()
        self._copy_intake_issues()
        self._copy_intake_settings()
        self._copy_intake_forms()
        self._copy_intake_form_fields()

        # Phase 10: Templates & Recurring Tasks
        self._copy_workitem_templates()
        self._copy_recurring_workitem_tasks()

        # Update project references (default_state, estimate)
        self._update_project_references()

        print("Project copy completed successfully!")

    def _copy_project(self):
        """Copy the project itself"""
        print(f"Copying project: {self.source_project.name}")

        project_data = {
            "name": self.new_project_name,
            "description": self.source_project.description,
            "description_text": self.source_project.description_text,
            "description_html": self.source_project.description_html,
            "network": self.source_project.network,
            "identifier": self.new_project_identifier,
            "emoji": self.source_project.emoji,
            "icon_prop": self.source_project.icon_prop,
            "module_view": self.source_project.module_view,
            "cycle_view": self.source_project.cycle_view,
            "issue_views_view": self.source_project.issue_views_view,
            "page_view": self.source_project.page_view,
            "intake_view": self.source_project.intake_view,
            "is_time_tracking_enabled": self.source_project.is_time_tracking_enabled,
            "is_issue_type_enabled": self.source_project.is_issue_type_enabled,
            "guest_view_all_features": self.source_project.guest_view_all_features,
            "cover_image": self.source_project.cover_image,
            "archive_in": self.source_project.archive_in,
            "close_in": self.source_project.close_in,
            "logo_props": self.source_project.logo_props,
            "timezone": self.source_project.timezone,
            # Set to null, will be updated later
            "default_assignee": None,
            "project_lead": None,
            "default_state": None,
            "estimate": None,
            # Audit fields
            "created_by": self.workspace_owner,
            "updated_by": self.workspace_owner,
        }

        self.new_project = Project.objects.create(
            workspace=self.target_workspace,
            **project_data,
        )
        self.project_map[str(self.source_project.id)] = self.new_project.id
        print(f"Project created: {self.new_project.name} ({self.new_project.id})")

    def _create_project_member(self):
        """Create workspace owner as project admin"""
        print("Creating project member for workspace owner")
        ProjectMember.objects.create(
            project=self.new_project,
            workspace=self.target_workspace,
            member=self.workspace_owner,
            role=20,  # Admin
            is_active=True,
            created_by=self.workspace_owner,
            updated_by=self.workspace_owner,
        )

    def _copy_states(self):
        """Copy project states"""
        print("Copying states")
        for state in State.objects.filter(project=self.source_project).values():
            try:
                new_state = State.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=state["name"],
                    description=state.get("description", ""),
                    color=state["color"],
                    slug=state.get("slug", ""),
                    sequence=state.get("sequence", 65535),
                    group=state["group"],
                    default=state.get("default", False),
                    is_triage=state.get("is_triage", False),
                    external_source=state.get("external_source"),
                    external_id=state.get("external_id"),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.state_map[str(state["id"])] = new_state.id
            except IntegrityError as e:
                print(f"Error copying state {state['name']}: {e}")
                continue

    def _copy_labels(self):
        """Copy project-scoped labels"""
        print("Copying labels")
        for label in Label.objects.filter(project=self.source_project).values():
            try:
                new_label = Label.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=label["name"],
                    description=label.get("description", ""),
                    color=label.get("color", ""),
                    sort_order=label.get("sort_order", 65535),
                    external_source=label.get("external_source"),
                    external_id=label.get("external_id"),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.label_map[str(label["id"])] = new_label.id
            except IntegrityError as e:
                print(f"Error copying label {label['name']}: {e}")
                continue

    def _copy_estimates(self):
        """Copy estimates and estimate points"""
        print("Copying estimates")
        for estimate in Estimate.objects.filter(project=self.source_project).values():
            try:
                new_estimate = Estimate.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=estimate["name"],
                    description=estimate.get("description", ""),
                    type=estimate.get("type", "categories"),
                    last_used=estimate.get("last_used"),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.estimate_map[str(estimate["id"])] = new_estimate.id
            except IntegrityError as e:
                print(f"Error copying estimate {estimate['name']}: {e}")
                continue

        # Copy estimate points
        for ep in EstimatePoint.objects.filter(project=self.source_project).values():
            estimate_id = self.estimate_map.get(str(ep.get("estimate_id")))
            if not estimate_id:
                continue
            try:
                new_ep = EstimatePoint.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    estimate_id=estimate_id,
                    key=ep["key"],
                    value=ep["value"],
                    description=ep.get("description", ""),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.estimate_point_map[str(ep["id"])] = new_ep.id
            except IntegrityError as e:
                print(f"Error copying estimate point: {e}")
                continue

    def _copy_issue_types(self):
        """Copy or map issue types from source to target workspace"""
        print("Copying/mapping issue types")

        # Get issue types used in the source project
        used_issue_type_ids = set(
            ProjectIssueType.objects.filter(project=self.source_project).values_list("issue_type_id", flat=True)
        )

        # Also include issue types used by issues in the project
        issue_type_ids = set(
            Issue.all_objects.filter(project=self.source_project, type__isnull=False).values_list("type_id", flat=True)
        )
        used_issue_type_ids.update(issue_type_ids)

        for issue_type_id in used_issue_type_ids:
            if not issue_type_id:
                continue

            source_type = IssueType.objects.filter(id=issue_type_id).first()
            if not source_type:
                continue

            # Check if matching issue type exists in target workspace by name
            existing_type = IssueType.objects.filter(
                workspace=self.target_workspace,
                name=source_type.name,
                deleted_at__isnull=True,
            ).first()

            if existing_type:
                # Map to existing type
                self.issue_type_map[str(issue_type_id)] = existing_type.id
            else:
                # Create new issue type in target workspace
                try:
                    new_type = IssueType.objects.create(
                        workspace=self.target_workspace,
                        name=source_type.name,
                        description=source_type.description,
                        logo_props=source_type.logo_props,
                        is_default=False,  # Don't copy default flag
                        is_active=source_type.is_active,
                        is_epic=source_type.is_epic,
                        level=source_type.level,
                        external_source=source_type.external_source,
                        external_id=source_type.external_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                    self.issue_type_map[str(issue_type_id)] = new_type.id
                except IntegrityError as e:
                    print(f"Error copying issue type {source_type.name}: {e}")
                    continue

    def _copy_project_issue_types(self):
        """Copy project issue type associations"""
        print("Copying project issue types")
        for pit in ProjectIssueType.objects.filter(project=self.source_project).values():
            issue_type_id = self.issue_type_map.get(str(pit.get("issue_type_id")))
            if not issue_type_id:
                continue
            try:
                ProjectIssueType.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    issue_type_id=issue_type_id,
                    is_default=pit.get("is_default", False),
                    level=pit.get("level", 0),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying project issue type: {e}")
                continue

    def _copy_project_states(self):
        """Copy EE project states"""
        print("Copying project states")
        # Project states are workspace-scoped, need to map or create
        for ps in ProjectAttribute.objects.filter(project=self.source_project).values():
            state_id = ps.get("state_id")
            if state_id:
                # Map or create the project state
                source_state = ProjectState.objects.filter(id=state_id).first()
                if source_state:
                    # Check if exists in target
                    existing = ProjectState.objects.filter(
                        workspace=self.target_workspace,
                        name=source_state.name,
                        deleted_at__isnull=True,
                    ).first()
                    if existing:
                        self.project_state_map[str(state_id)] = existing.id
                    else:
                        try:
                            new_ps = ProjectState.objects.create(
                                workspace=self.target_workspace,
                                name=source_state.name,
                                description=source_state.description,
                                color=source_state.color,
                                sequence=source_state.sequence,
                                group=source_state.group,
                                default=source_state.default,
                                created_by=self.workspace_owner,
                                updated_by=self.workspace_owner,
                            )
                            self.project_state_map[str(state_id)] = new_ps.id
                        except IntegrityError as e:
                            print(f"Error copying project state: {e}")

    def _copy_project_attributes(self):
        """Copy EE project attributes"""
        print("Copying project attributes")
        for pa in ProjectAttribute.objects.filter(project=self.source_project).values():
            state_id = self.project_state_map.get(str(pa.get("state_id"))) if pa.get("state_id") else None
            try:
                ProjectAttribute.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    state_id=state_id,
                    priority=pa.get("priority", "none"),
                    start_date=pa.get("start_date"),
                    target_date=pa.get("target_date"),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying project attribute: {e}")

    def _copy_project_features(self):
        """Copy EE project features"""
        print("Copying project features")
        for pf in ProjectFeature.objects.filter(project=self.source_project).values():
            try:
                ProjectFeature.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    is_project_updates_enabled=pf.get("is_project_updates_enabled", False),
                    is_epic_enabled=pf.get("is_epic_enabled", False),
                    is_workflow_enabled=pf.get("is_workflow_enabled", False),
                    is_milestone_enabled=pf.get("is_milestone_enabled", False),
                    is_automated_cycle_enabled=pf.get("is_automated_cycle_enabled", False),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying project feature: {e}")

    def _copy_project_links(self):
        """Copy EE project links"""
        print("Copying project links")
        for pl in ProjectLink.objects.filter(project=self.source_project).values():
            try:
                ProjectLink.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    title=pl.get("title"),
                    url=pl["url"],
                    metadata=pl.get("metadata", {}),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying project link: {e}")

    def _copy_issue_properties(self):
        """Copy EE issue properties"""
        print("Copying issue properties")
        for ip in IssueProperty.objects.filter(project=self.source_project).values():
            issue_type_id = self.issue_type_map.get(str(ip.get("issue_type_id"))) if ip.get("issue_type_id") else None
            try:
                new_ip = IssueProperty.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=ip["name"],
                    display_name=ip["display_name"],
                    description=ip.get("description"),
                    logo_props=ip.get("logo_props", {}),
                    sort_order=ip.get("sort_order", 65535),
                    property_type=ip["property_type"],
                    relation_type=ip.get("relation_type"),
                    is_required=ip.get("is_required", False),
                    default_value=ip.get("default_value", []),
                    settings=ip.get("settings", {}),
                    is_active=ip.get("is_active", True),
                    issue_type_id=issue_type_id,
                    is_multi=ip.get("is_multi", False),
                    validation_rules=ip.get("validation_rules", {}),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.issue_property_map[str(ip["id"])] = new_ip.id
            except IntegrityError as e:
                print(f"Error copying issue property: {e}")

    def _copy_issue_property_options(self):
        """Copy EE issue property options"""
        print("Copying issue property options")
        for ipo in IssuePropertyOption.objects.filter(project=self.source_project).values():
            property_id = self.issue_property_map.get(str(ipo.get("property_id")))
            if not property_id:
                continue
            try:
                new_ipo = IssuePropertyOption.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    property_id=property_id,
                    name=ipo["name"],
                    sort_order=ipo.get("sort_order", 65535),
                    description=ipo.get("description", ""),
                    logo_props=ipo.get("logo_props", {}),
                    is_active=ipo.get("is_active", True),
                    is_default=ipo.get("is_default", False),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.issue_property_option_map[str(ipo["id"])] = new_ipo.id
            except IntegrityError as e:
                print(f"Error copying issue property option: {e}")

    def _copy_modules(self):
        """Copy modules"""
        print("Copying modules")
        for module in Module.objects.filter(project=self.source_project).values():
            try:
                new_module = Module.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=module["name"],
                    description=module.get("description", ""),
                    description_text=module.get("description_text"),
                    description_html=module.get("description_html"),
                    start_date=module.get("start_date"),
                    target_date=module.get("target_date"),
                    status=module.get("status", "planned"),
                    lead=self.workspace_owner,  # Set to workspace owner
                    view_props=module.get("view_props", {}),
                    sort_order=module.get("sort_order", 65535),
                    logo_props=module.get("logo_props", {}),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.module_map[str(module["id"])] = new_module.id
            except IntegrityError as e:
                print(f"Error copying module {module['name']}: {e}")

    def _copy_module_links(self):
        """Copy module links"""
        print("Copying module links")
        for ml in ModuleLink.objects.filter(project=self.source_project).values():
            module_id = self.module_map.get(str(ml.get("module_id")))
            if not module_id:
                continue
            try:
                ModuleLink.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    module_id=module_id,
                    title=ml.get("title"),
                    url=ml["url"],
                    metadata=ml.get("metadata", {}),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying module link: {e}")

    def _copy_cycles(self):
        """Copy cycles"""
        print("Copying cycles")
        for cycle in Cycle.objects.filter(project=self.source_project).values():
            try:
                new_cycle = Cycle.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=cycle["name"],
                    description=cycle.get("description", ""),
                    start_date=cycle.get("start_date"),
                    end_date=cycle.get("end_date"),
                    owned_by=self.workspace_owner,  # Set to workspace owner
                    view_props=cycle.get("view_props", {}),
                    sort_order=cycle.get("sort_order", 65535),
                    progress_snapshot=cycle.get("progress_snapshot", {}),
                    logo_props=cycle.get("logo_props", {}),
                    timezone=cycle.get("timezone", "UTC"),
                    version=cycle.get("version", 1),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.cycle_map[str(cycle["id"])] = new_cycle.id
            except IntegrityError as e:
                print(f"Error copying cycle {cycle['name']}: {e}")

    def _copy_cycle_settings(self):
        """Copy EE cycle settings"""
        print("Copying cycle settings")
        for cs in CycleSettings.objects.filter(project=self.source_project).values():
            try:
                CycleSettings.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    title=cs["title"],
                    cycle_duration=cs["cycle_duration"],
                    cooldown_period=cs.get("cooldown_period", 0),
                    start_date=cs["start_date"],
                    number_of_cycles=cs["number_of_cycles"],
                    is_auto_rollover_enabled=cs.get("is_auto_rollover_enabled", False),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
            except IntegrityError as e:
                print(f"Error copying cycle settings: {e}")

    def _copy_milestones(self):
        """Copy EE milestones"""
        print("Copying milestones")
        for ms in Milestone.objects.filter(project=self.source_project).values():
            try:
                # Create description if needed
                description_id = None
                if ms.get("description_id"):
                    source_desc = Description.objects.filter(id=ms["description_id"]).first()
                    if source_desc:
                        new_desc = Description.objects.create(
                            workspace=self.target_workspace,
                            project=self.new_project,
                            description_html=source_desc.description_html,
                            description_json=source_desc.description_json,
                            description_stripped=source_desc.description_stripped,
                            description_binary=source_desc.description_binary,
                            created_by=self.workspace_owner,
                            updated_by=self.workspace_owner,
                        )
                        description_id = new_desc.id
                        self.description_map[str(ms["description_id"])] = new_desc.id

                new_ms = Milestone.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    title=ms["title"],
                    description_id=description_id,
                    target_date=ms.get("target_date"),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.milestone_map[str(ms["id"])] = new_ms.id
            except IntegrityError as e:
                print(f"Error copying milestone: {e}")

    def _copy_automations(self):
        """Copy EE automations"""
        print("Copying automations")
        for auto in Automation.objects.filter(project=self.source_project).values():
            try:
                # Create automation without bot_user (it will be created on save)
                new_auto = Automation(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=auto["name"],
                    description=auto.get("description", ""),
                    scope=auto["scope"],
                    status=auto.get("status", "draft"),
                    is_enabled=False,  # Disable by default for copied automations
                    run_count=0,
                    last_run_at=None,
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                new_auto.save()
                self.automation_map[str(auto["id"])] = new_auto.id

                # Copy automation versions
                for av in AutomationVersion.objects.filter(automation_id=auto["id"]).values():
                    new_av = AutomationVersion.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        automation=new_auto,
                        version_number=av["version_number"],
                        name=av["name"],
                        description=av.get("description", ""),
                        configuration=av.get("configuration", {}),
                        is_published=False,  # Don't publish copied versions
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                    self.automation_version_map[str(av["id"])] = new_av.id

                    # Copy automation nodes
                    for node in AutomationNode.objects.filter(version_id=av["id"]).values():
                        new_node = AutomationNode.objects.create(
                            workspace=self.target_workspace,
                            project=self.new_project,
                            version=new_av,
                            name=node["name"],
                            node_type=node["node_type"],
                            handler_name=node["handler_name"],
                            config=node.get("config", {}),
                            is_enabled=node.get("is_enabled", True),
                            created_by=self.workspace_owner,
                            updated_by=self.workspace_owner,
                        )
                        self.automation_node_map[str(node["id"])] = new_node.id

                    # Copy automation edges
                    for edge in AutomationEdge.objects.filter(version_id=av["id"]).values():
                        source_node_id = self.automation_node_map.get(str(edge.get("source_node_id")))
                        target_node_id = self.automation_node_map.get(str(edge.get("target_node_id")))
                        if source_node_id and target_node_id:
                            AutomationEdge.objects.create(
                                workspace=self.target_workspace,
                                project=self.new_project,
                                version=new_av,
                                source_node_id=source_node_id,
                                target_node_id=target_node_id,
                                execution_order=edge.get("execution_order", 0),
                                created_by=self.workspace_owner,
                                updated_by=self.workspace_owner,
                            )
            except IntegrityError as e:
                print(f"Error copying automation: {e}")

    def _copy_workflows(self):
        """Copy EE workflows"""
        print("Copying workflows")
        for wf in Workflow.objects.filter(project=self.source_project).values():
            state_id = self.state_map.get(str(wf.get("state_id")))
            if not state_id:
                continue
            try:
                new_wf = Workflow.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    state_id=state_id,
                    allow_issue_creation=wf.get("allow_issue_creation", True),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.workflow_map[str(wf["id"])] = new_wf.id

                # Copy workflow transitions
                for wt in WorkflowTransition.objects.filter(workflow_id=wf["id"]).values():
                    transition_state_id = self.state_map.get(str(wt.get("transition_state_id")))
                    rejection_state_id = (
                        self.state_map.get(str(wt.get("rejection_state_id"))) if wt.get("rejection_state_id") else None
                    )

                    new_wt = WorkflowTransition.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        workflow=new_wf,
                        transition_state_id=transition_state_id,
                        rejection_state_id=rejection_state_id,
                        required_approvals=wt.get("required_approvals"),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                    self.workflow_transition_map[str(wt["id"])] = new_wt.id

                    # Copy workflow transition approvers (but set approver to null since we don't copy members)
                    # We skip this because approvers are user-specific
            except IntegrityError as e:
                print(f"Error copying workflow: {e}")

    def _copy_parent_issues(self):
        """Copy parent issues (parent=null)"""
        print("Copying parent issues")
        for issue in Issue.all_objects.filter(
            project=self.source_project, parent__isnull=True, deleted_at__isnull=True
        ).values():
            self._create_issue(issue)

    def _copy_child_issues(self):
        """Copy child issues (parent!=null)"""
        print("Copying child issues")
        for issue in Issue.all_objects.filter(
            project=self.source_project, parent__isnull=False, deleted_at__isnull=True
        ).values():
            self._create_issue(issue)

    def _create_issue(self, issue):
        """Create a single issue with remapped references"""
        try:
            state_id = self.state_map.get(str(issue.get("state_id")))
            estimate_point_id = (
                self.estimate_point_map.get(str(issue.get("estimate_point_id")))
                if issue.get("estimate_point_id")
                else None
            )
            type_id = self.issue_type_map.get(str(issue.get("type_id"))) if issue.get("type_id") else None
            parent_id = self.issue_map.get(str(issue.get("parent_id"))) if issue.get("parent_id") else None

            new_issue = Issue.objects.create(
                workspace=self.target_workspace,
                project=self.new_project,
                name=issue["name"],
                description_json=issue.get("description_json", {}),
                description_html=issue.get("description_html", "<p></p>"),
                description_stripped=issue.get("description_stripped"),
                description_binary=issue.get("description_binary"),
                priority=issue.get("priority", "none"),
                start_date=issue.get("start_date"),
                target_date=issue.get("target_date"),
                state_id=state_id,
                estimate_point_id=estimate_point_id,
                type_id=type_id,
                parent_id=parent_id,
                sort_order=issue.get("sort_order", 65535),
                completed_at=issue.get("completed_at"),
                archived_at=issue.get("archived_at"),
                is_draft=issue.get("is_draft", False),
                created_by=self.workspace_owner,
                updated_by=self.workspace_owner,
            )
            self.issue_map[str(issue["id"])] = new_issue.id
        except Exception as e:
            print(f"Error copying issue {issue.get('name')}: {e}")

    def _copy_issue_labels(self):
        """Copy issue labels"""
        print("Copying issue labels")
        issue_labels = []
        for il in IssueLabel.objects.filter(project=self.source_project).values():
            issue_id = self.issue_map.get(str(il.get("issue_id")))
            label_id = self.label_map.get(str(il.get("label_id")))
            if issue_id and label_id:
                issue_labels.append(
                    IssueLabel(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        issue_id=issue_id,
                        label_id=label_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if issue_labels:
            IssueLabel.objects.bulk_create(issue_labels, ignore_conflicts=True, batch_size=1000)

    def _copy_issue_links(self):
        """Copy issue links"""
        print("Copying issue links")
        issue_links = []
        for il in IssueLink.objects.filter(project=self.source_project).values():
            issue_id = self.issue_map.get(str(il.get("issue_id")))
            if issue_id:
                issue_links.append(
                    IssueLink(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        issue_id=issue_id,
                        title=il.get("title"),
                        url=il["url"],
                        metadata=il.get("metadata", {}),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if issue_links:
            IssueLink.objects.bulk_create(issue_links, ignore_conflicts=True, batch_size=1000)

    def _copy_issue_relations(self):
        """Copy issue relations (only those where both issues are copied)"""
        print("Copying issue relations")
        issue_relations = []
        for ir in IssueRelation.objects.filter(project=self.source_project).values():
            issue_id = self.issue_map.get(str(ir.get("issue_id")))
            related_issue_id = self.issue_map.get(str(ir.get("related_issue_id")))
            # Only copy if both issues are in the copied project
            if issue_id and related_issue_id:
                issue_relations.append(
                    IssueRelation(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        issue_id=issue_id,
                        related_issue_id=related_issue_id,
                        relation_type=ir["relation_type"],
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if issue_relations:
            IssueRelation.objects.bulk_create(issue_relations, ignore_conflicts=True, batch_size=1000)

    def _copy_issue_property_values(self):
        """Copy EE issue property values"""
        print("Copying issue property values")
        ipv_list = []
        for ipv in IssuePropertyValue.objects.filter(project=self.source_project).values():
            issue_id = self.issue_map.get(str(ipv.get("issue_id")))
            property_id = self.issue_property_map.get(str(ipv.get("property_id")))
            value_option_id = (
                self.issue_property_option_map.get(str(ipv.get("value_option_id")))
                if ipv.get("value_option_id")
                else None
            )

            if issue_id and property_id:
                ipv_list.append(
                    IssuePropertyValue(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        issue_id=issue_id,
                        property_id=property_id,
                        value_text=ipv.get("value_text", ""),
                        value_boolean=ipv.get("value_boolean", False),
                        value_decimal=ipv.get("value_decimal", 0),
                        value_datetime=ipv.get("value_datetime"),
                        value_uuid=ipv.get("value_uuid"),
                        value_option_id=value_option_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if ipv_list:
            IssuePropertyValue.objects.bulk_create(ipv_list, ignore_conflicts=True, batch_size=1000)

    def _copy_issue_worklogs(self):
        """Copy EE issue worklogs"""
        print("Copying issue worklogs")
        worklogs = []
        for wl in IssueWorkLog.objects.filter(project=self.source_project).values():
            issue_id = self.issue_map.get(str(wl.get("issue_id")))
            if issue_id:
                worklogs.append(
                    IssueWorkLog(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        issue_id=issue_id,
                        description=wl.get("description", ""),
                        logged_by=self.workspace_owner,  # Set to workspace owner
                        duration=wl.get("duration", 0),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if worklogs:
            IssueWorkLog.objects.bulk_create(worklogs, ignore_conflicts=True, batch_size=1000)

    def _copy_cycle_issues(self):
        """Copy cycle issues"""
        print("Copying cycle issues")
        cycle_issues = []
        for ci in CycleIssue.objects.filter(project=self.source_project).values():
            cycle_id = self.cycle_map.get(str(ci.get("cycle_id")))
            issue_id = self.issue_map.get(str(ci.get("issue_id")))
            if cycle_id and issue_id:
                cycle_issues.append(
                    CycleIssue(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        cycle_id=cycle_id,
                        issue_id=issue_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if cycle_issues:
            CycleIssue.objects.bulk_create(cycle_issues, ignore_conflicts=True, batch_size=1000)

    def _copy_module_issues(self):
        """Copy module issues"""
        print("Copying module issues")
        module_issues = []
        for mi in ModuleIssue.objects.filter(project=self.source_project).values():
            module_id = self.module_map.get(str(mi.get("module_id")))
            issue_id = self.issue_map.get(str(mi.get("issue_id")))
            if module_id and issue_id:
                module_issues.append(
                    ModuleIssue(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        module_id=module_id,
                        issue_id=issue_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if module_issues:
            ModuleIssue.objects.bulk_create(module_issues, ignore_conflicts=True, batch_size=1000)

    def _copy_milestone_issues(self):
        """Copy EE milestone issues"""
        print("Copying milestone issues")
        milestone_issues = []
        for mi in MilestoneIssue.objects.filter(project=self.source_project).values():
            milestone_id = self.milestone_map.get(str(mi.get("milestone_id")))
            issue_id = self.issue_map.get(str(mi.get("issue_id")))
            if milestone_id and issue_id:
                milestone_issues.append(
                    MilestoneIssue(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        milestone_id=milestone_id,
                        issue_id=issue_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                )
        if milestone_issues:
            MilestoneIssue.objects.bulk_create(milestone_issues, ignore_conflicts=True, batch_size=1000)

    def _copy_pages(self):
        """Copy pages"""
        print("Copying pages")
        # Get all pages linked to the source project
        project_page_ids = ProjectPage.objects.filter(project=self.source_project).values_list("page_id", flat=True)

        # First pass: copy root pages (no parent)
        for page in Page.objects.filter(id__in=project_page_ids, parent__isnull=True).values():
            self._create_page(page)

        # Second pass: copy child pages (need parent_id remapping)
        for page in Page.objects.filter(id__in=project_page_ids, parent__isnull=False).values():
            self._create_page(page)

    def _create_page(self, page):
        """Create a single page with remapped references"""
        try:
            # Handle parent pages
            parent_id = None
            if page.get("parent_id"):
                parent_id = self.page_map.get(str(page["parent_id"]))

            new_page = Page.objects.create(
                workspace=self.target_workspace,
                name=page.get("name", ""),
                description=page.get("description", {}),
                description_binary=page.get("description_binary"),
                description_html=page.get("description_html", "<p></p>"),
                description_stripped=page.get("description_stripped"),
                owned_by=self.workspace_owner,  # Set to workspace owner
                access=page.get("access", 0),
                color=page.get("color", ""),
                parent_id=parent_id,
                is_locked=page.get("is_locked", False),
                view_props=page.get("view_props", {}),
                logo_props=page.get("logo_props", {}),
                is_global=page.get("is_global", False),
                sort_order=page.get("sort_order", 65535),
                created_by=self.workspace_owner,
                updated_by=self.workspace_owner,
            )
            self.page_map[str(page["id"])] = new_page.id
        except IntegrityError as e:
            print(f"Error copying page: {e}")

    def _copy_project_pages(self):
        """Copy project page associations"""
        print("Copying project pages")
        for pp in ProjectPage.objects.filter(project=self.source_project).values():
            page_id = self.page_map.get(str(pp.get("page_id")))
            if page_id:
                try:
                    ProjectPage.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        page_id=page_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying project page: {e}")

    def _copy_page_labels(self):
        """Copy page labels"""
        print("Copying page labels")
        for pl in PageLabel.objects.filter(page_id__in=self.page_map.keys()).values():
            page_id = self.page_map.get(str(pl.get("page_id")))
            label_id = self.label_map.get(str(pl.get("label_id")))
            if page_id and label_id:
                try:
                    PageLabel.objects.create(
                        workspace=self.target_workspace,
                        page_id=page_id,
                        label_id=label_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying page label: {e}")

    def _copy_views(self):
        """Copy project-scoped views"""
        print("Copying views")
        for view in IssueView.objects.filter(project=self.source_project).values():
            try:
                new_view = IssueView.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=view["name"],
                    description=view.get("description", ""),
                    query=view.get("query", {}),
                    filters=view.get("filters", {}),
                    display_filters=view.get("display_filters", {}),
                    display_properties=view.get("display_properties", {}),
                    rich_filters=view.get("rich_filters", {}),
                    access=view.get("access", 1),
                    sort_order=view.get("sort_order", 65535),
                    logo_props=view.get("logo_props", {}),
                    owned_by=self.workspace_owner,  # Set to workspace owner
                    is_locked=view.get("is_locked", False),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.view_map[str(view["id"])] = new_view.id
            except IntegrityError as e:
                print(f"Error copying view: {e}")

    def _copy_intakes(self):
        """Copy intakes"""
        print("Copying intakes")
        for intake in Intake.objects.filter(project=self.source_project).values():
            try:
                new_intake = Intake.objects.create(
                    workspace=self.target_workspace,
                    project=self.new_project,
                    name=intake["name"],
                    description=intake.get("description", ""),
                    is_default=intake.get("is_default", False),
                    view_props=intake.get("view_props", {}),
                    logo_props=intake.get("logo_props", {}),
                    created_by=self.workspace_owner,
                    updated_by=self.workspace_owner,
                )
                self.intake_map[str(intake["id"])] = new_intake.id
            except IntegrityError as e:
                print(f"Error copying intake: {e}")

    def _copy_intake_issues(self):
        """Copy intake issues"""
        print("Copying intake issues")
        for ii in IntakeIssue.objects.filter(project=self.source_project).values():
            intake_id = self.intake_map.get(str(ii.get("intake_id")))
            issue_id = self.issue_map.get(str(ii.get("issue_id")))
            duplicate_to_id = self.issue_map.get(str(ii.get("duplicate_to_id"))) if ii.get("duplicate_to_id") else None

            if intake_id and issue_id:
                try:
                    IntakeIssue.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        intake_id=intake_id,
                        issue_id=issue_id,
                        status=ii.get("status", -2),
                        snoozed_till=ii.get("snoozed_till"),
                        duplicate_to_id=duplicate_to_id,
                        source=ii.get("source", "IN_APP"),
                        source_email=ii.get("source_email"),
                        extra=ii.get("extra", {}),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying intake issue: {e}")

    def _copy_intake_settings(self):
        """Copy EE intake settings"""
        print("Copying intake settings")
        for iss in IntakeSetting.objects.filter(project=self.source_project).values():
            intake_id = self.intake_map.get(str(iss.get("intake_id")))
            if intake_id:
                try:
                    IntakeSetting.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        intake_id=intake_id,
                        is_in_app_enabled=iss.get("is_in_app_enabled", True),
                        is_email_enabled=iss.get("is_email_enabled", False),
                        is_form_enabled=iss.get("is_form_enabled", False),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying intake setting: {e}")

    def _copy_intake_forms(self):
        """Copy EE intake forms"""
        print("Copying intake forms")
        for if_ in IntakeForm.objects.filter(project=self.source_project).values():
            intake_id = self.intake_map.get(str(if_.get("intake_id")))
            work_item_type_id = self.issue_type_map.get(str(if_.get("work_item_type_id")))
            if intake_id and work_item_type_id:
                try:
                    new_if = IntakeForm.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        intake_id=intake_id,
                        work_item_type_id=work_item_type_id,
                        name=if_["name"],
                        description=if_.get("description"),
                        is_active=if_.get("is_active", True),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                    self.intake_form_map[str(if_["id"])] = new_if.id
                except IntegrityError as e:
                    print(f"Error copying intake form: {e}")

    def _copy_intake_form_fields(self):
        """Copy EE intake form fields"""
        print("Copying intake form fields")
        for iff in IntakeFormField.objects.filter(project=self.source_project).values():
            intake_form_id = self.intake_form_map.get(str(iff.get("intake_form_id")))
            work_item_property_id = self.issue_property_map.get(str(iff.get("work_item_property_id")))
            if intake_form_id and work_item_property_id:
                try:
                    IntakeFormField.objects.create(
                        workspace=self.target_workspace,
                        project=self.new_project,
                        intake_form_id=intake_form_id,
                        work_item_property_id=work_item_property_id,
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying intake form field: {e}")

    def _copy_workitem_templates(self):
        """Copy EE workitem templates (project-scoped ones)"""
        print("Copying workitem templates")
        for wt in WorkitemTemplate.objects.filter(
            project_template__isnull=True, workspace=self.source_workspace
        ).values():
            # Only copy workspace-scoped templates that have no template parent
            if wt.get("template_id") is None:
                try:
                    WorkitemTemplate.objects.create(
                        workspace=self.target_workspace,
                        name=wt["name"],
                        description=wt.get("description", {}),
                        description_html=wt.get("description_html", "<p></p>"),
                        description_stripped=wt.get("description_stripped"),
                        description_binary=wt.get("description_binary"),
                        priority=wt.get("priority", "none"),
                        parent=wt.get("parent", {}),
                        state=wt.get("state", {}),
                        assignees=wt.get("assignees", {}),
                        labels=wt.get("labels", {}),
                        type=wt.get("type", {}),
                        modules=wt.get("modules", {}),
                        properties=wt.get("properties", {}),
                        created_by=self.workspace_owner,
                        updated_by=self.workspace_owner,
                    )
                except IntegrityError as e:
                    print(f"Error copying workitem template: {e}")

    def _copy_recurring_workitem_tasks(self):
        """Copy EE recurring workitem tasks"""
        print("Copying recurring workitem tasks")
        # Skip this as recurring tasks reference templates which may not exist in target workspace
        # and they have complex scheduling logic
        pass

    def _update_project_references(self):
        """Update project FKs after all entities are copied"""
        print("Updating project references")

        # Update default_state if it was set
        if self.source_project.default_state_id:
            new_default_state_id = self.state_map.get(str(self.source_project.default_state_id))
            if new_default_state_id:
                self.new_project.default_state_id = new_default_state_id

        # Update estimate if it was set
        if self.source_project.estimate_id:
            new_estimate_id = self.estimate_map.get(str(self.source_project.estimate_id))
            if new_estimate_id:
                self.new_project.estimate_id = new_estimate_id

        self.new_project.save(update_fields=["default_state", "estimate"])


@shared_task
def copy_project_data(
    source_project_id,
    target_workspace_id,
    new_project_name,
    new_project_identifier,
):
    """Celery task to copy project data"""
    try:
        copier = ProjectDataCopier(
            source_project_id,
            target_workspace_id,
            new_project_name,
            new_project_identifier,
        )
        copier.initialize_project_copy()
        print("Project data copied successfully.")
    except Exception as e:
        log_exception(e)
        raise
