from urllib.parse import urlsplit


def base_host(request):
    """Utility function to return host / origin from the request"""
    return (
        request.META.get("HTTP_ORIGIN")
        or f"{urlsplit(request.META.get('HTTP_REFERER')).scheme}://{urlsplit(request.META.get('HTTP_REFERER')).netloc}"
        or f"{request.scheme}://{request.get_host()}"
    )
