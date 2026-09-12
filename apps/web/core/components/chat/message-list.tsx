/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatScope } from "@plane/types";
// hooks
import { useChat } from "@/hooks/store/use-chat";
// local imports
import { ChatMessageItem } from "./message-item";

/** Consecutive messages from one sender inside this window share a single header. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;
/** Distance from the bottom, in pixels, that still counts as "reading the latest". */
const STICKY_THRESHOLD_PX = 48;

type Props = {
  scope: TChatScope;
  channelId: string;
};

export const ChatMessageList = observer(function ChatMessageList(props: Props) {
  const { scope, channelId } = props;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  // states
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  // store hooks
  const { getMessageIds, messages, messageLoader, hasOlderByChannel, fetchOlderMessages } = useChat();
  // derived values
  const messageIds = getMessageIds(channelId);
  const isInitialLoading = messageLoader[channelId] === "init-loader";
  const hasOlder = hasOlderByChannel[channelId] ?? false;

  // a new channel always opens at its newest message
  useEffect(() => {
    stickToBottom.current = true;
  }, [channelId]);

  // keep the newest message in view unless the reader scrolled up on purpose
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messageIds.length, channelId]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_THRESHOLD_PX;
  };

  const handleLoadOlder = async () => {
    const el = containerRef.current;
    const previousHeight = el?.scrollHeight ?? 0;
    stickToBottom.current = false;
    setIsLoadingOlder(true);
    try {
      await fetchOlderMessages(scope, channelId);
      // keep the reader on the same message after older ones are prepended
      window.requestAnimationFrame(() => {
        if (el) el.scrollTop += el.scrollHeight - previousHeight;
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Older messages could not be loaded." });
    } finally {
      setIsLoadingOlder(false);
    }
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3">
      {hasOlder && (
        <div className="flex justify-center pb-3">
          <Button variant="secondary" size="sm" onClick={handleLoadOlder} loading={isLoadingOlder}>
            Load older messages
          </Button>
        </div>
      )}
      {isInitialLoading && messageIds.length === 0 && (
        <div className="py-8 text-center text-13 text-tertiary">Loading messages...</div>
      )}
      {!isInitialLoading && messageIds.length === 0 && (
        <div className="py-8 text-center text-13 text-tertiary">No messages yet. Say hi!</div>
      )}
      {messageIds.map((messageId, index) => {
        const message = messages[messageId];
        if (!message) return null;
        const previous = index > 0 ? messages[messageIds[index - 1]] : undefined;
        const sameSender = !!previous && previous.sender?.id === message.sender?.id;
        const closeInTime =
          !!previous &&
          new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < GROUP_WINDOW_MS;
        return (
          <ChatMessageItem
            key={messageId}
            scope={scope}
            channelId={channelId}
            message={message}
            showHeader={!(sameSender && closeInTime)}
          />
        );
      })}
    </div>
  );
});
