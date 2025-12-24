type ChatSupportType = "open";

type ChatSupportEventType = `chat-support:${ChatSupportType}`;

export const CHAT_SUPPORT_EVENTS = {
  open: "chat-support:open",
} satisfies Record<ChatSupportType, ChatSupportEventType>;

export class ChatSupportEvent extends CustomEvent<ChatSupportType> {
  constructor(type: ChatSupportType) {
    super(CHAT_SUPPORT_EVENTS[type]);
  }
}
