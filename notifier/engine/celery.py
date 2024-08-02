from celery import Celery
from .settings import settings

celery = Celery("tasks", broker=settings.CELERY_BROKER_URL)
