# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""TimelinePropagationView — DRF endpoint for Dependency Schedule Propagation.

Implements the ``{code, message}`` stable failure envelope for the 7
``PropagationErrorCode`` values (CONTEXT D-03). Deliberately does NOT use
``@allow_permission([ROLE.ADMIN, ROLE.MEMBER])`` — see CONTEXT D-02. Activity
and webhook side effects are registered via ``transaction.on_commit(...)`` so
they fire only on successful commit (Django 4.2 docs:
https://docs.djangoproject.com/en/4.2/topics/db/transactions/#performing-actions-after-commit).
This is the first usage of ``transaction.on_commit`` in apps/api/plane —
Phase 3 sets the pattern; the existing ``IssueBulkUpdateDateEndpoint``'s
pre-commit ``.delay(...)`` is a known latent audit-leak bug NOT replicated
here (RESEARCH Pitfall 7; API-11 keeps the existing endpoint untouched).

Plan 03-01 ships routing scaffold only. The ``post(...)`` body returns 501
unconditionally for authenticated callers; algorithm wiring lands in
Plan 03-02 (parse → permission → load_precedence_graph → propagate_move →
bulk_update → success envelope). Plan 03-03 adds the
``transaction.on_commit`` registrations referenced in this docstring.
"""

from rest_framework import status
from rest_framework.response import Response

from ..base import BaseAPIView


class TimelinePropagationView(BaseAPIView):
    """Plumbing for plane.app.services.timeline_propagation.

    Plan 03-01: scaffold only. Inherits ``BaseSessionAuthentication`` and
    ``IsAuthenticated`` from ``BaseAPIView``, so unauthenticated callers
    receive DRF's default 401 (NOT the {code, message} envelope — that
    envelope is reserved for the 7 PropagationErrorCode values per
    CONTEXT D-13).
    """

    def post(self, request, slug, project_id):
        # Plan 03-02 implements the body. Returning a placeholder
        # NOT_IMPLEMENTED would conflict with our envelope (NOT_IMPLEMENTED
        # is not one of the 7 PropagationErrorCode values), so we return
        # DRF default 501 here. The IsAuthenticated permission class on
        # BaseAPIView returns 401 first for unauthenticated callers, which
        # is what test_unauthenticated_request_returns_401 asserts. Plan
        # 03-02 replaces this body wholesale.
        return Response(
            {"detail": "Not implemented in Plan 03-01."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
