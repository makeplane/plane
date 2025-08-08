# Python imports
import random
import json
from datetime import datetime
import uuid
import logging
from typing import Any, Dict, Optional

# Django imports
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Case, When, Func, F, CharField, Value, Q
from django.db.models.functions import Cast
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from celery import shared_task

# Module imports
from plane.db.models import (
    Issue,
    IssueAssignee,
    Estimate,
    EstimatePoint,
    IssueType,
    Label,
    Project,
    ProjectIssueType,
    ProjectMember,
    IssueActivity,
    IssueLabel,
    State,
    Workspace,
    IssueSequence,
)
from plane.ee.models import (
    IssueProperty,
    IssuePropertyOption,
    ProjectTemplate,
    PropertyTypeEnum,
    WorkitemTemplate,
    IssuePropertyValue,
)
from plane.utils.exception_logger import log_exception
from plane.app.serializers import IssueDetailSerializer
from plane.bgtasks.webhook_task import model_activity
from plane.ee.bgtasks.issue_property_activity_task import issue_property_activity
from plane.bgtasks.issue_description_version_task import issue_description_version_task
from plane.ee.utils.issue_property_validators import (
    property_validators,
    property_savers,
)

logger = logging.getLogger("plane.worker")

# Constants
DATETIME_FORMATS = [
    "%Y-%m-%d",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%fZ",
]

BULK_CREATE_BATCH_SIZE = 1000


def get_random_color():
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))


