import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { IssueLabelService, IssueService } from "services/issue";
import { ProjectService, ProjectStateService } from "services/project";
import { RootStore } from "store/root.store";

import { IProject } from "types";

export interface IProjectsStore {
  loader: boolean;
  error: any | null;

  searchQuery: string;
  projectId: string | null;
  projectsMap: {
    [workspaceSlug: string]: {
      [projectId: string]: IProject; // projectId: project Info
    };
  };

  // computed
  searchedProjects: string[];
  workspaceProjects: string[] | null;
  joinedProjects: string[];
  favoriteProjects: string[];
  currentProjectDetails: IProject | undefined;

  // actions
  setSearchQuery: (query: string) => void;
  getProjectById: (workspaceSlug: string, projectId: string) => IProject | null;

  fetchProjects: (workspaceSlug: string) => Promise<void>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<any>;

  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;

  orderProjectsWithSortOrder: (sourceIndex: number, destinationIndex: number, projectId: string) => number;
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;

  createProject: (workspaceSlug: string, data: any) => Promise<any>;
  updateProject: (workspaceSlug: string, projectId: string, data: Partial<IProject>) => Promise<any>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectsStore implements IProjectsStore {
  loader: boolean = false;
  error: any | null = null;

  projectId: string | null = null;
  searchQuery: string = "";
  projectsMap: {
    [workspaceSlug: string]: {
      [projectId: string]: IProject; // projectId: project Info
    };
  };

  // root store
  rootStore: RootStore;
  // service
  projectService;
  issueLabelService;
  issueService;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      searchQuery: observable.ref,
      projectId: observable.ref,
      projectsMap: observable.ref,

      // computed
      searchedProjects: computed,
      workspaceProjects: computed,

      currentProjectDetails: computed,

      joinedProjects: computed,
      favoriteProjects: computed,

      // action
      setSearchQuery: action,
      fetchProjects: action,
      fetchProjectDetails: action,

      addProjectToFavorites: action,
      removeProjectFromFavorites: action,

      orderProjectsWithSortOrder: action,
      updateProjectView: action,
      createProject: action,
      updateProject: action,
    });

    this.rootStore = _rootStore;

    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
    this.stateService = new ProjectStateService();
  }

  get searchedProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];

    const currentProjectsMap = this.projectsMap[this.rootStore.workspace.workspaceSlug];
    const projectIds = Object.keys(currentProjectsMap);
    return this.searchQuery === ""
      ? projectIds
      : projectIds?.filter((projectId) => {
          currentProjectsMap[projectId].name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            currentProjectsMap[projectId].identifier.toLowerCase().includes(this.searchQuery.toLowerCase());
        });
  }

  get workspaceProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return null;
    const currentProjectsMap = this.projectsMap[this.rootStore.workspace.workspaceSlug];

    const projectIds = Object.keys(currentProjectsMap);
    if (!projectIds) return null;
    return projectIds;
  }

  get currentProjectDetails() {
    if (!this.projectId || !this.rootStore.workspace.workspaceSlug) return;
    return this.projectsMap[this.rootStore.workspace.workspaceSlug][this.projectId];
  }

  get joinedProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];

    const currentProjectsMap = this.projectsMap[this.rootStore.workspace.workspaceSlug];
    const projectIds = Object.keys(currentProjectsMap);

    return projectIds?.filter((projectId) => currentProjectsMap[projectId].is_member);
  }

  get favoriteProjects() {
    if (!this.rootStore.workspace.workspaceSlug) return [];

    const currentProjectsMap = this.projectsMap[this.rootStore.workspace.workspaceSlug];
    const projectIds = Object.keys(currentProjectsMap);

    return projectIds?.filter((projectId) => currentProjectsMap[projectId].is_favorite);
  }

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
      const currentProjectsMap = await this.projectService.getProjects(workspaceSlug);
      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: currentProjectsMap,
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
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: {
            ...this.projectsMap[workspaceSlug],
            [projectId]: response,
          },
        };
      });
      return response;
    } catch (error) {
      console.log("Error while fetching project details", error);
      throw error;
    }
  };

  getProjectById = (workspaceSlug: string, projectId: string) => {
    const currentProjectsMap = this.projectsMap?.[workspaceSlug];
    if (!currentProjectsMap) return null;

    const projectInfo: IProject | null = currentProjectsMap[projectId] || null;
    return projectInfo;
  };

  addProjectToFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const currentProject = this.projectsMap?.[workspaceSlug]?.[projectId];

      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: {
            ...this.projectsMap[workspaceSlug],
            [projectId]: { ...currentProject, is_favorite: true },
          },
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
      const currentProject = this.projectsMap?.[workspaceSlug]?.[projectId];

      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: {
            ...this.projectsMap[workspaceSlug],
            [projectId]: { ...currentProject, is_favorite: false },
          },
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

      const projectsList = Object.values(this.projectsMap[workspaceSlug] || {}) || [];
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

      const currentProject = this.projectsMap?.[workspaceSlug]?.[projectId];

      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: {
            ...this.projectsMap[workspaceSlug],
            [projectId]: { ...currentProject, sort_order: updatedSortOrder },
          },
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

  createProject = async (workspaceSlug: string, data: any) => {
    try {
      const response = await this.projectService.createProject(workspaceSlug, data);
      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: { ...this.projectsMap[workspaceSlug], [response.id]: response },
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
      const currentProject = this.projectsMap?.[workspaceSlug]?.[projectId];

      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: { ...this.projectsMap[workspaceSlug], [projectId]: { ...currentProject, ...data } },
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
      const workspaceProjects = { ...this.projectsMap[workspaceSlug] };

      delete workspaceProjects[projectId];

      runInAction(() => {
        this.projectsMap = {
          ...this.projectsMap,
          [workspaceSlug]: { ...workspaceProjects },
        };
      });

      await this.projectService.deleteProject(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
    } catch (error) {
      console.log("Failed to delete project from project store");
      this.fetchProjects(workspaceSlug);
    }
  };
}
