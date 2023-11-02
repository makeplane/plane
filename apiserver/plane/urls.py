"""plane URL Configuration

"""

from django.urls import path, include, re_path
from django.views.generic import TemplateView

from django.conf import settings


urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),
    path("api/", include("plane.api.urls")),
    path("", include("plane.web.urls")),
]


if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        re_path(r"^__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
