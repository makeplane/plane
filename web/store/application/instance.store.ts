import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { IInstance, IInstanceConfiguration, IFormattedInstanceConfiguration, IInstanceAdmin } from "@plane/types";
// services
import { InstanceService } from "services/instance.service";

export interface IInstanceStore {
  // issues
  instance: IInstance | null;
  instanceAdmins: IInstanceAdmin[] | null;
  configurations: IInstanceConfiguration[] | null;
  // computed
  formattedConfig: IFormattedInstanceConfiguration | null;
  // action
  fetchInstanceInfo: () => Promise<IInstance>;
  fetchInstanceAdmins: () => Promise<IInstanceAdmin[]>;
  updateInstanceInfo: (data: Partial<IInstance>) => Promise<IInstance>;
  fetchInstanceConfigurations: () => Promise<any>;
  updateInstanceConfigurations: (data: Partial<IFormattedInstanceConfiguration>) => Promise<IInstanceConfiguration[]>;
}

export class InstanceStore implements IInstanceStore {
  instance: IInstance | null = null;
  instanceAdmins: IInstanceAdmin[] | null = null;
  configurations: IInstanceConfiguration[] | null = null;
  // service
  instanceService;

  constructor() {
    makeObservable(this, {
      // observable
      instance: observable,
      instanceAdmins: observable,
      configurations: observable,
      // computed
      formattedConfig: computed,
      // actions
      fetchInstanceInfo: action,
      fetchInstanceAdmins: action,
      updateInstanceInfo: action,
      fetchInstanceConfigurations: action,
      updateInstanceConfigurations: action,
    });

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
   * fetch instance info from API
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
   * fetch instance admins from API
   */
  fetchInstanceAdmins = async () => {
    const instanceAdmins = await this.instanceService.getInstanceAdmins();
    runInAction(() => {
      this.instanceAdmins = instanceAdmins;
    });
    return instanceAdmins;
  };

  /**
   * update instance info
   * @param data
   */
  updateInstanceInfo = async (data: Partial<IInstance>) =>
    await this.instanceService.updateInstanceInfo(data).then((response) => {
      runInAction(() => {
        this.instance = response;
      });
      return response;
    });

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
  updateInstanceConfigurations = async (data: Partial<IFormattedInstanceConfiguration>) =>
    await this.instanceService.updateInstanceConfigurations(data).then((response) => {
      runInAction(() => {
        this.configurations = this.configurations ? [...this.configurations, ...response] : response;
      });
      return response;
    });
}
