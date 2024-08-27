import os

# third-party imports
# from pydantic_settings import BaseSettings

# local imports
from .celery import CelerySettings
from .postgres import PostgresSettings


class Settings(CelerySettings, PostgresSettings):
    PROJECT_NAME: str = "Notification Engine"
    PROJECT_DESCRIPTION: str = "A simple notification service"
    PROJECT_VERSION: str = "0.1.0"
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "123456789")
    DEBUG: bool = os.environ.get("DEBUG", False)
