# Python imports
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


def cache_response(timeout=60 * 60, path=None, user=True):
    """decorator to create cache per user"""

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Function to generate cache key
            auth_header = (
                None
                if request.user.is_anonymous
                else str(request.user.id)
                if user
                else None
            )
            custom_path = path if path is not None else request.get_full_path()
            key = generate_cache_key(custom_path, auth_header)
            cached_result = cache.get(key)

            if cached_result is not None:
                return Response(cached_result["data"], status=cached_result["status"])
            response = view_func(instance, request, *args, **kwargs)
            if response.status_code == 200 and not settings.DEBUG:
                cache.set(
                    key,
                    {"data": response.data, "status": response.status_code},
                    timeout,
                )

            return response

        return _wrapped_view

    return decorator


def invalidate_cache_directly(
    path=None, url_params=False, user=True, request=None, multiple=False
):
    if url_params and path:
        path_with_values = path
        # Assuming `kwargs` could be passed directly if needed, otherwise, skip this part
        for key, value in request.resolver_match.kwargs.items():
            path_with_values = path_with_values.replace(f":{key}", str(value))
        custom_path = path_with_values
    else:
        custom_path = path if path is not None else request.get_full_path()
    auth_header = (
        None
        if request and request.user.is_anonymous
        else str(request.user.id)
        if user
        else None
    )
    key = generate_cache_key(custom_path, auth_header)

    if multiple:
        cache.delete_many(keys=cache.keys(f"*{key}*"))
    else:
        cache.delete(key)


def invalidate_cache(path=None, url_params=False, user=True, multiple=False):
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
            return view_func(instance, request, *args, **kwargs)

        return _wrapped_view

    return decorator
