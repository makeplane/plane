import { observable, action, computed, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IInstance, IInstanceConfiguration, IFormattedInstanceConfiguration } from "types/instance";
// services
import { InstanceService } from "services/instance.service";

export interface IInstanceStore {
  loader: boolean;
  error: any | null;
  // issues
  instance: IInstance | null;
  configurations: IInstanceConfiguration[] | null;
  // computed
  formattedConfig: IFormattedInstanceConfiguration | null;
  // action
  fetchInstanceInfo: () => Promise<IInstance>;
  updateInstanceInfo: (data: Partial<IInstance>) => Promise<IInstance>;
  fetchInstanceConfigurations: () => Promise<any>;
  updateInstanceConfigurations: (data: Partial<IFormattedInstanceConfiguration>) => Promise<IInstanceConfiguration[]>;
}

export class InstanceStore implements IInstanceStore {
  loader: boolean = false;
  error: any | null = null;
  instance: IInstance | null = null;
  configurations: IInstanceConfiguration[] | null = null;
  // service
  instanceService;
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      instance: observable.ref,
      configurations: observable.ref,
      // computed
      formattedConfig: computed,
      // actions
      fetchInstanceInfo: action,
      updateInstanceInfo: action,
      fetchInstanceConfigurations: action,
      updateInstanceConfigurations: action,
    });

    this.rootStore = _rootStore;
    this.instanceService = new InstanceService();
  }

  /**
   * computed value for instance configurations data for forms.
   * @returns configurations in the form of {key, value} pair.
   */
  get formattedConfig() {
    if (!this.configurations) return null;

    return this.configurations?.reduce((formData: IFormattedInstanceConfiguration, config) => {
      formData[config.key] = config.value;
      return formData;
    }, {});
  }

  /**
   * fetch instace info from API
   */
  fetchInstanceInfo = async () => {
    try {
      const instance = await this.instanceService.getInstanceInfo();
      runInAction(() => {
        this.instance = instance;
      });
      return instance;
    } catch (error) {
      console.log("Error while fetching the instance info");
      throw error;
    }
  };

  /**
   * update instance info
   * @param data
   */
  updateInstanceInfo = async (data: Partial<IInstance>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.instanceService.updateInstanceInfo(data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.instance = response;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  /**
   * fetch instace configurations from API
   */
  fetchInstanceConfigurations = async () => {
    try {
      const configurations = await this.instanceService.getInstanceConfigurations();
      runInAction(() => {
        this.configurations = configurations;
      });
      return configurations;
    } catch (error) {
      console.log("Error while fetching the instance configurations");
      throw error;
    }
  };

  /**
   * update instance configurations
   * @param data
   */
  updateInstanceConfigurations = async (data: Partial<IFormattedInstanceConfiguration>) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.instanceService.updateInstanceConfigurations(data);

      runInAction(() => {
        this.loader = false;
        this.error = null;
        this.configurations = this.configurations ? [...this.configurations, ...response] : response;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };
}
