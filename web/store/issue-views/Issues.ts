import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
// services
import { UserService } from "services/user.service";
import { ProjectIssuesServices } from "services/issues.service";
import { ProjectIssuesServices as ProjectModuleServices } from "services/modules.service";
import { ProjectCycleServices } from "services/cycles.service";
// types
import { TIssueLayouts, TIssueViews } from "./issue_filters";

export interface IIssues {
  [key: string]: any;
}

export interface IIssuesLayout {
  list: IIssues;
  kanban: IIssues;
  calendar: IIssues;
  spreadsheet: IIssues;
  gantt_chart: IIssues;
}

export interface IIssueState {
  [key: string]: {
    my_issues: IIssuesLayout;
    project_issues: {
      [key: string]: {
        issues: IIssuesLayout;
        cycles: {
          [key: string]: IIssuesLayout;
        };
        modules: {
          [key: string]: IIssuesLayout;
        };
        views: {
          [key: string]: IIssuesLayout;
        };
      };
    };
  };
}

export interface IIssueViewStore {
  loader: boolean;
  error: any | null;
  issues: IIssueState;
  // computed
  getIssues: IIssues | null | undefined;
  // actions
  getMyIssuesAsync: (workspaceId: string, fetchFilterToggle: boolean) => null | Promise<any>;
  getProjectIssuesAsync: (workspaceId: string, projectId: string, fetchFilterToggle: boolean) => null | Promise<any>;
  getIssuesForModulesAsync: (
    workspaceId: string,
    projectId: string,
    moduleId: string,
    fetchFilterToggle: boolean
  ) => null | Promise<any>;
  getIssuesForCyclesAsync: (
    workspaceId: string,
    projectId: string,
    cycleId: string,
    fetchFilterToggle: boolean
  ) => null | Promise<any>;
  getIssuesForViewsAsync: (
    workspaceId: string,
    projectId: string,
    viewId: string,
    fetchFilterToggle: boolean
  ) => null | Promise<any>;
}

