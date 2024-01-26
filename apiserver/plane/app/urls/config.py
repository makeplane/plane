from django.urls import path


from plane.app.views import (
    ConfigurationEndpoint,
    MobileConfigurationEndpoint,
    AuthConfigurationEndpoint,
)

urlpatterns = [
    path(
        "configs/",
        ConfigurationEndpoint.as_view(),
        name="configuration",
    ),
    path(
        "mobile-configs/",
        MobileConfigurationEndpoint.as_view(),
        name="mobile-configuration",
    ),
    path(
        "auth-configs/",
        AuthConfigurationEndpoint.as_view(),
        name="auth-configuration",
    ),
]
