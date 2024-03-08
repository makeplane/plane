import { observable, action, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "store/root.store";
// services
import { InstanceService } from "services/instance.service";
// types
import { IInstance } from "@plane/types";

type TError = {
  status: string;
  message: string;
};

export interface IInstanceStore {
  // issues
  isLoading: boolean;
  instance: IInstance | undefined;
  error: TError | undefined;
  // action
  fetchInstanceInfo: () => Promise<void>;
}

export class InstanceStore implements IInstanceStore {
  isLoading: boolean = true;
  instance: IInstance | undefined = undefined;
  error: TError | undefined = undefined;
  // services
  instanceService;

  constructor(private store: RootStore) {
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
      runInAction(() => {
        this.isLoading = false;
        this.instance = instance;
      });
    } catch (error) {
      console.log("Failed to fetch instance info", error);
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
