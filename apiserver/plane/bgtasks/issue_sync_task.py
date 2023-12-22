from celery import shared_task

@shared_task(queue="segway_tasks")
def issue_sync(data):
    print(f"Received data from Segway: {data}")