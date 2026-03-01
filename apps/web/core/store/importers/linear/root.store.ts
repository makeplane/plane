/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { update, set } from "lodash-es";
import { computed, makeObservable, observable } from "mobx";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import type { LinearConfig } from "@plane/etl/linear";
// plane web constants
import { IMPORTER_LINEAR_STEPS } from "@/constants/importers/linear";
// plane web store types
import type { IImporterBaseStore } from "../base.store";
import { ImporterBaseStore } from "../base.store";
import type { IImporterJobStore } from "../job.store";
import { ImporterJobStore } from "../job.store";
import type { ILinearAuthStore, ILinearDataStore } from "../linear";
import { LinearAuthStore, LinearDataStore } from "../linear";
import type { RootStore } from "@/plane-web/store/root.store";
// plane web types
import type {
  TImporterLinearDataPayload,
  TImporterLinearStepKeys,
  TLinearImporterStep,
} from "@/types/importers/linear";
import { E_LINEAR_IMPORTER_STEPS } from "@/types/importers/linear";

// constants
const defaultImporterData: TImporterLinearDataPayload = {
  [E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]: {
    teamId: undefined,
  },
  [E_LINEAR_IMPORTER_STEPS.MAP_STATES]: {},
};

export interface ILinearStore extends IImporterBaseStore {
  // observables
  dashboardView: boolean;
  stepper: TImporterLinearStepKeys;
  importerData: TImporterLinearDataPayload;
  configData: Partial<LinearConfig>;
  // store instances
  job: IImporterJobStore<LinearConfig>;
  auth: ILinearAuthStore;
  data: ILinearDataStore;
  // computed
  currentStepIndex: number;
  currentStep: TLinearImporterStep;
  // helper actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TImporterLinearDataPayload>(
    key: T,
    value: TImporterLinearDataPayload[T]
  ) => void;
  handleSyncJobConfig: <T extends keyof LinearConfig>(key: T, config: LinearConfig[T]) => void;
  handleTeamSyncJobConfig: (config: Partial<LinearConfig>) => void;
  resetImporterData: () => void;
}

export class LinearStore extends ImporterBaseStore implements ILinearStore {
  // observables
  dashboardView: boolean = true;
  stepper: TImporterLinearStepKeys = E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
  importerData: TImporterLinearDataPayload = defaultImporterData;
  configData: Partial<LinearConfig> = {};
  // store instances
  job: IImporterJobStore<LinearConfig>;
  auth: ILinearAuthStore;
  data: ILinearDataStore;

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
    this.job = new ImporterJobStore<LinearConfig>(E_IMPORTER_KEYS.LINEAR);
    this.auth = new LinearAuthStore(store);
    this.data = new LinearDataStore(store);
  }

  // computed
  /**
   * @description Returns the current step index
   * @returns { TLinearImporterStep }
   */
  get currentStepIndex(): number {
    return IMPORTER_LINEAR_STEPS.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Returns the current step
   * @returns { TLinearImporterStep }
   */
  get currentStep(): TLinearImporterStep {
    return IMPORTER_LINEAR_STEPS[this.currentStepIndex];
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
   * @param { TImporterLinearDataPayload[T] } value
   */
  handleImporterData = <T extends keyof TImporterLinearDataPayload>(
    key: T,
    value: TImporterLinearDataPayload[T]
  ): void => {
    if (key == E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR) {
      const currentExistingValue = this.importerData[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR];
      const currentValue = value as TImporterLinearDataPayload[E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR];

      if (currentExistingValue.teamId === undefined) {
        set(this.importerData, key, value);
      } else if (currentValue.teamId != currentExistingValue.teamId) {
        update(this, "importerData", (currentData) => ({
          ...currentData,
          [E_LINEAR_IMPORTER_STEPS.CONFIGURE_LINEAR]: {
            teamId: currentValue.teamId,
          },
          [E_LINEAR_IMPORTER_STEPS.MAP_STATES]: {},
        }));
      }
    } else {
      set(this.importerData, key, value);
    }
  };

  /**
   * @description Handles the sync job config
   * @param { T } key
   * @param { LinearConfig[T] } config
   */
  handleSyncJobConfig = <T extends keyof LinearConfig>(key: T, config: LinearConfig[T]): void => {
    set(this.configData, key, config);
  };

  /**
   * @description Handles the team sync job config
   * @param { Partial<LinearConfig> } config
   * @returns { void }
   */
  handleTeamSyncJobConfig = (config: Partial<LinearConfig>): void => {
    this.configData = { ...this.configData, ...config };
  };

  /**
   * @description Resets importer data
   * @returns { void }
   */
  resetImporterData = (): void => {
    this.dashboardView = true;
    this.stepper = E_LINEAR_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
    this.importerData = defaultImporterData;
    this.configData = {};
  };
}
