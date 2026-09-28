# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""RD-487 / §6 / §17.3 / §23.5 — ``WorkflowError`` must map cleanly to
a DRF ``Response`` with the right status code + structured payload.

These tests cover the contract from the handler side so the FE can
rely on ``response.json()["code"]`` being the §10 error code, not a
serialized dataclass repr.
"""

# Third Party imports
import pytest
from rest_framework.exceptions import NotAuthenticated
from rest_framework.test import APIRequestFactory

# Module imports
from plane.authentication.adapter.exception import auth_exception_handler
from plane.services.workflow.errors import (
    WorkflowActorNotAuthorized,
    WorkflowDefaultImmutable,
    WorkflowNoCreationState,
    WorkflowNotFound,
    WorkflowTransitionNotAllowed,
)


@pytest.mark.unit
class TestWorkflowErrorHandler:
    """§10 + §23.5 — handler must serialize ``WorkflowError`` correctly."""

    def setup_method(self):
        self.factory = APIRequestFactory()
        self.context = {"view": None, "request": self.factory.get("/")}

    def _run(self, exc):
        response = auth_exception_handler(exc, self.context)
        assert response is not None, "handler must return a Response, not None"
        return response

    def test_workflow_actor_not_authorized_maps_to_403(self):
        response = self._run(WorkflowActorNotAuthorized("not for you"))
        assert response.status_code == 403
        assert response.data["code"] == "WORKFLOW_ACTOR_NOT_AUTHORIZED"
        assert "detail" in response.data

    def test_workflow_no_creation_state_maps_to_422(self):
        response = self._run(WorkflowNoCreationState("no state allows new work items"))
        assert response.status_code == 422
        assert response.data["code"] == "WORKFLOW_NO_CREATION_STATE"

    def test_workflow_transition_not_allowed_includes_target_and_allowed_targets(self):
        response = self._run(
            WorkflowTransitionNotAllowed(
                source_state_id="src-1",
                target_state_id="tgt-1",
                allowed_target_ids=["tgt-2", "tgt-3"],
            )
        )
        assert response.status_code == 422
        assert response.data["code"] == "WORKFLOW_TRANSITION_NOT_ALLOWED"
        assert response.data["source_state_id"] == "src-1"
        assert response.data["target_state_id"] == "tgt-1"
        assert response.data["allowed_target_ids"] == ["tgt-2", "tgt-3"]

    def test_workflow_not_found_maps_to_404(self):
        response = self._run(WorkflowNotFound())
        assert response.status_code == 404
        assert response.data["code"] == "WORKFLOW_NOT_FOUND"

    def test_workflow_default_immutable_maps_to_409(self):
        response = self._run(WorkflowDefaultImmutable())
        assert response.status_code == 409
        assert response.data["code"] == "WORKFLOW_DEFAULT_IMMUTABLE"

    def test_handler_keeps_existing_auth_behavior(self):
        """§6 / §10 — the handler must not regress the existing
        ``NotAuthenticated`` → 401 mapping while adding workflow
        error handling.
        """
        response = auth_exception_handler(NotAuthenticated(), self.context)
        assert response is not None
        assert response.status_code == 401
