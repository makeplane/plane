"use client";

import { createContext, Dispatch, ReactNode, SetStateAction, useState } from "react";
import { JiraConfig } from "@silo/jira";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
// silo constants
import { IMPORTER_STEPS } from "@/plane-web/silo/jira/constants/steps";
// silo services
import { ImporterAuthService } from "@/plane-web/silo/jira/services/auth.service";
import { JiraService } from "@/plane-web/silo/jira/services/jira.service";
// silo types
import {
  E_IMPORTER_STEPS,
  TImporterStepKeys,
  TImporterStep,
  TImporterDataPayload,
  E_FORM_RADIO_DATA,
} from "@/plane-web/silo/jira/types";

type TImporterCreateContext = {
  // services
  importerAuthService: ImporterAuthService;
  jiraService: JiraService;
  // stepper state management
  currentStep: TImporterStep;
  currentStepIndex: number;
  handleStepper: (direction: "previous" | "next") => void;
  // state
  importerData: TImporterDataPayload;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  syncJobConfig: Partial<JiraConfig>;
  handleSyncJobConfig: <T extends keyof JiraConfig>(key: T, config: JiraConfig[T]) => void;
  resetImporterData: () => void;
  setDashboardView: Dispatch<SetStateAction<boolean>>;
};

export const ImporterContext = createContext<TImporterCreateContext>({} as TImporterCreateContext);

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

type TImporterContext = {
  setDashboardView: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
};

export const ImporterContextProvider = (props: TImporterContext) => {
  // props
  const { setDashboardView, children } = props;
  // hooks
  const { siloBaseUrl } = useBaseImporter();
  // initiating services
  const importerAuthService = new ImporterAuthService(siloBaseUrl);
  const jiraService = new JiraService(siloBaseUrl);
  // states
  const [stepper, setStepper] = useState<TImporterStepKeys>(E_IMPORTER_STEPS.SELECT_PLANE_PROJECT);
  const [importerData, setImporterData] = useState<TImporterDataPayload>(defaultImporterData);
  const [syncJobConfig, setSyncJobConfig] = useState<Partial<JiraConfig>>({
    issueType: E_FORM_RADIO_DATA.CREATE_AS_LABEL,
  });

  // derived values
  const currentStepIndex = IMPORTER_STEPS.findIndex((step) => step.key === stepper);
  const currentStep = IMPORTER_STEPS[currentStepIndex];

  // handlers
  const handleStepper = (direction: "previous" | "next") => {
    if (direction === "previous") {
      if (currentStep.prevStep) setStepper(currentStep.prevStep);
    } else {
      if (currentStep.nextStep) setStepper(currentStep.nextStep);
    }
  };

  const handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void = (
    key,
    value
  ) => {
    setImporterData((prevData) => ({ ...prevData, [key]: value }));
  };

  const handleSyncJobConfig = <T extends keyof JiraConfig>(key: T, config: JiraConfig[T]) => {
    setSyncJobConfig((prevConfig) => ({ ...prevConfig, [key]: config }));
  };

  const resetImporterData = () => {
    setImporterData(defaultImporterData);
    setSyncJobConfig({});
  };

  return (
    <ImporterContext.Provider
      value={{
        importerAuthService,
        jiraService,
        currentStep,
        currentStepIndex,
        handleStepper,
        importerData,
        handleImporterData,
        syncJobConfig,
        handleSyncJobConfig,
        resetImporterData,
        setDashboardView,
      }}
    >
      {children}
    </ImporterContext.Provider>
  );
};

export default ImporterContext;
