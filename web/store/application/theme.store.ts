// mobx
import { action, observable, makeObservable } from "mobx";
// helper
import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";

export interface IThemeStore {
  // observables
  theme: string | null;
  sidebarCollapsed: boolean | undefined;
  // actions
  toggleSidebar: (collapsed?: boolean) => void;
  setTheme: (theme: any) => void;
}

export class ThemeStore implements IThemeStore {
  // observables
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
    // root store
    this.rootStore = _rootStore;
  }

  /**
   * Toggle the sidebar collapsed state
   * @param collapsed
   */
  toggleSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    } else {
      this.sidebarCollapsed = collapsed;
    }
    localStorage.setItem("app_sidebar_collapsed", this.sidebarCollapsed.toString());
  };

  /**
   * Sets the user theme and applies it to the platform
   * @param _theme
   */
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
}
