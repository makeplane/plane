import set from "lodash/set";
import sortBy from "lodash/sortBy";
import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IProject } from "@plane/types";
// helpers
import { orderProjects, shouldFilterProject } from "@/helpers/project.helper";
// services
import { IssueLabelService, IssueService } from "@/services/issue";
import { ProjectService, ProjectStateService, ProjectArchiveService } from "@/services/project";
// store
import { CoreRootStore } from "../root.store";

export interface IProjectStore {
  // observables
  loader: boolean;
  projectMap: {
    [projectId: string]: IProject; // projectId: project Info
  };
  // computed
  filteredProjectIds: string[] | undefined;
  workspaceProjectIds: string[] | undefined;
  archivedProjectIds: string[] | undefined;
  totalProjectIds: string[] | undefined;
  joinedProjectIds: string[];
  favoriteProjectIds: string[];
  currentProjectDetails: IProject | undefined;
  // actions
  getProjectById: (projectId: string | undefined | null) => IProject | undefined;
  getProjectIdentifierById: (projectId: string | undefined | null) => string;
  // fetch actions
  fetchProjects: (workspaceSlug: string) => Promise<IProject[]>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<IProject>;
  // favorites actions
  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  // project-view action
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;
  // CRUD actions
  createProject: (workspaceSlug: string, data: Partial<IProject>) => Promise<IProject>;
  updateProject: (workspaceSlug: string, projectId: string, data: Partial<IProject>) => Promise<IProject>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  // archive actions
  archiveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  restoreProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectStore implements IProjectStore {
  // observables
  loader: boolean = false;
  projectMap: {
    [projectId: string]: IProject; // projectId: project Info
  } = {};
  // root store
  rootStore: CoreRootStore;
  // service
  projectService;
  projectArchiveService;
  issueLabelService;
  issueService;
  stateService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      projectMap: observable,
      // computed
      filteredProjectIds: computed,
      workspaceProjectIds: computed,
      archivedProjectIds: computed,
      totalProjectIds: computed,
      currentProjectDetails: computed,
      joinedProjectIds: computed,
      favoriteProjectIds: computed,
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
    this.projectArchiveService = new ProjectArchiveService();
    this.issueService = new IssueService();
    this.issueLabelService = new IssueLabelService();
    this.stateService = new ProjectStateService();
  }

  /**
   * @description returns filtered projects based on filters and search query
   */
  get filteredProjectIds() {
    const workspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    const {
      currentWorkspaceDisplayFilters: displayFilters,
      currentWorkspaceFilters: filters,
      searchQuery,
    } = this.rootStore.projectRoot.projectFilter;
    if (!workspaceDetails || !displayFilters || !filters) return;
    let workspaceProjects = Object.values(this.projectMap).filter(
      (p) =>
        p.workspace === workspaceDetails.id &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.identifier.toLowerCase().includes(searchQuery.toLowerCase())) &&
        shouldFilterProject(p, displayFilters, filters)
    );
    workspaceProjects = orderProjects(workspaceProjects, displayFilters.order_by);
    return workspaceProjects.map((p) => p.id);
  }

  /**
   * Returns project IDs belong to the current workspace
   */
  get workspaceProjectIds() {
    const workspaceDetails = this.rootStore.workspaceRoot.currentWorkspace;
    if (!workspaceDetails) return;
    const workspaceProjects = Object.values(this.projectMap).filter(
      (p) => p.workspace === workspaceDetails.id && !p.archived_at
    );
    const projectIds = workspaceProjects.map((p) => p.id);
    return projectIds ?? null;
  }

  /**
   * Returns archived project IDs belong to current workspace.
   */
  get archivedProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return;

    let projects = Object.values(this.projectMap ?? {});
    projects = sortBy(projects, "archived_at");

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && !!project.archived_at)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns total project IDs belong to the current workspace
   */
  // workspaceProjectIds + archivedProjectIds
  get totalProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return;

    const workspaceProjects = this.workspaceProjectIds ?? [];
    const archivedProjects = this.archivedProjectIds ?? [];
    return [...workspaceProjects, ...archivedProjects];
  }

  /**
   * Returns current project details
   */
  get currentProjectDetails() {
    if (!this.rootStore.router.projectId) return;
    return this.projectMap?.[this.rootStore.router.projectId];
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
      .filter((project) => project.workspace === currentWorkspace.id && project.is_member && !project.archived_at)
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
      .filter(
        (project) =>
          project.workspace === currentWorkspace.id && project.is_member && project.is_favorite && !project.archived_at
      )
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns Promise<IProject[]>
   *
   */
  fetchProjects = async (workspaceSlug: string) => {
    try {
      this.loader = true;
      const projectsResponse = await this.projectService.getProjects(workspaceSlug);
      runInAction(() => {
        projectsResponse.forEach((project) => {
          set(this.projectMap, [project.id], project);
        });
        this.loader = false;
      });
      return projectsResponse;
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      this.loader = false;
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
  getProjectById = computedFn((projectId: string | undefined | null) => {
    const projectInfo = this.projectMap[projectId ?? ""] || undefined;
    return projectInfo;
  });

  /**
   * Returns project identifier using project id
   * @param projectId
   * @returns string
   */
  getProjectIdentifierById = computedFn((projectId: string | undefined | null) => {
    const projectInfo = this.projectMap?.[projectId ?? ""];
    return projectInfo?.identifier;
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

  /**
   * Archives a project from specific workspace and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<void>
   */
  archiveProject = async (workspaceSlug: string, projectId: string) => {
    await this.projectArchiveService
      .archiveProject(workspaceSlug, projectId)
      .then((response) => {
        runInAction(() => {
          set(this.projectMap, [projectId, "archived_at"], response.archived_at);
        });
      })
      .catch((error) => {
        console.log("Failed to archive project from project store");
        this.fetchProjects(workspaceSlug);
        this.fetchProjectDetails(workspaceSlug, projectId);
        throw error;
      });
  };

  /**
   * Restores a project from specific workspace and updates it in the store
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<void>
   */
  restoreProject = async (workspaceSlug: string, projectId: string) => {
    await this.projectArchiveService
      .restoreProject(workspaceSlug, projectId)
      .then(() => {
        runInAction(() => {
          set(this.projectMap, [projectId, "archived_at"], null);
        });
      })
      .catch((error) => {
        console.log("Failed to restore project from project store");
        this.fetchProjects(workspaceSlug);
        this.fetchProjectDetails(workspaceSlug, projectId);
        throw error;
      });
  };
}
