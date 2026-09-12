/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { SendHorizontal } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TChatChannel, TChatScope } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useChat } from "@/hooks/store/use-chat";

const MAX_LENGTH = 4000;

type Props = {
  scope: TChatScope;
  channel: TChatChannel;
};

export const ChatComposer = observer(function ChatComposer(props: Props) {
  const { scope, channel } = props;
  // refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // states
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  // store hooks
  const { sendMessage } = useChat();

  // focus the box when switching channels
  useEffect(() => {
    textareaRef.current?.focus();
  }, [channel.id]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(scope, channel.id, trimmed);
      setContent("");
    } catch (error: unknown) {
      const data = error as { error?: string; content?: string[] } | undefined;
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: data?.error ?? data?.content?.[0] ?? "Message could not be sent.",
      });
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void handleSend();
    }
  };

  const rows = Math.min(6, Math.max(1, content.split("\n").length));

  return (
    <div className="flex-shrink-0 border-t border-subtle px-4 py-3">
      <div className="focus-within:border-accent-primary flex items-end gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-2">
        <textarea
          ref={textareaRef}
          className="max-h-40 w-full resize-none bg-transparent text-13 text-primary outline-none placeholder:text-placeholder"
          placeholder={`Message #${channel.name}`}
          rows={rows}
          value={content}
          onChange={(event) => setContent(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          type="button"
          className={cn(
            "grid size-7 flex-shrink-0 place-items-center rounded",
            content.trim() ? "text-accent-primary hover:bg-layer-transparent-hover" : "text-placeholder"
          )}
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          aria-label="Send message"
        >
          <SendHorizontal className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-10 text-placeholder">Enter to send, Shift+Enter for a new line.</p>
    </div>
  );
});
