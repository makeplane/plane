import { enableStaticRendering } from "mobx-react";
// plane imports
import { FALLBACK_LANGUAGE, LANGUAGE_STORAGE_KEY } from "@plane/i18n";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// stores
import { EditorAssetStore, IEditorAssetStore } from "./editor/asset.store";
import { FavoriteStore, IFavoriteStore } from "./favorite.store";
import { IInstanceStore, InstanceStore } from "./instance.store";
import { IMemberRootStore, MemberRootStore } from "./member";
import { RouterStore, IRouterStore } from "./router.store";
import { ThemeStore, IThemeStore } from "./theme.store";
import { IUserStore, UserStore } from "./user";
import { IWorkspaceRootStore, WorkspaceRootStore } from "./workspace";

enableStaticRendering(typeof window === "undefined");

export class CoreRootStore {
  workspaceRoot: IWorkspaceRootStore;
  memberRoot: IMemberRootStore;

  router: IRouterStore;
  theme: IThemeStore;
  user: IUserStore;
  favorite: IFavoriteStore;
  editorAssetStore: IEditorAssetStore;
  instance: IInstanceStore;

  constructor() {
    this.router = new RouterStore();
    this.user = new UserStore(this as unknown as RootStore);
    this.instance = new InstanceStore();
    this.theme = new ThemeStore();
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.favorite = new FavoriteStore(this);
    this.memberRoot = new MemberRootStore(this as unknown as RootStore);
    this.editorAssetStore = new EditorAssetStore();
  }

  resetOnSignOut() {
    // handling the system theme when user logged out from the app
    localStorage.setItem("theme", "system");
    localStorage.setItem(LANGUAGE_STORAGE_KEY, FALLBACK_LANGUAGE);
    this.router = new RouterStore();
    this.instance = new InstanceStore();
    this.user = new UserStore(this as unknown as RootStore);
    this.workspaceRoot = new WorkspaceRootStore(this);
    this.memberRoot = new MemberRootStore(this as unknown as RootStore);
    this.editorAssetStore = new EditorAssetStore();
    this.favorite = new FavoriteStore(this);
  }
}
