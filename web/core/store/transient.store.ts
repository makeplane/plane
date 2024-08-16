import { action, observable, makeObservable } from "mobx";

export interface ITransientStore {
  // observables
  isIntercomToggle: boolean;
  // actions
  toggleIntercom: (intercomToggle: boolean) => void;
}

export class TransientStore implements ITransientStore {
  // observables
  isIntercomToggle: boolean = false;

  constructor() {
    makeObservable(this, {
      // observable
      isIntercomToggle: observable.ref,
      // action
      toggleIntercom: action,
    });
  }

  /**
   * @description Toggle the intercom collapsed state
   * @param { boolean } intercomToggle
   */
  toggleIntercom = (intercomToggle: boolean) => (this.isIntercomToggle = intercomToggle);
}
