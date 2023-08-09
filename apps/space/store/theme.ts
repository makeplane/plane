// mobx
import { observable, action, computed, makeObservable, runInAction } from "mobx";
// helper
// import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";
// interfaces
// import { ICurrentUserSettings } from "types";
// service
import UserService from "services/user.service";

class ThemeStore {
  sidebarCollapsed: boolean | null = null;
  theme: string | null = null;
  // root store
  rootStore;
  // service
  userService;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // observable
      sidebarCollapsed: observable,
      theme: observable,
      // action
      setSidebarCollapsed: action,
      setTheme: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.userService = new UserService();
    this.initialLoad();
  }

  setSidebarCollapsed(collapsed: boolean | null = null) {
    if (collapsed === null) {
      let _sidebarCollapsed: string | boolean | null = localStorage.getItem("app_sidebar_collapsed");
      _sidebarCollapsed = _sidebarCollapsed ? (_sidebarCollapsed === "true" ? true : false) : false;
      this.sidebarCollapsed = _sidebarCollapsed;
    } else {
      this.sidebarCollapsed = collapsed;
      localStorage.setItem("app_sidebar_collapsed", collapsed.toString());
    }
  }

  setTheme = async (_theme: any) => {
    try {
      localStorage.setItem("theme", _theme.theme.toString());
      this.theme = _theme.theme.toString();

      // if (this.theme === "custom") {
      //   let themeSettings = this.rootStore.user.currentUserSettings || null;
      //   if (themeSettings && themeSettings.theme.palette) {
      //     applyTheme(
      //       themeSettings.theme.palette !== ",,,,"
      //         ? themeSettings.theme.palette
      //         : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
      //       themeSettings.theme.darkPalette
      //     );
      //   }
      // } else unsetCustomCssVariables();
    } catch (error) {
      console.error("setting user theme error", error);
    }
  };

  // init load
  initialLoad() {}
}

export default ThemeStore;
