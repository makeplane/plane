import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { API_BASE_URL, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";
import { FlatfileConfig } from "@plane/etl/flatfile";
// plane web store types
import { NOTION_IMPORTER_STEPS, CONFLUENCE_IMPORTER_STEPS } from "@/plane-web/constants/importers/notion";
import { ZipImporterService } from "@/plane-web/services/importers/zip-importer/data.service";
import { SiloAssetsService } from "@/plane-web/services/importers/zip-importer/silo-assets.service";
import {
  IImporterBaseStore,
  IImporterJobStore,
  ImporterBaseStore,
  ImporterJobStore,
} from "@/plane-web/store/importers";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  TImporterStepKeys,
  E_IMPORTER_STEPS,
  TImporterStep,
  TImporterDataPayload,
  EZipDriverType,
} from "@/plane-web/types/importers/zip-importer";

// constants
const defaultImporterData: TImporterDataPayload = {
  [E_IMPORTER_STEPS.UPLOAD_ZIP]: {
    zipFile: undefined,
  },
};

// Upload state for Notion zip file
export enum UploadState {
  IDLE = "idle",
  GETTING_UPLOAD_URL = "getting_upload_url",
  UPLOADING = "uploading",
  CONFIRMING = "confirming",
  COMPLETE = "complete",
  ERROR = "error",
}

export interface IZipImporterStore extends IImporterBaseStore {
  // auth state
  currentAuth: TServiceAuthConfiguration | undefined;
  // observables
  dashboardView: boolean;
  stepper: TImporterStepKeys;
  importerData: TImporterDataPayload;
  // upload state
  uploadState: UploadState;
  uploadProgress: number;
  uploadError: string | null;
  uploadDetails: {
    fileKey?: string;
    uploadId?: string;
    etag?: string;
    fileName?: string;
  };
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
  // upload methods
  uploadZipFile: (workspaceId: string, file: File) => Promise<void>;
  updateUploadProgress: (progress: number) => void;
  confirmAndStartImport: (options?: { fileName?: string }) => Promise<void>;
  resetUploadState: () => void;
  // helpers
  handleSyncJobConfig: <T extends keyof FlatfileConfig>(key: T, config: FlatfileConfig[T]) => void;
}

export class ZipImporterStore extends ImporterBaseStore implements IZipImporterStore {
  dashboardView: boolean = true;
  stepper: TImporterStepKeys = E_IMPORTER_STEPS.UPLOAD_ZIP;
  importerData: TImporterDataPayload = defaultImporterData;
  job: IImporterJobStore<any>;
  configData: Partial<FlatfileConfig> = {};
  steps: TImporterStep[] = [];

  // upload state
  uploadState: UploadState = UploadState.IDLE;
  uploadProgress: number = 0;
  uploadError: string | null = null;
  uploadDetails: {
    fileKey?: string;
    uploadId?: string;
    etag?: string;
    fileName?: string;
  } = {};

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
  private zipImporterService: ZipImporterService;
  private siloAssetsService: SiloAssetsService;

