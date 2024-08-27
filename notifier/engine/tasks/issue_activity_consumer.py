import aio_pika
from ..settings import settings


async def issue_activity_consumer():
    connection = await aio_pika.connect_robust(settings.CELERY_BROKER_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue("NOTIFY_ISSUE_ACTIVITY", durable=True)

    async with queue.iterator() as queue_iter:
        async for message in queue_iter:
            async with message.process():
                print(f"Received message: {message.body.decode()}")
