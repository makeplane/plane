import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IProject, IIssueLabels, IProjectMember, IStateResponse, IState, ICycle, IModule, IView, IPage } from "types";
// services
import { ProjectService } from "services/project.service";
import { IssueService } from "services/issue.service";
import { ProjectStateServices } from "services/project_state.service";
import { CycleService } from "services/cycles.service";
import { ModuleService } from "services/modules.service";
import { ViewService } from "services/views.service";
import { PageService } from "services/page.service";

export interface IProjectStore {
  loader: boolean;
  error: any | null;

  projectLeaveModal: boolean;
  projectLeaveDetails: IProject | any;

  projectId: string | null;

  projects: {
    [projectId: string]: IProject; // projectId: project Info
  } | null;
  states: {
    [projectId: string]: IStateResponse; // project_id: states
  } | null;
  labels: {
    [projectId: string]: IIssueLabels[] | null; // project_id: labels
  } | null;
  members: {
    [projectId: string]: IProjectMember[] | null; // project_id: members
  } | null;
  cycles: {
    [projectId: string]: ICycle[] | null; // project_id: cycles
  } | null;
  modules: {
    [projectId: string]: IModule[] | null; // project_id: modules
  } | null;
  views: {
    [projectId: string]: IView[] | null; // project_id: views
  } | null;
  pages: {
    [projectId: string]: IPage[] | null; // project_id: pages
  } | null;

  // computed
  projectStatesByGroups: IStateResponse | null;
  projectStates: IState[] | null;
  projectLabels: IIssueLabels[] | null;
  projectMembers: IProjectMember[] | null;

  // actions
  setProjectId: (projectId: string) => void;

  getProjectStateById: (stateId: string) => IState | null;
  getProjectLabelById: (labelId: string) => IIssueLabels | null;
  getProjectMemberById: (memberId: string) => IProjectMember | null;

  fetchProjectStates: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  fetchProjectLabels: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  fetchProjectMembers: (workspaceSlug: string, projectSlug: string) => Promise<void>;

  addProjectToFavorites: (workspaceSlug: string, projectSlug: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectSlug: string) => Promise<any>;

  handleProjectLeaveModal: (project: any | null) => void;

  leaveProject: (workspaceSlug: string, projectSlug: string, user: any) => Promise<void>;
}

