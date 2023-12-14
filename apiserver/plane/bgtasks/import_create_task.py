from celery import shared_task

@shared_task(queue="node_to_celery_queue")
def issue_create_task(data):
    print(f"Received data from Node.js: {data}")