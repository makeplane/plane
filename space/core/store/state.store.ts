import clone from "lodash/clone";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { IState } from "@plane/types";
import { sortStates } from "@/helpers/state.helper";
import { StateService } from "@/services/state.service";
import { CoreRootStore } from "./root.store";

export interface IStateStore {
  // observables
  states: IState[] | undefined;
  //computed
  sortedStates: IState[] | undefined;
  // computed actions
  getStateById: (stateId: string | undefined) => IState | undefined;
  // fetch actions
  fetchStates: (anchor: string) => Promise<IState[]>;
}

export class StateStore implements IStateStore {
  states: IState[] | undefined = undefined;
  stateService: StateService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      states: observable,
      // computed
      sortedStates: computed,
      // fetch action
      fetchStates: action,
    });
    this.stateService = new StateService();
    this.rootStore = _rootStore;
  }

  get sortedStates() {
    if (!this.states) return;
    return sortStates(clone(this.states));
  }

  getStateById = (stateId: string | undefined) => this.states?.find((state) => state.id === stateId);

  fetchStates = async (anchor: string) => {
    const statesResponse = await this.stateService.getStates(anchor);
    runInAction(() => {
      this.states = statesResponse;
    });
    return statesResponse;
  };
}
