import { makeObservable } from "mobx";
// types
import type { IBasePowerKStore } from "@/store/base-power-k.store";
import { BasePowerKStore } from "@/store/base-power-k.store";

export type IPowerKStore = IBasePowerKStore;

export class PowerKStore extends BasePowerKStore implements IPowerKStore {
  constructor() {
    super();
    makeObservable(this, {});
  }
}
