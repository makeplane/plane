/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "../utils";
import type { AICommandPaletteProps } from "./helper";

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const AICommandPalette = React.forwardRef(function AICommandPalette(
  {
    open,
    onOpenChange,
    aiMode = false,
    onAIModeChange,
    onAIQuery,
    isAILoading = false,
    placeholder = "Search commands…",
    aiPlaceholder = "Ask AI anything…",
    children,
    className,
  }: AICommandPaletteProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [aiQuery, setAiQuery] = React.useState("");
  const aiInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (aiMode) aiInputRef.current?.focus();
  }, [aiMode]);

  if (open === false) return null;

  const toggleAI = () => onAIModeChange?.(!aiMode);
  const close = () => onOpenChange?.(false);

  const handleAIKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Enter" && aiQuery.trim() && !isAILoading) {
      onAIQuery?.(aiQuery.trim());
    }
    if (e.key === "Tab") {
      e.preventDefault();
      toggleAI();
    }
  };

  return (
    <div ref={ref} className={cn("shadow-lg overflow-hidden rounded-lg border border-subtle bg-layer-3", className)}>
      {/*
       * CommandPrimitive stays mounted at all times so cmdk's internal store
       * context is never torn down mid-render when switching modes.
       */}
      <CommandPrimitive shouldFilter={!aiMode}>
        {/* ── Header ──────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center gap-2 border-b border-subtle px-3 transition-colors",
            aiMode ? "bg-accent-subtle" : "bg-layer-3"
          )}
        >
          {aiMode ? (
            <SparkleIcon className="shrink-0 text-accent-primary" />
          ) : (
            <SearchIcon className="shrink-0 text-tertiary" />
          )}

          {/* AI mode text input — plain <input>, not cmdk-aware */}
          {aiMode && (
            <input
              ref={aiInputRef}
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={handleAIKeyDown}
              placeholder={aiPlaceholder}
              className="placeholder-tertiary flex-1 bg-transparent py-3 text-13 text-primary focus:outline-none"
              autoComplete="off"
              aria-label="AI query"
            />
          )}

          {/* Normal mode cmdk input — must live inside CommandPrimitive */}
          {!aiMode && (
            <CommandPrimitive.Input
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  close();
                  return;
                }
                if (e.key === "Tab") {
                  e.preventDefault();
                  toggleAI();
                }
              }}
              className="placeholder-tertiary flex-1 bg-transparent py-3 text-13 text-primary focus:outline-none"
            />
          )}

          {isAILoading && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 animate-spin text-accent-primary"
              aria-hidden
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>

        {/* ── Normal search results ────────────────────────────── */}
        {!aiMode && <CommandPrimitive.List className="max-h-72 overflow-y-auto py-1">{children}</CommandPrimitive.List>}

        {/* ── AI response area ─────────────────────────────────── */}
        {aiMode && (
          <div className="min-h-16 px-3 py-3 text-13">
            {isAILoading ? (
              <span className="text-tertiary italic">Thinking…</span>
            ) : (
              <span className="text-tertiary">
                {aiQuery.trim() ? "Press Enter to send" : "Type your question above"}
              </span>
            )}
          </div>
        )}
      </CommandPrimitive>

      {/* ── Footer (outside CommandPrimitive to avoid event capture) ── */}
      <div className="flex items-center gap-3 border-t border-subtle px-3 py-2 text-11 text-tertiary">
        <button
          type="button"
          onClick={toggleAI}
          className={cn(
            "rounded px-1.5 py-0.5 text-11 font-medium transition-colors",
            aiMode
              ? "text-on-accent bg-accent-primary hover:opacity-90"
              : "bg-layer-4 hover:bg-layer-5 text-secondary hover:text-primary"
          )}
        >
          AI
        </button>
        <span>
          <kbd className="font-mono rounded border border-subtle bg-layer-2 px-1">Tab</kbd>{" "}
          {aiMode ? "exit AI" : "AI mode"}
        </span>
        {aiMode && (
          <span>
            <kbd className="font-mono rounded border border-subtle bg-layer-2 px-1">↵</kbd> send
          </span>
        )}
        <span className="ml-auto">
          <kbd className="font-mono rounded border border-subtle bg-layer-2 px-1">Esc</kbd> close
        </span>
      </div>
    </div>
  );
});

AICommandPalette.displayName = "ai-command-palette";

export { AICommandPalette };
