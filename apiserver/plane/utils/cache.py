from django.core.cache import cache
from django.utils.encoding import force_bytes
import hashlib
from functools import wraps
from rest_framework.response import Response
from datetime import datetime, timedelta
from django.utils.http import http_date


def generate_cache_key(custom_path, auth_header=None):
    if auth_header:
        key_data = f'{custom_path}:{auth_header}'
    else:
        key_data = custom_path
    return hashlib.md5(force_bytes(key_data)).hexdigest()

def cache_user_response(timeout, path=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Function to generate cache key
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            custom_path = path if path is not None else request.get_full_path()
            key = generate_cache_key(custom_path, auth_header)
            cached_result = cache.get(key)
            if cached_result is not None:
                return Response(cached_result['data'], status=cached_result['status'])

            response = view_func(instance, request, *args, **kwargs)

            if response.status_code == 200:
                cache.set(key, {'data': response.data, 'status': response.status_code}, timeout)
                response['Cache-Control'] = f'max-age={timeout}'
                expires_time = datetime.utcnow() + timedelta(seconds=timeout)
                response['Expires'] = http_date(expires_time.timestamp())

            return response
        return _wrapped_view
    return decorator

def invalidate_user_cache(path):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Invalidate cache before executing the view function
            custom_path = path if path is not None else request.get_full_path()
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            key = generate_cache_key(custom_path, auth_header)
            cache.delete(key)

            # Execute the view function
            return view_func(instance, request, *args, **kwargs)
        return _wrapped_view
    return decorator


def cache_path_response(timeout, path=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Function to generate cache key
            custom_path = path if path is not None else request.get_full_path()
            key = generate_cache_key(custom_path, None)
            cached_result = cache.get(key)
            if cached_result is not None:
                return Response(cached_result['data'], status=cached_result['status'])

            response = view_func(instance, request, *args, **kwargs)

            if response.status_code == 200:
                cache.set(key, {'data': response.data, 'status': response.status_code}, timeout)
                response['Cache-Control'] = f'max-age={timeout}'
                expires_time = datetime.utcnow() + timedelta(seconds=timeout)
                response['Expires'] = http_date(expires_time.timestamp())

            return response
        return _wrapped_view
    return decorator

def invalidate_path_cache(path=None):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(instance, request, *args, **kwargs):
            # Invalidate cache before executing the view function
            custom_path = path if path is not None else request.get_full_path()
            key = generate_cache_key(custom_path, None)
            cache.delete(key)

            # Execute the view function
            return view_func(instance, request, *args, **kwargs)
        return _wrapped_view
    return decorator

