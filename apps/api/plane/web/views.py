"""Web views for serving frontend applications"""

import requests
from django.http import HttpResponse, HttpRequest, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings


def robots_txt(request: HttpRequest) -> HttpResponse:
    """Return robots.txt content"""
    return HttpResponse("User-agent: *\nDisallow: /", content_type="text/plain")


def health_check(request: HttpRequest) -> JsonResponse:
    """Health check endpoint"""
    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
def proxy_admin(request: HttpRequest) -> HttpResponse:
    """
    Proxy requests to the admin app running on port 3001.
    This allows /god-mode to work without a reverse proxy.
    """
    admin_url = getattr(settings, "ADMIN_BASE_URL", "http://localhost:3001")
    
    # Remove /god-mode prefix and forward to admin app
    # The admin app expects to be served at /god-mode/, so we need to preserve that
    path = request.path
    if path.startswith("/god-mode"):
        # Remove /god-mode prefix, but keep the trailing path
        path = path[len("/god-mode"):] or "/"
        # Ensure path starts with /
        if not path.startswith("/"):
            path = "/" + path
    
    # Build the full URL - admin app is configured with base path /god-mode
    # So we need to prepend /god-mode to the path
    admin_path = f"/god-mode{path}"
    url = f"{admin_url}{admin_path}"
    if request.GET:
        url += "?" + request.GET.urlencode()
    
    # Prepare headers (exclude host and connection)
    headers = {}
    for key, value in request.headers.items():
        if key.lower() not in ["host", "connection", "content-length"]:
            headers[key] = value
    
    # Forward the request
    try:
        if request.method == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif request.method == "POST":
            response = requests.post(url, data=request.body, headers=headers, timeout=30)
        elif request.method == "PUT":
            response = requests.put(url, data=request.body, headers=headers, timeout=30)
        elif request.method == "PATCH":
            response = requests.patch(url, data=request.body, headers=headers, timeout=30)
        elif request.method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        elif request.method == "OPTIONS":
            response = requests.options(url, headers=headers, timeout=30)
        elif request.method == "HEAD":
            response = requests.head(url, headers=headers, timeout=30)
        else:
            return HttpResponse("Method not allowed", status=405)
        
        # Create Django response with forwarded content
        django_response = HttpResponse(
            response.content,
            status=response.status_code,
            content_type=response.headers.get("Content-Type", "text/html")
        )
        
        # Forward relevant headers
        for key, value in response.headers.items():
            if key.lower() in ["content-type", "cache-control", "etag", "last-modified"]:
                django_response[key] = value
        
        return django_response
    except requests.RequestException as e:
        return HttpResponse(f"Proxy error: {str(e)}", status=502)
