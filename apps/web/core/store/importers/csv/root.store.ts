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

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { E_IMPORTER_KEYS } from "@plane/etl/core";
// constants
import { CSV_IMPORTER_STEPS } from "@/constants/importers/csv";
// services
import projectService from "@/services/project/project.service";
// plane web store types
import type { IImporterBaseStore } from "../base.store";
import { ImporterBaseStore } from "../base.store";
import type { IImporterJobStore } from "../job.store";
import { ImporterJobStore } from "../job.store";
import type { RootStore } from "@/plane-web/store/root.store";
// plane web types
import type { TCSVImporterDataPayload, TCSVImporterStepKeys, TCSVImporterStep } from "@/types/importers/csv";
import { E_CSV_IMPORTER_STEPS } from "@/types/importers/csv";

const defaultImporterData: TCSVImporterDataPayload = {
  [E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_CSV_IMPORTER_STEPS.UPLOAD_CSV]: {
    assetId: undefined,
    fileName: undefined,
  },
};

export interface ICSVImporterStore extends IImporterBaseStore {
  // observables
  dashboardView: boolean;
  stepper: TCSVImporterStepKeys;
  importerData: TCSVImporterDataPayload;
  isImporting: boolean;
  importJobId: string | undefined;
  // store instances
  job: IImporterJobStore<object>;
  auth: {
    currentAuth?: {
      isAuthenticated: boolean;
      sourceTokenInvalid: boolean;
    };
    deactivateAuth: () => Promise<void>;
    apiTokenVerification: () => Promise<{ message: string } | undefined>;
  };
  // computed
  currentStepIndex: number;
  currentStep: TCSVImporterStep;
  // actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TCSVImporterDataPayload>(key: T, value: TCSVImporterDataPayload[T]) => void;
  resetImporterData: () => void;
  triggerImport: (assetId: string) => Promise<string>;
}

export class CSVImporterStore extends ImporterBaseStore implements ICSVImporterStore {
  // observables
  dashboardView: boolean = true;
  stepper: TCSVImporterStepKeys = E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
  importerData: TCSVImporterDataPayload = defaultImporterData;
  isImporting: boolean = false;
  importJobId: string | undefined = undefined;

  // store instances
  job: IImporterJobStore<object>;

  // Noop object for auth, required to use the base dashboard component
  auth = {
    currentAuth: { isAuthenticated: true, sourceTokenInvalid: false },
    deactivateAuth: async () => {
      // No auth needed for CSV importer
    },
    apiTokenVerification: () => Promise.resolve({ message: "Token is valid" }),
  };

  constructor(public store: RootStore) {
    super(store);
    makeObservable(this, {
      // observables
      dashboardView: observable,
      stepper: observable,
      importerData: observable,
      isImporting: observable,
      importJobId: observable,
      // computed
      currentStepIndex: computed,
      currentStep: computed,
      // actions
      handleDashboardView: action,
      handleStepper: action,
      handleImporterData: action,
      resetImporterData: action,
      triggerImport: action,
    });

    // Use existing ImporterJobStore with CSV key
    this.job = new ImporterJobStore(E_IMPORTER_KEYS.CSV);
  }

  /**
   * @description Gets the current step index
   * @returns {number} The current step index
   */
  get currentStepIndex(): number {
    return CSV_IMPORTER_STEPS.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Gets the current step
   * @returns {TCSVImporterStep} The current step
   */
  get currentStep(): TCSVImporterStep {
    return CSV_IMPORTER_STEPS[this.currentStepIndex];
  }

  /**
   * @description Handles the dashboard view toggle
   */
  handleDashboardView = (): void => {
    this.dashboardView = !this.dashboardView;
  };

  /**
   * @description Handles the stepper navigation
   * @param direction - The direction to move in
   */
  handleStepper = (direction: "previous" | "next"): void => {
    const { currentStep } = this;
    if (!currentStep) return;

    if (direction === "previous" && currentStep.prevStep) {
      runInAction(() => {
        this.stepper = currentStep.prevStep as TCSVImporterStepKeys;
      });
    } else if (direction === "next" && currentStep.nextStep) {
      runInAction(() => {
        this.stepper = currentStep.nextStep as TCSVImporterStepKeys;
      });
    }
  };

  /**
   * @description Handles updating importer data for a specific step
   * @param key - The step key
   * @param value - The data to set
   */
  handleImporterData = <T extends keyof TCSVImporterDataPayload>(key: T, value: TCSVImporterDataPayload[T]): void => {
    runInAction(() => {
      set(this.importerData, key, value);
    });
  };

  /**
   * @description Resets the importer data to defaults
   */
  resetImporterData = (): void => {
    runInAction(() => {
      this.stepper = E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
      this.importerData = defaultImporterData;
      this.isImporting = false;
      this.importJobId = undefined;
    });
  };

  /**
   * @description Triggers the CSV import
   * @param assetId - The uploaded file asset ID
   * @returns The import job ID
   */
  triggerImport = async (assetId: string): Promise<string> => {
    const workspaceSlug = this.workspace?.slug;
    const workspaceId = this.workspace?.id;
    const projectId = this.importerData[E_CSV_IMPORTER_STEPS.SELECT_PLANE_PROJECT].projectId;

    if (!workspaceSlug || !workspaceId || !projectId) {
      throw new Error("Workspace or project not selected");
    }

    runInAction(() => {
      this.isImporting = true;
    });

    try {
      const response = await projectService.importWorkItemsFromCSV(workspaceSlug, projectId, assetId);

      runInAction(() => {
        this.importJobId = response.job_id;
        this.isImporting = false;
      });

      // Ensure job store has workspace configured, then refresh jobs
      if (this.externalApiToken) {
        this.job.setDefaultServiceConfig(workspaceId, this.externalApiToken);
        await this.job.fetchJobs("re-fetch");
      }

      return response.job_id;
    } catch (error) {
      runInAction(() => {
        this.isImporting = false;
      });
      throw error;
    }
  };
}
