import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IProject, IIssueLabels, IProjectMember, IStateResponse, IState, IEstimate } from "types";
// services
import { ProjectService, ProjectStateService, ProjectEstimateService } from "services/project";
import { IssueService, IssueLabelService } from "services/issue";

export interface IProjectStore {
  loader: boolean;
  error: any | null;

  searchQuery: string;
  projectId: string | null;
  projects: { [workspaceSlug: string]: IProject[] };
  project_details: {
    [projectId: string]: IProject; // projectId: project Info
  };
  states: {
    [projectId: string]: IStateResponse; // project_id: states
  } | null;
  labels: {
    [projectId: string]: IIssueLabels[] | null; // project_id: labels
  } | null;
  members: {
    [projectId: string]: IProjectMember[] | null; // project_id: members
  } | null;
  estimates: {
    [projectId: string]: IEstimate[] | null; // project_id: members
  } | null;

  // computed
  searchedProjects: IProject[];
  projectStatesByGroups: IStateResponse | null;
  projectStates: IState[] | null;
  projectLabels: IIssueLabels[] | null;
  projectMembers: IProjectMember[] | null;
  projectEstimates: IEstimate[] | null;

  joinedProjects: IProject[];
  favoriteProjects: IProject[];

  // actions
  setProjectId: (projectId: string) => void;
  setSearchQuery: (query: string) => void;

  getProjectById: (workspaceSlug: string, projectId: string) => IProject | null;
  getProjectStateById: (stateId: string) => IState | null;
  getProjectLabelById: (labelId: string) => IIssueLabels | null;
  getProjectMemberById: (memberId: string) => IProjectMember | null;
  getProjectMemberByUserId: (memberId: string) => IProjectMember | null;
  getProjectEstimateById: (estimateId: string) => IEstimate | null;

  fetchProjects: (workspaceSlug: string) => Promise<void>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<any>;
  fetchProjectStates: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchProjectLabels: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchProjectMembers: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<void>;

  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;

  orderProjectsWithSortOrder: (sourceIndex: number, destinationIndex: number, projectId: string) => number;
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;

  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<void>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  createProject: (workspaceSlug: string, data: any) => Promise<any>;
  updateProject: (workspaceSlug: string, projectId: string, data: any) => Promise<any>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  searchQuery: string = "";
  projectId: string | null = null;
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspace_id: project[]
  project_details: {
    [key: string]: IProject; // project_id: project
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
  estimates: {
    [key: string]: IEstimate[]; // project_id: estimates
  } | null = {};

  // root store
  rootStore;
  // service
  projectService;
  issueLabelService;
  issueService;
  stateService;
  estimateService;

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
      projectEstimates: computed,

      joinedProjects: computed,
      favoriteProjects: computed,

      // action
      setProjectId: action,
      setSearchQuery: action,
      fetchProjects: action,
      fetchProjectDetails: action,

      getProjectById: action,
      getProjectStateById: action,
      getProjectLabelById: action,
      getProjectMemberById: action,

      fetchProjectStates: action,
      fetchProjectLabels: action,
      fetchProjectMembers: action,
      fetchProjectEstimates: action,

      addProjectToFavorites: action,
      removeProjectFromFavorites: action,

      orderProjectsWithSortOrder: action,
      updateProjectView: action,
      createProject: action,
      updateProject: action,
      leaveProject: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
    this.stateService = new ProjectStateService();
    this.estimateService = new ProjectEstimateService();
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

  get projectEstimates() {
    if (!this.projectId) return null;
    return this.estimates?.[this.projectId] || null;
  }

  // actions
  setProjectId = (projectId: string) => {
    this.projectId = projectId ?? null;
  };

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  /**
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns
   *
   */
  fetchProjects = async (workspaceSlug: string) => {
    try {
      const projects = await this.projectService.getProjects(workspaceSlug);
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: projects,
        };
      });
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      throw error;
    }
  };

  fetchProjectDetails = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.getProject(workspaceSlug, projectId);
      runInAction(() => {
        this.project_details = {
          ...this.project_details,
          [projectId]: response,
        };
      });
      return response;
    } catch (error) {
      console.log("Error while fetching project details", error);
      throw error;
    }
  };

  getProjectById = (workspaceSlug: string, projectId: string) => {
    if (!this.projectId) return null;
    const projects = this.projects?.[workspaceSlug];
    if (!projects) return null;
    const projectInfo: IProject | null = projects.find((project) => project.id === projectId) || null;
    return projectInfo;
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

  getProjectMemberByUserId = (memberId: string) => {
    if (!this.projectId) return null;
    const members = this.projectMembers;
    if (!members) return null;
    const memberInfo: IProjectMember | null = members.find((member) => member.member.id === memberId) || null;
    return memberInfo;
  };

  getProjectEstimateById = (estimateId: string) => {
    if (!this.projectId) return null;
    const estimates = this.projectEstimates;
    if (!estimates) return null;
    const estimateInfo: IEstimate | null = estimates.find((estimate) => estimate.id === estimateId) || null;
    return estimateInfo;
  };

  fetchProjectStates = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const stateResponse = await this.stateService.getStates(workspaceSlug, projectId);
      const _states = {
        ...this.states,
        [projectId]: stateResponse,
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

      const labelResponse = await this.issueLabelService.getProjectIssueLabels(workspaceSlug, projectId);
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

  fetchProjectMembers = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const membersResponse = await this.projectService.projectMembers(workspaceSlug, projectId);
      const _members = {
        ...this.members,
        [projectId]: membersResponse,
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

  fetchProjectEstimates = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const estimatesResponse = await this.estimateService.getEstimatesList(workspaceSlug, projectId);
      const _estimates = {
        ...this.estimates,
        [projectId]: estimatesResponse,
      };

      runInAction(() => {
        this.estimates = _estimates;
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

  leaveProject = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.leaveProject(workspaceSlug, projectId, this.rootStore.user);
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

  createProject = async (workspaceSlug: string, data: any) => {
    try {
      const response = await this.projectService.createProject(workspaceSlug, data, this.rootStore.user.currentUser);
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: [...this.projects[workspaceSlug], response],
        };
        this.project_details = {
          ...this.project_details,
          [response.id]: response,
        };
      });
      return response;
    } catch (error) {
      console.log("Failed to create project from project store");
      throw error;
    }
  };

  updateProject = async (workspaceSlug: string, projectId: string, data: any) => {
    try {
      const response = await this.projectService.updateProject(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser
      );
      await this.fetchProjectDetails(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to create project from project store");
      throw error;
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
