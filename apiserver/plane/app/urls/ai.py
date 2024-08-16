from django.urls import path


from plane.app.views import AskAIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/ask-AI/",
        AskAIEndpoint.as_view(),
        name="askAI",
    ),
]
