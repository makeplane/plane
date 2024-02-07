from django.apps import AppConfig


class BgtasksConfig(AppConfig):
    name = "plane.bgtasks"

    def ready(self) -> None:
        from plane.bgtasks.create_faker import create_fake_data

