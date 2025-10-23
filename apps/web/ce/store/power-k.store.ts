import { makeObservable } from "mobx";
// types
import { BasePowerKStore, IBasePowerKStore } from "@/store/base-power-k.store";

export type IPowerKStore = IBasePowerKStore;

export class PowerKStore extends BasePowerKStore implements IPowerKStore {
  constructor() {
    super();
    makeObservable(this, {});
  }
}
