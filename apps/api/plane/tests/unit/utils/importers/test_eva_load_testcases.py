# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from plane.db.models import Issue, Label, Project, State
from plane.utils.importers.eva.constants import EVA_EXTERNAL_SOURCE
from plane.utils.importers.eva.load import EvaLoader
from plane.utils.importers.eva.media import looks_like_broken_eva_image_html


@pytest.fixture
def eva_projects(create_user, workspace):
    tasks_project = Project.objects.create(
        name="Tasks Project",
        identifier="TASK",
        workspace=workspace,
        created_by=create_user,
    )
    testcase_project = Project.objects.create(
        name="Test Cases Project",
        identifier="TC",
        workspace=workspace,
        created_by=create_user,
    )
    for project in (tasks_project, testcase_project):
        State.objects.create(
            name="Todo",
            color="#000000",
            project=project,
            workspace=workspace,
            group="unstarted",
            default=True,
            created_by=create_user,
        )
    return tasks_project, testcase_project


def _build_loader(*, importer, workspace, tasks_project, testcase_project, actor):
    return EvaLoader(
        importer=importer,
        workspace=workspace,
        project=tasks_project,
        testcase_project=testcase_project,
        actor=actor,
        config={},
        data={"users": []},
    )


@pytest.mark.unit
@pytest.mark.django_db
def test_eva_loader_imports_testcases_into_separate_project(create_user, workspace, eva_projects):
    tasks_project, testcase_project = eva_projects
    importer = MagicMock()
    importer.pk = uuid4()
    importer.metadata = {"url": "", "token": ""}
    importer.imported_data = None

    loader = _build_loader(
        importer=importer,
        workspace=workspace,
        tasks_project=tasks_project,
        testcase_project=testcase_project,
        actor=create_user,
    )
    extracted = {
        "tasks": [{"id": "task-1", "name": "Task 1", "code": "T1"}],
        "testcases": [
            {
                "id": "tc-1",
                "name": "Test case 1",
                "code": "TC1",
                "parent_task": {"id": "task-1"},
            }
        ],
        "comments": [],
        "testcase_comments": [],
        "attachments": [],
        "documents": [],
    }

    with (
        patch.object(loader, "_import_description_media", side_effect=lambda html, **kwargs: html),
        patch("plane.utils.importers.eva.load.Importer.objects.filter") as importer_filter,
    ):
        importer_filter.return_value.update = MagicMock()
        loader.run(extracted)

    task_issue = Issue.objects.get(external_id="task-1", project=tasks_project)
    testcase_issue = Issue.objects.get(external_id="tc-1", project=testcase_project)

    assert task_issue.project_id == tasks_project.id
    assert testcase_issue.project_id == testcase_project.id
    assert testcase_issue.parent_id is None
    assert Label.objects.filter(project=testcase_project, name="eva-test-case").exists()
    assert not Label.objects.filter(project=tasks_project, name="eva-test-case").exists()


@pytest.mark.unit
@pytest.mark.django_db
def test_eva_loader_maps_testcase_external_ids_to_testcase_project(create_user, workspace, eva_projects):
    tasks_project, testcase_project = eva_projects
    importer = MagicMock()
    importer.pk = uuid4()
    importer.metadata = {"url": "", "token": ""}
    importer.imported_data = None

    loader = _build_loader(
        importer=importer,
        workspace=workspace,
        tasks_project=tasks_project,
        testcase_project=testcase_project,
        actor=create_user,
    )
    extracted = {
        "tasks": [],
        "testcases": [{"id": "tc-2", "name": "Test case 2", "code": "TC2"}],
        "comments": [],
        "testcase_comments": [],
        "attachments": [],
        "documents": [],
    }

    with (
        patch.object(loader, "_import_description_media", side_effect=lambda html, **kwargs: html),
        patch("plane.utils.importers.eva.load.Importer.objects.filter") as importer_filter,
    ):
        importer_filter.return_value.update = MagicMock()
        loader.run(extracted)

    assert loader.id_project_map["tc-2"] == str(testcase_project.id)
    assert loader._project_for_external_id("tc-2").id == testcase_project.id


