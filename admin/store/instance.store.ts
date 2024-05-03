import { observable, action, computed, makeObservable, runInAction } from "mobx";
import set from "lodash/set";
import { IInstance, IInstanceAdmin, IInstanceConfiguration, IFormattedInstanceConfiguration } from "@plane/types";
// helpers
import { EInstanceStatus, TInstanceStatus } from "@/helpers";
// services
import { InstanceService } from "@/services/instance.service";
// root store
import { RootStore } from "@/store/root-store";

export interface IInstanceStore {
  // issues
  isLoading: boolean;
  instanceStatus: TInstanceStatus | undefined;
  instance: IInstance | undefined;
  instanceAdmins: IInstanceAdmin[] | undefined;
  instanceConfigurations: IInstanceConfiguration[] | undefined;
  // computed
  formattedConfig: IFormattedInstanceConfiguration | undefined;
  // action
  fetchInstanceInfo: () => Promise<IInstance | undefined>;
  updateInstanceInfo: (data: Partial<IInstance["instance"]>) => Promise<IInstance["instance"] | undefined>;
  fetchInstanceAdmins: () => Promise<IInstanceAdmin[] | undefined>;
  fetchInstanceConfigurations: () => Promise<IInstanceConfiguration[] | undefined>;
  updateInstanceConfigurations: (data: Partial<IFormattedInstanceConfiguration>) => Promise<void>;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  instanceStatus: TInstanceStatus | undefined = undefined;
  instance: IInstance | undefined = undefined;
  instanceAdmins: IInstanceAdmin[] | undefined = undefined;
  instanceConfigurations: IInstanceConfiguration[] | undefined = undefined;
  // service
  instanceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      instanceStatus: observable,
      instance: observable,
      instanceAdmins: observable,
      instanceConfigurations: observable,
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
    if (!this.instanceConfigurations) return undefined;
    return this.instanceConfigurations?.reduce((formData: IFormattedInstanceConfiguration, config) => {
      formData[config.key] = config.value;
      return formData;
    }, {} as IFormattedInstanceConfiguration);
  }

  /**
   * @description fetching instance configuration
   * @returns {IInstance} instance
   */
  fetchInstanceInfo = async () => {
    try {
      if (this.instance === undefined) this.isLoading = true;
      const instance = await this.instanceService.getInstanceInfo();
      // handling the new user popup toggle
      if (this.instance === undefined && !instance?.instance?.workspaces_exist) this.store.theme.toggleNewUserPopup();
      runInAction(() => {
        this.isLoading = false;
        this.instance = instance;
      });
      return instance;
    } catch (error) {
      console.error("Error fetching the instance info");
      this.isLoading = false;
      this.instanceStatus = {
        status: EInstanceStatus.ERROR,
      };
      throw error;
    }
  };

  /**
   * @description updating instance information
   * @param {Partial<IInstance["instance"]>} data
   * @returns void
   */
  updateInstanceInfo = async (data: Partial<IInstance["instance"]>) => {
    try {
      const instanceResponse = await this.instanceService.updateInstanceInfo(data);
      if (instanceResponse) {
        runInAction(() => {
          if (this.instance) set(this.instance, "instance", instanceResponse);
        });
      }
      return instanceResponse;
    } catch (error) {
      console.error("Error updating the instance info");
      throw error;
    }
  };

  /**
   * @description fetching instance admins
   * @return {IInstanceAdmin[]} instanceAdmins
   */
  fetchInstanceAdmins = async () => {
    try {
      const instanceAdmins = await this.instanceService.getInstanceAdmins();
      if (instanceAdmins) runInAction(() => (this.instanceAdmins = instanceAdmins));
      return instanceAdmins;
    } catch (error) {
      console.error("Error fetching the instance admins");
      throw error;
    }
  };

  /**
   * @description fetching instance configurations
   * @return {IInstanceAdmin[]} instanceConfigurations
   */
  fetchInstanceConfigurations = async () => {
    try {
      const instanceConfigurations = await this.instanceService.getInstanceConfigurations();
      if (instanceConfigurations) runInAction(() => (this.instanceConfigurations = instanceConfigurations));
      return instanceConfigurations;
    } catch (error) {
      console.error("Error fetching the instance configurations");
      throw error;
    }
  };

  /**
   * @description updating instance configurations
   * @param data
   */
  updateInstanceConfigurations = async (data: Partial<IFormattedInstanceConfiguration>) => {
    try {
      await this.instanceService.updateInstanceConfigurations(data).then((response) => {
        runInAction(() => {
          this.instanceConfigurations = this.instanceConfigurations
            ? [...this.instanceConfigurations, ...response]
            : response;
        });
      });
    } catch (error) {
      console.error("Error updating the instance configurations");
      throw error;
    }
  };
}
