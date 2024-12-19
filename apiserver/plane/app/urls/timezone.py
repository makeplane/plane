from django.urls import path

from plane.app.views import TimezoneEndpoint

urlpatterns = [
    # timezone endpoint
    path("timezones/", TimezoneEndpoint.as_view(), name="timezone-list")
]
