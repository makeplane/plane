# Python imports
import random

# Third party imports
from celery import shared_task

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import (
    Estimate,
    EstimatePoint,
    IssueType,
    Label,
    Project,
    ProjectIssueType,
    WorkspaceMember,
    ProjectMember,
    IssueUserProperty,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    ProjectTemplate,
    PropertyTypeEnum,
)
from plane.bgtasks.project_add_user_email_task import project_add_user_email


def get_random_color():
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))


def create_estimates(estimate_data, project_id, project):
    # Create Estimates
    estimate = Estimate.objects.create(
        project_id=project_id, name=estimate_data["name"], type=estimate_data["type"]
    )
    EstimatePoint.objects.bulk_create(
        [
            EstimatePoint(
                estimate_id=estimate.id,
                key=point_data["key"],
                value=point_data["value"],
            )
            for point_data in estimate_data["points"]
        ]
    )

    project.estimate = estimate
    project.save()


def create_labels(label_data, project_id, workspace_id):
    # Create Labels
    Label.objects.bulk_create(
        [
            Label(
                workspace_id=workspace_id,
                project_id=project_id,
                name=label["name"],
                color=label.get("color", get_random_color()),
                sort_order=random.randint(0, 65535),
            )
            for label in label_data
        ]
    )


def create_workitem_types(workitem_type_data, project_id, workspace_id):
    # Create Workitem Types
    for type in workitem_type_data:
        # Create IssueType
        issue_type = IssueType.objects.create(
            workspace_id=workspace_id,
            name=type["name"],
            is_default=type.get("is_default", False),
            logo_props=type.get("logo_props", {}),
        )

        # Create ProjectIssueType
        ProjectIssueType.objects.create(
            project_id=project_id,
            issue_type_id=issue_type.id,
            is_default=type.get("is_default", False),
        )

        for property in type.get("properties", []):
            issue_property = IssueProperty.objects.create(
                project_id=project_id,
                issue_type_id=issue_type.id,
                display_name=property["display_name"],
                property_type=property["property_type"],
                relation_type=property.get("relation_type"),
                sort_order=random.randint(0, 65535),
                logo_props=property.get("logo_props", {}),
                is_required=property.get("is_required"),
                settings=property.get("settings", {}),
                is_active=property.get("is_active", True),
                is_multi=property.get("is_multi", False),
            )

            # create options
            if issue_property.property_type == PropertyTypeEnum.OPTION:
                IssuePropertyOption.objects.bulk_create(
                    [
                        IssuePropertyOption(
                            name=value["name"],
                            sort_order=value.get(
                                "sort_order", random.randint(0, 65535)
                            ),
                            property=issue_property,
                            is_active=value.get("is_active", True),
                            is_default=value.get("is_default", False),
                            logo_props=value.get("logo_props", {}),
                            workspace_id=workspace_id,
                            project_id=project_id,
                        )
                        for value in property.get("options", [])
                    ],
                    batch_size=1000,
                )


def create_epics(epic_data, project_id, workspace_id):
    issue_type = IssueType.objects.create(
        workspace_id=workspace_id, name=epic_data["name"], is_epic=True, level=1
    )

    ProjectIssueType.objects.create(
        project_id=project_id, issue_type=issue_type, level=1
    )

    for property in epic_data.get("properties", []):
        epic_property = IssueProperty.objects.create(
            project_id=project_id,
            issue_type_id=issue_type.id,
            display_name=property["display_name"],
            property_type=property["property_type"],
            relation_type=property.get("relation_type"),
            sort_order=random.randint(0, 65535),
            logo_props=property.get("logo_props", {}),
            is_required=property.get("is_required"),
            settings=property.get("settings", {}),
            is_active=property.get("is_active", True),
            is_multi=property.get("is_multi", False),
        )

        # create options
        if epic_property.property_type == PropertyTypeEnum.OPTION:
            IssuePropertyOption.objects.bulk_create(
                [
                    IssuePropertyOption(
                        name=value["name"],
                        sort_order=value.get("sort_order", random.randint(0, 65535)),
                        property=epic_property,
                        is_active=value.get("is_active", True),
                        is_default=value.get("is_default", False),
                        logo_props=value.get("logo_props", {}),
                        workspace_id=workspace_id,
                        project_id=project_id,
                    )
                    for value in property.get("options", [])
                ],
                batch_size=1000,
            )


def create_members(template_members, project_id, workspace_id, user_id, host):
    # get workspace members
    workspace_member_roles = {
        member.get("member_id"): member.get("role")
        for member in WorkspaceMember.objects.filter(
            workspace_id=workspace_id, member_id__in=template_members.keys()
        ).values("member_id", "role")
    }

    # get project members
    project_members = (
        ProjectMember.objects.filter(
            workspace_id=workspace_id, member_id__in=workspace_member_roles.keys()
        )
        .values("member_id", "sort_order")
        .order_by("sort_order")
    )

    # Loop through members and create
    bulk_project_members = []
    bulk_issue_props = []
    for member in template_members:
        member_id = member.get("member_id")

        # if the user is not part of workspace continue
        if member_id not in workspace_member_roles:
            continue

        # get the workspace member role
        workspace_member_role = workspace_member_roles[str(member_id)]
        sort_order = [
            project_member.get("sort_order")
            for project_member in project_members
            if str(project_member.get("member_id")) == str(member.get("member_id"))
        ]

        # Create a new project member
        bulk_project_members.append(
            ProjectMember(
                member_id=member.get("member_id"),
                role=ROLE.GUEST.value
                if workspace_member_role == ROLE.GUEST.value
                else member.get("role"),
                project_id=project_id,
                workspace_id=workspace_id,
                sort_order=(sort_order[0] - 10000 if len(sort_order) else 65535),
            )
        )

        # Create a new issue property
        bulk_issue_props.append(
            IssueUserProperty(
                user_id=member.get("member_id"),
                project_id=project_id,
                workspace_id=workspace_id,
            )
        )

        # Bulk create the project members and issue properties
        project_members = ProjectMember.objects.bulk_create(
            bulk_project_members, batch_size=10, ignore_conflicts=True
        )
        _ = IssueUserProperty.objects.bulk_create(
            bulk_issue_props, batch_size=10, ignore_conflicts=True
        )

        # send email to project members
        [
            project_add_user_email.delay(host, project_member.id, user_id)
            for project_member in project_members
        ]

        return


@shared_task
def create_project_from_template(template_id, project_id, user_id, host):
    # get
    project_template = ProjectTemplate.objects.get(template_id=template_id)
    project = Project.objects.get(id=project_id)
    workspace_id = project.workspace_id

    # Create Estimates
    if project_template.estimates:
        create_estimates(project_template.estimates, project_id, project)

    # Create Labels
    if project_template.labels:
        create_labels(project_template.labels, project_id, workspace_id)

    # Create workitem types
    if project_template.workitem_types:
        create_workitem_types(project_template.workitem_types, project_id, workspace_id)

    # create epics
    if project_template.epics:
        create_epics(project_template.epics, project_id, workspace_id)

    if project_template.members:
        create_members(
            project_template.members, project_id, workspace_id, user_id, host
        )
