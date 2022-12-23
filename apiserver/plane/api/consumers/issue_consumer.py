from channels.generic.websocket import JsonWebsocketConsumer
import json
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from plane.db.models import IssueActivity


class IssueConsumer(JsonWebsocketConsumer):
    def connect(self):
        print("inside EventConsumer connect()")
        self.room_group_name = "issues"
        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        print("inside EventConsumer disconnect()")
        print("Closed websocket with code: ", close_code)
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )
        self.close()

    # Receive message from WebSocket
    def receive(self, content, **kwargs):
        print("inside EventConsumer receive_json()")
        print("Received event: {}".format(content))
        self.send_json(content)

    # Receive message from room group
    def issue_activity(self, event):
        print(event)
        # database_sync_to_async(IssueActivity.objects.create)(
        #     issue_id="1b2756d8-d545-41c0-923c-c9ce19e48248", verb="Hello", field="Hello"
        # )
        # Send message to WebSocket
        self.send_json({"type": "issue.activity", "content": "Hellow"})
