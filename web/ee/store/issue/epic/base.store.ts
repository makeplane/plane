/* eslint-disable no-useless-catch */

import { action, makeObservable, observable } from "mobx";
import { CoreRootStore } from "@/store/root.store";
import { IUpdateStore, UpdateStore } from "../../updates/base.store";

export interface IEpicBaseStore {
  updatesStore: IUpdateStore;
}

export class EpicBaseStore implements IEpicBaseStore {
  //store
  rootStore: CoreRootStore;
  updatesStore: IUpdateStore;

  constructor(public store: CoreRootStore) {
    makeObservable(this, {});
    // services
    this.rootStore = store;
    this.updatesStore = new UpdateStore();
  }
}
