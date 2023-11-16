import { observable, action, computed, makeObservable, runInAction } from "mobx";
// store
import { RootStore } from "../root";
// types
import { IInstance } from "types/instance";
// services
import { InstanceService } from "services/instance.service";

export interface IInstanceStore {
  loader: boolean;
  error: any | null;
  // issues
  instance: IInstance | null;
  configurations: any | null;
  // computed
  // action
  fetchInstanceInfo: () => Promise<IInstance>;
  fetchInstanceConfigurations: () => Promise<any>;
}

export class InstanceStore implements IInstanceStore {
  loader: boolean = false;
  error: any | null = null;
  instance: IInstance | null = null;
  configurations: any | null = null;
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
      //   getIssueType: computed,
      // actions
      fetchInstanceInfo: action,
      fetchInstanceConfigurations: action,
    });

    this.rootStore = _rootStore;
    this.instanceService = new InstanceService();
  }

  fetchInstanceInfo = async () => {
    try {
      const instance = await this.instanceService.getInstanceInfo();
      runInAction(() => {
        this.instance = instance;
      });
      return instance;
    } catch (error) {
      console.log("Error while fetching the instance");
      throw error;
    }
  };

  fetchInstanceConfigurations = async () => {
    try {
      const configurations = await this.instanceService.getInstanceConfigurations();
      runInAction(() => {
        this.configurations = configurations;
      });
      return configurations;
    } catch (error) {
      console.log("Error while fetching the instance");
      throw error;
    }
  };
}
