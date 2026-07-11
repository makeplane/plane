/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Chat over contracts backed by assistant-ui's external-store runtime
 * (https://www.assistant-ui.com/docs/runtimes/pick-a-runtime): Django owns
 * the messages, we mirror them into the store and send new turns through the
 * synchronous chat endpoint. GENERAL mode answers with RAG over the
 * vectorized chunks; CONTRACT mode chats over one contract's full text.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { Bot, History, Loader2, Plus, Trash2, X } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TContractChat, TContractChatMessage, TContractChatMode } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { contractService } from "@/services/contract.service";
// local imports
import { ChatSourcesContext, ContractSourcesToolUI, SOURCES_TOOL_NAME } from "./sources-tool";
import { ContractChatThread } from "./thread";

type Props = {
  workspaceSlug: string;
  mode: TContractChatMode;
  contractId?: string;
  /** Sent automatically as the first message (Power K "search with AI") */
  initialQuery?: string;
  /** Hide the chat-history sidebar (peek panel embed) */
  compact?: boolean;
  onOpenContract?: (contractId: string) => void;
};

const toThreadMessage = (message: TContractChatMessage): ThreadMessageLike => {
  if (message.role === "USER") return { id: message.id, role: "user", content: [{ type: "text", text: message.content }] };
  const content: ThreadMessageLike["content"] = [{ type: "text", text: message.content }];
  if (message.sources && message.sources.length > 0) {
    // Matching contracts render as a Tool UI (assistant-ui tools/tool-ui)
    (content as unknown[]).push({
      type: "tool-call",
      toolCallId: `sources-${message.id}`,
      toolName: SOURCES_TOOL_NAME,
      args: { sources: message.sources },
      result: { shown: true },
    });
  }
  return { id: message.id, role: "assistant", content };
};

export function ContractChatPanel(props: Props) {
  const { workspaceSlug, mode, contractId, initialQuery, compact = false, onOpenContract } = props;
  const { t } = useTranslation();
  // states
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<TContractChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const initialQuerySent = useRef(false);

  // chat history (scoped to the contract in CONTRACT mode)
  const { data: chats, mutate: mutateChats } = useSWR(
    `CONTRACT_CHATS_${workspaceSlug}_${mode}_${contractId ?? "all"}`,
    () => contractService.getChats(workspaceSlug, { mode, contractId }),
    { revalidateOnFocus: false }
  );

  // selectable models come from the Worker env (never hardcoded); the env's
  // CHAT_DEFAULT_MODEL (deepseek-v4-flash) starts selected
  const { data: modelOptions } = useSWR(
    `CONTRACT_CHAT_MODELS_${workspaceSlug}`,
    () => contractService.getChatModels(workspaceSlug),
    { revalidateOnFocus: false }
  );
  const activeModel = selectedModel ?? modelOptions?.default_model ?? null;

  // load messages when switching chats
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    contractService
      .getChatDetail(workspaceSlug, activeChatId)
      .then(({ messages: loaded }) => {
        if (!cancelled) setMessages(loaded);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, activeChatId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isRunning) return;
      setIsRunning(true);
      // optimistic user turn
      const optimistic: TContractChatMessage = {
        id: `optimistic-${Date.now()}`,
        chat_id: activeChatId ?? "",
        role: "USER",
        content: trimmed,
        sources: null,
        created_at: new Date().toISOString(),
      };
      setMessages((previous) => [...previous, optimistic]);
      try {
        let chatId = activeChatId;
        if (!chatId) {
          const chat = await contractService.createChat(workspaceSlug, {
            mode,
            contract_id: contractId,
          });
          chatId = chat.id;
          setActiveChatId(chat.id);
          void mutateChats();
        }
        const { user_message, assistant_message } = await contractService.sendChatMessage(
          workspaceSlug,
          chatId,
          trimmed,
          activeModel ?? undefined
        );
        setMessages((previous) => [
          ...previous.filter((message) => message.id !== optimistic.id),
          user_message,
          assistant_message,
        ]);
        void mutateChats();
      } catch {
        setMessages((previous) => previous.filter((message) => message.id !== optimistic.id));
        setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.chat.failed") });
      } finally {
        setIsRunning(false);
      }
    },
    [workspaceSlug, mode, contractId, activeChatId, isRunning, activeModel, mutateChats, t]
  );

  // Power K entry: fire the search as the first turn of a fresh chat
  useEffect(() => {
    if (initialQuery && !initialQuerySent.current) {
      initialQuerySent.current = true;
      void sendMessage(initialQuery);
    }
  }, [initialQuery, sendMessage]);

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = message.content
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("\n");
      await sendMessage(text);
    },
    [sendMessage]
  );

  const runtime = useExternalStoreRuntime<TContractChatMessage>({
    messages,
    isRunning,
    convertMessage: toThreadMessage,
    onNew,
  });

  const handleDeleteChat = async (chatId: string) => {
    try {
      await contractService.deleteChat(workspaceSlug, chatId);
      if (activeChatId === chatId) setActiveChatId(null);
      void mutateChats();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("file_library.contracts.chat.failed") });
    }
  };

  const sourcesContext = useMemo(
    () => ({ workspaceSlug, onOpenContract }),
    [workspaceSlug, onOpenContract]
  );

  const historyList = (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={() => {
          setActiveChatId(null);
          setShowHistory(false);
        }}
        className="mx-2 mt-2 flex items-center justify-center gap-1.5 rounded-md border border-subtle px-2 py-1.5 text-12 font-medium hover:bg-layer-1-hover"
      >
        <Plus className="size-3.5" />
        {t("file_library.contracts.chat.new_chat")}
      </button>
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {(chats ?? []).map((chat: TContractChat) => (
          <div
            key={chat.id}
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1.5 text-12 hover:bg-layer-1-hover",
              activeChatId === chat.id ? "bg-layer-1" : ""
            )}
          >
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left"
              onClick={() => {
                setActiveChatId(chat.id);
                setShowHistory(false);
              }}
            >
              {chat.title || t("file_library.contracts.chat.untitled")}
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteChat(chat.id)}
              className="shrink-0 rounded-sm p-1 text-tertiary opacity-0 hover:text-danger-primary group-hover:opacity-100"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        {(chats ?? []).length === 0 && (
          <p className="px-2 py-4 text-center text-11 text-tertiary">{t("file_library.contracts.chat.no_chats")}</p>
        )}
      </div>
    </div>
  );

  return (
    <ChatSourcesContext.Provider value={sourcesContext}>
      <AssistantRuntimeProvider runtime={runtime}>
        <ContractSourcesToolUI />
        <div className="relative flex h-full min-h-0 w-full">
          {/* history — persistent column on desktop, overlay drawer on mobile/compact */}
          {!compact && (
            <div className="hidden w-56 shrink-0 border-r border-subtle lg:block">{historyList}</div>
          )}
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <div className={cn("flex shrink-0 items-center justify-between border-b border-subtle px-3 py-1.5", compact ? "" : "lg:hidden")}>
              <button
                type="button"
                onClick={() => setShowHistory((value) => !value)}
                className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-12 hover:bg-layer-1-hover"
              >
                <History className="size-3.5" />
                {t("file_library.contracts.chat.history")}
              </button>
              {isRunning && <Loader2 className="size-3.5 animate-spin text-tertiary" />}
            </div>
            <div className="min-h-0 flex-1">
              <ContractChatThread
                emptyTitle={t(
                  mode === "CONTRACT"
                    ? "file_library.contracts.chat.empty_contract_title"
                    : "file_library.contracts.chat.empty_general_title"
                )}
                emptyDescription={t(
                  mode === "CONTRACT"
                    ? "file_library.contracts.chat.empty_contract_description"
                    : "file_library.contracts.chat.empty_general_description"
                )}
                composerAccessory={
                  (modelOptions?.models.length ?? 0) > 0 ? (
                    <label className="flex items-center gap-1.5 text-11 text-tertiary">
                      <Bot className="size-3.5" />
                      <select
                        value={activeModel ?? ""}
                        onChange={(event) => setSelectedModel(event.target.value)}
                        className="cursor-pointer rounded-sm border border-subtle bg-transparent px-1.5 py-0.5 text-11 outline-none hover:bg-layer-1-hover"
                      >
                        {modelOptions?.models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.id} ({model.provider})
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : undefined
                }
              />
            </div>
          </div>
          {/* mobile / compact history drawer */}
          {showHistory && (
            <div className="absolute inset-0 z-10 flex">
              <div className="flex h-full w-64 max-w-[85%] flex-col border-r border-subtle bg-surface-1 shadow-raised-200">
                <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                  <span className="text-12 font-medium">{t("file_library.contracts.chat.history")}</span>
                  <button type="button" onClick={() => setShowHistory(false)} className="rounded-sm p-1 hover:bg-layer-1-hover">
                    <X className="size-3.5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">{historyList}</div>
              </div>
              <button type="button" className="flex-1 bg-black/20" onClick={() => setShowHistory(false)} aria-label="close" />
            </div>
          )}
        </div>
      </AssistantRuntimeProvider>
    </ChatSourcesContext.Provider>
  );
}
