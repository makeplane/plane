def base_host(request):
    """Utility function to return host / origin from the request"""
    return (
        request.META.get("HTTP_ORIGIN")
        or f"{request.scheme}://{request.get_host()}"
    )
