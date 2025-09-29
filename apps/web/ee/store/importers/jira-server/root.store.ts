import { update, set } from "lodash-es";
import { computed, makeObservable, observable } from "mobx";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { JiraConfig } from "@plane/etl/jira";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/jira-server";
// plane web store types
import {
  IImporterBaseStore,
  ImporterBaseStore,
  IImporterJobStore,
  ImporterJobStore,
  IJiraServerAuthStore,
  JiraServerAuthStore,
  IJiraServerDataStore,
  JiraServerDataStore,
} from "@/plane-web/store/importers";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TImporterDataPayload,
  TImporterStepKeys,
  E_IMPORTER_STEPS,
  TImporterStep,
} from "@/plane-web/types/importers/jira-server";

// constants
const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
    resourceId: undefined,
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.MAP_STATES]: {},
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {},
};

export interface IJiraServerStore extends IImporterBaseStore {
  // observables
  dashboardView: boolean;
  stepper: TImporterStepKeys;
  importerData: TImporterDataPayload;
  configData: Partial<JiraConfig>;
  // store instances
  job: IImporterJobStore<JiraConfig>;
  auth: IJiraServerAuthStore;
  data: IJiraServerDataStore;
  // computed
  currentStepIndex: number;
  currentStep: TImporterStep;
  // helper actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  handleSyncJobConfig: <T extends keyof JiraConfig>(key: T, config: JiraConfig[T]) => void;
  resetImporterData: () => void;
}

export class JiraServerStore extends ImporterBaseStore implements IJiraServerStore {
  // observables
  dashboardView: boolean = true;
  stepper: TImporterStepKeys = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
  importerData: TImporterDataPayload = defaultImporterData;
  configData: Partial<JiraConfig> = {};
  // store instances
  job: IImporterJobStore<JiraConfig>;
  auth: IJiraServerAuthStore;
  data: IJiraServerDataStore;

  constructor(public store: RootStore) {
    super(store);

    makeObservable(this, {
      // observables
      dashboardView: observable,
      stepper: observable,
      importerData: observable,
      configData: observable,
      // computed
      currentStepIndex: computed,
      currentStep: computed,
    });

    // store instances
    this.job = new ImporterJobStore<JiraConfig>(E_IMPORTER_KEYS.JIRA_SERVER);
    this.auth = new JiraServerAuthStore(store);
    this.data = new JiraServerDataStore(store);
  }

  // computed
  /**
   * @description Returns the current step index
   * @returns { TImporterStep }
   */
  get currentStepIndex(): number {
    return IMPORTER_STEPS.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Returns the current step
   * @returns { TImporterStep }
   */
  get currentStep(): TImporterStep {
    return IMPORTER_STEPS[this.currentStepIndex];
  }

  // helper actions
  /**
   * @description Handles the dashboard view
   * @returns { void }
   */
  handleDashboardView = (): void => update(this, "dashboardView", (currentView) => !currentView);

  /**
   * @description Handles the stepper
   * @param { "previous" | "next" } direction
   */
  handleStepper = (direction: "previous" | "next"): void => {
    if (direction === "previous") {
      if (this.currentStep.prevStep) set(this, "stepper", this.currentStep.prevStep);
    } else {
      if (this.currentStep.nextStep) set(this, "stepper", this.currentStep.nextStep);
    }
  };

  /**
   * @description Handles the importer data
   * @param { T } key
   * @param { TImporterDataPayload[T] } value
   */
  handleImporterData = <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]): void => {
    if (key == E_IMPORTER_STEPS.CONFIGURE_JIRA) {
      const currentExistingValue = this.importerData[E_IMPORTER_STEPS.CONFIGURE_JIRA];
      const currentValue = value as TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_JIRA];

      if (currentExistingValue.resourceId === undefined && currentExistingValue.projectId === undefined) {
        set(this.importerData, key, value);
      } else if (currentValue.resourceId != currentExistingValue.resourceId) {
        update(this, "importerData", (currentData) => ({
          ...currentData,
          [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
            resourceId: currentValue.resourceId,
            projectId: undefined,
          },
          [E_IMPORTER_STEPS.MAP_STATES]: {},
          [E_IMPORTER_STEPS.MAP_PRIORITY]: {},
        }));
      } else if (currentValue.projectId != currentExistingValue.projectId) {
        update(this, "importerData", (currentData) => ({
          ...currentData,
          [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
            resourceId: currentValue.resourceId,
            projectId: currentValue.projectId,
          },
          [E_IMPORTER_STEPS.MAP_STATES]: {},
          [E_IMPORTER_STEPS.MAP_PRIORITY]: {},
        }));
      }
    } else {
      set(this.importerData, key, value);
    }
  };

  /**
   * @description Handles the sync job config
   * @param { T } key
   * @param { JiraConfig[T] } config
   */
  handleSyncJobConfig = <T extends keyof JiraConfig>(key: T, config: JiraConfig[T]): void => {
    set(this.configData, key, config);
  };

  /**
   * @description Resets importer data
   * @returns { void }
   */
  resetImporterData = (): void => {
    this.dashboardView = true;
    this.stepper = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
    this.importerData = defaultImporterData;
    this.configData = {};
  };
}
