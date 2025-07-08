from django.urls import path


from plane.ee.views import EnhancedGlobalSearchEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/enhanced-search/",
        EnhancedGlobalSearchEndpoint.as_view(),
        name="enhanced-global-search",
    )
]
