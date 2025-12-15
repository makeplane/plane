import React, { createContext, useContext } from "react";
// hooks
import { useYjsSetup } from "@/hooks/use-yjs-setup";

export type TCollabValue = NonNullable<ReturnType<typeof useYjsSetup>>;

const CollabContext = createContext<TCollabValue | null>(null);

type CollabProviderProps = Parameters<typeof useYjsSetup>[0] & {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function CollaborationProvider({ fallback = null, children, ...args }: CollabProviderProps) {
  const setup = useYjsSetup(args);

  // Only wait for provider setup, not content ready
  // Consumers can check state.isDocReady to gate content rendering
  if (!setup) {
    return <>{fallback}</>;
  }

  return <CollabContext.Provider value={setup}>{children}</CollabContext.Provider>;
}

export function useCollaboration(): TCollabValue {
  const ctx = useContext(CollabContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used inside <CollaborationProvider>");
  }
  return ctx; // guaranteed non-null
}
