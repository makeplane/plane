from django.urls import path
from plane.app.ai.views import AIChatEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/ai-chat/",
        AIChatEndpoint.as_view(),
        name="workspace-ai-chat",
    ),
]
