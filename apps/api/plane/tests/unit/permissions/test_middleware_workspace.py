# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""
Tests for WorkspaceResolverMiddleware.
"""

import pytest
from uuid import uuid4
from unittest.mock import MagicMock, patch

from django.core.cache import cache

from plane.db.models import Workspace
from plane.middleware.workspace import WorkspaceResolverMiddleware


@pytest.mark.django_db
class TestWorkspaceResolverMiddleware:
    """Test the workspace slug -> id resolution middleware."""

    def _make_middleware(self):
        get_response = MagicMock(return_value=MagicMock(status_code=200))
        return WorkspaceResolverMiddleware(get_response)

    def test_resolves_slug_to_workspace_id(self, perm_workspace):
        """Middleware sets request.workspace_id from slug."""
        middleware = self._make_middleware()
        request = MagicMock()

        # __call__ initializes workspace/workspace_id to None
        middleware(request)
        assert request.workspace is None
        assert request.workspace_id is None

        # process_view resolves from kwargs
        middleware.process_view(
            request, None, [], {"slug": perm_workspace.slug}
        )
        assert request.workspace_id == str(perm_workspace.id)
        assert request.workspace.id == perm_workspace.id

    def test_no_slug_sets_none(self):
        """Request without slug keeps workspace_id=None."""
        middleware = self._make_middleware()
        request = MagicMock()

        middleware(request)
        result = middleware.process_view(request, None, [], {})
        assert result is None
        # workspace_id was set to None in __call__
        assert request.workspace_id is None

    def test_invalid_slug_sets_none(self):
        """Non-existent slug leaves workspace_id=None."""
        middleware = self._make_middleware()
        request = MagicMock()

        middleware(request)
        middleware.process_view(
            request, None, [], {"slug": "nonexistent-workspace-slug-xyz"}
        )
        # workspace_id stays None since no workspace matched
        assert request.workspace_id is None

    def test_sets_workspace_object(self, perm_workspace):
        """Middleware sets request.workspace as full object."""
        middleware = self._make_middleware()
        request = MagicMock()

        middleware(request)
        middleware.process_view(
            request, None, [], {"slug": perm_workspace.slug}
        )
        assert request.workspace.name == perm_workspace.name
        assert request.workspace.slug == perm_workspace.slug

    def test_cache_hit_sets_workspace_id_without_db_lookup(self, perm_workspace):
        """Cache hit sets workspace_id without querying Workspace table."""
        middleware = self._make_middleware()
        request = MagicMock()
        Workspace.set_slug_cache(perm_workspace.slug, perm_workspace.id)

        middleware(request)
        with patch("plane.db.models.Workspace.objects.filter") as workspace_filter:
            middleware.process_view(request, None, [], {"slug": perm_workspace.slug})

        workspace_filter.assert_not_called()
        assert request.workspace is None
        assert request.workspace_id == str(perm_workspace.id)

    def test_slug_change_invalidates_cached_entry(self, perm_workspace):
        """Changing workspace slug invalidates old slug cache key."""
        middleware = self._make_middleware()
        old_slug = perm_workspace.slug
        old_key = Workspace.slug_cache_key(old_slug)
        Workspace.set_slug_cache(old_slug, perm_workspace.id)

        perm_workspace.slug = f"renamed-{uuid4().hex[:8]}"
        perm_workspace.save()

        assert cache.get(old_key) is None

        request = MagicMock()
        middleware(request)
        middleware.process_view(request, None, [], {"slug": perm_workspace.slug})
        assert request.workspace_id == str(perm_workspace.id)

    def test_malformed_cache_value_evicted_and_resolved(self, perm_workspace):
        """Malformed cached workspace_id is evicted and resolved via slug lookup."""
        middleware = self._make_middleware()
        request = MagicMock()
        cache_key = Workspace.slug_cache_key(perm_workspace.slug)
        cache.set(cache_key, "not-a-valid-uuid", Workspace.SLUG_CACHE_TTL)

        middleware(request)
        middleware.process_view(request, None, [], {"slug": perm_workspace.slug})

        assert request.workspace_id == str(perm_workspace.id)
        assert request.workspace.id == perm_workspace.id
        assert str(cache.get(cache_key)) == str(perm_workspace.id)
