# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""~/states/: this deployment keeps states per project, so the catalogue refuses every call.

The MCP state tool (decorated with toolkit.governance.scoped("states")) turns a
400 whose code is "workspace_not_managed" into "this workspace keeps states per
project. Pass project_id." when no project_id was given.
"""

from uuid import uuid4

import pytest

REFUSAL = {"code": "workspace_not_managed", "error": "This workspace keeps states per project. Pass project_id."}


@pytest.mark.contract
class TestWorkspaceStates:
    @pytest.mark.parametrize(
        "method, suffix, body",
        [
            ("get", "states/", None),
            ("post", "states/", {"name": "Doing", "color": "#EF4444", "group": "started"}),
            ("get", "states/<id>/", None),
            ("patch", "states/<id>/", {"name": "Renamed"}),
            ("delete", "states/<id>/", None),
        ],
    )
    def test_every_call_says_pass_project_id(self, client, ws_url, method, suffix, body):
        url = ws_url(suffix.replace("<id>", str(uuid4())))
        res = getattr(client, method)(url, body, format="json") if body else getattr(client, method)(url)
        assert res.status_code == 400 and res.data == REFUSAL

    def test_matches_the_workspace_feature_flag(self, client, ws_url):
        assert client.get(ws_url("features/")).data["states_owned_by_workspace"] is False

    def test_project_states_still_work(self, client, project_url):
        assert client.get(project_url("states/")).status_code == 200

    def test_guest_gets_the_same_answer_and_outsider_is_refused(self, guest_client, outsider_client, ws_url):
        assert guest_client.get(ws_url("states/")).data == REFUSAL
        assert outsider_client.get(ws_url("states/")).status_code == 403
