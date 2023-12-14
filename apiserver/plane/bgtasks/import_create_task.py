from celery import shared_task

@shared_task(queue="node_to_celery_queue")
def issue_create_task(x,y):
    print(f"Received data from Node.js: {x,y}")