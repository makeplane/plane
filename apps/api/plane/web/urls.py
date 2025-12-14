from django.urls import path, re_path
from plane.web.views import robots_txt, health_check, proxy_admin

# URL patterns for /god-mode/ (included from main urls.py with path("god-mode/", ...))
god_mode_urlpatterns = [
    re_path(r"^.*$", proxy_admin, name="proxy-admin"),  # Match all paths under /god-mode/
    path("", proxy_admin, name="proxy-admin-root"),  # Match /god-mode/ exactly
]

# URL patterns for root (included from main urls.py with path("", ...))
urlpatterns = [
    path("robots.txt", robots_txt),
    path("", health_check),
]
