import { action, observable, makeObservable } from "mobx";
// root store
import { RootStore } from "@/store/root-store";

type TTheme = "dark" | "light";
export interface IThemeStore {
  // observables
  isNewUserPopup: boolean;
  theme: string | undefined;
  isSidebarCollapsed: boolean | undefined;
  // actions
  toggleNewUserPopup: () => void;
  toggleSidebar: (collapsed: boolean) => void;
  setTheme: (currentTheme: TTheme) => void;
}

export class ThemeStore implements IThemeStore {
  // observables
  isNewUserPopup: boolean = false;
  isSidebarCollapsed: boolean | undefined = undefined;
  theme: string | undefined = undefined;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      isNewUserPopup: observable.ref,
      isSidebarCollapsed: observable.ref,
      theme: observable.ref,
      // action
      toggleNewUserPopup: action,
      toggleSidebar: action,
      setTheme: action,
    });
  }

  /**
   * @description Toggle the new user popup modal
   */
  toggleNewUserPopup = () => (this.isNewUserPopup = !this.isNewUserPopup);

  /**
   * @description Toggle the sidebar collapsed state
   * @param isCollapsed
   */
  toggleSidebar = (isCollapsed: boolean) => {
    if (isCollapsed === undefined) this.isSidebarCollapsed = !this.isSidebarCollapsed;
    else this.isSidebarCollapsed = isCollapsed;
    localStorage.setItem("god_mode_sidebar_collapsed", isCollapsed.toString());
  };

  /**
   * @description Sets the user theme and applies it to the platform
   * @param currentTheme
   */
  setTheme = async (currentTheme: TTheme) => {
    try {
      localStorage.setItem("theme", currentTheme);
      this.theme = currentTheme;
    } catch (error) {
      console.error("setting user theme error", error);
    }
  };
}
