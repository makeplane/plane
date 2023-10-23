# from django.contrib import admin
from django.urls import path, include

from plane.analytics.views import EventTrackingEndpoint

urlpatterns = [
    path('track-event/', EventTrackingEndpoint.as_view(), name='event_tracking'),
]