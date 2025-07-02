import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";
import { FlatfileConfig } from "@plane/etl/flatfile";
// plane web store types
import { IMPORTER_STEPS } from "@/plane-web/constants/importers/flatfile";
import { FlatfileAuthService } from "@/plane-web/services/importers/flatfile/auth.service";
import {
  IImporterBaseStore,
  IImporterJobStore,
  ImporterBaseStore,
  ImporterJobStore,
} from "@/plane-web/store/importers";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TImporterDataPayload,
  TImporterStepKeys,
  E_IMPORTER_STEPS,
  TImporterStep,
} from "@/plane-web/types/importers/flatfile";

// constants
const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: undefined,
  },
  [E_IMPORTER_STEPS.CONFIGURE_FLATFILE]: {
    workbookId: undefined,
    actorId: undefined,
    environmentId: undefined,
    spaceId: undefined,
    appId: undefined,
    jobId: undefined,
  },
};

export interface IFlatfileStore extends IImporterBaseStore {
  // auth state
  currentAuth: TServiceAuthConfiguration | undefined;
  // observables
  dashboardView: boolean;
  stepper: TImporterStepKeys;
  importerData: TImporterDataPayload;
  // store instances
  job: IImporterJobStore<any>;
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
  currentStep: TImporterStep;
  // actions
  handleDashboardView: () => void;
  handleStepper: (direction: "previous" | "next") => void;
  handleImporterData: <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]) => void;
  resetImporterData: () => void;
  // methods
  fetchAuthStatus: (workspaceId: string, userId: string) => Promise<void>;
  saveCredentials: (workspaceId: string, userId: string, externalApiToken: string) => Promise<void>;
  verifyAndAddCredentials: (workspaceId: string, userId: string, externalApiToken: string) => Promise<void>;
  // helpers
  handleSyncJobConfig: <T extends keyof FlatfileConfig>(key: T, config: FlatfileConfig[T]) => void;
}

export class FlatfileStore extends ImporterBaseStore implements IFlatfileStore {
  dashboardView: boolean = true;
  stepper: TImporterStepKeys = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
  importerData: TImporterDataPayload = defaultImporterData;
  job: IImporterJobStore<any>;
  configData: Partial<FlatfileConfig> = {};

  // auth state
  authentication: Record<string, TServiceAuthConfiguration> = {};

  // Noop object for auth, required to use the base dashboard component
  auth = {
    currentAuth: { isAuthenticated: true, sourceTokenInvalid: false },
    deactivateAuth: async () => {},
    apiTokenVerification: async () => ({
      message: "Token is valid",
    }),
  };

  // services
  private flatfileAuthService: FlatfileAuthService;

  constructor(public store: RootStore) {
    super(store);
    makeObservable(this, {
      // observables
      dashboardView: observable,
      stepper: observable,
      importerData: observable,
      // computed
      currentStepIndex: computed,
      currentStep: computed,
      // actions
      fetchAuthStatus: action,
      saveCredentials: action,
      verifyAndAddCredentials: action,
      // helpers
      handleSyncJobConfig: action,
    });

    // store instances
    this.flatfileAuthService = new FlatfileAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
    this.job = new ImporterJobStore(E_IMPORTER_KEYS.FLATFILE);
  }

  // computed
  /**
   * @description get the current authentication
   * @returns { TServiceAuthConfiguration | undefined }
   */
  get currentAuth(): TServiceAuthConfiguration | undefined {
    const {
      flatfileImporter: { user },
    } = this.store;

    const userId = user?.id;
    if (!userId) return undefined;

    return this.authentication[userId];
  }

  /**
   * @description Gets the current step index
   * @returns {number} The current step index
   */
  get currentStepIndex(): number {
    return IMPORTER_STEPS.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Gets the current step
   * @returns {TImporterStep} The current step
   */
  get currentStep(): TImporterStep {
    return IMPORTER_STEPS[this.currentStepIndex];
  }

  /**
   * @description Handles the dashboard view
   */
  handleDashboardView = (): void => {
    this.dashboardView = !this.dashboardView;
  };

  /**
   * @description Handles the stepper
   * @param { "previous" | "next" } direction
   */
  handleStepper = (direction: "previous" | "next"): void => {
    if (direction === "previous" && this.currentStep.prevStep) {
      this.stepper = this.currentStep.prevStep;
    } else if (direction === "next" && this.currentStep.nextStep) {
      this.stepper = this.currentStep.nextStep;
    }
  };

  /**
   * @description Handles the importer data
   * @param { T } key
   * @param { FlatfileConfig[T] } value
   */
  handleImporterData = <T extends keyof TImporterDataPayload>(key: T, value: TImporterDataPayload[T]): void => {
    set(this.importerData, key, value);
  };

  /**
   * @description Resets the importer data
   */
  resetImporterData = (): void => {
    this.dashboardView = true;
    this.stepper = E_IMPORTER_STEPS.SELECT_PLANE_PROJECT;
    this.importerData = defaultImporterData;
  };

  /**
   * @description Handles the sync job config
   * @param { T } key
   * @param { AsanaConfig[T] } config
   */
  handleSyncJobConfig = <T extends keyof FlatfileConfig>(key: T, config: FlatfileConfig[T]): void => {
    set(this.configData, key, config);
  };

  /**
   * @description Fetch auth status for Flatfile importer
   * @param workspaceId
   * @param userId
   */
  fetchAuthStatus = async (workspaceId: string, userId: string): Promise<void> => {
    try {
      const response = await this.flatfileAuthService.csvAuthVerification(workspaceId, userId);
      runInAction(() => {
        if (response) {
          set(this.authentication, [userId], response);
        }
      });
    } catch (error) {
      runInAction(() => {
        set(this.authentication, [userId], error as unknown as TServiceAuthConfiguration);
      });

      throw error;
    }
  };

  /**
   * @description Save CSV credentials
   * @param workspaceId
   * @param userId
   * @param externalApiToken
   */
  saveCredentials = async (workspaceId: string, userId: string, externalApiToken: string): Promise<void> => {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.flatfileAuthService.saveCredentials(workspaceId, userId, externalApiToken);
      // After saving credentials, refresh auth status
      await this.fetchAuthStatus(workspaceId, userId);
    } catch (error) {
      throw error;
    }
  };

  verifyAndAddCredentials = async (workspaceId: string, userId: string, externalApiToken: string): Promise<void> => {
    if (!this.currentAuth) {
      await this.fetchAuthStatus(workspaceId, userId);
    }

    if (this.currentAuth && !this.currentAuth.isAuthenticated) {
      await this.saveCredentials(workspaceId, userId, externalApiToken);
    }
  };
}
