/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { ComposerPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { motion } from "framer-motion";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";

// Entrance animation used across the thread (mirrors the assistant-ui examples)
const messageMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" as const },
};

/**
 * Consecutive tool-call parts render inside this wrapper. Always passed
 * explicitly: MessagePrimitive.Parts crashes reading `components.ToolGroup`
 * when no components object is provided and a tool-call part exists.
 */
function ToolGroup({ children }: { startIndex: number; endIndex: number; children?: ReactNode }) {
  return (
    <motion.div {...messageMotion} className="w-full">
      {children}
    </motion.div>
  );
}

const PARTS_COMPONENTS = { ToolGroup };

function UserMessage() {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div {...messageMotion} className="flex justify-end px-3 py-1.5">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent-primary/10 px-3.5 py-2 text-13">
          <MessagePrimitive.Parts components={PARTS_COMPONENTS} />
        </div>
      </motion.div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root asChild>
      <motion.div {...messageMotion} className="flex justify-start px-3 py-1.5">
        <div className="max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-layer-1 px-3.5 py-2 text-13">
          <MessagePrimitive.Parts components={PARTS_COMPONENTS} />
        </div>
      </motion.div>
    </MessagePrimitive.Root>
  );
}

type Props = {
  emptyTitle: string;
  emptyDescription: string;
  /** Extra composer controls (e.g. the model picker) */
  composerAccessory?: ReactNode;
};

/** Chat thread + composer (assistant-ui primitives, Plane styling) */
export function ContractChatThread(props: Props) {
  const { emptyTitle, emptyDescription, composerAccessory } = props;
  const { t } = useTranslation();

  return (
    <ThreadPrimitive.Root className="flex h-full min-h-0 flex-col">
      <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto py-2">
        <ThreadPrimitive.Empty>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-tertiary"
          >
            <Sparkles className="size-7 text-accent-primary" />
            <p className="text-14 font-medium text-secondary">{emptyTitle}</p>
            <p className="max-w-sm text-12">{emptyDescription}</p>
          </motion.div>
        </ThreadPrimitive.Empty>
        <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
        <ThreadPrimitive.If running>
          <motion.div
            {...messageMotion}
            className="flex items-center gap-2 px-4 py-2 text-12 text-tertiary"
          >
            <Loader2 className="size-3.5 animate-spin" />
            <span className="animate-pulse">{t("file_library.contracts.chat.thinking")}</span>
          </motion.div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <div className="shrink-0 border-t border-subtle p-2.5">
        <ComposerPrimitive.Root className="rounded-lg border border-subtle bg-layer-1 px-3 py-2 transition-colors focus-within:border-accent-strong">
          <div className="flex items-end gap-2">
            <ComposerPrimitive.Input
              rows={1}
              placeholder={t("file_library.contracts.chat.placeholder")}
              className="max-h-32 min-h-6 flex-1 resize-none bg-transparent text-13 outline-none placeholder:text-tertiary"
            />
            <ComposerPrimitive.Send
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-primary text-on-color transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
              title={t("file_library.contracts.chat.send")}
            >
              <ArrowUp className="size-4" />
            </ComposerPrimitive.Send>
          </div>
          {composerAccessory && <div className="mt-1.5 flex items-center justify-between">{composerAccessory}</div>}
        </ComposerPrimitive.Root>
      </div>
    </ThreadPrimitive.Root>
  );
}
