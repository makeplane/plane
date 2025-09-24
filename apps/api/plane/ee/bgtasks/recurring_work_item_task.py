# Python imports
import logging
from django.utils import timezone

# Third party imports
from celery import shared_task
from django.utils import timezone as django_timezone

# Module imports
from plane.db.models import (
    State,
    Label,
    IssueType,
    EstimatePoint,
)

from plane.ee.models import (
    RecurringWorkitemTask,
    RecurringWorkitemTaskLog,
    RecurringWorkItemTaskActivity,
    WorkitemTemplate,
    IssueProperty,
    IssuePropertyOption,
)
from plane.utils.exception_logger import log_exception
from plane.ee.bgtasks.template_task import create_workitems
from plane.ee.utils.workflow import WorkflowStateManager

logger = logging.getLogger("plane.worker")


@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def create_work_item_from_template(self, recurring_workitem_task_id: str):
    """
    Create a work item from a recurring task template.

    Args:
        recurring_workitem_task_id (str): The ID of the RecurringWorkitemTask to execute

    Returns:
        dict: Result of the task execution
    """
    task_log = None
    task_id = self.request.id

    try:
        # Get the recurring task
        recurring_task = RecurringWorkitemTask.objects.select_related(
            "workitem_blueprint", "project", "workspace"
        ).get(id=recurring_workitem_task_id)

        slug = recurring_task.workspace.slug

        # get the user id from the recurring task
        user_id = recurring_task.created_by.id
        project_id = recurring_task.project.id
        workspace_id = recurring_task.workspace.id

        # Check if task is enabled
        if not recurring_task.enabled:
            logger.info(
                f"Recurring task {recurring_workitem_task_id} is disabled, skipping execution"
            )
            return {"status": "skipped", "message": "Task is disabled"}

        # Check if task has expired
        if recurring_task.end_at and timezone.now() > recurring_task.end_at:
            logger.info(
                f"Recurring task {recurring_workitem_task_id} has expired, skipping execution"
            )
            return {"status": "skipped", "message": "Task has expired"}

        # Create log entry
        task_log = RecurringWorkitemTaskLog.objects.create(
            recurring_task=recurring_task,
            task_id=task_id,
            status=RecurringWorkitemTaskLog.TaskStatus.STARTED,
            project_id=project_id,
            workspace_id=workspace_id,
            created_by_id=user_id,
            updated_by_id=user_id,
        )

        # get any workitem blueprint is present in the template
        workitem_blueprints = WorkitemTemplate.objects.filter(
            id=recurring_task.workitem_blueprint.id,
            project_id=project_id,
            workspace_id=workspace_id,
        )

        # check the first workitem blueprint
        workitem_blueprint_first = workitem_blueprints.first()

        # check for the workflows for the issue creation
        # if the state is changed later
        if workitem_blueprint_first.state.get("id"):
            workflow_state_manager = WorkflowStateManager(
                project_id=project_id, slug=slug
            )
            if workflow_state_manager.validate_issue_creation(
                state_id=workitem_blueprint_first.state.get("id"), user_id=user_id
            ):
                return

        # get all the states in the project and create a mapping dict
        state_map = {
            str(state.id): str(state.id)
            for state in State.objects.filter(
                project_id=project_id, workspace_id=workspace_id
            )
        }

        # get the labels in the project and create a mapping dict
        label_map = {
            str(label.id): str(label.id)
            for label in Label.objects.filter(
                project_id=project_id, workspace_id=workspace_id
            )
        }

        # get all the workitem types in the project and create a mapping dict
        workitem_type_map = {
            str(issue_type.id): str(issue_type.id)
            for issue_type in IssueType.objects.filter(
                project_issue_types__project_id=project_id,
                workspace_id=workspace_id,
                is_epic=False,
            )
        }

        # get all the workitem properties in the project and create a mapping dict
        workitem_property_map = {
            str(prop.id): str(prop.id)
            for prop in IssueProperty.objects.filter(
                project_id=project_id, workspace_id=workspace_id
            )
        }

        # get all the workitem property options in the project and create a mapping dict
        workitem_property_option_map = {
            str(option.id): str(option.id)
            for option in IssuePropertyOption.objects.filter(
                project_id=project_id, workspace_id=workspace_id
            )
        }

        # get all the estimates in the project and create a mapping dict
        estimate_point_map = {
            str(estimate.id): str(estimate.id)
            for estimate in EstimatePoint.objects.filter(
                project_id=project_id, workspace_id=workspace_id
            )
        }

        work_item = create_workitems(
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
        )

        # get the first workitem
        work_item = work_item[0]

        # Update log with success
        task_log.status = RecurringWorkitemTaskLog.TaskStatus.SUCCESS
        task_log.workitem = work_item
        task_log.finished_at = django_timezone.now()
        task_log.save()

        # Create activity record for success
        RecurringWorkItemTaskActivity.objects.create(
            recurring_workitem_task=recurring_task,
            recurring_workitem_task_log=task_log,
            verb="completed",
            field="task_execution",
            old_value=None,
            new_value="SUCCESS",
            actor_id=user_id,
            project_id=project_id,
            workspace_id=workspace_id,
            epoch=int(timezone.now().timestamp()),
            created_by_id=user_id,
            updated_by_id=user_id,
        )

        logger.info(
            f"Successfully created work item {work_item.id} from recurring task {recurring_workitem_task_id}"
        )

        return {
            "status": "success",
            "work_item_id": str(work_item.id),
            "work_item_name": work_item.name,
            "task_log_id": str(task_log.id),
        }

    except RecurringWorkitemTask.DoesNotExist:
        error_msg = (
            f"RecurringWorkitemTask with ID {recurring_workitem_task_id} not found"
        )
        logger.error(error_msg)
        return {"status": "error", "message": error_msg}

    except Exception as e:
        error_msg = f"Error creating work item from template: {str(e)}"
        logger.error(error_msg)
        log_exception(e)

        # Update log with failure
        if task_log:
            task_log.status = RecurringWorkitemTaskLog.TaskStatus.FAILURE
            task_log.error_message = error_msg[:1000]  # Truncate to fit in field
            task_log.finished_at = django_timezone.now()
            task_log.save()

            # Create activity record for failure
            RecurringWorkItemTaskActivity.objects.create(
                recurring_workitem_task=recurring_task,
                recurring_workitem_task_log=task_log,
                verb="failed",
                field="task_execution",
                old_value=None,
                new_value="FAILURE",
                actor_id=user_id,
                project_id=project_id,
                workspace_id=workspace_id,
                epoch=int(timezone.now().timestamp()),
                created_by_id=user_id,
                updated_by_id=user_id,
            )

        # Retry the task if retries are available
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying task {task_id} (attempt {self.request.retries + 1})")
            raise self.retry(exc=e)

        return {"status": "error", "message": error_msg}
