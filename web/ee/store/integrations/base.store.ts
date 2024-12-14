import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
import { IApiToken } from "@plane/types";
// plane web services
import { ServiceAPITokenService } from "@/plane-web/services/api_token.service";
// plane web root store
import { RootStore } from "@/plane-web/store/root.store";

export interface IIntegrationBaseStore {
  externalApiToken: string | undefined;
  // actions
  fetchExternalApiToken: (workspaceSlug: string) => Promise<IApiToken | undefined>;
}

export class IntegrationBaseStore implements IIntegrationBaseStore {
  // observables
  externalApiToken: string | undefined = undefined;
  // services
  serviceAPITokenService: ServiceAPITokenService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      externalApiToken: observable.ref,
      // actions
      fetchExternalApiToken: action,
    });

    this.serviceAPITokenService = new ServiceAPITokenService();
  }

  // actions
  /**
   * @description handle external api token
   * @param { string } workspaceSlug
   * @returns { Promise<IApiToken | undefined> }
   */
  fetchExternalApiToken = async (workspaceSlug: string): Promise<IApiToken | undefined> => {
    if (!workspaceSlug) return;

    try {
      const externalApiToken = await this.serviceAPITokenService.createServiceApiToken(
        workspaceSlug,
        {} as Partial<IApiToken>
      );
      if (externalApiToken) {
        runInAction(() => {
          set(this, "externalApiToken", externalApiToken.token);
        });
      }
      return externalApiToken;
    } catch (error) {
      runInAction(() => {
        set(this, "error", error as unknown as object);
      });
    }
  };
}
