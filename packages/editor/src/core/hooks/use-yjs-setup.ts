import { HocuspocusProvider } from "@hocuspocus/provider";
// react
import { useCallback, useEffect, useRef, useState } from "react";
// indexeddb
import { IndexeddbPersistence } from "y-indexeddb";
// yjs
import type * as Y from "yjs";
// types
import type { CollaborationState, CollabStage, CollaborationError } from "@/types/collaboration";

// Helper to check if a close code indicates a forced close
const isForcedCloseCode = (code: number | undefined): boolean => {
  if (!code) return false;
  // All custom close codes (4000-4003) are treated as forced closes
  return code >= 4000 && code <= 4003;
};

type UseYjsSetupArgs = {
  docId: string;
  serverUrl: string;
  authToken: string;
  onStateChange?: (state: CollaborationState) => void;
  options?: {
    maxConnectionAttempts?: number;
  };
};

const DEFAULT_MAX_RETRIES = 3;

export const useYjsSetup = ({ docId, serverUrl, authToken, onStateChange }: UseYjsSetupArgs) => {
  // Current collaboration stage
  const [stage, setStage] = useState<CollabStage>({ kind: "initial" });

  // Cache readiness state
  const [hasCachedContent, setHasCachedContent] = useState(false);
  const [isCacheReady, setIsCacheReady] = useState(false);

  // Provider and Y.Doc in state (nullable until effect runs)
  const [yjsSession, setYjsSession] = useState<{ provider: HocuspocusProvider; ydoc: Y.Doc } | null>(null);

  // Use refs for values that need to be mutated from callbacks
  const retryCountRef = useRef(0);
  const forcedCloseSignalRef = useRef(false);
  const isDisposedRef = useRef(false);
  const stageRef = useRef<CollabStage>({ kind: "initial" });
  const lastReconnectTimeRef = useRef(0);

  // Create/destroy provider in effect (not during render)
  useEffect(() => {
    // Reset refs when creating new provider (e.g., document switch)
    retryCountRef.current = 0;
    isDisposedRef.current = false;
    forcedCloseSignalRef.current = false;
    stageRef.current = { kind: "initial" };

    const provider = new HocuspocusProvider({
      name: docId,
      token: authToken,
      url: serverUrl,
      onAuthenticationFailed: () => {
        if (isDisposedRef.current) return;
        const error: CollaborationError = { type: "auth-failed", message: "Authentication failed" };
        const newStage = { kind: "disconnected" as const, error };
        stageRef.current = newStage;
        setStage(newStage);
      },
      onConnect: () => {
        if (isDisposedRef.current) {
          provider?.disconnect();
          return;
        }
        retryCountRef.current = 0;
        // After successful connection, transition to awaiting-sync (onSynced will move to synced)
        const newStage = { kind: "awaiting-sync" as const };
        stageRef.current = newStage;
        setStage(newStage);
      },
      onStatus: ({ status: providerStatus }) => {
        if (isDisposedRef.current) return;
        if (providerStatus === "connecting") {
          // Derive whether this is initial connect or reconnection from retry count
          const isReconnecting = retryCountRef.current > 0;
          setStage(isReconnecting ? { kind: "reconnecting", attempt: retryCountRef.current } : { kind: "connecting" });
        } else if (providerStatus === "disconnected") {
          // Do not transition here; let handleClose decide the final stage
        } else if (providerStatus === "connected") {
          // Connection succeeded, move to awaiting-sync
          const newStage = { kind: "awaiting-sync" as const };
          stageRef.current = newStage;
          setStage(newStage);
        }
      },
      onSynced: () => {
        if (isDisposedRef.current) return;
        retryCountRef.current = 0;
        // Document sync complete
        const newStage = { kind: "synced" as const };
        stageRef.current = newStage;
        setStage(newStage);
      },
    });

    const pauseProvider = () => {
      const wsProvider = provider.configuration.websocketProvider;
      if (wsProvider) {
        try {
          wsProvider.shouldConnect = false;
          wsProvider.disconnect();
        } catch (error) {
          console.error(`Error pausing websocketProvider:`, error);
        }
      }
    };

    const permanentlyStopProvider = () => {
      isDisposedRef.current = true;

      const wsProvider = provider.configuration.websocketProvider;
      if (wsProvider) {
        try {
          wsProvider.shouldConnect = false;
          wsProvider.disconnect();
          wsProvider.destroy();
        } catch (error) {
          console.error(`Error tearing down websocketProvider:`, error);
        }
      }
      try {
        provider.destroy();
      } catch (error) {
        console.error(`Error destroying provider:`, error);
      }
    };

    const handleClose = (closeEvent: { event?: { code?: number; reason?: string } }) => {
      if (isDisposedRef.current) return;

      const closeCode = closeEvent.event?.code;
      const wsProvider = provider.configuration.websocketProvider;
      const shouldConnect = wsProvider.shouldConnect;
      const isForcedClose = isForcedCloseCode(closeCode) || forcedCloseSignalRef.current || shouldConnect === false;

      if (isForcedClose) {
        // Determine if this is a manual disconnect or a permanent error
        const isManualDisconnect = shouldConnect === false;

        const error: CollaborationError = {
          type: "forced-close",
          code: closeCode || 0,
          message: isManualDisconnect ? "Manually disconnected" : "Server forced connection close",
        };
        const newStage = { kind: "disconnected" as const, error };
        stageRef.current = newStage;
        setStage(newStage);

        retryCountRef.current = 0;
        forcedCloseSignalRef.current = false;

        // Only pause if it's a real forced close (not manual disconnect)
        // Manual disconnect leaves it as is (shouldConnect=false already set if manual)
        if (!isManualDisconnect) {
          pauseProvider();
        }
      } else {
        // Transient connection loss: attempt reconnection
        retryCountRef.current++;

        if (retryCountRef.current >= DEFAULT_MAX_RETRIES) {
          // Exceeded max retry attempts
          const error: CollaborationError = {
            type: "max-retries",
            message: `Failed to connect after ${DEFAULT_MAX_RETRIES} attempts`,
          };
          const newStage = { kind: "disconnected" as const, error };
          stageRef.current = newStage;
          setStage(newStage);

          pauseProvider();
        } else {
          // Still have retries left, move to reconnecting
          const newStage = { kind: "reconnecting" as const, attempt: retryCountRef.current };
          stageRef.current = newStage;
          setStage(newStage);
        }
      }
    };

    provider.on("close", handleClose);

    setYjsSession({ provider, ydoc: provider.document });

    // Handle page visibility changes (sleep/wake, tab switching)
    const handleVisibilityChange = (event?: Event) => {
      if (isDisposedRef.current) return;

      const isVisible = document.visibilityState === "visible";
      const isFocus = event?.type === "focus";

      if (isVisible || isFocus) {
        // Throttle reconnection attempts to avoid double-firing (visibility + focus)
        const now = Date.now();
        if (now - lastReconnectTimeRef.current < 1000) {
          return;
        }

        const wsProvider = provider.configuration.websocketProvider;
        if (!wsProvider) return;

        const ws = wsProvider.webSocket;
        const isStale = ws?.readyState === WebSocket.CLOSED || ws?.readyState === WebSocket.CLOSING;

        // If disconnected or stale, re-enable reconnection and force reconnect
        if (isStale || stageRef.current.kind === "disconnected") {
          lastReconnectTimeRef.current = now;

          // Re-enable connection on tab focus (even if manually disconnected before sleep)
          wsProvider.shouldConnect = true;

          // Reset retry count for fresh reconnection attempt
          retryCountRef.current = 0;

          // Move to connecting state
          const newStage = { kind: "connecting" as const };
          stageRef.current = newStage;
          setStage(newStage);

          wsProvider.disconnect();
          wsProvider.connect();
        }
      }
    };

    // Handle online/offline events
    const handleOnline = () => {
      if (isDisposedRef.current) return;

      const wsProvider = provider.configuration.websocketProvider;
      if (wsProvider) {
        wsProvider.shouldConnect = true;
        wsProvider.disconnect();
        wsProvider.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      try {
        provider.off("close", handleClose);
      } catch (error) {
        console.error(`Error unregistering close handler:`, error);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);

      permanentlyStopProvider();
    };
  }, [docId, serverUrl, authToken]);

  // IndexedDB persistence lifecycle
  useEffect(() => {
    if (!yjsSession) return;

    const idbPersistence = new IndexeddbPersistence(docId, yjsSession.provider.document);

    const onIdbSynced = () => {
      const yFragment = idbPersistence.doc.getXmlFragment("default");
      const docLength = yFragment?.length ?? 0;
      setIsCacheReady(true);
      setHasCachedContent(docLength > 0);
    };

    idbPersistence.on("synced", onIdbSynced);

    return () => {
      idbPersistence.off("synced", onIdbSynced);
      try {
        idbPersistence.destroy();
      } catch (error) {
        console.error(`Error destroying local provider:`, error);
      }
    };
  }, [docId, yjsSession]);

  // Observe Y.Doc content changes to update hasCachedContent (catches fallback scenario)
  useEffect(() => {
    if (!yjsSession || !isCacheReady) return;

    const fragment = yjsSession.ydoc.getXmlFragment("default");
    let lastHasContent = false;

    const updateCachedContentFlag = () => {
      const len = fragment?.length ?? 0;
      const hasContent = len > 0;

      // Only update state if the boolean value actually changed
      if (hasContent !== lastHasContent) {
        lastHasContent = hasContent;
        setHasCachedContent(hasContent);
      }
    };
    // Initial check (handles fallback content loaded before this effect runs)
    updateCachedContentFlag();

    // Use observeDeep to catch nested changes (keystrokes modify Y.XmlText inside Y.XmlElement)
    fragment.observeDeep(updateCachedContentFlag);

    return () => {
      try {
        fragment.unobserveDeep(updateCachedContentFlag);
      } catch (error) {
        console.error("Error unobserving fragment:", error);
      }
    };
  }, [yjsSession, isCacheReady]);

  // Notify state changes callback (use ref to avoid dependency on handler)
  const stateChangeCallbackRef = useRef(onStateChange);
  stateChangeCallbackRef.current = onStateChange;

  useEffect(() => {
    if (!stateChangeCallbackRef.current) return;

    const isServerSynced = stage.kind === "synced";
    const isServerDisconnected = stage.kind === "disconnected";

    const state: CollaborationState = {
      stage,
      isServerSynced,
      isServerDisconnected,
    };

    stateChangeCallbackRef.current(state);
  }, [stage]);

  // Derived values for convenience
  const isServerSynced = stage.kind === "synced";
  const isServerDisconnected = stage.kind === "disconnected";
  const isDocReady = isServerSynced || isServerDisconnected || (isCacheReady && hasCachedContent);

  const signalForcedClose = useCallback((value: boolean) => {
    forcedCloseSignalRef.current = value;
  }, []);

  // Don't return anything until provider is ready - guarantees non-null provider
  if (!yjsSession) {
    return null;
  }

  return {
    provider: yjsSession.provider,
    ydoc: yjsSession.ydoc,
    state: {
      stage,
      hasCachedContent,
      isCacheReady,
      isServerSynced,
      isServerDisconnected,
      isDocReady,
    },
    actions: {
      signalForcedClose,
    },
  };
};
