# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.db.models import APIToken


def get_api_token_actor(request):
    """Return the API token identity when present, otherwise the authenticated user."""
    django_request = getattr(request, "_request", request)
    return getattr(django_request, "api_token_actor", None) or request.user


def is_api_token_actor_owned_by(user_id, actor_id):
    """Check whether a user owns a token identity, including identities on revoked tokens."""
    return APIToken.all_objects.filter(user_id=user_id, actor_id=actor_id).exists()


def get_api_token_actor_ids(user_id):
    """Return all token actor IDs for owner-scoped queries, including revoked tokens."""
    return APIToken.all_objects.filter(user_id=user_id).values_list("actor_id", flat=True)


def is_request_user_creator(request, creator_id):
    """Match a record creator to the user or to one of their API token identities."""
    return creator_id == request.user.id or is_api_token_actor_owned_by(request.user.id, creator_id)
