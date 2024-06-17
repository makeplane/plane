import { action, observable, makeObservable } from "mobx";

export interface IThemeStore {
  // observables
  sidebarCollapsed: boolean | undefined;
  profileSidebarCollapsed: boolean | undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined;
  issueDetailSidebarCollapsed: boolean | undefined;
  // actions
  toggleSidebar: (collapsed?: boolean) => void;
  toggleProfileSidebar: (collapsed?: boolean) => void;
  toggleWorkspaceAnalyticsSidebar: (collapsed?: boolean) => void;
  toggleIssueDetailSidebar: (collapsed?: boolean) => void;
}

export class ThemeStore implements IThemeStore {
  // observables
  sidebarCollapsed: boolean | undefined = undefined;
  profileSidebarCollapsed: boolean | undefined = undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined = undefined;
  issueDetailSidebarCollapsed: boolean | undefined = undefined;

  constructor() {
    makeObservable(this, {
      // observable
      sidebarCollapsed: observable.ref,
      profileSidebarCollapsed: observable.ref,
      workspaceAnalyticsSidebarCollapsed: observable.ref,
      issueDetailSidebarCollapsed: observable.ref,
      // action
      toggleSidebar: action,
      toggleProfileSidebar: action,
      toggleWorkspaceAnalyticsSidebar: action,
      toggleIssueDetailSidebar: action,
    });
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
}
