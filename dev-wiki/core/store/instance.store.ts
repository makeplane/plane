import set from "lodash/set";
import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { IInstance, IInstanceConfig } from "@plane/types";
// services
import { InstanceService } from "@/services/instance.service";

type TError = {
  status: string;
  message: string;
  data?: {
    is_activated: boolean;
    is_setup_done: boolean;
  };
};

export interface IInstanceStore {
  // issues
  isLoading: boolean;
  instance: IInstance | undefined;
  config: IInstanceConfig | undefined;
  error: TError | undefined;
  // computed
  isUpdateAvailable: boolean;
  // helper action
  updateInstanceInfo: (payload: Partial<IInstance>) => void;
  // action
  fetchInstanceInfo: () => Promise<void>;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  instance: IInstance | undefined = undefined;
  config: IInstanceConfig | undefined = undefined;
  error: TError | undefined = undefined;
  // services
  instanceService;

  constructor() {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      instance: observable,
      config: observable,
      error: observable,
      // computed
      isUpdateAvailable: computed,
      // helper actions
      updateInstanceInfo: action,
      // actions
      fetchInstanceInfo: action,
    });
    // services
    this.instanceService = new InstanceService();
  }

  get isUpdateAvailable() {
    if (!this.instance || !this.instance.latest_version) return false;
    return this.instance.current_version !== this.instance.latest_version;
  }

  /**
   * @description updating instance information
   */
  updateInstanceInfo = (payload: Partial<IInstance>) => {
    runInAction(() => {
      set(this, "instance", { ...this.instance, ...payload });
    });
  };

  /**
   * @description fetching instance information
   */
  fetchInstanceInfo = async () => {
    try {
      this.isLoading = true;
      this.error = undefined;
      const instanceInfo = await this.instanceService.getInstanceInfo();
      runInAction(() => {
        this.isLoading = false;
        this.instance = instanceInfo.instance;
        this.config = instanceInfo.config;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = {
          status: "error",
          message: "Failed to fetch instance info",
        };
      });
      throw error;
    }
  };
}
