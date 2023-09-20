import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { UserService } from "services/user.service";
import { IssueServices } from "services/issue.service";
import { ModuleService } from "services/modules.service";
import { CycleService } from "services/cycles.service";
// types
import { TIssueLayouts, TIssueViews } from "./issue_filters.legacy";

export interface IIssues {
  [key: string]: any;
}

export interface IIssuesLayout {
  list: IIssues[];
  kanban: IIssues[];
  calendar: IIssues[];
  spreadsheet: IIssues[];
  gantt_chart: IIssues[];
}

export interface IIssueState {
  [key: string]: {
    // project_id: layout_view
    issues: {
      [key: string]: IIssuesLayout; // project_id: layout_key: ...issues, It's always one project id here
    };
    cycles: {
      [key: string]: IIssuesLayout; // cycle_id: layout_key: ...issues
    };
    modules: {
      [key: string]: IIssuesLayout; // module_id: layout_key: ...issues
    };
    views: {
      [key: string]: IIssuesLayout; // view_id: layout_key: ...issues
    };
  };
}

export interface IIssueStore {
  loader: boolean;
  error: any | null;
  issues: IIssueState;
  // computed
  getIssues: IIssues | null | undefined;
  // actions
  updateIssues: (data: any) => void;
  getProjectIssuesAsync: (workspaceId: string, projectId: string, fetchFilterToggle?: boolean) => null | Promise<any>;
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

class IssueStore implements IIssueStore {
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
      // computed
      getIssues: computed,
      // action
      updateIssues: action,
      getProjectIssuesAsync: action,
      getIssuesForModulesAsync: action,
      getIssuesForCyclesAsync: action,
      getIssuesForViewsAsync: action,
    });

    this.rootStore = _rootStore;
    this.issueService = new IssueServices();
    this.userService = new UserService();
    this.modulesService = new ModuleService();
    this.cyclesService = new CycleService();
  }

  // computed
  get getIssues() {
    if (this.issues != null) {
      const issueView: TIssueViews | null = this.rootStore.issueFilter.issueView;
      const projectId: string | null = this.rootStore.project.projectId;
      const moduleId: string | null = this.rootStore.module.moduleId;
      const cycleId: string | null = this.rootStore.cycle.cycleId;
      const viewId: string | null = this.rootStore.view.viewId;
      const issueLayout: TIssueLayouts | null = this.rootStore.issueFilter.issueLayout;

      if (!issueView || !projectId) return null;

      const currentViewIdIndex: string | null =
        issueView === "issues" && projectId
          ? projectId
          : issueView === "modules" && moduleId
          ? moduleId
          : issueView === "cycles" && cycleId
          ? cycleId
          : issueView === "cycles" && viewId
          ? viewId
          : null;

      if (!issueLayout || !currentViewIdIndex) return null;
      return this.issues[projectId][issueView][currentViewIdIndex][issueLayout];
    }

    return null;
  }

  updateIssues = (data: any) => {
    const issueView: TIssueViews | null = this.rootStore.issueFilter.issueView;
    const projectId: string | null = this.rootStore.project.projectId;
    const moduleId: string | null = this.rootStore.module.moduleId;
    const cycleId: string | null = this.rootStore.cycle.cycleId;
    const viewId: string | null = this.rootStore.view.viewId;
    const issueLayout: TIssueLayouts | null = this.rootStore.issueFilter.issueLayout;

    const { groupId, issueId, issueData } = data as {
      groupId?: any;
      issueId: string | null;
      issueData: any;
    };

    if (!issueView || !projectId) return null;

    const currentViewIdIndex: string | null =
      issueView === "issues" && projectId
        ? projectId
        : issueView === "modules" && moduleId
        ? moduleId
        : issueView === "cycles" && cycleId
        ? cycleId
        : issueView === "cycles" && viewId
        ? viewId
        : null;

    if (!issueLayout || !currentViewIdIndex) return null;

    let _issues = this?.issues?.[projectId]?.[issueView]?.[currentViewIdIndex]?.[issueLayout];
    if (groupId && groupId != null && ["list", "kanban"].includes(issueLayout)) {
      _issues = {
        ..._issues,
        [groupId]:
          _issues?.[groupId] && _issues?.[groupId].length > 0
            ? _issues?.[groupId]?.map((item: any) => (item.id === issueId ? { ...item, ...issueData } : { ...item }))
            : [],
      };
    } else {
      _issues = {
        ..._issues,
        ..._issues.map((item: any) => (item.id === issueId ? { ...item, ...issueData } : { ...item })),
      };
    }

    this.issues = {
      ...this.issues,
      [projectId]: {
        ...this?.issues?.[projectId],
        [issueView]: {
          ...this?.issues?.[projectId]?.[issueView],
          [currentViewIdIndex]: {
            ...this?.issues?.[projectId]?.[issueView]?.[currentViewIdIndex],
            [issueLayout]: {
              ...this?.issues?.[projectId]?.[issueView]?.[currentViewIdIndex]?.[issueLayout],
              ..._issues,
            },
          },
        },
      },
    };
  };

  // fetching project issues
  getProjectIssuesAsync = async (workspaceId: string, projectId: string, fetchFilterToggle: boolean = true) => {
    try {
      this.loader = true;
      this.error = null;

      if (fetchFilterToggle) await this.rootStore.issueFilter.getProjectIssueFilters(workspaceId, projectId);
      // const filteredParams = this.rootStore.issueFilter.getComputedFilters(
      //   workspaceId,
      //   projectId,
      //   null,
      //   null,
      //   null,
      //   "issues"
      // );
      // const issuesResponse = await this.issueService.getIssuesWithParams(workspaceId, projectId, filteredParams);

      // if (issuesResponse) {
      //   const _issueResponse: any = {
      //     ...this.issues,
      //     [projectId]: {
      //       ...this?.issues?.[projectId],
      //       issues: {
      //         ...this?.issues?.[projectId]?.issues,
      //         [this.rootStore?.issueFilter?.userFilters?.display_filters?.layout as string]: issuesResponse,
      //       },
      //     },
      //   };

      //   runInAction(() => {
      //     this.issues = _issueResponse;
      //     this.loader = false;
      //     this.error = null;
      //   });
      // }

      // return issuesResponse;
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
        await this.rootStore.issueFilter.getProjectIssueModuleFilters(workspaceId, projectId, moduleId);
      const filteredParams = this.rootStore.issueFilter.getComputedFilters(
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
          [projectId]: {
            ...this?.issues?.[projectId],
            modules: {
              ...this?.issues?.[projectId]?.modules,
              [moduleId]: {
                ...this?.issues?.[projectId]?.modules?.[moduleId],
                [this.rootStore?.issueFilter?.userFilters?.display_filters?.layout as string]: issuesResponse,
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
        await this.rootStore.issueFilter.getProjectIssueCyclesFilters(workspaceId, projectId, cycleId);
      const filteredParams = this.rootStore.issueFilter.getComputedFilters(
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
          [projectId]: {
            ...this?.issues?.[projectId],
            cycles: {
              ...this?.issues?.[projectId]?.cycles,
              [cycleId]: {
                ...this?.issues?.[projectId]?.cycles?.[cycleId],
                [this.rootStore?.issueFilter?.userFilters?.display_filters?.layout as string]: issuesResponse,
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
        await this.rootStore.issueFilter.getProjectIssueViewsFilters(workspaceId, projectId, viewId);
      const filteredParams = this.rootStore.issueFilter.getComputedFilters(
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
          [projectId]: {
            ...this?.issues?.[projectId],
            views: {
              ...this?.issues?.[projectId]?.views,
              [viewId]: {
                ...this?.issues?.[projectId]?.views?.[viewId],
                [this.rootStore?.issueFilter?.userFilters?.display_filters?.layout as string]: issuesResponse,
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

export default IssueStore;
