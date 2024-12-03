import { computed, makeObservable } from "mobx";
// types / constants
import { BaseCommandPaletteStore, IBaseCommandPaletteStore } from "@/store/base-command-palette.store";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // computed
  isAnyModalOpen: boolean;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  isTeamModalOpen: boolean = false;

  constructor() {
    super();
    makeObservable(this, {
      // computed
      isAnyModalOpen: computed,
    });
  }

  /**
   * Checks whether any modal is open or not.
   * @returns boolean
   */
  get isAnyModalOpen() {
    return Boolean(this.isAnyBaseModalOpen);
  }
}
