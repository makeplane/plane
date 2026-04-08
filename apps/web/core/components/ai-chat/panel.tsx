import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Sparkles, X, Send, Trash2 } from "lucide-react";
import { cn } from "@plane/utils";
import { useAiChat } from "@/hooks/store/use-ai-chat";
import type { TAiChatMessage } from "@/store/ai-chat.store";

const MessageBubble = ({ message }: { message: TAiChatMessage }) => {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "text-sm max-w-[80%] rounded-xl px-3 py-2",
          isUser ? "bg-accent-primary text-white" : "bg-surface-2 text-primary"
        )}
      >
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-white/20 pt-2">
            {message.actions.map((action) => (
              <div key={action.tool} className="text-xs opacity-80">
                ✅ {action.result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <div className="flex gap-1">
        <span className="bg-secondary h-2 w-2 animate-bounce rounded-full [animation-delay:0ms]" />
        <span className="bg-secondary h-2 w-2 animate-bounce rounded-full [animation-delay:150ms]" />
        <span className="bg-secondary h-2 w-2 animate-bounce rounded-full [animation-delay:300ms]" />
      </div>
    </div>
  </div>
);

export const AiChatPanel = observer(function AiChatPanel() {
  const { workspaceSlug } = useParams();
  const { isOpen, isLoading, messages, togglePanel, sendMessage, clearMessages } = useAiChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || !workspaceSlug) return;
    setInput("");
    await sendMessage(workspaceSlug.toString(), text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-20 cursor-default"
        onClick={() => togglePanel(false)}
        aria-label="Close AI Assistant"
      />
      <div className="shadow-xl fixed top-0 right-0 z-30 flex h-screen w-96 flex-col border-l border-subtle bg-surface-1">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-primary" />
            <span className="text-sm font-medium text-primary">AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="rounded p-1 text-secondary hover:bg-layer-transparent-hover hover:text-primary"
                title="Очистить чат"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => togglePanel(false)}
              className="rounded p-1 text-secondary hover:bg-layer-transparent-hover hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="h-8 w-8 text-accent-primary opacity-50" />
              <p className="text-sm text-secondary">Чем могу помочь?</p>
              <div className="space-y-2">
                {["Покажи все проекты", "Создай задачу «Найти кейтеринг»", "Какие задачи на этой неделе?"].map(
                  (hint) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="text-xs hover:border-accent-primary block w-full rounded-lg border border-subtle px-3 py-2 text-left text-secondary hover:text-primary"
                    >
                      {hint}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-subtle p-3">
          <div className="focus-within:border-accent-primary flex items-end gap-2 rounded-xl border border-subtle bg-surface-2 px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напиши запрос... (Enter — отправить)"
              rows={1}
              className="text-sm max-h-32 flex-1 resize-none bg-transparent text-primary outline-none placeholder:text-secondary"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="rounded-lg p-1.5 text-accent-primary hover:bg-layer-transparent-hover disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs mt-1 text-center text-secondary">Shift+Enter — новая строка</p>
        </div>
      </div>
    </>
  );
});
