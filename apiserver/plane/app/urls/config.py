from django.urls import path


from plane.app.views import ConfigurationEndpoint, MobileConfigurationEndpoint

urlpatterns = [
    path(
        "configs/",
        ConfigurationEndpoint.as_view(),
        name="configuration",
    ),
    path(
        "mobile-configs/",
        MobileConfigurationEndpoint.as_view(),
        name="configuration",
    ),
]
