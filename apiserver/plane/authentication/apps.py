from django.apps import AppConfig


class AuthConfig(AppConfig):
    name = "plane.authentication"

    def ready(self):
        # Import signals to register them
        import plane.authentication.signals  # noqa
