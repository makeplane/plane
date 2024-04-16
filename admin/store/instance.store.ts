import { observable, action, computed, makeObservable, runInAction } from "mobx";
import {
  TInstanceNotReady,
  IInstance,
  IInstanceConfiguration,
  IFormattedInstanceConfiguration,
  IInstanceAdmin,
} from "@plane/types";
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
  isLoading: boolean = true;
  instanceStatus: TInstanceStatus | undefined = undefined;
  instance: IInstance | undefined = undefined;

  configurations: IInstanceConfiguration[] | null = null;
  instanceAdmins: IInstanceAdmin[] | null = null;
  // service
  instanceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      instanceStatus: observable,
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
    }, {} as IFormattedInstanceConfiguration);
  }

  /**
   * @description fetch instance information
   */
  fetchInstanceInfo = async () => {
    try {
      this.isLoading = true;
      const instance = await this.instanceService.getInstanceInfo();
      this.isLoading = false;

      const isInstanceNotSetup = (instance: IInstance) => "is_activated" in instance && "is_setup_done" in instance;

      if (isInstanceNotSetup(instance)) {
        const instanceData: TInstanceNotReady = instance as unknown as TInstanceNotReady;
        runInAction(() => {
          this.isLoading = false;
          this.instanceStatus = {
            status: EInstanceStatus.NOT_YET_READY,
            data: {
              is_activated: instanceData?.is_activated,
              is_setup_done: instanceData?.is_setup_done,
            },
          };
        });
      } else
        runInAction(() => {
          this.isLoading = false;
          this.instance = instance;
        });
      return instance;
    } catch (error) {
      console.log("Error while fetching the instance info");
      this.isLoading = false;
      this.instanceStatus = {
        status: EInstanceStatus.ERROR,
      };
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
   * fetch instance configurations from API
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
