// mobx
import { action, observable, makeObservable } from "mobx";

export interface IInstanceStore {}

export class InstanceStore implements IInstanceStore {
  constructor() {
    makeObservable(this, {
      // observable
      // action
      // computed
    });
  }
}
