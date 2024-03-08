import { RootStore } from "store/root.store";
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { InstanceStore, IInstanceStore } from "./instance.store";
import { RouterStore, IRouterStore } from "./router.store";
import { ThemeStore, IThemeStore } from "./theme.store";

export interface IAppRootStore {
  commandPalette: ICommandPaletteStore;
  instance: IInstanceStore;
  theme: IThemeStore;
  router: IRouterStore;
}

export class AppRootStore implements IAppRootStore {
  commandPalette: ICommandPaletteStore;
  instance: IInstanceStore;
  theme: IThemeStore;
  router: IRouterStore;

  constructor(private store: RootStore) {
    this.router = new RouterStore();
    this.commandPalette = new CommandPaletteStore();
    this.instance = new InstanceStore(this.store);
    this.theme = new ThemeStore();
  }
}
