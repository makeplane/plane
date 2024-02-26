// mobx
import { action, observable, makeObservable } from "mobx";
// helper
import { applyTheme, unsetCustomCssVariables } from "helpers/theme.helper";

export interface IThemeStore {
  // observables
  theme: string | null;
  mobileSidebarCollapsed: boolean | undefined;
  sidebarCollapsed: boolean | undefined;
  profileSidebarCollapsed: boolean | undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined;
  issueDetailSidebarCollapsed: boolean | undefined;
  // actions
  toggleSidebar: (collapsed?: boolean) => void;
  toggleMobileSidebar: (collapsed?: boolean) => void;
  setTheme: (theme: any) => void;
  toggleProfileSidebar: (collapsed?: boolean) => void;
  toggleWorkspaceAnalyticsSidebar: (collapsed?: boolean) => void;
  toggleIssueDetailSidebar: (collapsed?: boolean) => void;
}

export class ThemeStore implements IThemeStore {
  // observables
  mobileSidebarCollapsed: boolean | undefined = true;
  sidebarCollapsed: boolean | undefined = undefined;
  theme: string | null = null;
  profileSidebarCollapsed: boolean | undefined = undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined = undefined;
  issueDetailSidebarCollapsed: boolean | undefined = undefined;
  // root store
  rootStore;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // observable
      mobileSidebarCollapsed: observable.ref,
      sidebarCollapsed: observable.ref,
      theme: observable.ref,
      profileSidebarCollapsed: observable.ref,
      workspaceAnalyticsSidebarCollapsed: observable.ref,
      issueDetailSidebarCollapsed: observable.ref,
      // action
      toggleSidebar: action,
      toggleMobileSidebar: action,
      setTheme: action,
      toggleProfileSidebar: action,
      toggleWorkspaceAnalyticsSidebar: action,
      toggleIssueDetailSidebar: action,
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
   * Toggle mobile sidebar collapsed state
   * @param collapsed
   */
  toggleMobileSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.mobileSidebarCollapsed = !this.mobileSidebarCollapsed;
    } else {
      this.mobileSidebarCollapsed = collapsed;
    }
    localStorage.setItem("mobile_sidebar_collapsed", this.mobileSidebarCollapsed.toString());
  };

  /**
   * Toggle the profile sidebar collapsed state
   * @param collapsed
   */
  toggleProfileSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.profileSidebarCollapsed = !this.profileSidebarCollapsed;
    } else {
      this.profileSidebarCollapsed = collapsed;
    }
    localStorage.setItem("profile_sidebar_collapsed", this.profileSidebarCollapsed.toString());
  };

  /**
   * Toggle the profile sidebar collapsed state
   * @param collapsed
   */
  toggleWorkspaceAnalyticsSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.workspaceAnalyticsSidebarCollapsed = !this.workspaceAnalyticsSidebarCollapsed;
    } else {
      this.workspaceAnalyticsSidebarCollapsed = collapsed;
    }
    localStorage.setItem("workspace_analytics_sidebar_collapsed", this.workspaceAnalyticsSidebarCollapsed.toString());
  };

  toggleIssueDetailSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.issueDetailSidebarCollapsed = !this.issueDetailSidebarCollapsed;
    } else {
      this.issueDetailSidebarCollapsed = collapsed;
    }
    localStorage.setItem("issue_detail_sidebar_collapsed", this.issueDetailSidebarCollapsed.toString());
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
