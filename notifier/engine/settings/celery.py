import os


class CelerySettings:
    # Message queue settings
    RABBITMQ_USER = os.environ.get("RABBITMQ_USER", "guest")
    RABBITMQ_PASSWORD = os.environ.get("RABBITMQ_PASSWORD", "guest")
    RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
    RABBITMQ_PORT = os.environ.get("RABBITMQ_PORT", 5672)
    RABBITMQ_VHOST = os.environ.get("RABBITMQ_VHOST", "plane")
    # Celery settings
    CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}"
    CELERY_ACCEPT_CONTENT = ["json"]
    CELERY_TASK_SERIALIZER = "json"
    CELERY_RESULT_SERIALIZER = "json"
    CELERY_TIMEZONE = "UTC"
    CELERY_ENABLE_UTC = True