class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  projectLeaveModal: boolean = false;
  projectLeaveDetails: IProject | null = null;

  projectId: string | null = null;

  projects: {
    [key: string]: IProject; // project_id: project
  } | null = {};
  cycles: {
    [key: string]: ICycle[]; // project_id: cycles
  } = {};
  modules: {
    [key: string]: IModule[]; // project_id: modules
  } = {};
  views: {
    [key: string]: IView[]; // project_id: views
  } = {};
  pages: {
    [key: string]: IPage[]; // project_id: pages
  } = {};
  states: {
    [key: string]: IStateResponse; // project_id: states
  } | null = {};
  labels: {
    [key: string]: IIssueLabels[]; // project_id: labels
  } | null = {};
  members: {
    [key: string]: IProjectMember[]; // project_id: members
  } | null = {};

  // root store
  rootStore;
  // service
  projectService;
  issueService;
  stateService;
  moduleService;
  viewService;
  pageService;
  cycleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      projectId: observable.ref,
      projects: observable.ref,
      states: observable.ref,
      labels: observable.ref,
      members: observable.ref,

      projectLeaveModal: observable,
      projectLeaveDetails: observable.ref,

      // computed
      projectStatesByGroups: computed,
      projectStates: computed,
      projectLabels: computed,
      projectMembers: computed,

      // action
      setProjectId: action,

      getProjectStateById: action,
      getProjectLabelById: action,
      getProjectMemberById: action,

      fetchProjectStates: action,
      fetchProjectLabels: action,
      fetchProjectMembers: action,

      addProjectToFavorites: action,
      removeProjectFromFavorites: action,

      handleProjectLeaveModal: action,
      leaveProject: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.stateService = new ProjectStateServices();
    this.moduleService = new ModuleService();
    this.viewService = new ViewService();
    this.pageService = new PageService();
    this.cycleService = new CycleService();
  }

  get projectStatesByGroups() {
    if (!this.projectId) return null;
    return this.states?.[this.projectId] || null;
  }

  get projectStates() {
    if (!this.projectId) return null;
    const stateByGroups: IStateResponse | null = this.projectStatesByGroups;
    if (!stateByGroups) return null;
    const _states: IState[] = [];
    Object.keys(stateByGroups).forEach((_stateGroup: string) => {
      stateByGroups[_stateGroup].map((state) => {
        _states.push(state);
      });
    });
    return _states.length > 0 ? _states : null;
  }

  get projectLabels() {
    if (!this.projectId) return null;
    return this.labels?.[this.projectId] || null;
  }

  get projectMembers() {
    if (!this.projectId) return null;
    return this.members?.[this.projectId] || null;
  }

  get projectCycles() {
    if (!this.projectId) return null;
    return this.cycles[this.projectId] || null;
  }

  get projectModules() {
    if (!this.projectId) return null;
    return this.modules[this.projectId] || null;
  }

  get projectViews() {
    if (!this.projectId) return null;
    return this.views[this.projectId] || null;
  }

  get projectPages() {
    if (!this.projectId) return null;
    return this.pages[this.projectId] || null;
  }

  // actions
  setProjectId = (projectSlug: string) => {
    this.projectId = projectSlug ?? null;
  };

  getProjectStateById = (stateId: string) => {
    if (!this.projectId) return null;
    const states = this.projectStates;
    if (!states) return null;
    const stateInfo: IState | null = states.find((state) => state.id === stateId) || null;
    return stateInfo;
  };

  getProjectLabelById = (labelId: string) => {
    if (!this.projectId) return null;
    const labels = this.projectLabels;
    if (!labels) return null;
    const labelInfo: IIssueLabels | null = labels.find((label) => label.id === labelId) || null;
    return labelInfo;
  };

  getProjectMemberById = (memberId: string) => {
    if (!this.projectId) return null;
    const members = this.projectMembers;
    if (!members) return null;
    const memberInfo: IProjectMember | null = members.find((member) => member.id === memberId) || null;
    return memberInfo;
  };

  fetchProjectStates = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const stateResponse = await this.stateService.getStates(workspaceSlug, projectSlug);
      const _states = {
        ...this.states,
        [projectSlug]: stateResponse,
      };

      runInAction(() => {
        this.states = _states;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectLabels = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const labelResponse = await this.issueService.getIssueLabels(workspaceSlug, projectSlug);
      const _labels = {
        ...this.labels,
        [projectSlug]: labelResponse,
      };

      runInAction(() => {
        this.labels = _labels;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectMembers = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const membersResponse = await this.projectService.projectMembers(workspaceSlug, projectSlug);
      const _members = {
        ...this.members,
        [projectSlug]: membersResponse,
      };

      runInAction(() => {
        this.members = _members;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectCycles = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const cyclesResponse = await this.cycleService.getCyclesWithParams(workspaceSlug, projectSlug, "all");

      runInAction(() => {
        this.cycles = {
          ...this.cycles,
          [projectSlug]: cyclesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project cycles in project store", error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectModules = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectSlug);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectSlug]: modulesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch modules list in project store", error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectViews = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const viewsResponse = await this.viewService.getViews(workspaceSlug, projectSlug);

      runInAction(() => {
        this.views = {
          ...this.views,
          [projectSlug]: viewsResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project views in project store", error);
      this.loader = false;
      this.error = error;
    }
  };

  fetchProjectPages = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const pagesResponse = await this.pageService.getPagesWithParams(workspaceSlug, projectSlug, "all");

      runInAction(() => {
        this.pages = {
          ...this.pages,
          [projectSlug]: pagesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch project pages in project store", error);
      this.loader = false;
      this.error = error;
    }
  };

  addProjectToFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.addProjectToFavorites(workspaceSlug, projectId);
      console.log("res", response);
      await this.rootStore.workspace.getWorkspaceProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      throw error;
    }
  };

  removeProjectFromFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = this.projectService.removeProjectFromFavorites(workspaceSlug, projectId);
      this.rootStore.workspace.getWorkspaceProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      throw error;
    }
  };

  handleProjectLeaveModal = (project: IProject | null = null) => {
    if (project && project?.id) {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = project;
    } else {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = null;
    }
  };

  leaveProject = async (workspaceSlug: string, projectSlug: string, user: any) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.leaveProject(workspaceSlug, projectSlug, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default ProjectStore;