  constructor(
    public store: RootStore,
    provider: EZipDriverType
  ) {
    super(store);
    makeObservable(this, {
      // observables
      dashboardView: observable,
      stepper: observable,
      importerData: observable,
      uploadState: observable,
      uploadProgress: observable,
      uploadError: observable,
      uploadDetails: observable,
      // computed
      currentStepIndex: computed,
      currentStep: computed,
      // actions
      fetchAuthStatus: action,
      saveCredentials: action,
      verifyAndAddCredentials: action,
      uploadZipFile: action,
      updateUploadProgress: action,
      confirmAndStartImport: action,
      resetUploadState: action,
      // helpers
      handleSyncJobConfig: action,
    });

    this.steps = provider === EZipDriverType.NOTION ? NOTION_IMPORTER_STEPS : CONFLUENCE_IMPORTER_STEPS;

    // store instances
    this.zipImporterService = new ZipImporterService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH), provider);
    this.job = new ImporterJobStore(
      provider === EZipDriverType.NOTION ? E_IMPORTER_KEYS.NOTION : E_IMPORTER_KEYS.CONFLUENCE
    );
    this.siloAssetsService = new SiloAssetsService(API_BASE_URL);
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
    return this.steps.findIndex((step) => step.key === this.stepper);
  }

  /**
   * @description Gets the current step
   * @returns {TImporterStep} The current step
   */
  get currentStep(): TImporterStep {
    return this.steps[this.currentStepIndex];
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
    this.stepper = E_IMPORTER_STEPS.UPLOAD_ZIP;
    this.importerData = defaultImporterData;
    this.resetUploadState();
  };

  /**
   * @description Reset upload state
   */
  resetUploadState = (): void => {
    runInAction(() => {
      this.uploadState = UploadState.IDLE;
      this.uploadProgress = 0;
      this.uploadError = null;
      this.uploadDetails = {};
    });
  };

  /**
   * @description Update upload progress
   * @param {number} progress - Progress value between 0-100
   */
  updateUploadProgress = (progress: number): void => {
    runInAction(() => {
      this.uploadProgress = progress;
    });
  };

  /**
   * @description Upload a Notion zip file to S3
   * @param {string} workspaceId - The workspace ID
   * @param {File} file - The Notion zip file to upload
   */
  uploadZipFile = async (workspaceSlug: string, file: File): Promise<void> => {
    try {
      // Reset state
      this.resetUploadState();

      // Set state to getting upload URL
      runInAction(() => {
        this.uploadState = UploadState.GETTING_UPLOAD_URL;
      });

      // Get the presigned URL from Silo Assets
      const uploadUrlResponse = await this.siloAssetsService.getUploadUrl(
        workspaceSlug,
        file.name,
        file.type,
        file.size
      );

      // Set state to uploading
      runInAction(() => {
        this.uploadState = UploadState.UPLOADING;
        this.uploadDetails = {
          fileKey: uploadUrlResponse.asset_key,
          uploadId: uploadUrlResponse.asset_id,
        };
      });

      // Upload the file to S3
      const etag = await this.siloAssetsService.uploadFileToS3(
        uploadUrlResponse.upload_data,
        file,
        this.updateUploadProgress
      );

      // Set state to ready for confirmation, but don't confirm yet
      runInAction(() => {
        this.uploadProgress = 100; // Ensure progress shows as complete
        this.uploadState = UploadState.COMPLETE; // Mark as complete (ready for import)
        this.uploadDetails = {
          ...this.uploadDetails,
          etag,
        };
      });
    } catch (error) {
      console.error("Error uploading Notion ZIP file:", error);

      runInAction(() => {
        this.uploadState = UploadState.ERROR;
        this.uploadError = error instanceof Error ? error.message : "Unable to upload file please try again later";
      });

      throw error;
    }
  };

  /**
   * @description Confirm the upload and start the import process
   * @param {Object} options - Options for the import
   * @param {string} options.fileName - Original file name
   */
  confirmAndStartImport = async (options?: { fileName?: string }): Promise<void> => {
    try {
      const {
        notionImporter: { workspace, user },
      } = this.store;

      if (!workspace || !user) {
        throw new Error("Missing workspace or user");
      }

      const { fileKey, uploadId, etag } = this.uploadDetails;

      if (!fileKey || !uploadId || !etag) {
        throw new Error("Missing upload details");
      }

      // Set state to confirming
      runInAction(() => {
        this.uploadState = UploadState.CONFIRMING;
        // Save the fileName if provided
        if (options?.fileName) {
          this.uploadDetails.fileName = options.fileName;
        }
      });

      // Confirm the upload using Silo Assets
      await this.siloAssetsService.confirmUpload(
        workspace.slug,
        uploadId // This is the asset_id from upload response
      );

      await this.zipImporterService.startImport(workspace.id, user.id, fileKey, options?.fileName);

      // Set state to complete
      runInAction(() => {
        this.uploadState = UploadState.COMPLETE;
        this.uploadProgress = 100;
      });
    } catch (error) {
      runInAction(() => {
        this.uploadState = UploadState.ERROR;
        this.uploadError = error instanceof Error ? error.message : "Failed to confirm upload";
      });

      throw error;
    }
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
      const response = await this.zipImporterService.verifyCredentials(workspaceId, userId);
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
      await this.zipImporterService.saveCredentials(workspaceId, userId, externalApiToken);
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
