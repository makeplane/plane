import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IAppConfig } from "types/app";
// services
import { AppConfigService } from "services/app_config.service";

export interface IAppConfigStore {
  envConfig: IAppConfig | null;
  // action
  fetchAppConfig: () => Promise<any>;
}

class AppConfigStore implements IAppConfigStore {
  // observables
  envConfig: IAppConfig | null = null;

  // root store
  rootStore;
  // service
  appConfigService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      envConfig: observable.ref,
      // actions
      fetchAppConfig: action,
    });
    this.appConfigService = new AppConfigService();

    this.rootStore = _rootStore;
  }
  fetchAppConfig = async () => {
    try {
      const config = await this.appConfigService.envConfig();
      runInAction(() => {
        this.envConfig = config;
      });
      return config;
    } catch (error) {
      throw error;
    }
  };
}

export default AppConfigStore;
