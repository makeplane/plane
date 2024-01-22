import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { IAppConfig } from "@plane/types";
// services
import { AppConfigService } from "services/app_config.service";

export interface IAppConfigStore {
  // observables
  envConfig: IAppConfig | null;
  // actions
  fetchAppConfig: () => Promise<any>;
}

export class AppConfigStore implements IAppConfigStore {
  // observables
  envConfig: IAppConfig | null = null;
  // service
  appConfigService;

  constructor() {
    makeObservable(this, {
      // observables
      envConfig: observable.ref,
      // actions
      fetchAppConfig: action,
    });
    this.appConfigService = new AppConfigService();
  }

  /**
   * Fetches the app config from the API
   */
  fetchAppConfig = async () =>
    await this.appConfigService.envConfig().then((config) => {
      runInAction(() => {
        this.envConfig = config;
      });
      return config;
    });
}