@pytest.mark.unit
@pytest.mark.django_db
def test_eva_loader_skips_testcases_when_scope_disabled(create_user, workspace, eva_projects):
    tasks_project, testcase_project = eva_projects
    importer = MagicMock()
    importer.pk = uuid4()
    importer.metadata = {"url": "", "token": ""}
    importer.imported_data = None

    loader = EvaLoader(
        importer=importer,
        workspace=workspace,
        project=tasks_project,
        testcase_project=testcase_project,
        actor=create_user,
        config={"import_tasks": True, "import_testcases": False},
        data={"users": []},
    )
    extracted = {
        "tasks": [{"id": "task-1", "name": "Task 1", "code": "T1"}],
        "testcases": [{"id": "tc-1", "name": "Test case 1", "code": "TC1"}],
        "comments": [],
        "testcase_comments": [],
        "attachments": [],
        "documents": [],
    }

    with (
        patch.object(loader, "_import_description_media", side_effect=lambda html, **kwargs: html),
        patch("plane.utils.importers.eva.load.Importer.objects.filter") as importer_filter,
    ):
        importer_filter.return_value.update = MagicMock()
        loader.run(extracted)

    assert Issue.objects.filter(external_id="task-1", project=tasks_project).exists()
    assert Issue.objects.filter(external_id="tc-1").count() == 0


@pytest.mark.unit
@pytest.mark.django_db
def test_eva_loader_repairs_testcase_images_in_testcase_project(create_user, workspace, eva_projects):
    tasks_project, testcase_project = eva_projects
    importer = MagicMock()
    importer.pk = uuid4()
    importer.metadata = {"url": "https://eva.devstream.by", "token": "token"}
    importer.imported_data = None

    loader = _build_loader(
        importer=importer,
        workspace=workspace,
        tasks_project=tasks_project,
        testcase_project=testcase_project,
        actor=create_user,
    )
    loader.eva_client.base_url = "https://eva.devstream.by"
    loader.eva_client.token = "token"

    broken_html = (
        '<p><em>EVA test case: NDOC-TC-279</em></p>'
        '<image-component src="https://eva.devstream.by/files/obj/CmfTestcase/x/IMG_0598.HEIC" '
        'status="uploaded"></image-component>'
    )
    repaired_html = (
        '<p><em>EVA test case: NDOC-TC-279</em></p>'
        '<p data-eva-attachment="CmfAttachment:1373dcca-6889-11f1-85f9-3e7b608e5c91">'
        '<a href="http://localhost:8000/api/assets/v2/workspaces/ws/projects/p/issues/issue/attachments/asset-heic/">'
        "Attachment: IMG_0598.HEIC</a></p>"
    )
    testcase = {
        "id": "CmfTestcase:e6d02ad8-6888-11f1-a97d-3e7b608e5c91",
        "name": "Есть возможность загрузить фото в формате HEIC",
        "code": "NDOC-TC-279",
        "text": (
            '<div class="app-tinymce-card-preview" data-attach-id="CmfAttachment:1373dcca-6889-11f1-85f9-3e7b608e5c91">'
            '<a class="app-tinymce-href-preview" title="IMG_0598.HEIC" '
            'download="/files/obj/CmfTestcase/CmfTestcase%3Ae6d/CmfTestcase%3Ae6d02ad8-6888-11f1-a97d-3e7b608e5c91/IMG_0598.HEIC">'
            '<img class="app-tinymce-img-preview" '
            'src="files/obj/CmfTestcase/CmfTestcase%3Ae6d/CmfTestcase%3Ae6d02ad8-6888-11f1-a97d-3e7b608e5c91/IMG_0598.HEIC.meta/thumbnail.jpg">'
            "</a></div>"
        ),
        "steps": [],
    }

    existing_issue = Issue.objects.create(
        project=testcase_project,
        workspace=workspace,
        name="Есть возможность загрузить фото в формате HEIC",
        description_html=broken_html,
        external_source=EVA_EXTERNAL_SOURCE,
        external_id="CmfTestcase:e6d02ad8-6888-11f1-a97d-3e7b608e5c91",
        created_by=create_user,
    )
    assert looks_like_broken_eva_image_html(broken_html, "https://eva.devstream.by")

    with (
        patch.object(loader, "_import_description_media", return_value=repaired_html) as import_media,
        patch("plane.utils.importers.eva.load.Importer.objects.filter") as importer_filter,
    ):
        importer_filter.return_value.update = MagicMock()
        loader._import_testcases([testcase], {})

    import_media.assert_called_once()
    assert import_media.call_args.kwargs["project"].id == testcase_project.id
    existing_issue.refresh_from_db()
    assert existing_issue.description_html == repaired_html
