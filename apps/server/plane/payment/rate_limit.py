from rest_framework.throttling import SimpleRateThrottle


class WorkspaceRateThrottle(SimpleRateThrottle):
    scope = "workspace"
    rate = "10/minute"

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            slug = view.kwargs.get("slug")
            if slug:
                return self.cache_format % {"scope": self.scope, "ident": slug}
        return None
