"""Template summaries must survive SDK serialization in every supported scope."""

import pytest


@pytest.mark.parametrize(
    ("kind", "project_id", "namespace", "summary_field"),
    [
        ("project", "", "workspace_templates.projects", "description"),
        ("workitem", "", "workspace_templates.work_items", "description_html"),
        ("page", "", "workspace_templates.pages", "description_html"),
        ("workitem", "project-1", "project_templates.work_item_templates", "short_description"),
        ("page", "project-1", "project_templates.page_templates", "short_description"),
    ],
    ids=["workspace-project", "workspace-workitem", "workspace-page", "project-workitem", "project-page"],
)
@pytest.mark.parametrize("action", ["create", "update"])
@pytest.mark.parametrize("with_description", [True, False], ids=["description", "omitted"])
def test_template_summary_reaches_sdk(
    registered, spy, kind, project_id, namespace, summary_field, action, with_description
):
    arguments = {"action": action, "kind": kind, "project_id": project_id}
    expected = {}
    if action == "create":
        arguments.update(name="Starter", template_data='{"name": "Templated body"}')
        expected.update(name="Starter", template_data={"name": "Templated body"})
    else:
        arguments["template_id"] = "template-1"
        if not with_description:
            arguments["name"] = "Renamed"
            expected["name"] = "Renamed"

    if with_description:
        arguments["description"] = "Saved summary"
        expected[summary_field] = "Saved summary"

    registered["template"].fn(**arguments)

    call = spy.recorder.only()
    assert call.method == f"{namespace}.{action}"
    assert call.kwargs["workspace_slug"] == "acme"
    if project_id:
        assert call.kwargs["project_id"] == project_id
    else:
        assert "project_id" not in call.kwargs
    if action == "update":
        assert call.kwargs["template_id"] == "template-1"
    assert call.kwargs["data"].model_dump(exclude_none=True) == expected
