from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from plane.db.models import IssueActivity


class IssueConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.room_group_name = "issue"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        print(text_data)
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "issue_activity", "message": message}
        )

    # Receive message from room group
    async def issue_activity(self, event):
        print(event)
        message = event["message"]
        await database_sync_to_async(IssueActivity.objects.create)(
            issue_id="1b2756d8-d545-41c0-923c-c9ce19e48248", verb="Hello", field="Hello"
        )
        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message}))
