from django.urls import path


from plane.app.views import ConfigurationEndpoint

urlpatterns = [
    path(
        "configs/",
        ConfigurationEndpoint.as_view(),
        name="configuration",
    ),
]