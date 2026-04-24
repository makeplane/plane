worker-1 | [2026-04-24 10:00:00,011: ERROR/MainProcess] Received unregistered task of type 'plane.bgtasks.worklog*reminder_task.worklog_daily_reminder'.
worker-1 | The message has been ignored and discarded.
worker-1 |
worker-1 | Did you remember to import the module containing this task?
worker-1 | Or maybe you're using relative imports?
worker-1 |
worker-1 | Please see
worker-1 | https://docs.celeryq.dev/en/latest/internals/protocol.html
worker-1 | for more information.
worker-1 |
worker-1 | The full contents of the message body was:
worker-1 | '[[], {}, {"callbacks": null, "errbacks": null, "chain": null, "chord": null}]' (77b)
worker-1 |
worker-1 | The full contents of the message headers:
worker-1 | {'argsrepr': '()', 'eta': None, 'expires': None, 'group': None, 'group_index': None, 'id': 'a915b114-7858-469c-a068-58bd0a808559', 'ignore_result': False, 'kwargsrepr': '{}', 'lang': 'py', 'origin': 'gen9@4c3c1bb6d435', 'parent_id': None, 'replaced_task_nesting': 0, 'retries': 0, 'root_id': 'a915b114-7858-469c-a068-58bd0a808559', 'shadow': None, 'stamped_headers': None, 'stamps': {}, 'task': 'plane.bgtasks.worklog_reminder_task.worklog_daily_reminder', 'timelimit': [None, None]}
worker-1 |
worker-1 | The delivery info for this task is:
worker-1 | {'consumer_tag': 'None4', 'delivery_tag': 71, 'redelivered': False, 'exchange': '', 'routing_key': 'celery'}
worker-1 | Traceback (most recent call last):
worker-1 | File "/usr/local/lib/python3.12/site-packages/celery/worker/consumer/consumer.py", line 659, in on_task_received
worker-1 | strategy = strategies[type*]
worker-1 | ~~~~~~~~~~^^^^^^^
worker-1 | KeyError: 'plane.bgtasks.worklog_reminder_task.worklog_daily_reminder'
worker-1 | {"levelname": "ERROR", "asctime": "2026-04-24 10:00:00,011", "module": "consumer", "name": "celery.worker.consumer.consumer", "message": "Received unregistered task of type 'plane.bgtasks.worklog_reminder_task.worklog_daily_reminder'.\nThe message has been ignored and discarded.\n\nDid you remember to import the module containing this task?\nOr maybe you're using relative imports?\n\nPlease see\nhttps://docs.celeryq.dev/en/latest/internals/protocol.html\nfor more information.\n\nThe full contents of the message body was:\n
