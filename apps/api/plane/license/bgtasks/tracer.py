# Instance tracer disabled for government deployment
# Original implementation sent detailed instance/workspace data to telemetry.plane.so

from celery import shared_task


@shared_task
def instance_traces():
    """No-op: Instance telemetry disabled for government deployment

    Original implementation sent:
    - instance_id, instance_name, domain, version
    - user_count, workspace_count, project_count
    - issue_count, module_count, cycle_count, page_count
    - Per-workspace breakdowns including workspace slugs
    """
    pass
