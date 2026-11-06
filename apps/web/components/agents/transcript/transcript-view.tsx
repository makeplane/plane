/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import type { PendingPermission, TranscriptItem } from "@plane/acp-client";
import { useTranslation } from "@plane/i18n";
// local imports
import { CompactionItem } from "./compaction-item";
import { MessageItem } from "./message-item";
import { NoticeItem } from "./notice-item";
import { ThoughtItem } from "./thought-item";
import { ToolCallCard } from "./tool-call-card";
import { TurnEndItem } from "./turn-end-item";

/** Within this many pixels of the bottom, new content keeps the view pinned to the bottom. */
const STICK_THRESHOLD_PX = 80;

type Props = {
  items: readonly TranscriptItem[];
  permissions: readonly PendingPermission[];
  prompting: boolean;
  onRespondToPermission: (permissionId: string, optionId: string | null) => void;
};

export function TranscriptView({ items, permissions, prompting, onRespondToPermission }: Props) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const lastItem = items.at(-1);

  // Follow the stream while the reader is at the bottom; leave them alone once they scroll up.
  useEffect(() => {
    const element = scrollRef.current;
    if (element && pinnedRef.current) element.scrollTop = element.scrollHeight;
  }, [items, permissions]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    pinnedRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD_PX;
  };

  const permissionFor = (toolCallId: string) =>
    permissions.find((permission) => permission.toolCall.toolCallId === toolCallId);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="vertical-scrollbar scrollbar-md h-full overflow-y-auto"
      role="log"
      aria-live="polite"
      aria-label={t("agents.transcript.label")}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-4">
        {items.map((item) => {
          switch (item.kind) {
            case "message":
              return <MessageItem key={item.id} item={item} />;
            case "thought":
              return <ThoughtItem key={item.id} item={item} isStreaming={prompting && item === lastItem} />;
            case "tool_call":
              return (
                <ToolCallCard
                  key={item.id}
                  item={item}
                  {...(permissionFor(item.toolCallId) ? { permission: permissionFor(item.toolCallId) } : {})}
                  onRespondToPermission={onRespondToPermission}
                />
              );
            case "notice":
              return <NoticeItem key={item.id} item={item} />;
            case "compaction":
              return <CompactionItem key={item.id} item={item} />;
            case "turn_end":
              return <TurnEndItem key={item.id} item={item} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
