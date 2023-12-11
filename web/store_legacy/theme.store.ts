// mobx
import { action, observable, makeObservable } from "mobx";
// helper
import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";

export interface IThemeStore {
  theme: string | null;
  sidebarCollapsed: boolean | undefined;

  toggleSidebar: (collapsed?: boolean) => void;
  setTheme: (theme: any) => void;
}

class ThemeStore implements IThemeStore {
  sidebarCollapsed: boolean | undefined = undefined;
  theme: string | null = null;
  // root store
  rootStore;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // observable
      sidebarCollapsed: observable.ref,
      theme: observable.ref,
      // action
      toggleSidebar: action,
      setTheme: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.initialLoad();
  }
  toggleSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.sidebarCollapsed = collapsed;
    }
    localStorage.setItem("app_sidebar_collapsed", this.sidebarCollapsed.toString());
  };

  setTheme = async (_theme: { theme: any }) => {
    try {
      const currentTheme: string = _theme?.theme?.theme?.toString();

      // updating the local storage theme value
      localStorage.setItem("theme", currentTheme);
      // updating the mobx theme value
      this.theme = currentTheme;

      // applying the theme to platform if the selected theme is custom
      if (currentTheme === "custom") {
        const themeSettings = this.rootStore.user.currentUserSettings || null;
        applyTheme(
          themeSettings?.theme?.palette !== ",,,,"
            ? themeSettings?.theme?.palette
            : "#0d101b,#c5c5c5,#3f76ff,#0d101b,#c5c5c5",
          themeSettings?.theme?.darkPalette
        );
      } else unsetCustomCssVariables();
    } catch (error) {
      console.error("setting user theme error", error);
    }
  };

  // init load
  initialLoad() {}
}

export default ThemeStore;
