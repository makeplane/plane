"use client";

import { createContext, ReactNode } from "react";

type TImporterCreateContext = {
  // default props
  workspaceSlug: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  serviceToken: string;
  apiBaseUrl: string;
  siloBaseUrl: string;
};

export const ImporterBaseContext = createContext<TImporterCreateContext>({} as TImporterCreateContext);

type TImporterBaseContextProvider = {
  workspaceSlug: string;
  workspaceId: string;
  userId: string;
  userEmail: string;
  serviceToken: string;
  apiBaseUrl: string;
  siloBaseUrl: string;
  children: ReactNode;
};

export const ImporterBaseContextProvider = (props: TImporterBaseContextProvider) => {
  const { workspaceSlug, workspaceId, userId, userEmail, serviceToken, apiBaseUrl, siloBaseUrl, children } = props;

  return (
    <ImporterBaseContext.Provider
      value={{
        workspaceSlug,
        workspaceId,
        userId,
        userEmail,
        serviceToken,
        apiBaseUrl,
        siloBaseUrl,
      }}
    >
      {children}
    </ImporterBaseContext.Provider>
  );
};

export default ImporterBaseContextProvider;
