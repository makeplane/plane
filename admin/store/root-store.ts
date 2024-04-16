import { enableStaticRendering } from "mobx-react-lite";
// stores
import { IThemeStore, ThemeStore } from "./theme.store";
import { IInstanceStore, InstanceStore } from "./instance.store";
import { IUserStore, UserStore } from "./user.store";

enableStaticRendering(typeof window === "undefined");

export class RootStore {
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;

  constructor() {
    this.theme = new ThemeStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
  }

  resetOnSignOut() {
    this.theme = new ThemeStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
  }
}
