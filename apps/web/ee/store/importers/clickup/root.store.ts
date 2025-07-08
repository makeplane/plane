import set from "lodash/set";
import update from "lodash/update";
import { computed, makeObservable, observable } from "mobx";
import { TClickUpConfig } from "@plane/etl/clickup";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
// plane web constants
import { IMPORTER_CLICKUP_STEPS } from "@/plane-web/constants/importers/clickup";
// plane web store types
import {
  IImporterBaseStore,
  ImporterBaseStore,
  IImporterJobStore,
  ImporterJobStore,
} from "@/plane-web/store/importers";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TImporterClickUpDataPayload,
  TClickUpImporterStepKeys,
  TClickUpImporterStep,
  E_CLICKUP_IMPORTER_STEPS,
} from "@/plane-web/types/importers/clickup";
import { ClickUpAuthStore, IClickUpAuthStore } from "./auth.store";
import { ClickUpDataStore, IClickUpDataStore } from "./data.store";

// constants
const defaultImporterData: TImporterClickUpDataPayload = {
  [E_CLICKUP_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP]: {
    teamId: undefined,
    spaceId: undefined,
    folderIds: [],
  },
  [E_CLICKUP_IMPORTER_STEPS.MAP_STATES]: {},
  [E_CLICKUP_IMPORTER_STEPS.MAP_PRIORITIES]: {},
  [E_CLICKUP_IMPORTER_STEPS.SUMMARY]: {
    skipUserImport: false,
  },
};

export interface IClickUpStore extends IImporterBaseStore {
  // observables
  dashboardView: boolean;
  stepper: TClickUpImporterStepKeys;
  importerData: TImporterClickUpDataPayload;
  configData: Partial<TClickUpConfig>;
  // store instances
  job: IImporterJobStore<TClickUpConfig>;
  auth: IClickUpAuthStore;
  data: IClickUpDataStore;
  // computed
  currentStepIndex: number;
  currentStep: TClickUpImporterStep;
  // helper actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TImporterClickUpDataPayload>(
    key: T,
    value: TImporterClickUpDataPayload[T]
  ) => void;
  handleSyncJobConfig: <T extends keyof TClickUpConfig>(key: T, config: TClickUpConfig[T]) => void;
  handleTeamSyncJobConfig: (config: Partial<TClickUpConfig>) => void;
  resetImporterData: () => void;
}

export class ClickUpStore extends ImporterBaseStore implements IClickUpStore {
  // observables
  dashboardView: boolean = true;
  stepper: TClickUpImporterStepKeys = E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP;
  importerData: TImporterClickUpDataPayload = defaultImporterData;
  configData: Partial<TClickUpConfig> = {};
  // store instances
  job: IImporterJobStore<TClickUpConfig>;
  auth: IClickUpAuthStore;
  data: IClickUpDataStore;

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
    this.job = new ImporterJobStore<TClickUpConfig>(E_IMPORTER_KEYS.CLICKUP);
    this.auth = new ClickUpAuthStore(store);
    this.data = new ClickUpDataStore(store);
  }

  // computed
  /**
   * @description Returns the current step index
   * @returns { TClickUpImporterStep }
   */
  get currentStepIndex(): number {
    return IMPORTER_CLICKUP_STEPS.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Returns the current step
   * @returns { TClickUpImporterStep }
   */
  get currentStep(): TClickUpImporterStep {
    return IMPORTER_CLICKUP_STEPS[this.currentStepIndex];
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
   * @param { TImporterClickUpDataPayload[T] } value
   */
  handleImporterData = <T extends keyof TImporterClickUpDataPayload>(
    key: T,
    value: TImporterClickUpDataPayload[T]
  ): void => {
    if (key == E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP) {
      const currentExistingValue = this.importerData[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP];
      const currentValue = value as TImporterClickUpDataPayload[E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP];

      if (currentExistingValue.teamId === undefined) {
        set(this.importerData, key, value);
      } else if (currentValue.teamId != currentExistingValue.teamId) {
        update(this, "importerData", () => defaultImporterData);
      }
    } else {
      set(this.importerData, key, value);
    }
  };

  /**
   * @description Handles the sync job config
   * @param { T } key
   * @param { TClickUpConfig[T] } config
   */
  handleSyncJobConfig = <T extends keyof TClickUpConfig>(key: T, config: TClickUpConfig[T]): void => {
    set(this.configData, key, config);
  };

  /**
   * @description Handles the team sync job config
   * @param { Partial<TClickUpConfig> } config
   * @returns { void }
   */
  handleTeamSyncJobConfig = (config: Partial<TClickUpConfig>): void => {
    this.configData = { ...this.configData, ...config };
  };

  /**
   * @description Resets importer data
   * @returns { void }
   */
  resetImporterData = (): void => {
    this.dashboardView = true;
    this.stepper = E_CLICKUP_IMPORTER_STEPS.CONFIGURE_CLICKUP;
    this.importerData = defaultImporterData;
    this.configData = {};
  };
}