class IssueViewStore implements IIssueViewStore {
  loader: boolean = false;
  error: any | null = null;
  issues: IIssueState = {};
  // root store
  rootStore;
  // service
  issueService;
  userService;
  modulesService;
  cyclesService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,
      issues: observable.ref,
      // action
      getMyIssuesAsync: action,
      getProjectIssuesAsync: action,
      getIssuesForModulesAsync: action,
      getIssuesForCyclesAsync: action,
      getIssuesForViewsAsync: action,
      updateIssues: action,
      // computed
      getIssues: computed,
    });

    this.rootStore = _rootStore;
    this.issueService = new ProjectIssuesServices();
    this.userService = new UserService();
    this.modulesService = new ProjectModuleServices();
    this.cyclesService = new ProjectCycleServices();
  }

  // computed
  get getIssues() {
    if (this.issues != null) {
      const currentView: TIssueViews | null = this.rootStore.issueFilters.issueView;
      const currentWorkspaceId: string | null = this.rootStore.issueFilters.workspaceId;
      const currentProjectId: string | null = this.rootStore.issueFilters.projectId;
      const currentModuleId: string | null = this.rootStore.issueFilters.moduleId;
      const currentCycleId: string | null = this.rootStore.issueFilters.cycleId;
      const currentViewId: string | null = this.rootStore.issueFilters.viewId;

      if (!currentView || !currentWorkspaceId) return null;

      const currentLayout: TIssueLayouts = currentProjectId
        ? this.rootStore.issueFilters.issueFilters?.[currentWorkspaceId]?.project_issue_properties?.[currentProjectId]
            ?.issues?.display_filters?.layout
        : this.rootStore.issueFilters.issueFilters?.[currentWorkspaceId]?.my_issue_properties?.display_filters?.layout;

      if (currentView === "my_issues") return this.issues?.[currentWorkspaceId]?.my_issues?.[currentLayout];
      else if (currentView === "issues" && currentProjectId)
        return this.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues?.[currentLayout];
      else if (currentView === "modules" && currentProjectId && currentModuleId)
        return this.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.modules?.[currentModuleId]?.[
          currentLayout
        ];
      else if (currentView === "cycles" && currentProjectId && currentCycleId)
        return this.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.cycles?.[currentCycleId]?.[
          currentLayout
        ];
      else if (currentView === "views" && currentProjectId && currentViewId)
        return this.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.views?.[currentViewId]?.[
          currentLayout
        ];
    }

    return null;
  }

  updateIssues = (group_id: string | null, issue_id: string | null, data: any) => {
    const currentWorkspaceId: string | null = this.rootStore.issueFilters.workspaceId;
    const currentProjectId: string | null = this.rootStore.issueFilters.projectId;
    const currentModuleId: string | null = this.rootStore.issueFilters.moduleId;
    const currentCycleId: string | null = this.rootStore.issueFilters.cycleId;
    const currentViewId: string | null = this.rootStore.issueFilters.viewId;
    const currentView: TIssueViews | null = this.rootStore.issueFilters.issueView;
    const currentLayout: TIssueLayouts | null | undefined = this.rootStore.issueFilters.issueLayout;

    if (!currentView || !currentWorkspaceId || !currentLayout || !issue_id) return null;

    if (currentView === "my_issues") {
      if (group_id) {
        this.issues = {
          ...this.issues,
          [currentWorkspaceId]: {
            ...this?.issues?.[currentWorkspaceId],
            my_issues: {
              ...this?.issues?.[currentWorkspaceId]?.my_issues,
              [currentLayout]: {
                ...this?.issues?.[currentWorkspaceId]?.my_issues?.[currentLayout],
                [group_id]: this?.issues?.[currentWorkspaceId]?.my_issues?.[currentLayout]?.[group_id].map(
                  (item: any) => (item.id === issue_id ? { ...item, ...data } : { ...item })
                ),
              },
            },
          },
        };
      } else {
        this.issues = {
          ...this.issues,
          [currentWorkspaceId]: {
            ...this?.issues?.[currentWorkspaceId],
            my_issues: {
              ...this?.issues?.[currentWorkspaceId]?.my_issues,
              [currentLayout]: this?.issues?.[currentWorkspaceId]?.my_issues?.[currentLayout].map((item: any) =>
                item.id === issue_id ? { ...item, ...data } : { ...item }
              ),
            },
          },
        };
      }
    }

    if (!currentProjectId) return null;
    if (currentView) {
      if (group_id) {
        this.issues = {
          ...this.issues,
          [currentWorkspaceId]: {
            ...this?.issues?.[currentWorkspaceId],
            project_issues: {
              ...this?.issues?.[currentWorkspaceId]?.project_issues,
              [currentProjectId]: {
                ...this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId],
                [currentView]: {
                  ...this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues,
                  [currentLayout]: {
                    ...this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues?.[currentLayout],
                    [group_id]: this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues?.[
                      currentLayout
                    ]?.[group_id].map((item: any) => (item.id === issue_id ? { ...item, ...data } : { ...item })),
                  },
                },
              },
            },
          },
        };
      } else {
        this.issues = {
          ...this.issues,
          [currentWorkspaceId]: {
            ...this?.issues?.[currentWorkspaceId],
            project_issues: {
              ...this?.issues?.[currentWorkspaceId]?.project_issues,
              [currentProjectId]: {
                ...this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId],
                [currentView]: {
                  ...this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues,
                  [currentLayout]: this?.issues?.[currentWorkspaceId]?.project_issues?.[currentProjectId]?.issues?.[
                    currentLayout
                  ].map((item: any) => (item.id === issue_id ? { ...item, ...data } : { ...item })),
                },
              },
            },
          },
        };
      }
    }
  };

  // fetching my issues
  getMyIssuesAsync = async (workspaceId: string, fetchFilterToggle: boolean = true) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle) await this.rootStore.issueFilters.getWorkspaceMyIssuesFilters(workspaceId);
      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        null,
        null,
        null,
        null,
        "my_issues"
      );
      const issuesResponse = await this.userService.userIssues(workspaceId, filteredParams);

      if (issuesResponse) {
        const _issueResponse: any = {
          ...this.issues,
          [workspaceId]: {
            ...this?.issues[workspaceId],
            my_issues: {
              ...this?.issues[workspaceId]?.my_issues,
              [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
            },
          },
        };

        runInAction(() => {
          this.issues = _issueResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error in fetching the my issues", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching project issues
  getProjectIssuesAsync = async (workspaceId: string, projectId: string, fetchFilterToggle: boolean = true) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle) await this.rootStore.issueFilters.getProjectIssueFilters(workspaceId, projectId);
      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        null,
        null,
        null,
        "issues"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(workspaceId, projectId, filteredParams);

      if (issuesResponse) {
        const _issueResponse: any = {
          ...this.issues,
          [workspaceId]: {
            ...this?.issues?.[workspaceId],
            project_issues: {
              ...this?.issues?.[workspaceId]?.project_issues,
              [projectId]: {
                ...this?.issues?.[workspaceId]?.project_issues?.[projectId],
                issues: {
                  ...this?.issues[workspaceId]?.project_issues?.[projectId]?.issues,
                  [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issues = _issueResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error in fetching the project issues", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching project issues for modules
  getIssuesForModulesAsync = async (
    workspaceId: string,
    projectId: string,
    moduleId: string,
    fetchFilterToggle: boolean = true
  ) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle)
        await this.rootStore.issueFilters.getProjectIssueModuleFilters(workspaceId, projectId, moduleId);
      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        moduleId,
        null,
        null,
        "modules"
      );
      const issuesResponse = await this.modulesService.getModuleIssuesWithParams(
        workspaceId,
        projectId,
        moduleId,
        filteredParams
      );

      if (issuesResponse) {
        const _issueResponse: any = {
          ...this.issues,
          [workspaceId]: {
            ...this?.issues?.[workspaceId],
            project_issues: {
              ...this?.issues?.[workspaceId]?.project_issues,
              [projectId]: {
                ...this?.issues?.[workspaceId]?.project_issues?.[projectId],
                modules: {
                  ...this?.issues[workspaceId]?.project_issues?.[projectId]?.modules,
                  [moduleId]: {
                    ...this?.issues[workspaceId]?.project_issues?.[projectId]?.modules?.[moduleId],
                    [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issues = _issueResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error in fetching the project module issues", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching project issues for cycles
  getIssuesForCyclesAsync = async (
    workspaceId: string,
    projectId: string,
    cycleId: string,
    fetchFilterToggle: boolean = true
  ) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle)
        await this.rootStore.issueFilters.getProjectIssueCyclesFilters(workspaceId, projectId, cycleId);
      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        null,
        cycleId,
        null,
        "cycles"
      );
      const issuesResponse = await this.cyclesService.getCycleIssuesWithParams(
        workspaceId,
        projectId,
        cycleId,
        filteredParams
      );

      if (issuesResponse) {
        const _issueResponse: any = {
          ...this.issues,
          [workspaceId]: {
            ...this?.issues?.[workspaceId],
            project_issues: {
              ...this?.issues?.[workspaceId]?.project_issues,
              [projectId]: {
                ...this?.issues?.[workspaceId]?.project_issues?.[projectId],
                cycles: {
                  ...this?.issues[workspaceId]?.project_issues?.[projectId]?.cycles,
                  [cycleId]: {
                    ...this?.issues[workspaceId]?.project_issues?.[projectId]?.cycles?.[cycleId],
                    [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issues = _issueResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error in fetching the project cycles issues", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };

  // fetching project issues for views
  getIssuesForViewsAsync = async (
    workspaceId: string,
    projectId: string,
    viewId: string,
    fetchFilterToggle: boolean = true
  ) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle)
        await this.rootStore.issueFilters.getProjectIssueViewsFilters(workspaceId, projectId, viewId);
      const filteredParams = this.rootStore.issueFilters.getComputedFilters(
        workspaceId,
        projectId,
        null,
        null,
        viewId,
        "views"
      );
      const issuesResponse = await this.issueService.getIssuesWithParams(workspaceId, projectId, filteredParams);

      if (issuesResponse) {
        const _issueResponse: any = {
          ...this.issues,
          [workspaceId]: {
            ...this?.issues?.[workspaceId],
            project_issues: {
              ...this?.issues?.[workspaceId]?.project_issues,
              [projectId]: {
                ...this?.issues?.[workspaceId]?.project_issues?.[projectId],
                views: {
                  ...this?.issues[workspaceId]?.project_issues?.[projectId]?.views,
                  [viewId]: {
                    ...this?.issues[workspaceId]?.project_issues?.[projectId]?.views?.[viewId],
                    [this.rootStore?.issueFilters?.userFilters?.display_filters?.layout as string]: issuesResponse,
                  },
                },
              },
            },
          },
        };

        runInAction(() => {
          this.issues = _issueResponse;
          this.loader = false;
          this.error = null;
        });
      }

      return issuesResponse;
    } catch (error) {
      console.warn("error in fetching the project view issues", error);
      this.loader = false;
      this.error = null;
      return error;
    }
  };
}

export default IssueViewStore;
