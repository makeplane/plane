import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
import { IProject, IIssueLabels, IProjectMember, IStateResponse, IState } from "types";
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

  searchQuery: string;
  projectId: string | null;
  projects: { [key: string]: IProject[] };
  project_details: {
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

  // computed
  searchedProjects: IProject[];
  projectStatesByGroups: IStateResponse | null;
  projectStates: IState[] | null;
  projectLabels: IIssueLabels[] | null;
  projectMembers: IProjectMember[] | null;

  joinedProjects: IProject[];
  favoriteProjects: IProject[];

  // actions
  setProjectId: (projectId: string) => void;
  setSearchQuery: (query: string) => void;

  getProjectStateById: (stateId: string) => IState | null;
  getProjectLabelById: (labelId: string) => IIssueLabels | null;
  getProjectMemberById: (memberId: string) => IProjectMember | null;

  fetchProjects: (workspaceSlug: string) => Promise<void>;
  fetchProjectStates: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  fetchProjectLabels: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  fetchProjectMembers: (workspaceSlug: string, projectSlug: string) => Promise<void>;

  addProjectToFavorites: (workspaceSlug: string, projectSlug: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectSlug: string) => Promise<any>;

  orderProjectsWithSortOrder: (sourceIndex: number, destinationIndex: number, projectId: string) => number;
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;

  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<void>;
  leaveProject: (workspaceSlug: string, projectSlug: string) => Promise<void>;
  deleteProject: (workspaceSlug: string, projectSlug: string) => Promise<void>;
}

class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  searchQuery: string = "";
  projectId: string | null = null;
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspace_id: project[]
  project_details: {
    [key: string]: IProject; // project_id: project
  } | null = {};
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

      searchQuery: observable.ref,
      projectId: observable.ref,
      projects: observable.ref,
      project_details: observable.ref,
      states: observable.ref,
      labels: observable.ref,
      members: observable.ref,

      // computed
      searchedProjects: computed,
      projectStatesByGroups: computed,
      projectStates: computed,
      projectLabels: computed,
      projectMembers: computed,

      joinedProjects: computed,
      favoriteProjects: computed,

      // action
      setProjectId: action,
      setSearchQuery: action,

      getProjectStateById: action,
      getProjectLabelById: action,
      getProjectMemberById: action,

      fetchProjectStates: action,
      fetchProjectLabels: action,
      fetchProjectMembers: action,

      addProjectToFavorites: action,
      removeProjectFromFavorites: action,

      orderProjectsWithSortOrder: action,
      updateProjectView: action,
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

  get searchedProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];

    const projects = this.projects[this.rootStore.workspace.workspaceSlug];

    return this.searchQuery === ""
      ? projects
      : projects?.filter(
          (project) =>
            project.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            project.identifier.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
  }

  get joinedProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];
    return this.projects?.[this.rootStore.workspace.workspaceSlug]?.filter((p) => p.is_member);
  }

  get favoriteProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];
    return this.projects?.[this.rootStore.workspace.workspaceSlug]?.filter((p) => p.is_favorite);
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

  // actions
  setProjectId = (projectSlug: string) => {
    this.projectId = projectSlug ?? null;
  };

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  /**
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns
   */
  fetchProjects = async (workspaceSlug: string) => {
    try {
      const projects = await this.projectService.getProjects(workspaceSlug, { is_favorite: "all" });
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: projects,
        };
      });
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
    }
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

  fetchProjectLabels = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const labelResponse = await this.issueService.getIssueLabels(workspaceSlug, projectId);
      const _labels = {
        ...this.labels,
        [projectId]: labelResponse,
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

  addProjectToFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.addProjectToFavorites(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      throw error;
    }
  };

  removeProjectFromFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.removeProjectFromFavorites(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      throw error;
    }
  };

  orderProjectsWithSortOrder = (sortIndex: number, destinationIndex: number, projectId: string) => {
    try {
      const workspaceSlug = this.rootStore.workspace.workspaceSlug;
      if (!workspaceSlug) return 0;

      const projectsList = this.projects[workspaceSlug] || [];
      let updatedSortOrder = projectsList[sortIndex].sort_order;

      if (destinationIndex === 0) updatedSortOrder = (projectsList[0].sort_order as number) - 1000;
      else if (destinationIndex === projectsList.length - 1)
        updatedSortOrder = (projectsList[projectsList.length - 1].sort_order as number) + 1000;
      else {
        const destinationSortingOrder = projectsList[destinationIndex].sort_order as number;
        const relativeDestinationSortingOrder =
          sortIndex < destinationIndex
            ? (projectsList[destinationIndex + 1].sort_order as number)
            : (projectsList[destinationIndex - 1].sort_order as number);

        updatedSortOrder = (destinationSortingOrder + relativeDestinationSortingOrder) / 2;
      }

      const updatedProjectsList = projectsList.map((p) =>
        p.id === projectId ? { ...p, sort_order: updatedSortOrder } : p
      );

      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: updatedProjectsList,
        };
      });

      return updatedSortOrder;
    } catch (error) {
      console.log("failed to update sort order of the projects");
      return 0;
    }
  };

  updateProjectView = async (workspaceSlug: string, projectId: string, viewProps: any) => {
    try {
      const response = await this.projectService.setProjectView(workspaceSlug, projectId, viewProps);
      await this.fetchProjects(workspaceSlug);

      return response;
    } catch (error) {
      console.log("Failed to update sort order of the projects");
      throw error;
    }
  };

  joinProject = async (workspaceSlug: string, projectIds: string[]) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.joinProject(workspaceSlug, projectIds);
      await this.fetchProjects(workspaceSlug);

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

  leaveProject = async (workspaceSlug: string, projectSlug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.leaveProject(workspaceSlug, projectSlug, this.rootStore.user);
      await this.fetchProjects(workspaceSlug);

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

  deleteProject = async (workspaceSlug: string, projectId: string) => {
    try {
      await this.projectService.deleteProject(workspaceSlug, projectId, this.rootStore.user.currentUser);
      await this.fetchProjects(workspaceSlug);
    } catch (error) {
      console.log("Failed to delete project from project store");
    }
  };
}

export default ProjectStore;
