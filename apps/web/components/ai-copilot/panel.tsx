/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ChevronLeftOutline, ChevronRightOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { useCopilot } from "@/hooks/store/use-copilot";
// local imports
import { Composer } from "./composer";
import { MessageList } from "./message-list";

export const PANEL_MIN_WIDTH = 320;
export const PANEL_MAX_WIDTH = 640;
const PANEL_WIDTH_STORAGE_KEY = "copilot_panel_width";

type Props = {
  workspaceSlug: string;
  projectId: string;
  sessionId: string | undefined;
  loading: boolean;
  error: string | null;
};

export const CopilotPanel = observer(function CopilotPanel(props: Props) {
  const { workspaceSlug, projectId, sessionId, loading, error } = props;
  const { t } = useTranslation();
  const store = useCopilot();
  const { panelOpen, panelWidth, messages, streamStatus, hasRunningTurn } = store;
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Restore the persisted width once.
  useEffect(() => {
    const stored = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
    if (stored) {
      const width = parseInt(stored, 10);
      if (!Number.isNaN(width)) store.setPanelWidth(clampWidth(width));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to the latest message unless the user scrolled up to read history.
  useEffect(() => {
    const element = listRef.current;
    if (!element || userScrolledUpRef.current) return;
    element.scrollTop = element.scrollHeight;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const element = listRef.current;
    if (!element) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 48;
  }, []);

  const handleDragStart = useCallback(
    (event: React.PointerEvent) => {
      dragStateRef.current = { startX: event.clientX, startWidth: panelWidth };
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [panelWidth]
  );

  const handleDragMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      // Dragging left (decreasing clientX) widens the panel.
      const nextWidth = drag.startWidth + (drag.startX - event.clientX);
      store.setPanelWidth(clampWidth(nextWidth));
    },
    [store]
  );

  const handleDragEnd = useCallback(() => {
    if (dragStateRef.current) {
      localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelRef.current?.offsetWidth ?? store.panelWidth));
    }
    dragStateRef.current = null;
  }, [store]);

  const handleSend = useCallback(
    (content: string) => {
      if (!sessionId) return;
      void store.sendMessage(workspaceSlug, projectId, sessionId, content);
    },
    [store, workspaceSlug, projectId, sessionId]
  );

  const handleStop = useCallback(() => {
    if (!sessionId) return;
    void store.stop(workspaceSlug, projectId, sessionId);
  }, [store, workspaceSlug, projectId, sessionId]);

  const isStreaming = streamStatus === "streaming";

  if (!panelOpen) return null;

  return (
    <div
      ref={panelRef}
      className="relative flex h-full flex-col border-l border-subtle bg-surface-1"
      style={{ width: panelWidth }}
      data-testid="copilot-panel"
    >
      {/* resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("copilot.title")}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-accent-primary/40"
      />
      {/* header */}
      <div className="flex h-11 w-full items-center justify-between border-b border-subtle px-3 py-2">
        <span className="text-sm font-medium text-primary">{t("copilot.title")}</span>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={t("copilot.collapse")}
          icon={<ChevronRightOutline />}
          onClick={() => store.togglePanel(false)}
        />
      </div>
      {/* body */}
      {loading ? (
        <div className="text-sm flex h-full w-full items-center justify-center text-secondary">
          {t("copilot.loading")}
        </div>
      ) : error ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
          <span className="text-sm text-error-primary font-medium">{t("copilot.error_state.title")}</span>
          <span className="text-sm text-secondary">{t("copilot.error_state.description")}</span>
        </div>
      ) : (
        <div ref={listRef} onScroll={handleScroll} className="flex h-full w-full flex-col overflow-hidden">
          <MessageList messages={messages} />
        </div>
      )}
      {/* composer */}
      <Composer
        disabled={!sessionId || loading || !!error || hasRunningTurn}
        isStreaming={isStreaming}
        onSend={handleSend}
        onStop={handleStop}
      />
    </div>
  );
});

export function clampWidth(width: number): number {
  return Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, width));
}

export const CopilotPanelToggle = observer(function CopilotPanelToggle() {
  const { t } = useTranslation();
  const store = useCopilot();
  return (
    <IconButton
      variant="ghost"
      size="sm"
      aria-label={t("copilot.open")}
      icon={<ChevronLeftOutline />}
      onClick={() => store.togglePanel(true)}
    />
  );
});
