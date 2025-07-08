import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable } from "mobx";
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { TServiceAuthConfiguration } from "@plane/etl/core";
import { JiraAuthState, JiraPATAuthState } from "@plane/etl/jira";
// plane web services
import { JiraAuthService } from "@/plane-web/services/importers/jira/auth.service";
// store types
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TJiraPATFormFields } from "@/plane-web/types/importers/jira";

export interface IJiraAuthStore {
  // observables
  isLoading: boolean;
  error: object;
  authentication: Record<string, TServiceAuthConfiguration>; // userId -> TServiceAuthConfiguration
  // computed
  currentAuth: TServiceAuthConfiguration | undefined;
  // actions
  apiTokenVerification: () => Promise<{ message: string } | undefined>;
  authVerification: () => Promise<TServiceAuthConfiguration | undefined>;
  oAuthInitiate: () => Promise<string | undefined>;
  authWithPAT: (payload: TJiraPATFormFields) => Promise<void | undefined>;
  deactivateAuth: () => Promise<void | undefined>;
}

export class JiraAuthStore implements IJiraAuthStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  authentication: Record<string, TServiceAuthConfiguration> = {};
  // service
  service: JiraAuthService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      authentication: observable,
      // computed
      currentAuth: computed,
      // actions
      apiTokenVerification: action,
      authVerification: action,
      oAuthInitiate: action,
      authWithPAT: action,
      deactivateAuth: action,
    });

    // service instance
    this.service = new JiraAuthService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description get the current authentication
   * @returns { TServiceAuthConfiguration | undefined }
   */
  get currentAuth(): TServiceAuthConfiguration | undefined {
    const {
      jiraImporter: { user },
    } = this.store;

    const userId = user?.id;
    if (!userId) return undefined;

    return this.authentication[userId];
  }

  // actions
  /**
   * @description verify the api token
   * @returns { Promise<{ message: string } | undefined> }
   */
  apiTokenVerification = async (): Promise<{ message: string } | undefined> => {
    const {
      jiraImporter: { workspace, user, externalApiToken },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId || !externalApiToken) return undefined;

    try {
      this.isLoading = true;
      const response = await this.service.jiraApiTokenVerification(workspaceId, userId, externalApiToken);
      this.isLoading = false;
      return response;
    } catch (error) {
      this.isLoading = false;
      throw error;
    }
  };

  /**
   * @description authenticate the service
   * @returns { Promise<TServiceAuthConfiguration | undefined> }
   */
  authVerification = async (): Promise<TServiceAuthConfiguration | undefined> => {
    const {
      jiraImporter: { workspace, user, externalApiToken },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId || !externalApiToken) return undefined;

    try {
      this.isLoading = true;
      const response = await this.service.jiraAuthVerification(workspaceId, userId);

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
   * @description initiate the OAuth flow
   * @returns { Promise<string | undefined> }
   */
  oAuthInitiate = async (): Promise<string | undefined> => {
    const {
      jiraImporter: { workspace, user, externalApiToken },
    } = this.store;

    const workspaceId = workspace?.id;
    const workspaceSlug = workspace?.slug;
    const userId = user?.id;
    if (!workspaceId || !workspaceSlug || !userId || !externalApiToken) return undefined;

    try {
      this.isLoading = true;
      const oAuthPayload: JiraAuthState = {
        apiToken: externalApiToken,
        workspaceId: workspaceId,
        workspaceSlug: workspaceSlug,
        userId: userId,
      };

      const response = await this.service.jiraAuthentication(oAuthPayload);

      this.isLoading = false;
      return response;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
      throw error;
    }
  };

  /**
   * @description authenticate the service with PAT
   * @param { TJiraPATFormFields } payload
   * @returns { Promise<void | undefined> }
   */
  authWithPAT = async (payload: TJiraPATFormFields): Promise<void | undefined> => {
    const {
      jiraImporter: { workspace, user, externalApiToken },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId || !externalApiToken) return undefined;

    try {
      this.isLoading = true;
      const authVerificationPayload: JiraPATAuthState = {
        workspaceId: workspace?.id,
        userId: user?.id,
        apiToken: externalApiToken,
        ...payload,
      };

      const response = await this.service.jiraPATAuthentication(authVerificationPayload);
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
      jiraImporter: { workspace, user },
    } = this.store;

    const workspaceId = workspace?.id;
    const userId = user?.id;
    if (!workspaceId || !userId) return undefined;

    try {
      this.isLoading = true;
      const response = await this.service.jiraAuthDeactivate(workspaceId, userId);

      if (response) {
        unset(this.authentication, [userId]);
      }

      this.isLoading = false;
      return response;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
      throw error;
    }
  };
}
