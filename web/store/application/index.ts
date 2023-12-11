import { RootStore } from "../root.store";

export class AppRootStore {
  config;
  commandPalette;
  eventTracker;
  instance;
  theme;

  constructor(rootStore: RootStore) {
    this.config = new ConfigStore(rootStore);
    this.commandPalette = new CommandPaletteStore(rootStore);
    this.eventTracker = new EventTrackerStore(rootStore);
    this.instance = new InstanceStore(rootStore);
    this.theme = new ThemeStore(rootStore);
  }
}
