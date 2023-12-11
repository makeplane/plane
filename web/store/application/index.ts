import { RootStore } from "../root.store";
import { AppConfigStore } from "./app-config.store";
import { CommandPaletteStore } from "./command-palette.store";
import { EventTrackerStore } from "./event-tracker.store";
import { InstanceStore } from "./instance.store";
import { RouterStore } from "./router.store";
import { ThemeStore } from "./theme.store";

export class AppRootStore {
  config: AppConfigStore;
  commandPalette: CommandPaletteStore;
  eventTracker: EventTrackerStore;
  instance: InstanceStore;
  theme: ThemeStore;
  router: RouterStore;

  constructor(rootStore: RootStore) {
    this.config = new AppConfigStore(rootStore);
    this.commandPalette = new CommandPaletteStore(rootStore);
    this.eventTracker = new EventTrackerStore(rootStore);
    this.instance = new InstanceStore(rootStore);
    this.theme = new ThemeStore(rootStore);
    this.router = new RouterStore();
  }
}
