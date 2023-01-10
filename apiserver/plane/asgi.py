import os

from channels.routing import ProtocolTypeRouter, ChannelNameRouter
from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.

from plane.api.consumers import IssueConsumer

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "channel": ChannelNameRouter(
            {
                "issue-activites": IssueConsumer.as_asgi(),
            }
        ),
    }
)
