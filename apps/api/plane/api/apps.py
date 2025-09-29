from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = "plane.api"

    def ready(self):
        # Import authentication extensions to register them with drf-spectacular
        try:
            import plane.utils.openapi.auth  # noqa
        except ImportError:
            pass
