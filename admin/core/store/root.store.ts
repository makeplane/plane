import { enableStaticRendering } from "mobx-react";
// stores
import { IInstanceStore, InstanceStore } from "./instance.store";
import { IThemeStore, ThemeStore } from "./theme.store";
import { IUserStore, UserStore } from "./user.store";

enableStaticRendering(typeof window === "undefined");

export abstract class CoreRootStore {
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;

  constructor() {
    this.theme = new ThemeStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
  }

  hydrate(initialData: any) {
    this.theme.hydrate(initialData.theme);
    this.instance.hydrate(initialData.instance);
    this.user.hydrate(initialData.user);
  }

  resetOnSignOut() {
    localStorage.setItem("theme", "system");
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
  }
}
