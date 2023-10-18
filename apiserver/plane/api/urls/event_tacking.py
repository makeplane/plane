from django.urls import path

from plane.api.views import EventTrackingEndpoint

urlpatterns = [
    path('track-event/', EventTrackingEndpoint.as_view(), name='event_tracking'),
]