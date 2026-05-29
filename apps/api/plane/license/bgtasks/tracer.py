# Third party imports
from celery import shared_task
from opentelemetry import trace

# Module imports
from plane.license.models import Instance
from plane.db.models import (
    User,
    Workspace,
    Project,
    Issue,
    Module,
    Cycle,
    CycleIssue,
    ModuleIssue,
    Page,
    WorkspaceMember,
)
from plane.utils.telemetry import init_tracer, shutdown_tracer


@shared_task
def instance_traces():
    try:
        init_tracer()
        # Check if the instance is registered
        instance = Instance.objects.first()

        # If instance is None then return
        if instance is None:
            return

        if instance.is_telemetry_enabled:
            # Get the tracer
            tracer = trace.get_tracer(__name__)
            # Instance details
            with tracer.start_as_current_span("instance_details") as span:
                # Count of all models
                workspace_count = Workspace.objects.count()
                user_count = User.objects.count()
                project_count = Project.objects.count()
                issue_count = Issue.objects.count()
                module_count = Module.objects.count()
                cycle_count = Cycle.objects.count()
                cycle_issue_count = CycleIssue.objects.count()
                module_issue_count = ModuleIssue.objects.count()
                page_count = Page.objects.count()

                # Set span attributes
                span.set_attribute("instance_id", instance.instance_id)
                span.set_attribute("instance_name", instance.instance_name)
                span.set_attribute("current_version", instance.current_version)
                span.set_attribute("latest_version", instance.latest_version)
                span.set_attribute("is_telemetry_enabled", instance.is_telemetry_enabled)
                span.set_attribute("is_support_required", instance.is_support_required)
                span.set_attribute("is_setup_done", instance.is_setup_done)
                span.set_attribute("is_signup_screen_visited", instance.is_signup_screen_visited)
                span.set_attribute("is_verified", instance.is_verified)
                span.set_attribute("edition", instance.edition)
                span.set_attribute("domain", instance.domain)
                span.set_attribute("is_test", instance.is_test)
                span.set_attribute("user_count", user_count)
                span.set_attribute("workspace_count", workspace_count)
                span.set_attribute("project_count", project_count)
                span.set_attribute("issue_count", issue_count)
                span.set_attribute("module_count", module_count)
                span.set_attribute("cycle_count", cycle_count)
                span.set_attribute("cycle_issue_count", cycle_issue_count)
                span.set_attribute("module_issue_count", module_issue_count)
                span.set_attribute("page_count", page_count)

            # Workspace details
            for workspace in Workspace.objects.all():
                # Count of all models
                project_count = Project.objects.filter(workspace=workspace).count()
                issue_count = Issue.objects.filter(workspace=workspace).count()
                module_count = Module.objects.filter(workspace=workspace).count()
                cycle_count = Cycle.objects.filter(workspace=workspace).count()
                cycle_issue_count = CycleIssue.objects.filter(workspace=workspace).count()
                module_issue_count = ModuleIssue.objects.filter(workspace=workspace).count()
                page_count = Page.objects.filter(workspace=workspace).count()
                member_count = WorkspaceMember.objects.filter(workspace=workspace).count()

                # Set span attributes
                with tracer.start_as_current_span("workspace_details") as span:
                    span.set_attribute("instance_id", instance.instance_id)
                    span.set_attribute("workspace_id", str(workspace.id))
                    span.set_attribute("workspace_slug", workspace.slug)
                    span.set_attribute("project_count", project_count)
                    span.set_attribute("issue_count", issue_count)
                    span.set_attribute("module_count", module_count)
                    span.set_attribute("cycle_count", cycle_count)
                    span.set_attribute("cycle_issue_count", cycle_issue_count)
                    span.set_attribute("module_issue_count", module_issue_count)
                    span.set_attribute("page_count", page_count)
                    span.set_attribute("member_count", member_count)

        return
    finally:
        # Shutdown the tracer
        shutdown_tracer()
