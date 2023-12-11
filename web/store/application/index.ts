export class AppRootStore {
  config;
  commandPalette;
  eventTracker;
  instance;
  theme;

  constructor() {
    this.config = new ConfigStore();
    this.commandPalette = new CommandPaletteStore();
    this.eventTracker = new EventTrackerStore();
    this.instance = new InstanceStore();
    this.theme = new ThemeStore();
  }
}
