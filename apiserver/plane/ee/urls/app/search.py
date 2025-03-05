from django.urls import path


from plane.ee.views import EnchancedGlobalSearchEndpoint


urlpatterns = [
    path(
        "workspaces/<str:slug>/enhanced-search/",
        EnchancedGlobalSearchEndpoint.as_view(),
        name="enhanced-global-search",
    )
]
