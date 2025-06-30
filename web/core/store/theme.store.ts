import { action, observable, makeObservable, runInAction } from "mobx";

export interface IThemeStore {
  // observables
  isAnySidebarDropdownOpen: boolean | undefined;
  sidebarCollapsed: boolean | undefined;
  sidebarPeek: boolean | undefined;
  isExtendedSidebarOpened: boolean | undefined;
  isExtendedProjectSidebarOpened: boolean | undefined;
  profileSidebarCollapsed: boolean | undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined;
  issueDetailSidebarCollapsed: boolean | undefined;
  epicDetailSidebarCollapsed: boolean | undefined;
  initiativesSidebarCollapsed: boolean | undefined;
  projectOverviewSidebarCollapsed: boolean | undefined;
  // actions
  toggleAnySidebarDropdown: (open?: boolean) => void;
  toggleSidebar: (collapsed?: boolean) => void;
  toggleSidebarPeek: (peek?: boolean) => void;
  toggleExtendedSidebar: (collapsed?: boolean) => void;
  toggleExtendedProjectSidebar: (collapsed?: boolean) => void;
  toggleProfileSidebar: (collapsed?: boolean) => void;
  toggleWorkspaceAnalyticsSidebar: (collapsed?: boolean) => void;
  toggleIssueDetailSidebar: (collapsed?: boolean) => void;
  toggleEpicDetailSidebar: (collapsed?: boolean) => void;
  toggleInitiativesSidebar: (collapsed?: boolean) => void;
  toggleProjectOverviewSidebar: (collapsed?: boolean) => void;
}

export class ThemeStore implements IThemeStore {
  // observables
  isAnySidebarDropdownOpen: boolean | undefined = undefined;
  sidebarCollapsed: boolean | undefined = undefined;
  sidebarPeek: boolean | undefined = undefined;
  isExtendedSidebarOpened: boolean | undefined = undefined;
  isExtendedProjectSidebarOpened: boolean | undefined = undefined;
  profileSidebarCollapsed: boolean | undefined = undefined;
  workspaceAnalyticsSidebarCollapsed: boolean | undefined = undefined;
  issueDetailSidebarCollapsed: boolean | undefined = undefined;
  epicDetailSidebarCollapsed: boolean | undefined = undefined;
  initiativesSidebarCollapsed: boolean | undefined = undefined;
  projectOverviewSidebarCollapsed: boolean | undefined = undefined;

  constructor() {
    makeObservable(this, {
      // observable
      isAnySidebarDropdownOpen: observable.ref,
      sidebarCollapsed: observable.ref,
      sidebarPeek: observable.ref,
      isExtendedSidebarOpened: observable.ref,
      isExtendedProjectSidebarOpened: observable.ref,
      profileSidebarCollapsed: observable.ref,
      workspaceAnalyticsSidebarCollapsed: observable.ref,
      issueDetailSidebarCollapsed: observable.ref,
      epicDetailSidebarCollapsed: observable.ref,
      initiativesSidebarCollapsed: observable.ref,
      projectOverviewSidebarCollapsed: observable.ref,
      // action
      toggleAnySidebarDropdown: action,
      toggleSidebar: action,
      toggleSidebarPeek: action,
      toggleExtendedSidebar: action,
      toggleExtendedProjectSidebar: action,
      toggleProfileSidebar: action,
      toggleWorkspaceAnalyticsSidebar: action,
      toggleIssueDetailSidebar: action,
      toggleEpicDetailSidebar: action,
      toggleInitiativesSidebar: action,
      toggleProjectOverviewSidebar: action,
    });
  }

  toggleAnySidebarDropdown = (open?: boolean) => {
    if (open === undefined) {
      this.isAnySidebarDropdownOpen = !this.isAnySidebarDropdownOpen;
    } else {
      this.isAnySidebarDropdownOpen = open;
    }
  };

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
   * Toggle the sidebar peek state
   * @param peek
   */
  toggleSidebarPeek = (peek?: boolean) => {
    if (peek === undefined) {
      this.sidebarPeek = !this.sidebarPeek;
    } else {
      this.sidebarPeek = peek;
    }
  };

  /**
   * Toggle the extended sidebar collapsed state
   * @param collapsed
   */
  toggleExtendedSidebar = (collapsed?: boolean) => {
    const updatedState = collapsed ?? !this.isExtendedSidebarOpened;
    runInAction(() => {
      this.isExtendedSidebarOpened = updatedState;
    });
    localStorage.setItem("extended_sidebar_collapsed", updatedState.toString());
  };

  /**
   * Toggle the extended project sidebar collapsed state
   * @param collapsed
   */
  toggleExtendedProjectSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.isExtendedProjectSidebarOpened = !this.isExtendedProjectSidebarOpened;
    } else {
      this.isExtendedProjectSidebarOpened = collapsed;
    }
    localStorage.setItem("extended_project_sidebar_collapsed", this.isExtendedProjectSidebarOpened.toString());
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

  toggleEpicDetailSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.epicDetailSidebarCollapsed = !this.epicDetailSidebarCollapsed;
    } else {
      this.epicDetailSidebarCollapsed = collapsed;
    }
    localStorage.setItem("epic_detail_sidebar_collapsed", this.epicDetailSidebarCollapsed.toString());
  };

  toggleInitiativesSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.initiativesSidebarCollapsed = !this.initiativesSidebarCollapsed;
    } else {
      this.initiativesSidebarCollapsed = collapsed;
    }
    localStorage.setItem("initiatives_sidebar_collapsed", this.initiativesSidebarCollapsed.toString());
  };

  toggleProjectOverviewSidebar = (collapsed?: boolean) => {
    if (collapsed === undefined) {
      this.projectOverviewSidebarCollapsed = !this.projectOverviewSidebarCollapsed;
    } else {
      this.projectOverviewSidebarCollapsed = collapsed;
    }
    localStorage.setItem("project_overview_sidebar_collapsed", this.projectOverviewSidebarCollapsed.toString());
  };
}
