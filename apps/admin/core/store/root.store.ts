import { enableStaticRendering } from "mobx-react";
// stores
import type { IInstanceStore } from "./instance.store";
import { InstanceStore } from "./instance.store";
import type { IThemeStore } from "./theme.store";
import { ThemeStore } from "./theme.store";
import type { IUserStore } from "./user.store";
import { UserStore } from "./user.store";
import type { IWorkspaceStore } from "./workspace.store";
import { WorkspaceStore } from "./workspace.store";

enableStaticRendering(typeof window === "undefined");

export abstract class CoreRootStore {
  theme: IThemeStore;
  instance: IInstanceStore;
  user: IUserStore;
  workspace: IWorkspaceStore;

  constructor() {
    this.theme = new ThemeStore(this);
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.workspace = new WorkspaceStore(this);
  }

  hydrate(initialData: any) {
    this.theme.hydrate(initialData.theme);
    this.instance.hydrate(initialData.instance);
    this.user.hydrate(initialData.user);
    this.workspace.hydrate(initialData.workspace);
  }

  resetOnSignOut() {
    localStorage.setItem("theme", "system");
    this.instance = new InstanceStore(this);
    this.user = new UserStore(this);
    this.theme = new ThemeStore(this);
    this.workspace = new WorkspaceStore(this);
  }
}
