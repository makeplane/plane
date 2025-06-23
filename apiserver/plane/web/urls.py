from django.urls import path
from plane.web.views import robots_txt, health_check

urlpatterns = [path("robots.txt", robots_txt), path("", health_check)]
