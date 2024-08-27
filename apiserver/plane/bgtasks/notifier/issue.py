import pika
from django.conf import settings
from celery import shared_task


def publish_issue_activity(queue_name, message):
    # print(settings.CELERY_BROKER_URL)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters("127.0.0.1")
    )
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=True)
    channel.basic_publish(exchange="", routing_key=queue_name, body=message)
    connection.close()


@shared_task
def notify_issue_activity(queue_name, message):
    publish_issue_activity(queue_name, message)


if __name__ == "__main__":
    publish_issue_activity("NOTIFY_ISSUE_ACTIVITY", "Hello World")
