from django.apps import AppConfig


class AuthConfig(AppConfig):
    name = "plane.authentication"

    def ready(self): ...
