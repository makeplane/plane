import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { TClickUpAuthState } from "@plane/etl/clickup";
import { E_IMPORTER_KEYS, TServiceAuthConfiguration } from "@plane/etl/core";
// plane web services
import { ClickUpAuthService } from "@/plane-web/services/importers/clickup/auth.service";
// store types
import { ApplicationService } from "@/plane-web/services/marketplace/application.service";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TClickUpPATFormFields } from "@/plane-web/types/importers/clickup";

export interface IClickUpAuthStore {
  // observables
  isLoading: boolean;
  error: object;
  authentication: Record<string, TServiceAuthConfiguration>; // userId -> TServiceAuthConfiguration
  // computed
  currentAuth: TServiceAuthConfiguration | undefined;
  // actions
  authVerification: () => Promise<TServiceAuthConfiguration | undefined>;
  authWithPAT: (payload: TClickUpPATFormFields) => Promise<void | undefined>;
  deactivateAuth: () => Promise<void | undefined>;
}

export class ClickUpAuthStore implements IClickUpAuthStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  authentication: Record<string, TServiceAuthConfiguration> = {};
  // service
  service: ClickUpAuthService;
  applicationService: ApplicationService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      authentication: observable,
      // computed
      currentAuth: computed,
      // actions
      authVerification: action,
      authWithPAT: action,
      deactivateAuth: action,
    });

    // service instance
    this.service = new ClickUpAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
    this.applicationService = new ApplicationService();
  }

  // computed
  /**
   * @description get the current authentication
   * @returns { TServiceAuthConfiguration | undefined }
   */
  get currentAuth(): TServiceAuthConfiguration | undefined {
    const {
      clickupImporter: { user },
    } = this.store;

    const userId = user?.id;
    if (!userId) return undefined;

    return this.authentication[userId];
  }

  // actions
  /**
   * @description authenticate the service
   * @returns { Promise<TServiceAuthConfiguration | undefined> }
   */
  authVerification = async (): Promise<TServiceAuthConfiguration | undefined> => {
    const {
      clickupImporter: { workspace, user },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId) return undefined;

    try {
      this.isLoading = true;
      const response = await this.service.clickUpAuthVerification(workspaceId, userId);

      if (response) {
        set(this.authentication, [userId], response);
      }

      this.isLoading = false;
      return response;
    } catch (error) {
      set(this.authentication, [userId], error as unknown as TServiceAuthConfiguration);
      this.isLoading = false;
      throw error;
    }
  };

  /**
   * @description authenticate the service with PAT
   * @param { TClickUpPATFormFields } payload
   * @returns { Promise<void | undefined> }
   */
  authWithPAT = async (payload: TClickUpPATFormFields): Promise<void | undefined> => {
    const {
      clickupImporter: { workspace, user },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId) return undefined;

    try {
      this.isLoading = true;
      const applicationDetails = await this.service.getPlaneClickUpAppDetails();
      const appInstallation = await this.applicationService.installApplication(
        workspace.slug,
        applicationDetails.appId
      );

      if (!appInstallation) {
        console.log("Failed to install application");
        throw new Error("Failed to install application");
      }

      const authVerificationPayload: TClickUpAuthState = {
        workspaceId: workspaceId,
        userId: userId,
        appInstallationId: appInstallation.id,
        ...payload,
      };

      const response = await this.service.clickUpPATAuthentication(authVerificationPayload);
      if (response) {
        await this.authVerification();
      }

      this.isLoading = false;
      return response;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
      throw error;
    }
  };

  /**
   * @description deactivate the service
   * @returns { Promise<void | undefined> }
   */
  deactivateAuth = async (): Promise<void | undefined> => {
    const {
      clickupImporter: { workspace, user },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId) return undefined;

    try {
      this.isLoading = true;
      const response = await this.service.clickUpAuthDeactivate(workspaceId, userId);

      if (response) {
        unset(this.authentication, [userId]);
      }

      this.isLoading = false;
      return response;
    } catch (error) {
      console.log("error", error);
      this.error = error as unknown as object;
      this.isLoading = false;
      throw error;
    }
  };
}
