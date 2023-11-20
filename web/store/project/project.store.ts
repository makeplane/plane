import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IProject, IEstimate } from "types";
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
  estimates: {
    [projectId: string]: IEstimate[] | null; // project_id: members
  } | null;

  // computed
  searchedProjects: IProject[];
  workspaceProjects: IProject[] | null;
  projectEstimates: IEstimate[] | null;
  joinedProjects: IProject[];
  favoriteProjects: IProject[];
  currentProjectDetails: IProject | undefined;

  // actions
  setProjectId: (projectId: string | null) => void;
  setSearchQuery: (query: string) => void;

  getProjectById: (workspaceSlug: string, projectId: string) => IProject | null;

  getProjectEstimateById: (estimateId: string) => IEstimate | null;
  fetchProjects: (workspaceSlug: string) => Promise<void>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<any>;
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<any>;

  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;

  orderProjectsWithSortOrder: (sourceIndex: number, destinationIndex: number, projectId: string) => number;
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;

  joinProject: (workspaceSlug: string, projectIds: string[]) => Promise<void>;
  leaveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  createProject: (workspaceSlug: string, data: any) => Promise<any>;
  updateProject: (workspaceSlug: string, projectId: string, data: Partial<IProject>) => Promise<any>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  searchQuery: string = "";
  projectId: string | null = null;
  projects: { [workspaceSlug: string]: IProject[] } = {}; // workspaceSlug: project[]
  project_details: {
    [projectId: string]: IProject; // projectId: project
  } = {};
  estimates: {
    [projectId: string]: IEstimate[]; // projectId: estimates
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

      estimates: observable.ref,

      // computed
      searchedProjects: computed,
      workspaceProjects: computed,

      projectEstimates: computed,

      currentProjectDetails: computed,

      joinedProjects: computed,
      favoriteProjects: computed,

      // action
      setProjectId: action,
      setSearchQuery: action,
      fetchProjects: action,
      fetchProjectDetails: action,

      getProjectById: action,
      getProjectEstimateById: action,

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

  get workspaceProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return null;
    const projects = this.projects[this.rootStore.workspace.workspaceSlug];
    if (!projects) return null;
    return projects;
  }

  get currentProjectDetails() {
    if (!this.projectId) return;
    return this.project_details[this.projectId];
  }

  get joinedProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];
    return this.projects?.[this.rootStore.workspace.workspaceSlug]?.filter((p) => p.is_member);
  }

  get favoriteProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];
    return this.projects?.[this.rootStore.workspace.workspaceSlug]?.filter((p) => p.is_favorite);
  }

  get projectEstimates() {
    if (!this.projectId) return null;
    return this.estimates?.[this.projectId] || null;
  }

  // actions
  setProjectId = (projectId: string | null) => {
    this.projectId = projectId;
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
    const projects = this.projects?.[workspaceSlug];
    if (!projects) return null;

    const projectInfo: IProject | null = projects.find((project) => project.id === projectId) || null;
    return projectInfo;
  };

  getProjectEstimateById = (estimateId: string) => {
    if (!this.projectId) return null;
    const estimates = this.projectEstimates;
    if (!estimates) return null;
    const estimateInfo: IEstimate | null = estimates.find((estimate) => estimate.id === estimateId) || null;
    return estimateInfo;
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
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: this.projects[workspaceSlug].map((project) => {
            if (project.id === projectId) {
              return { ...project, is_favorite: true };
            }
            return project;
          }),
        };
      });
      const response = await this.projectService.addProjectToFavorites(workspaceSlug, projectId);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      await this.fetchProjects(workspaceSlug);
      throw error;
    }
  };

  removeProjectFromFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: this.projects[workspaceSlug].map((project) => {
            if (project.id === projectId) {
              return { ...project, is_favorite: false };
            }
            return project;
          }),
        };
      });
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
    const newPermissions: { [projectId: string]: boolean } = {};
    projectIds.forEach((projectId) => {
      newPermissions[projectId] = true;
    });

    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.joinProject(workspaceSlug, projectIds);
      await this.fetchProjects(workspaceSlug);

      runInAction(() => {
        this.rootStore.user.hasPermissionToProject = {
          ...this.rootStore.user.hasPermissionToProject,
          ...newPermissions,
        };
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

      const response = await this.projectService.leaveProject(workspaceSlug, projectId);
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
      const response = await this.projectService.createProject(workspaceSlug, data);
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

  updateProject = async (workspaceSlug: string, projectId: string, data: Partial<IProject>) => {
    try {
      runInAction(() => {
        this.projects = {
          ...this.projects,
          [workspaceSlug]: this.projects[workspaceSlug].map((p) => (p.id === projectId ? { ...p, ...data } : p)),
        };
        this.project_details = {
          ...this.project_details,
          [projectId]: { ...this.project_details[projectId], ...data },
        };
      });

      const response = await this.projectService.updateProject(workspaceSlug, projectId, data);
      return response;
    } catch (error) {
      console.log("Failed to create project from project store");

      this.fetchProjects(workspaceSlug);
      this.fetchProjectDetails(workspaceSlug, projectId);
      throw error;
    }
  };

  deleteProject = async (workspaceSlug: string, projectId: string) => {
    try {
      await this.projectService.deleteProject(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
    } catch (error) {
      console.log("Failed to delete project from project store");
    }
  };
}
