import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { IInstance } from "@plane/types";
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
  instanceNotReady: any | undefined;
  instance: IInstance | undefined;
  error: TError | undefined;
  // action
  fetchInstanceInfo: () => Promise<void>;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  instanceNotReady: any | undefined = undefined;
  instance: IInstance | undefined = undefined;
  error: TError | undefined = undefined;
  // services
  instanceService;

  constructor() {
    makeObservable(this, {
      // observable
      isLoading: observable.ref,
      instance: observable,
      error: observable,
      // actions
      fetchInstanceInfo: action,
    });
    // services
    this.instanceService = new InstanceService();
  }

  /**
   * @description fetching instance information
   */
  fetchInstanceInfo = async () => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = undefined;
      });

      const instance = await this.instanceService.getInstanceInfo();

      const isInstanceNotSetup = (instance: IInstance) => "is_activated" in instance && "is_setup_done" in instance;

      if (isInstanceNotSetup(instance)) {
        runInAction(() => {
          this.isLoading = false;
          this.error = {
            status: "success",
            message: "Instance is not created in the backend",
            data: {
              is_activated: instance?.instance?.is_activated,
              is_setup_done: instance?.instance?.is_setup_done,
            },
          };
        });
      } else {
        runInAction(() => {
          this.isLoading = false;
          this.instance = instance;
        });
      }
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
