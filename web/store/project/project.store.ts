import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
// types
import { RootStore } from "../root.store";
import { IProject } from "@plane/types";
// services
import { IssueLabelService, IssueService } from "services/issue";
import { ProjectService, ProjectStateService } from "services/project";
import { cloneDeep, update } from "lodash";
export interface IProjectStore {
  // observables
  searchQuery: string;
  projectMap: {
    [projectId: string]: IProject; // projectId: project Info
  };
  // computed
  searchedProjects: string[];
  workspaceProjectIds: string[] | null;
  joinedProjectIds: string[];
  favoriteProjectIds: string[];
  currentProjectDetails: IProject | undefined;
  // actions
  setSearchQuery: (query: string) => void;
  getProjectById: (projectId: string) => IProject | null;
  // fetch actions
  fetchProjects: (workspaceSlug: string) => Promise<IProject[]>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<any>;
  // favorites actions
  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  // project-view action
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;
  // CRUD actions
  createProject: (workspaceSlug: string, data: any) => Promise<any>;
  updateProject: (workspaceSlug: string, projectId: string, data: Partial<IProject>) => Promise<any>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectStore implements IProjectStore {
  // observables
  searchQuery: string = "";
  projectMap: {
    [projectId: string]: IProject; // projectId: project Info
  } = {};
  // root store
  rootStore: RootStore;
  // service
  projectService;
  issueLabelService;
  issueService;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      searchQuery: observable.ref,
      projectMap: observable,
      // computed
      searchedProjects: computed,
      workspaceProjectIds: computed,
      currentProjectDetails: computed,
      joinedProjectIds: computed,
      favoriteProjectIds: computed,
      // actions
      setSearchQuery: action.bound,
      // fetch actions
      fetchProjects: action,
      fetchProjectDetails: action,
      // favorites actions
      addProjectToFavorites: action,
      removeProjectFromFavorites: action,
      // project-view action
      updateProjectView: action,
      // CRUD actions
      createProject: action,
      updateProject: action,
    });
    // root store
    this.rootStore = _rootStore;
    // services
    this.projectService = new ProjectService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
    this.stateService = new ProjectStateService();
  }

  /**
   * Returns searched projects based on search query
   */
  get searchedProjects() {
    const workspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!workspaceDetails) return [];
    const workspaceProjects = Object.values(this.projectMap).filter(
      (p) =>
        p.workspace === workspaceDetails.id &&
        (p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          p.identifier.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
    return workspaceProjects.map((p) => p.id);
  }

  /**
   * Returns project IDs belong to the current workspace
   */
  get workspaceProjectIds() {
    const workspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!workspaceDetails) return null;
    const workspaceProjects = Object.values(this.projectMap).filter((p) => p.workspace === workspaceDetails.id);
    const projectIds = workspaceProjects.map((p) => p.id);
    return projectIds ?? null;
  }

  /**
   * Returns current project details
   */
  get currentProjectDetails() {
    if (!this.rootStore.app.router.projectId) return;
    return this.projectMap?.[this.rootStore.app.router.projectId];
  }

  /**
   * Returns joined project IDs belong to the current workspace
   */
  get joinedProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    let projects = Object.values(this.projectMap ?? {});
    projects = sortBy(projects, "sort_order");

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.is_member)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns favorite project IDs belong to the current workspace
   */
  get favoriteProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    let projects = Object.values(this.projectMap ?? {});
    projects = sortBy(projects, "created_at");

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.is_favorite)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Sets search query
   * @param query
   */
  setSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  /**
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns Promise<IProject[]>
   *
   */
  fetchProjects = async (workspaceSlug: string) => {
    try {
      const projectsResponse = await this.projectService.getProjects(workspaceSlug);
      runInAction(() => {
        projectsResponse.forEach((project) => {
          set(this.projectMap, [project.id], project);
        });
      });
      return projectsResponse;
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      throw error;
    }
  };

  /**
   * Fetches project details using workspace slug and project id
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<IProject>
   */
  fetchProjectDetails = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.getProject(workspaceSlug, projectId);
      runInAction(() => {
        set(this.projectMap, [projectId], response);
      });
      return response;
    } catch (error) {
      console.log("Error while fetching project details", error);
      throw error;
    }
  };

  /**
   * Returns project details using project id
   * @param projectId
   * @returns IProject | null
   */
  getProjectById = computedFn((projectId: string) => {
    const projectInfo = this.projectMap[projectId] || null;
    return projectInfo;
  });

  /**
   * Adds project to favorites and updates project favorite status in the store
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  addProjectToFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const currentProject = this.getProjectById(projectId);
      if (currentProject.is_favorite) return;
      runInAction(() => {
        set(this.projectMap, [projectId, "is_favorite"], true);
      });
      const response = await this.projectService.addProjectToFavorites(workspaceSlug, projectId);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      runInAction(() => {
        set(this.projectMap, [projectId, "is_favorite"], false);
      });
      throw error;
    }
  };

  /**
   * Removes project from favorites and updates project favorite status in the store
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  removeProjectFromFavorites = async (workspaceSlug: string, projectId: string) => {
    try {
      const currentProject = this.getProjectById(projectId);
      if (!currentProject.is_favorite) return;
      runInAction(() => {
        set(this.projectMap, [projectId, "is_favorite"], false);
      });
      const response = await this.projectService.removeProjectFromFavorites(workspaceSlug, projectId);
      await this.fetchProjects(workspaceSlug);
      return response;
    } catch (error) {
      console.log("Failed to add project to favorite");
      runInAction(() => {
        set(this.projectMap, [projectId, "is_favorite"], true);
      });
      throw error;
    }
  };

  /**
   * Updates the project view
   * @param workspaceSlug
   * @param projectId
   * @param viewProps
   * @returns
   */
  updateProjectView = async (workspaceSlug: string, projectId: string, viewProps: { sort_order: number }) => {
    const currentProjectSortOrder = this.getProjectById(projectId)?.sort_order;
    try {
      runInAction(() => {
        set(this.projectMap, [projectId, "sort_order"], viewProps?.sort_order);
      });
      const response = await this.projectService.setProjectView(workspaceSlug, projectId, viewProps);
      return response;
    } catch (error) {
      runInAction(() => {
        set(this.projectMap, [projectId, "sort_order"], currentProjectSortOrder);
      });
      console.log("Failed to update sort order of the projects");
      throw error;
    }
  };

  /**
   * Creates a project in the workspace and adds it to the store
   * @param workspaceSlug
   * @param data
   * @returns Promise<IProject>
   */
  createProject = async (workspaceSlug: string, data: any) => {
    try {
      const response = await this.projectService.createProject(workspaceSlug, data);
      runInAction(() => {
        set(this.projectMap, [response.id], response);
        set(this.rootStore.user.membership.workspaceProjectsRole, [workspaceSlug, response.id], response.member_role);
      });
      return response;
    } catch (error) {
      console.log("Failed to create project from project store");
      throw error;
    }
  };

  /**
   * Updates a details of a project and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns Promise<IProject>
   */
  updateProject = async (workspaceSlug: string, projectId: string, data: Partial<IProject>) => {
    try {
      const projectDetails = this.getProjectById(projectId);
      runInAction(() => {
        set(this.projectMap, [projectId], { ...projectDetails, ...data });
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

  /**
   * Deletes a project from specific workspace and deletes it from the store
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<void>
   */
  deleteProject = async (workspaceSlug: string, projectId: string) => {
    try {
      if (!this.projectMap?.[projectId]) return;
      await this.projectService.deleteProject(workspaceSlug, projectId);
      runInAction(() => {
        delete this.projectMap[projectId];
      });
    } catch (error) {
      console.log("Failed to delete project from project store");
      this.fetchProjects(workspaceSlug);
    }
  };
}
