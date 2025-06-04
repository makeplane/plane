import json

from celery import shared_task
from importlib import import_module

from plane.db.models import Project, Workspace
from plane.ee.documents import TeamspaceDocument
from plane.ee.models import Teamspace


def get_index_class_from_path(index_path):
    path, klass = index_path.rsplit(".", maxsplit=1)
    module = import_module(path)
    index_class = getattr(module, klass)
    return index_class


@shared_task
def handle_project_member_update(objs, indices_to_update):
    objs = json.loads(objs)
    project_ids = list(set([obj["project"] for obj in objs]))
    for index_path in indices_to_update:
        index = get_index_class_from_path(index_path)
        index_model = index.django.model
        if index_model == Project:
            qs = index_model.objects.filter(id__in=project_ids)
        else:
            qs = index_model.objects.filter(project_id__in=project_ids)
        qs = index().apply_related_to_queryset(qs)
        index().update(qs)


@shared_task
def handle_project_udpate(objs, indices_to_update):
    objs = json.loads(objs)
    project_ids = [obj["id"] for obj in objs]
    for index_path in indices_to_update:
        index = get_index_class_from_path(index_path)
        index_model = index.django.model
        qs = index_model.objects.filter(project_id__in=project_ids)
        qs = index().apply_related_to_queryset(qs)
        index().update(qs)


@shared_task
def handle_workspace_member_update(objs, indices_to_update):
    objs = json.loads(objs)
    workspace_ids = list(set([obj["workspace"] for obj in objs]))
    for index_path in indices_to_update:
        index = get_index_class_from_path(index_path)
        index_model = index.django.model
        if index_model == Workspace:
            qs = index_model.objects.filter(id__in=workspace_ids)
        else:
            qs = index_model.objects.filter(workspace_id__in=workspace_ids)
        qs = index().apply_related_to_queryset(qs)
        index().update(qs)


@shared_task
def handle_teamspace_member_update(objs, indices_to_update):
    objs = json.loads(objs)
    # Teamspace index is the only index with TeamspaceMember as related model.
    teamspace_ids = [obj["team_space"] for obj in objs]
    qs = Teamspace.objects.filter(id__in=teamspace_ids)
    qs = TeamspaceDocument().apply_related_to_queryset(qs)
    TeamspaceDocument().update(qs)


@shared_task
def run_search_index_command(*args, **kwargs):
    """
    Run the search_index management command with the given arguments.
    :param args: Positional arguments for the management command.
    :param kwargs: Keyword arguments for the management command.

    Available options:
    --models: Specify the model or app to be updated in Elasticsearch.
    --create: Create the indices in Elasticsearch.
    --populate: Populate Elasticsearch indices with models data.
    --delete: Delete the indices in Elasticsearch.
    --rebuild: Delete the indices and then recreate and populate them.
    --parallel: Run populate/rebuild update multi-threaded.
    --no-parallel: Run populate/rebuild update single-threaded.
    --use-alias: Use alias with indices.
    --use-alias-keep-index: Do not delete replaced indices when used with '--rebuild' and '--use-alias' args.
    --refresh: Refresh indices after populate/rebuild.
    --no-count: Do not include a total count in the summary log line.

    Example usage:
    # Create indices for a specific model
    run_search_index_command.delay('--create', '--models', 'app_name.ModelName')

    # Populate indices for all models in an app
    run_search_index_command.delay('--populate', '--models', 'app_name')

    # Delete indices for a specific model
    run_search_index_command.delay('--delete', '--models', 'app_name.ModelName')

    # Rebuild indices for all models in an app with alias
    run_search_index_command.delay('--rebuild', '--models', 'app_name', '--use-alias')

    # Create indices with force option
    run_search_index_command.delay('--create', '--models', 'app_name.ModelName', '-f')

    # Populate indices in parallel
    run_search_index_command.delay('--populate', '--models', 'app_name', '--parallel')

    # Create indices for multiple models
    run_search_index_command.delay('--create', '--models', 'app_name.ModelOne', 'app_name.ModelTwo')
    """
    from django.core.management import call_command

    print("Running search_index command with args:", args)
    # Remove '--background' if present
    args = [arg for arg in args if arg != "--background"]
    if "-f" in args:
        call_command("manage_search_index", *args, **kwargs)
    else:
        call_command("manage_search_index", "-f", *args, **kwargs)
    print("Search index command completed")
