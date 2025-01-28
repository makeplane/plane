"use client";

import { createContext, ReactNode, useState } from "react";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
// silo services
import { IntegrationAuthService } from "@/plane-web/silo/integrations/github/services/auth.service";
import { GitHubService } from "@/plane-web/silo/integrations/github/services/github.service";
// silo types
import { E_IMPORTER_STEPS, TImporterDataPayload, E_FORM_RADIO_DATA } from "@/plane-web/silo/jira/types";

type TImporterCreateContext = {
  // services
  integrationAuthService: IntegrationAuthService;
  gitHubService: GitHubService;
  // state
  importerData: TImporterDataPayload;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  resetImporterData: () => void;
};

export const IntegrationContext = createContext<TImporterCreateContext>({} as TImporterCreateContext);

const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
    resourceId: undefined,
    projectId: undefined,
    issueType: E_FORM_RADIO_DATA.CREATE_AS_LABEL,
  },
  [E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA]: {
    userSkipToggle: false,
    userData: undefined,
  },
  [E_IMPORTER_STEPS.MAP_STATES]: {},
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {},
};

type TIntegrationContext = {
  children: ReactNode;
};

export const IntegrationContextProvider = (props: TIntegrationContext) => {
  // props
  const { children } = props;
  // hooks
  const { siloBaseUrl } = useBaseImporter();
  // initiating services
  const integrationAuthService = new IntegrationAuthService(siloBaseUrl);
  const gitHubService = new GitHubService(siloBaseUrl);
  // states
  const [importerData, setImporterData] = useState<TImporterDataPayload>(defaultImporterData);

  const handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void = (
    key,
    value
  ) => {
    setImporterData((prevData) => ({ ...prevData, [key]: value }));
  };

  const resetImporterData = () => {
    setImporterData(defaultImporterData);
  };

  return (
    <IntegrationContext.Provider
      value={{
        integrationAuthService,
        gitHubService,
        importerData,
        handleImporterData,
        resetImporterData,
      }}
    >
      {children}
    </IntegrationContext.Provider>
  );
};

export default IntegrationContext;
