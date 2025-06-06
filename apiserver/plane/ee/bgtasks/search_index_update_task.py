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
    Run the opensearch management command with the given arguments.
    :param args: Positional arguments for the management command.
    :param kwargs: Keyword arguments for the management command.

    Available subcommands:
    - list: Show all available indices and their state
    - index: Manage index creation/deletion/rebuild
    - document: Manage document indexing/updating/deletion

    Index subcommand options:
    - create: Create the indices in OpenSearch
    - delete: Delete the indices in OpenSearch
    - rebuild: Delete the indices and then recreate them
    - update: Update index mappings

    Document subcommand options:
    - index: Index documents into OpenSearch
    - delete: Delete documents from OpenSearch
    - update: Update documents in OpenSearch

    Additional options:
    --force: Do not ask for confirmation
    --parallel: Run operations in parallel
    --refresh: Refresh indices after operations

    Example usage:
    # Create all indices
    run_search_index_command.delay('index', 'create', '--force')

    # Rebuild specific indices
    run_search_index_command.delay('index', 'rebuild', '--indices', 'index_name', '--force')

    # Index all documents
    run_search_index_command.delay('document', 'index', '--force')

    # Index documents for specific indices with parallel processing
    run_search_index_command.delay('document', 'index', '--indices', 'index_name', '--parallel', '--force')
    """
    from django.core.management import call_command

    print("Running opensearch command with args:", args)

    # Remove '--background' if present (shouldn't be needed but just in case)
    args = [arg for arg in args if arg != "--background"]

    call_command("opensearch", *args, **kwargs)
    print("OpenSearch command completed")
