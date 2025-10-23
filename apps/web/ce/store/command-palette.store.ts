import { computed, makeObservable } from "mobx";
// types / constants
import type { IBaseCommandPaletteStore } from "@/store/base-command-palette.store";
import { BaseCommandPaletteStore } from "@/store/base-command-palette.store";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // computed
  isAnyModalOpen: boolean;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  constructor() {
    super();
    makeObservable(this, {
      // computed
      isAnyModalOpen: computed,
    });
  }

  /**
   * Checks whether any modal is open or not in the base command palette.
   * @returns boolean
   */
  get isAnyModalOpen(): boolean {
    return Boolean(super.getCoreModalsState());
  }
}
