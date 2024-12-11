import { makeObservable } from "mobx";
// types / constants
import { BaseCommandPaletteStore, IBaseCommandPaletteStore } from "@/store/base-command-palette.store";

export type ICommandPaletteStore = IBaseCommandPaletteStore;

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  constructor() {
    super();
    makeObservable(this, {});
  }
}
