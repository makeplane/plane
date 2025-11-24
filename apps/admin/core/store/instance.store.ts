import { set } from "lodash-es";
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// plane internal packages
import type { TInstanceStatus } from "@plane/constants";
import { EInstanceStatus } from "@plane/constants";
import { InstanceService } from "@plane/services";
import type {
  IInstance,
  IInstanceAdmin,
  IInstanceConfiguration,
  IFormattedInstanceConfiguration,
  IInstanceInfo,
  IInstanceConfig,
} from "@plane/types";
// root store
import type { CoreRootStore } from "@/store/root.store";

export interface IInstanceStore {
  // issues
  isLoading: boolean;
  error: any;
  instanceStatus: TInstanceStatus | undefined;
  instance: IInstance | undefined;
  config: IInstanceConfig | undefined;
  instanceAdmins: IInstanceAdmin[] | undefined;
  instanceConfigurations: IInstanceConfiguration[] | undefined;
  // computed
  formattedConfig: IFormattedInstanceConfiguration | undefined;
  // action
  hydrate: (data: IInstanceInfo) => void;
  fetchInstanceInfo: () => Promise<IInstanceInfo | undefined>;
  updateInstanceInfo: (data: Partial<IInstance>) => Promise<IInstance | undefined>;
  fetchInstanceAdmins: () => Promise<IInstanceAdmin[] | undefined>;
  fetchInstanceConfigurations: () => Promise<IInstanceConfiguration[] | undefined>;
  updateInstanceConfigurations: (data: Partial<IFormattedInstanceConfiguration>) => Promise<IInstanceConfiguration[]>;
  disableEmail: () => Promise<void>;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  error: any = undefined;
  instanceStatus: TInstanceStatus | undefined = undefined;
  instance: IInstance | undefined = undefined;
  config: IInstanceConfig | undefined = undefined;
  instanceAdmins: IInstanceAdmin[] | undefined = undefined;
  instanceConfigurations: IInstanceConfiguration[] | undefined = undefined;
  // service
  instanceService;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      error: observable.ref,
      instanceStatus: observable,
      instance: observable,
      instanceAdmins: observable,
      instanceConfigurations: observable,
      // computed
      formattedConfig: computed,
      // actions
      hydrate: action,
      fetchInstanceInfo: action,
      fetchInstanceAdmins: action,
      updateInstanceInfo: action,
      fetchInstanceConfigurations: action,
      updateInstanceConfigurations: action,
    });

    this.instanceService = new InstanceService();
  }

  hydrate = (data: IInstanceInfo) => {
    if (data) {
      this.instance = data.instance;
      this.config = data.config;
    }
  };

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
      this.error = undefined;
      const instanceInfo = await this.instanceService.info();
      // handling the new user popup toggle
      if (this.instance === undefined && !instanceInfo?.instance?.workspaces_exist)
        this.store.theme.toggleNewUserPopup();
      runInAction(() => {
        // console.log("instanceInfo: ", instanceInfo);
        this.isLoading = false;
        this.instance = instanceInfo.instance;
        this.config = instanceInfo.config;
      });
      return instanceInfo;
    } catch (error) {
      console.error("Error fetching the instance info");
      this.isLoading = false;
      this.error = { message: "Failed to fetch the instance info" };
      this.instanceStatus = {
        status: EInstanceStatus.ERROR,
      };
      throw error;
    }
  };

  /**
   * @description updating instance information
   * @param {Partial<IInstance>} data
   * @returns void
   */
  updateInstanceInfo = async (data: Partial<IInstance>) => {
    try {
      const instanceResponse = await this.instanceService.update(data);
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
      const instanceAdmins = await this.instanceService.admins();
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
      const instanceConfigurations = await this.instanceService.configurations();
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
      const response = await this.instanceService.updateConfigurations(data);
      runInAction(() => {
        this.instanceConfigurations = this.instanceConfigurations?.map((config) => {
          const item = response.find((item) => item.key === config.key);
          if (item) return item;
          return config;
        });
      });
      return response;
    } catch (error) {
      console.error("Error updating the instance configurations");
      throw error;
    }
  };

  disableEmail = async () => {
    const instanceConfigurations = this.instanceConfigurations;
    try {
      runInAction(() => {
        this.instanceConfigurations = this.instanceConfigurations?.map((config) => {
          if (
            [
              "EMAIL_HOST",
              "EMAIL_PORT",
              "EMAIL_HOST_USER",
              "EMAIL_HOST_PASSWORD",
              "EMAIL_FROM",
              "ENABLE_SMTP",
            ].includes(config.key)
          )
            return { ...config, value: "" };
          return config;
        });
      });
      await this.instanceService.disableEmail();
    } catch (_error) {
      console.error("Error disabling the email");
      this.instanceConfigurations = instanceConfigurations;
    }
  };
}
