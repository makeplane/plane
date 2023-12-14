import { RootStore } from "store/root.store";
import { AppConfigStore, IAppConfigStore } from "./app-config.store";
import { CommandPaletteStore, ICommandPaletteStore } from "./command-palette.store";
import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
// import { EventTrackerStore, IEventTrackerStore } from "./event-tracker.store";
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

  constructor(_rootStore: RootStore) {
    this.router = new RouterStore();
    this.config = new AppConfigStore();
    this.commandPalette = new CommandPaletteStore();
    this.eventTracker = new EventTrackerStore(_rootStore);
    this.instance = new InstanceStore();
    this.theme = new ThemeStore();
  }
}
