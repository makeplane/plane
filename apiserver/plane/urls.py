"""plane URL Configuration

"""

# from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView

from django.conf import settings
from django.conf.urls import include, url, static

# from django.conf.urls.static import static

urlpatterns = [
    # path("admin/", admin.site.urls),
    path("", TemplateView.as_view(template_name="index.html")),
    path("api/", include("plane.api.urls")),
    path("", include("plane.web.urls")),
]

urlpatterns = urlpatterns + static.static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
        url(r"^__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
