import { update, set } from "lodash-es";
import { computed, makeObservable, observable } from "mobx";
import { AsanaConfig } from "@plane/etl/asana";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
// plane web constants
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/asana";
// plane web store types
import {
  IImporterBaseStore,
  ImporterBaseStore,
  IImporterJobStore,
  ImporterJobStore,
  IAsanaAuthStore,
  AsanaAuthStore,
  IAsanaDataStore,
  AsanaDataStore,
} from "@/plane-web/store/importers";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TImporterDataPayload,
  TImporterStepKeys,
  E_IMPORTER_STEPS,
  TImporterStep,
} from "@/plane-web/types/importers/asana";

// constants
const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.CONFIGURE_ASANA]: {
    workspaceGid: undefined,
    projectGid: undefined,
  },
  [E_IMPORTER_STEPS.MAP_STATES]: {},
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    customFieldGid: undefined,
    priorityMap: {},
  },
};

export interface IAsanaStore extends IImporterBaseStore {
  // observables
  dashboardView: boolean;
  stepper: TImporterStepKeys;
  importerData: TImporterDataPayload;
  configData: Partial<AsanaConfig>;
  // store instances
  job: IImporterJobStore<AsanaConfig>;
  auth: IAsanaAuthStore;
  data: IAsanaDataStore;
  // computed
  currentStepIndex: number;
  currentStep: TImporterStep;
  // helper actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  handleSyncJobConfig: <T extends keyof AsanaConfig>(key: T, config: AsanaConfig[T]) => void;
  resetImporterData: () => void;
}

export class AsanaStore extends ImporterBaseStore implements IAsanaStore {
  // observables
  dashboardView: boolean = true;
  stepper: TImporterStepKeys = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
  importerData: TImporterDataPayload = defaultImporterData;
  configData: Partial<AsanaConfig> = {};
  // store instances
  job: IImporterJobStore<AsanaConfig>;
  auth: IAsanaAuthStore;
  data: IAsanaDataStore;

  constructor(public store: RootStore) {
    super(store);

    makeObservable(this, {
      // observables
      dashboardView: observable.ref,
      stepper: observable.ref,
      importerData: observable,
      configData: observable,
      // computed
      currentStepIndex: computed,
      currentStep: computed,
    });

    // store instances
    this.job = new ImporterJobStore<AsanaConfig>(E_IMPORTER_KEYS.ASANA);
    this.auth = new AsanaAuthStore(store);
    this.data = new AsanaDataStore(store);
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
    if (key == E_IMPORTER_STEPS.CONFIGURE_ASANA) {
      const currentExistingValue = this.importerData[E_IMPORTER_STEPS.CONFIGURE_ASANA];
      const currentValue = value as TImporterDataPayload[E_IMPORTER_STEPS.CONFIGURE_ASANA];

      if (currentExistingValue.workspaceGid === undefined && currentExistingValue.projectGid === undefined) {
        set(this.importerData, key, value);
      } else if (currentValue.workspaceGid != currentExistingValue.workspaceGid) {
        update(this, "importerData", (currentData) => ({
          ...currentData,
          [E_IMPORTER_STEPS.CONFIGURE_ASANA]: {
            workspaceGid: currentValue.workspaceGid,
            projectGid: undefined,
          },
          [E_IMPORTER_STEPS.MAP_STATES]: {},
          [E_IMPORTER_STEPS.MAP_PRIORITY]: {
            customFieldGid: undefined,
            priorityMap: {},
          },
        }));
      } else if (currentValue.projectGid != currentExistingValue.projectGid) {
        update(this, "importerData", (currentData) => ({
          ...currentData,
          [E_IMPORTER_STEPS.CONFIGURE_ASANA]: {
            workspaceGid: currentValue.workspaceGid,
            projectGid: currentValue.projectGid,
          },
          [E_IMPORTER_STEPS.MAP_STATES]: {},
          [E_IMPORTER_STEPS.MAP_PRIORITY]: {
            customFieldGid: undefined,
            priorityMap: {},
          },
        }));
      }
    } else {
      set(this.importerData, key, value);
    }
  };

  /**
   * @description Handles the sync job config
   * @param { T } key
   * @param { AsanaConfig[T] } config
   */
  handleSyncJobConfig = <T extends keyof AsanaConfig>(key: T, config: AsanaConfig[T]): void => {
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
