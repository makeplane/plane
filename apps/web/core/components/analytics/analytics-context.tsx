"use client";

import React, { createContext, useContext } from "react";

type AnalyticsWorkspaceContextValue = {
  workspaceSlug: string;
};

const AnalyticsWorkspaceContext = createContext<AnalyticsWorkspaceContextValue | null>(null);

export const AnalyticsWorkspaceProvider: React.FC<{ workspaceSlug: string; children: React.ReactNode }> = ({
  workspaceSlug,
  children,
}) => {
  return <AnalyticsWorkspaceContext.Provider value={{ workspaceSlug }}>{children}</AnalyticsWorkspaceContext.Provider>;
};

export const useAnalyticsWorkspace = () => {
  const ctx = useContext(AnalyticsWorkspaceContext);
  if (!ctx) throw new Error("useAnalyticsWorkspace must be used within AnalyticsWorkspaceProvider");
  return ctx;
};
