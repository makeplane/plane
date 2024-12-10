"use client";

import { createContext, Dispatch, ReactNode, SetStateAction, useState } from "react";
import { LinearConfig } from "@silo/linear";
// silo hooks
import { useBaseImporter } from "@/plane-web/silo/hooks";
// silo constants
import { IMPORTER_STEPS } from "@/plane-web/silo/linear/constants/steps";
// silo services
import { ImporterAuthService } from "@/plane-web/silo/linear/services/auth.service";
import { LinearService } from "@/plane-web/silo/linear/services/linear.service";
// silo types
import {
  E_IMPORTER_STEPS,
  TImporterStepKeys,
  TImporterStep,
  TImporterDataPayload,
} from "@/plane-web/silo/linear/types";

type TImporterCreateContext = {
  // services
  importerAuthService: ImporterAuthService;
  linearService: LinearService;
  // stepper state management
  currentStep: TImporterStep;
  currentStepIndex: number;
  handleStepper: (direction: "previous" | "next") => void;
  // state
  importerData: TImporterDataPayload;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  syncJobConfig: Partial<LinearConfig>;
  handleSyncJobConfig: <T extends keyof LinearConfig>(key: T, config: LinearConfig[T]) => void;
  resetImporterData: () => void;
  setDashboardView: Dispatch<SetStateAction<boolean>>;
};

export const ImporterContext = createContext<TImporterCreateContext>({} as TImporterCreateContext);

const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.CONFIGURE_LINEAR]: {
    teamId: undefined,
  },
  [E_IMPORTER_STEPS.MAP_STATES]: {},
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
  const linearService = new LinearService(siloBaseUrl);
  // states
  const [stepper, setStepper] = useState<TImporterStepKeys>(E_IMPORTER_STEPS.SELECT_PLANE_PROJECT);
  const [importerData, setImporterData] = useState<TImporterDataPayload>(defaultImporterData);
  const [syncJobConfig, setSyncJobConfig] = useState<Partial<LinearConfig>>({});

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

  const handleSyncJobConfig = <T extends keyof LinearConfig>(key: T, config: LinearConfig[T]) => {
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
        linearService,
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
