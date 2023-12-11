import { RootStore } from "../root.store";
import { AppConfigStore, IAppConfigStore } from "./app-config.store";
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
import { InstanceStore, IInstanceStore } from "./instance.store";
import { RouterStore, IRouterStore } from "./router.store";
import { ThemeStore, IThemeStore } from "./theme.store";

export interface IAppRootStore {
  config: IAppConfigStore;
  commandPalette: ICommandPaletteStore;
  eventTracker: IEventTrackerStore;
  instance: IInstanceStore;
  theme: IThemeStore;
  router: IRouterStore;
}

export class AppRootStore implements IAppRootStore {
  config: IAppConfigStore;
  commandPalette: ICommandPaletteStore;
  eventTracker: IEventTrackerStore;
  instance: IInstanceStore;
  theme: IThemeStore;
  router: IRouterStore;

  constructor(rootStore: RootStore) {
    this.config = new AppConfigStore(rootStore);
    this.commandPalette = new CommandPaletteStore(rootStore);
    this.eventTracker = new EventTrackerStore(rootStore);
    this.instance = new InstanceStore(rootStore);
    this.theme = new ThemeStore(rootStore);
    this.router = new RouterStore();
  }
}
