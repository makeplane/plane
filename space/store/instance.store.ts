import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { IInstance } from "@plane/types";
// services
import { InstanceService } from "@/services/instance.service";
// store types
import { RootStore } from "@/store/root.store";

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
  data: IInstance | NonNullable<unknown>;
  config: Record<string, any>;
  error: TError | undefined;
  // action
  fetchInstanceInfo: () => Promise<void>;
  hydrate: (data: Record<string, unknown>, config: Record<string, unknown>) => void;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  data: IInstance | Record<string, any> = {};
  config: Record<string, unknown> = {};
  error: TError | undefined = undefined;
  // services
  instanceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      data: observable,
      config: observable,
      error: observable,
      // actions
      fetchInstanceInfo: action,
      hydrate: action,
    });
    // services
    this.instanceService = new InstanceService();
  }

  hydrate = (data: Record<string, unknown>, config: Record<string, unknown>) => {
    this.data = { ...this.data, ...data };
    this.config = { ...this.config, ...config };
  };

  /**
   * @description fetching instance information
   */
  fetchInstanceInfo = async () => {
    try {
      this.isLoading = true;
      this.error = undefined;
      const instanceDetails = await this.instanceService.getInstanceInfo();
      runInAction(() => {
        this.isLoading = false;
        this.data = instanceDetails.instance;
        this.config = instanceDetails.config;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
        this.error = {
          status: "error",
          message: "Failed to fetch instance info",
        };
      });
    }
  };
}
