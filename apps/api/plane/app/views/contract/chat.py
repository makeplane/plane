# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Chat over contracts. GENERAL mode answers with RAG over the workspace's
vectorized chunks (ranked by cosine similarity); CONTRACT mode is scoped to a
single contract whose full extracted text is passed as system context. The AI
call itself runs in the Cloudflare Worker — Django only owns auth, history and
persistence.
"""

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import ContractChatMessageSerializer, ContractChatSerializer
from plane.db.models import Contract, ContractChat, ContractChatMessage, Workspace
from plane.utils.worker_client import WorkerTriggerError, chat_with_contracts, get_chat_models

from ..file_library.base import FileLibraryBaseView

# How many previous turns travel to the model with each new message
HISTORY_LIMIT = 12


class ContractChatModelsEndpoint(FileLibraryBaseView):
    """Selectable chat models, proxied from the Worker's env-driven list."""

    model = ContractChat

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        try:
            return Response(get_chat_models(), status=status.HTTP_200_OK)
        except WorkerTriggerError as e:
            return Response({"error": str(e)[:300]}, status=status.HTTP_502_BAD_GATEWAY)


class ContractChatsEndpoint(FileLibraryBaseView):
    serializer_class = ContractChatSerializer
    model = ContractChat

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        chats = ContractChat.objects.filter(workspace__slug=slug, user=request.user)
        contract_id = request.query_params.get("contract_id")
        if contract_id:
            chats = chats.filter(contract_id=contract_id)
        mode = request.query_params.get("mode")
        if mode:
            chats = chats.filter(mode=mode)
        return Response(ContractChatSerializer(chats[:50], many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        mode = request.data.get("mode", ContractChat.Mode.GENERAL)
        if mode not in ContractChat.Mode.values:
            return Response({"error": "invalid mode"}, status=status.HTTP_400_BAD_REQUEST)
        contract = None
        if mode == ContractChat.Mode.CONTRACT:
            contract = Contract.objects.filter(id=request.data.get("contract_id"), workspace=workspace).first()
            if contract is None:
                return Response({"error": "contract_id is required for CONTRACT mode"}, status=status.HTTP_400_BAD_REQUEST)
        chat = ContractChat.objects.create(
            workspace=workspace,
            user=request.user,
            mode=mode,
            contract=contract,
            title=(request.data.get("title") or "")[:255],
        )
        return Response(ContractChatSerializer(chat).data, status=status.HTTP_201_CREATED)


class ContractChatDetailEndpoint(FileLibraryBaseView):
    serializer_class = ContractChatMessageSerializer
    model = ContractChatMessage

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, chat_id):
        chat = ContractChat.objects.get(id=chat_id, workspace__slug=slug, user=request.user)
        messages = chat.messages.all()
        return Response(
            {
                "chat": ContractChatSerializer(chat).data,
                "messages": ContractChatMessageSerializer(messages, many=True).data,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def delete(self, request, slug, chat_id):
        chat = ContractChat.objects.get(id=chat_id, workspace__slug=slug, user=request.user)
        chat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ContractChatMessageEndpoint(FileLibraryBaseView):
    serializer_class = ContractChatMessageSerializer
    model = ContractChatMessage

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def post(self, request, slug, chat_id):
        chat = ContractChat.objects.select_related("contract").get(
            id=chat_id, workspace__slug=slug, user=request.user
        )
        content = (request.data.get("message") or "").strip()
        if not content:
            return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

        history = [
            {"role": message.role.lower(), "content": message.content}
            for message in chat.messages.order_by("-created_at")[:HISTORY_LIMIT][::-1]
        ]

        user_message = ContractChatMessage.objects.create(
            workspace=chat.workspace,
            chat=chat,
            role=ContractChatMessage.Role.USER,
            content=content,
        )
        # First message titles the chat
        if not chat.title:
            chat.title = content[:255]
        chat.save(update_fields=["title", "updated_at"])

        try:
            result = chat_with_contracts(
                workspace_id=chat.workspace_id,
                mode=chat.mode,
                query=content,
                history=history,
                contract_id=chat.contract_id,
                model=(request.data.get("model") or "").strip() or None,
            )
        except WorkerTriggerError as e:
            return Response(
                {
                    "user_message": ContractChatMessageSerializer(user_message).data,
                    "error": str(e)[:300],
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        assistant_message = ContractChatMessage.objects.create(
            workspace=chat.workspace,
            chat=chat,
            role=ContractChatMessage.Role.ASSISTANT,
            content=result.get("answer") or "",
            sources=result.get("sources") or [],
        )
        return Response(
            {
                "user_message": ContractChatMessageSerializer(user_message).data,
                "assistant_message": ContractChatMessageSerializer(assistant_message).data,
            },
            status=status.HTTP_200_OK,
        )
