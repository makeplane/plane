import { action, observable, makeObservable } from "mobx";

export interface ITransientStore {
  chatWindowEnabled: boolean;
  toggleChatWindow: () => void;
}

export class TransientStore implements ITransientStore {
  chatWindowEnabled: boolean = false;

  constructor() {
    makeObservable(this, {
      chatWindowEnabled: observable,
      toggleChatWindow: action,
    });
  }

  /**
   * Toggle the chat window
   */
  toggleChatWindow = () => {
    this.chatWindowEnabled = !this.chatWindowEnabled;
  };
}
