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

  // Create/destroy provider in effect (not during render)
  useEffect(() => {
    // Reset refs when creating new provider (e.g., document switch)
    retryCountRef.current = 0;
    isDisposedRef.current = false;

    const provider = new HocuspocusProvider({
      name: docId,
      token: authToken,
      url: serverUrl,
      onAuthenticationFailed: () => {
        if (isDisposedRef.current) return;
        const error: CollaborationError = { type: "auth-failed", message: "Authentication failed" };
        setStage({ kind: "disconnected", error });
      },
      onConnect: () => {
        if (isDisposedRef.current) {
          provider?.disconnect();
          return;
        }
        retryCountRef.current = 0;
        // After successful connection, transition to awaiting-sync (onSynced will move to synced)
        setStage({ kind: "awaiting-sync" });
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
          setStage({ kind: "awaiting-sync" });
        }
      },
      onSynced: () => {
        if (isDisposedRef.current) return;
        retryCountRef.current = 0;
        // Document sync complete
        setStage({ kind: "synced" });

        let workspaceSlug: string | null = null;
        let projectId: string | null = null;
        let teamspaceId: string | null = null;
        try {
          const urlParams = new URL(serverUrl);
          workspaceSlug = urlParams.searchParams.get("workspaceSlug");
          projectId = urlParams.searchParams.get("projectId");
          teamspaceId = urlParams.searchParams.get("teamspaceId");
        } catch {
          // Ignore malformed URL
        }
        provider.sendStateless(
          JSON.stringify({
            action: "synced",
            workspaceSlug,
            projectId,
            teamspaceId,
          })
        );
      },
    });

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
      const isForcedClose = isForcedCloseCode(closeCode) || forcedCloseSignalRef.current;

      if (isForcedClose) {
        // Server forced close: terminal error
        const error: CollaborationError = {
          type: "forced-close",
          code: closeCode || 0,
          message: "Server forced connection close",
        };
        setStage({ kind: "disconnected", error });

        retryCountRef.current = 0;
        forcedCloseSignalRef.current = false;
        permanentlyStopProvider();
      } else {
        // Transient connection loss: attempt reconnection
        retryCountRef.current++;

        if (retryCountRef.current >= DEFAULT_MAX_RETRIES) {
          // Exceeded max retry attempts
          const error: CollaborationError = {
            type: "max-retries",
            message: `Failed to connect after ${DEFAULT_MAX_RETRIES} attempts`,
          };
          setStage({ kind: "disconnected", error });

          permanentlyStopProvider();
        } else {
          // Still have retries left, move to reconnecting
          setStage({ kind: "reconnecting", attempt: retryCountRef.current });
        }
      }
    };

    provider.on("close", handleClose);

    setYjsSession({ provider, ydoc: provider.document as Y.Doc });

    return () => {
      try {
        provider.off("close", handleClose);
      } catch (error) {
        console.error(`Error unregistering close handler:`, error);
      }
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
