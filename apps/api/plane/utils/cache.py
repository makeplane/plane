# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import hashlib
from functools import wraps

# Django imports
from django.conf import settings
from django.core.cache import cache

# Third party imports
from rest_framework.response import Response


def generate_cache_key(custom_path, auth_header=None):
    """Generate a cache key with the given params"""
    if auth_header:
        key_data = f"{custom_path}:{auth_header}"
    else:
        key_data = custom_path
    return key_data


def _generation_key(custom_path):
    """Key holding the invalidation generation for a path (query string ignored).

    The path is hashed so the ``*<path>*`` pattern used by ``multiple`` invalidation never deletes it.
    """
    path_hash = hashlib.sha256(custom_path.split("?")[0].encode()).hexdigest()
    return f"cache_generation:{path_hash}"


def _bump_generation(custom_path):
    """Start a new generation so responses read before this point are never served"""
    generation_key = _generation_key(custom_path)
    cache.add(generation_key, 0, timeout=None)
    cache.incr(generation_key)


def cache_response(timeout=60 * 60, path=None, user=True):
    """decorator to create cache per user"""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Function to generate cache key
            auth_header = None if request.user.is_anonymous else str(request.user.id) if user else None
            custom_path = path if path is not None else request.get_full_path()
            key = generate_cache_key(custom_path, auth_header)
            generation_key = _generation_key(path if path is not None else request.path)
            # Read the generation before the view so a write that lands mid-read
            # makes this response's cache entry unusable
            cached = cache.get_many([key, generation_key])
            cached_result = cached.get(key)
            generation = cached.get(generation_key, 0)

            if cached_result is not None and cached_result.get("generation", 0) == generation:
                return Response(cached_result["data"], status=cached_result["status"])
            response = view_func(instance, request, *args, **kwargs)
            if response.status_code == 200 and not settings.DEBUG:
                cache.set(
                    key,
                    {"data": response.data, "status": response.status_code, "generation": generation},
                    timeout,
                )

            return response

        return _wrapped_view

    return decorator


def invalidate_cache_directly(path=None, url_params=False, user=True, request=None, multiple=False):
    if url_params and path:
        path_with_values = path
        # Assuming `kwargs` could be passed directly if needed, otherwise, skip this part
        for key, value in request.resolver_match.kwargs.items():
            path_with_values = path_with_values.replace(f":{key}", str(value))
        custom_path = path_with_values
    else:
        custom_path = path if path is not None else request.get_full_path()
    auth_header = None if request and request.user.is_anonymous else str(request.user.id) if user else None
    key = generate_cache_key(custom_path, auth_header)

    _bump_generation(custom_path)
    if multiple:
        cache.delete_many(keys=cache.keys(f"*{key}*"))
    else:
        cache.delete(key)


def invalidate_cache(path=None, url_params=False, user=True, multiple=False, after_write=False):
    """Invalidate a cached response before the view runs.

    With ``after_write``, invalidate again once the view returns a successful response,
    so a read that cached the old data while the write was in flight doesn't survive it.
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # invalidate the cache
            invalidate_cache_directly(
                path=path,
                url_params=url_params,
                user=user,
                request=request,
                multiple=multiple,
            )
            response = view_func(instance, request, *args, **kwargs)
            if after_write and response.status_code < 400:
                invalidate_cache_directly(
                    path=path,
                    url_params=url_params,
                    user=user,
                    request=request,
                    multiple=multiple,
                )
            return response

        return _wrapped_view

    return decorator
