import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from plane.api.consumers import IssueConsumer
from django.urls import re_path, path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.

websocket_urlpatterns = [
    path(r"^ws/event/$", IssueConsumer),
]

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": URLRouter(
            websocket_urlpatterns,
        ),
    }
)