def _parse_datetime_value(value: Any) -> Optional[datetime]:
    """Parse datetime value from various formats."""
    if not isinstance(value, str):
        return value

    for fmt in DATETIME_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def _get_property_value_data(
    property_obj: IssueProperty,
    value: Any,
    workitem_property_option_map: Optional[Dict[str, str]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Get property value data based on property type.

    Args:
        property_obj: The IssueProperty object
        value: The value to process
        workitem_property_option_map: Optional mapping for option IDs

    Returns:
        Dictionary with property value data or None if processing failed
    """
    property_type_handlers = {
        PropertyTypeEnum.TEXT: lambda v: {"value_text": str(v)},
        PropertyTypeEnum.BOOLEAN: lambda v: {"value_boolean": bool(v)},
        PropertyTypeEnum.DECIMAL: lambda v: {
            "value_decimal": float(v) if v is not None else 0.0
        },
        PropertyTypeEnum.DATETIME: lambda v: {
            "value_datetime": _parse_datetime_value(v)
        },
        PropertyTypeEnum.URL: lambda v: {"value_text": str(v)},
        PropertyTypeEnum.EMAIL: lambda v: {"value_text": str(v)},
        PropertyTypeEnum.RELATION: lambda v: {"value_uuid": uuid.UUID(str(v))},
    }

    try:
        if property_obj.property_type == PropertyTypeEnum.OPTION:
            # Handle option type - map the old option ID to new option ID
            if workitem_property_option_map:
                old_option_id = str(value)
                new_option_id = workitem_property_option_map.get(old_option_id)
                if new_option_id:
                    try:
                        option_obj = IssuePropertyOption.objects.get(id=new_option_id)
                        return {"value_option": option_obj}
                    except IssuePropertyOption.DoesNotExist:
                        logger.warning(f"Option does not exist: {new_option_id}")
                        return None
                else:
                    logger.warning(f"Option mapping not found for: {old_option_id}")
                    return None
            else:
                # Direct option lookup (for subworkitems)
                try:
                    option_obj = IssuePropertyOption.objects.get(id=value)
                    return {"value_option": option_obj}
                except IssuePropertyOption.DoesNotExist:
                    logger.warning(f"Option does not exist: {value}")
                    return None

        # Handle other property types
        handler = property_type_handlers.get(property_obj.property_type)
        if handler:
            return handler(value)

        # Default case - store as text
        return {"value_text": str(value)}

    except (ValueError, TypeError) as e:
        logger.warning(
            f"Failed to process value {value} for property {property_obj.id}: {e}"
        )
        return None


def query_annotator(query):
    return query.values("property_id").annotate(
        values=ArrayAgg(
            Case(
                When(
                    property__property_type__in=[
                        PropertyTypeEnum.TEXT,
                        PropertyTypeEnum.URL,
                        PropertyTypeEnum.EMAIL,
                        PropertyTypeEnum.FILE,
                    ],
                    then=F("value_text"),
                ),
                When(
                    property__property_type=PropertyTypeEnum.DATETIME,
                    then=Func(
                        F("value_datetime"),
                        function="TO_CHAR",
                        template="%(function)s(%(expressions)s, 'YYYY-MM-DD')",
                        output_field=CharField(),
                    ),
                ),
                When(
                    property__property_type=PropertyTypeEnum.DECIMAL,
                    then=Cast(F("value_decimal"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.BOOLEAN,
                    then=Cast(F("value_boolean"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.RELATION,
                    then=Cast(F("value_uuid"), output_field=CharField()),
                ),
                When(
                    property__property_type=PropertyTypeEnum.OPTION,
                    then=Cast(F("value_option"), output_field=CharField()),
                ),
                default=Value(""),  # Default value if none of the conditions match
                output_field=CharField(),
            ),
            filter=Q(property_id=F("property_id")),
            distinct=True,
        )
    )


def create_estimates(estimate_data, project_id, project, user_id):
    """
    Create estimates for the project from the template
    Args:
        estimate_data: The estimate data
        project_id: The ID of the project
        project: The project
        user_id: The ID of the user

    """

    # Create Estimates
    estimate = Estimate(
        project_id=project_id,
        name=estimate_data["name"],
        type=estimate_data["type"],
        created_by_id=user_id,
        project=project,
    )
    estimate.save(created_by_id=user_id)
    logger.info(f"Estimate created: {estimate.id}")
    estimate_point_map = {}
    # Create Estimate Points
    for point_data in estimate_data["points"]:
        created_estimate_point = EstimatePoint(
            estimate_id=estimate.id,
            key=point_data["key"],
            value=point_data["value"],
            created_by_id=user_id,
            project_id=project_id,
        )
        created_estimate_point.save(created_by_id=user_id)
        estimate_point_map[str(point_data.get("id"))] = str(created_estimate_point.id)
    logger.info("Estimate points created")
    project.estimate = estimate
    project.save()
    logger.info(f"Estimate saved to project: {project.id}")
    return estimate_point_map


def create_labels(label_data, project_id, workspace_id, user_id):
    """
    Create labels for the project from the template
    Args:
        label_data: The label data
        project_id: The ID of the project
        workspace_id: The ID of the workspace
        user_id: The ID of the user

    """

    # Create Labels
    label_map = {}

    for label in label_data:
        created_label = Label(
            workspace_id=workspace_id,
            project_id=project_id,
            name=label["name"],
            color=label.get("color", get_random_color()),
            sort_order=random.randint(0, 65535),
            created_by_id=user_id,
        )
        created_label.save(created_by_id=user_id)
        label_map[str(label.get("id"))] = str(created_label.id)
    logger.info("Labels created")
    return label_map


def create_workitem_types(workitem_type_data, project_id, workspace_id, user_id):
    """
    Create workitem types for the project from the template
    Args:
        workitem_type_data: The workitem type data
        project_id: The ID of the project
        workspace_id: The ID of the workspace
        user_id: The ID of the user

    """

    workitem_type_map = {}
    workitem_property_map = {}
    workitem_property_option_map = {}

    # Create Workitem Types
    for type in workitem_type_data:
        # Create IssueType
        created_issue_type = IssueType(
            workspace_id=workspace_id,
            name=type["name"],
            description=type.get("description", ""),
            is_default=type.get("is_default", False),
            logo_props=type.get("logo_props", {}),
            created_by_id=user_id,
        )
        created_issue_type.save(created_by_id=user_id)
        workitem_type_map[str(type.get("id"))] = str(created_issue_type.id)
        logger.info(f"Issue type created: {created_issue_type.id}")
        # Create ProjectIssueType
        created_project_issue_type = ProjectIssueType(
            project_id=project_id,
            issue_type_id=created_issue_type.id,
            is_default=type.get("is_default", False),
            created_by_id=user_id,
        )
        created_project_issue_type.save(created_by_id=user_id)
        logger.info(f"Project issue type created: {created_project_issue_type.id}")
        for property in type.get("properties", []):
            created_issue_property = IssueProperty(
                project_id=project_id,
                issue_type_id=created_issue_type.id,
                display_name=property["display_name"],
                description=property.get("description", ""),
                property_type=property["property_type"],
                relation_type=property.get("relation_type"),
                sort_order=random.randint(0, 65535),
                logo_props=property.get("logo_props", {}),
                is_required=property.get("is_required", False),
                settings=property.get("settings", {}),
                is_active=property.get("is_active", True),
                is_multi=property.get("is_multi", False),
            )
            created_issue_property.save(created_by_id=user_id)
            workitem_property_map[str(property.get("id"))] = str(
                created_issue_property.id
            )
            logger.info(f"Issue property created: {created_issue_property.id}")
            # create options
            if created_issue_property.property_type == PropertyTypeEnum.OPTION:
                for value in property.get("options", []):
                    created_issue_property_option = IssuePropertyOption(
                        name=value["name"],
                        sort_order=value.get("sort_order", random.randint(0, 65535)),
                        property=created_issue_property,
                        is_active=value.get("is_active", True),
                        is_default=value.get("is_default", False),
                        logo_props=value.get("logo_props", {}),
                        workspace_id=workspace_id,
                        project_id=project_id,
                    )
                    created_issue_property_option.save(created_by_id=user_id)
                    workitem_property_option_map[str(value.get("id"))] = str(
                        created_issue_property_option.id
                    )
                    logger.info(
                        f"Issue property option created: {created_issue_property_option.id}"
                    )
    return workitem_type_map, workitem_property_map, workitem_property_option_map


def create_epics(epic_data, project_id, workspace_id, user_id):
    """
    Create epics for the project from the template
    Args:
        epic_data: The epic data
        project_id: The ID of the project
        workspace_id: The ID of the workspace
        user_id: The ID of the user

    """

    issue_type = IssueType(
        workspace_id=workspace_id,
        name=epic_data["name"],
        description=epic_data.get("description", ""),
        is_epic=True,
        level=1,
        created_by_id=user_id,
    )
    issue_type.save(created_by_id=user_id)
    logger.info(f"Epic created: {issue_type.id}")
    created_project_issue_type = ProjectIssueType(
        project_id=project_id, issue_type=issue_type, level=1
    )
    created_project_issue_type.save(created_by_id=user_id)
    logger.info(f"Epic project issue type created: {created_project_issue_type.id}")
    for property in epic_data.get("properties", []):
        epic_property = IssueProperty(
            project_id=project_id,
            issue_type_id=issue_type.id,
            display_name=property["display_name"],
            description=property.get("description", ""),
            property_type=property["property_type"],
            relation_type=property.get("relation_type"),
            sort_order=random.randint(0, 65535),
            logo_props=property.get("logo_props", {}),
            is_required=property.get("is_required", False),
            settings=property.get("settings", {}),
            is_active=property.get("is_active", True),
            is_multi=property.get("is_multi", False),
            created_by_id=user_id,
        )
        epic_property.save(created_by_id=user_id)
        logger.info(f"Epic property created: {epic_property.id}")
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
                batch_size=BULK_CREATE_BATCH_SIZE,
            )
            logger.info(f"Epic property options created: {epic_property.id}")


def create_issue_property_values(
    issue,
    blueprint_properties,
    workitem_property_map,
    workitem_property_option_map,
    workspace_id,
    project_id,
    user_id,
):
    """
    Create IssuePropertyValue objects based on blueprint properties
    Args:
        issue: The issue
        blueprint_properties: The blueprint properties
        workitem_property_map: The workitem property map
        workitem_property_option_map: The workitem property option map
        workspace_id: The ID of the workspace
    """

    property_values_to_create = []
    logger.info(f"Creating issue property values for issue: {issue.id}")

    existing_prop_values = query_annotator(
        IssuePropertyValue.objects.filter(
            workspace_id=workspace_id,
            project_id=project_id,
            issue_id=issue.id,
        )
    ).values("property_id", "values")

    # Get all issue properties
    issue_properties = IssueProperty.objects.filter(
        workspace_id=workspace_id,
        project_id=project_id,
        issue_type_id=issue.type_id,
        issue_type__is_epic=False,
        is_active=True,
    )

    # Convert blueprint properties to use actual project property IDs
    converted_properties = {}
    for property in blueprint_properties:
        template_property_id = str(property.get("id"))
        actual_property_id = workitem_property_map.get(template_property_id)
        if actual_property_id:
            converted_properties[actual_property_id] = property.get("values", [])

    # Validate the data
    property_validators(
        properties=issue_properties,
        property_values=converted_properties,
        existing_prop_values=existing_prop_values,
    )

    # Save the data
    bulk_issue_property_values = property_savers(
        properties=issue_properties,
        property_values=converted_properties,
        issue_id=issue.id,
        workspace_id=workspace_id,
        project_id=project_id,
        existing_prop_values=existing_prop_values,
    )

    # Bulk create the epic property values
    IssuePropertyValue.objects.bulk_create(
        bulk_issue_property_values,
        batch_size=BULK_CREATE_BATCH_SIZE,
        ignore_conflicts=True,
    )

    # Log the activity
    issue_property_activity.delay(
        existing_values={
            str(prop["property_id"]): prop["values"] for prop in existing_prop_values
        },
        requested_values=converted_properties,
        issue_id=issue.id,
        user_id=user_id,
        epoch=int(timezone.now().timestamp()),
    )

    logger.info(f"Created {len(property_values_to_create)} issue property values")


def create_workitems(
    workitem_blueprints,
    project_id,
    workspace_id,
    state_map,
    labels_map,
    workitem_type_map,
    workitem_property_map,
    workitem_property_option_map,
    estimate_point_map,
    user_id,
    origin=None,
):
    """
    Create workitems for the project from the template
    Args:
        workitem_blueprints: The workitem blueprints
        project_id: The ID of the project
        workspace_id: The ID of the workspace
        state_map: The state map
        labels_map: The labels map
        workitem_type_map: The workitem type map
        workitem_property_map: The workitem property map
        workitem_property_option_map: The workitem property option map
        estimate_point_map: The estimate point map
        user_id: The ID of the user

    """
    created_workitems = []
    # Create workitems
    for blueprint in workitem_blueprints:

        # Check if the state is present in the state map
        if blueprint.state and state_map:
            state_id = state_map.get(str(blueprint.state.get("id")))
        else:
            state_id = (
                State.objects.filter(
                    project_id=project_id,
                    workspace_id=workspace_id,
                    default=True,
                )
                .first()
                .id
            )

        logger.info(f"State found: {state_id}")

        # Check if the type is present in the workitem type map
        if blueprint.type:
            type_id = workitem_type_map.get(str(blueprint.type.get("id")))
        else:
            type_id = None
        logger.info(f"Type found: {type_id}")
        # Create the issue
        new_issue = Issue.objects.create(
            project_id=project_id,
            workspace_id=workspace_id,
            type_id=type_id,
            state_id=state_id,
            parent_id=None,
            name=blueprint.name,
            description=blueprint.description,
            description_html=blueprint.description_html,
            description_stripped=blueprint.description_stripped,
            description_binary=blueprint.description_binary,
            priority=blueprint.priority,
            sort_order=random.randint(0, 65535),
            created_by_id=user_id,
        )
        new_issue_id = new_issue.id

        logger.info(f"Issue created: {new_issue_id}")

        # Create the issue sequence
        IssueSequence.objects.create(
            issue_id=new_issue_id,
            project_id=project_id,
            sequence=new_issue.sequence_id,
            created_by_id=user_id,
        )
        logger.info(f"Issue sequence created: {new_issue.sequence_id}")
        # Create the issue activity
        IssueActivity.objects.create(
            issue_id=new_issue_id,
            project_id=project_id,
            workspace_id=workspace_id,
            comment="created the issue",
            verb="created",
            actor_id=user_id,
            epoch=int(timezone.now().timestamp()),
            created_by_id=user_id,
        )
        logger.info(f"Issue activity created: {new_issue_id}")
        requested_data = json.dumps(
            IssueDetailSerializer(new_issue).data, cls=DjangoJSONEncoder
        )
        slug = Workspace.objects.get(id=workspace_id).slug

        # trigger the webhook
        model_activity.delay(
            model_name="issue",
            model_id=str(new_issue_id),
            requested_data=requested_data,
            current_instance=None,
            actor_id=user_id,
            slug=slug,
            origin=origin,
        )
        logger.info(f"triggered the webhook for the workitem: {new_issue_id}")
        # updated issue description version
        issue_description_version_task.delay(
            updated_issue=requested_data,
            issue_id=str(new_issue_id),
            user_id=user_id,
            is_creating=True,
        )
        logger.info(
            f"triggered the workitem description version for the workitem: {new_issue_id}"
        )

        # Create the assignees
        IssueAssignee.objects.bulk_create(
            [
                IssueAssignee(
                    issue_id=new_issue_id,
                    assignee_id=member_id,
                    project_id=project_id,
                    workspace_id=workspace_id,
                    created_by_id=user_id,
                )
                for member_id in ProjectMember.objects.filter(
                    project_id=project_id,
                    workspace_id=workspace_id,
                    member_id__in=[
                        str(assignee.get("id")) for assignee in blueprint.assignees
                    ],
                ).values_list("member_id", flat=True)
            ],
            batch_size=BULK_CREATE_BATCH_SIZE,
            ignore_conflicts=True,
        )
        logger.info(f"Issue assignees created: {new_issue.id}")

        # Create the labels
        IssueLabel.objects.bulk_create(
            [
                IssueLabel(
                    issue_id=new_issue.id,
                    label_id=labels_map.get(str(label.get("id"))),
                    project_id=project_id,
                    workspace_id=workspace_id,
                    created_by_id=user_id,
                )
                for label in blueprint.labels
                if labels_map.get(str(label.get("id")))
            ],
            batch_size=BULK_CREATE_BATCH_SIZE,
            ignore_conflicts=True,
        )

        logger.info(f"Issue labels created: {new_issue_id}")

        if type_id:
            # create the issue property values
            create_issue_property_values(
                issue=new_issue,
                blueprint_properties=blueprint.properties,
                workitem_property_map=workitem_property_map,
                workitem_property_option_map=workitem_property_option_map,
                workspace_id=workspace_id,
                project_id=project_id,
                user_id=user_id,
            )
        logger.info(f"Issue property values created: {new_issue_id}")

        created_workitems.append(new_issue)

    return created_workitems


@shared_task
def create_project_from_template(
    template_id, project_id, user_id, state_map, origin=None
):
    try:
        """
        Create a project from a template and copy the workitems, labels, estimates, etc.
        Args:
            template_id: The ID of the template
            project_id: The ID of the project
            user_id: The ID of the user
            state_map: The state map

        """

        # get the project template and project
        project_template = ProjectTemplate.objects.get(template_id=template_id)
        project = Project.objects.get(id=project_id)
        workspace_id = project.workspace_id

        # initialize the maps
        estimate_point_map = {}
        label_map = {}
        workitem_type_map = {}

        # create estimates
        if project_template.estimates:
            estimate_point_map = create_estimates(
                project_template.estimates, project_id, project, user_id
            )

        # create labels
        if project_template.labels:
            label_map = create_labels(
                project_template.labels, project_id, workspace_id, user_id
            )

        # create workitem types
        if project_template.workitem_types:
            workitem_type_map, workitem_property_map, workitem_property_option_map = (
                create_workitem_types(
                    project_template.workitem_types, project_id, workspace_id, user_id
                )
            )

        # create epics
        if project_template.epics:
            create_epics(project_template.epics, project_id, workspace_id, user_id)

        # get any workitem blueprint is present in the template
        workitem_blueprints = WorkitemTemplate.objects.filter(
            project_template=project_template,
        )

        # Create workitems
        if workitem_blueprints:
            create_workitems(
                workitem_blueprints=workitem_blueprints,
                project_id=project_id,
                workspace_id=workspace_id,
                state_map=state_map,
                labels_map=label_map,
                workitem_type_map=workitem_type_map,
                workitem_property_map=workitem_property_map,
                workitem_property_option_map=workitem_property_option_map,
                estimate_point_map=estimate_point_map,
                user_id=user_id,
                origin=origin,
            )
        logger.info(f"Project created from template: {project.id}")
        return
    except Exception as e:
        log_exception(e)
        return


@shared_task
def create_subworkitems(workitem_template_id, project_id, workitem_id, user_id):
    """
    Create subworkitems for a workitem from the template
    Args:
        workitem_template_id: The ID of the workitem template
        project_id: The ID of the project
        workitem_id: The ID of the workitem
        user_id: The ID of the user

    """
    try:
        # Get the workitem template
        workitem_template = WorkitemTemplate.objects.get(id=workitem_template_id)
    except WorkitemTemplate.DoesNotExist:
        logger.info(f"Workitem template does not exist: {workitem_template_id}")
        return

    # Get the project
    project = Project.objects.get(id=project_id)
    workspace_id = project.workspace_id

    # Get all the subworkitem templates
    sub_workitem_templates = WorkitemTemplate.objects.filter(
        workspace_id=workspace_id,
        parent_workitem_template=workitem_template,
    )

    logger.info(f"Subworkitem templates found: {sub_workitem_templates.count()}")

    try:
        # Create the subworkitem templates
        for sub_workitem_template in sub_workitem_templates:
            logger.info(f"Creating subworkitem: {sub_workitem_template.name}")
            issue = Issue.objects.create(
                project_id=project_id,
                name=sub_workitem_template.name,
                description=sub_workitem_template.description,
                description_html=sub_workitem_template.description_html,
                description_binary=sub_workitem_template.description_binary,
                description_stripped=sub_workitem_template.description_stripped,
                priority=sub_workitem_template.priority,
                parent_id=workitem_id,
                created_by_id=user_id,
                state_id=sub_workitem_template.state.get("id"),
                type_id=sub_workitem_template.type.get("id"),
            )

            logger.info(f"Subworkitem created: {issue.id}")

            # Create the issue sequence
            IssueSequence.objects.create(
                issue_id=issue.id,
                project_id=project_id,
                sequence=issue.sequence_id,
                created_by_id=user_id,
            )
            logger.info(f"Issue sequence created: {issue.sequence_id}")
            # Create the issue activity
            IssueActivity.objects.create(
                issue_id=issue.id,
                project_id=project_id,
                workspace_id=workspace_id,
                comment="created the issue",
                verb="created",
                actor_id=user_id,
                epoch=int(timezone.now().timestamp()),
                created_by_id=user_id,
            )
            logger.info(f"Issue activity created: {issue.id}")
            # Create issue assignees
            assignees = sub_workitem_template.assignees
            IssueAssignee.objects.bulk_create(
                [
                    IssueAssignee(
                        issue_id=issue.id,
                        assignee_id=assignee.get("id"),
                        project_id=project_id,
                        created_by_id=user_id,
                        workspace_id=workspace_id,
                    )
                    for assignee in assignees
                ]
            )
            logger.info(f"Issue assignees created: {issue.id}")
            # Create issue labels
            labels = sub_workitem_template.labels
            IssueLabel.objects.bulk_create(
                [
                    IssueLabel(
                        issue_id=issue.id,
                        label_id=label.get("id"),
                        project_id=project_id,
                        created_by_id=user_id,
                        workspace_id=workspace_id,
                    )
                    for label in labels
                ]
            )
            logger.info(f"Issue labels created: {issue.id}")
            # Process properties
            property_values_to_create = []
            for property in sub_workitem_template.properties:
                try:
                    property_obj = IssueProperty.objects.get(id=property.get("id"))
                except IssueProperty.DoesNotExist:
                    logger.info(f"Property does not exist: {property.get('id')}")
                    continue

                property_values = property.get("values", [])
                if not property_values:
                    logger.info(f"No values for property: {property.get('id')}")
                    continue

                # Process each value for this property
                for value in property_values:
                    property_value_data = _get_property_value_data(property_obj, value)

                    if property_value_data:
                        property_value_data.update(
                            {
                                "issue": issue,
                                "property": property_obj,
                                "workspace_id": workspace_id,
                                "project_id": project_id,
                                "created_by_id": user_id,
                            }
                        )
                        property_values_to_create.append(
                            IssuePropertyValue(**property_value_data)
                        )

            if property_values_to_create:
                IssuePropertyValue.objects.bulk_create(
                    property_values_to_create,
                    batch_size=BULK_CREATE_BATCH_SIZE,
                    ignore_conflicts=True,
                )
            logger.info(f"Issue property values created: {issue.id}")
    except Exception as e:
        log_exception(e)
        return
