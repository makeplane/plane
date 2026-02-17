/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
