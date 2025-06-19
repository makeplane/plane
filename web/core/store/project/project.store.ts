import cloneDeep from "lodash/cloneDeep";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import update from "lodash/update";
import { observable, action, computed, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { TFetchStatus, TLoader, TProjectAnalyticsCount, TProjectAnalyticsCountParams } from "@plane/types";
// helpers
import { orderProjects, shouldFilterProject } from "@plane/utils";
// services
import { TProject, TPartialProject } from "@/plane-web/types/projects";
import { IssueLabelService, IssueService } from "@/services/issue";
import { ProjectService, ProjectStateService, ProjectArchiveService } from "@/services/project";
// store
import { CoreRootStore } from "../root.store";

type ProjectOverviewCollapsible = "links" | "attachments";

export interface IProjectStore {
  // observables
  isUpdatingProject: boolean;
  loader: TLoader;
  fetchStatus: TFetchStatus;
  projectMap: Record<string, TProject>; // projectId: project info
  projectAnalyticsCountMap: Record<string, TProjectAnalyticsCount>; // projectId: project analytics count
  // computed
  filteredProjectIds: string[] | undefined;
  workspaceProjectIds: string[] | undefined;
  archivedProjectIds: string[] | undefined;
  totalProjectIds: string[] | undefined;
  joinedProjectIds: string[];
  favoriteProjectIds: string[];
  currentProjectDetails: TProject | undefined;
  // actions
  getProjectById: (projectId: string | undefined | null) => TProject | undefined;
  getPartialProjectById: (projectId: string | undefined | null) => TPartialProject | undefined;
  getProjectIdentifierById: (projectId: string | undefined | null) => string;
  getProjectAnalyticsCountById: (projectId: string | undefined | null) => TProjectAnalyticsCount | undefined;
  getProjectByIdentifier: (projectIdentifier: string) => TProject | undefined;
  // collapsible
  openCollapsibleSection: ProjectOverviewCollapsible[];
  lastCollapsibleAction: ProjectOverviewCollapsible | null;

  setOpenCollapsibleSection: (section: ProjectOverviewCollapsible[]) => void;
  setLastCollapsibleAction: (section: ProjectOverviewCollapsible) => void;
  toggleOpenCollapsibleSection: (section: ProjectOverviewCollapsible) => void;

  // helper actions
  processProjectAfterCreation: (workspaceSlug: string, data: TProject) => void;

  // fetch actions
  fetchPartialProjects: (workspaceSlug: string) => Promise<TPartialProject[]>;
  fetchProjects: (workspaceSlug: string) => Promise<TProject[]>;
  fetchProjectDetails: (workspaceSlug: string, projectId: string) => Promise<TProject>;
  fetchProjectAnalyticsCount: (
    workspaceSlug: string,
    params?: TProjectAnalyticsCountParams
  ) => Promise<TProjectAnalyticsCount[]>;
  // favorites actions
  addProjectToFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  removeProjectFromFavorites: (workspaceSlug: string, projectId: string) => Promise<any>;
  // project-view action
  updateProjectView: (workspaceSlug: string, projectId: string, viewProps: any) => Promise<any>;
  // CRUD actions
  createProject: (workspaceSlug: string, data: Partial<TProject>) => Promise<TProject>;
  updateProject: (workspaceSlug: string, projectId: string, data: Partial<TProject>) => Promise<TProject>;
  deleteProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  // archive actions
  archiveProject: (workspaceSlug: string, projectId: string) => Promise<void>;
  restoreProject: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class ProjectStore implements IProjectStore {
  // observables
  isUpdatingProject: boolean = false;
  loader: TLoader = "init-loader";
  fetchStatus: TFetchStatus = undefined;
  projectMap: Record<string, TProject> = {};
  projectAnalyticsCountMap: Record<string, TProjectAnalyticsCount> = {};
  openCollapsibleSection: ProjectOverviewCollapsible[] = [];
  lastCollapsibleAction: ProjectOverviewCollapsible | null = null;

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
      isUpdatingProject: observable,
      loader: observable.ref,
      fetchStatus: observable.ref,
      projectMap: observable,
      projectAnalyticsCountMap: observable,
      openCollapsibleSection: observable.ref,
      lastCollapsibleAction: observable.ref,
      // computed
      filteredProjectIds: computed,
      workspaceProjectIds: computed,
      archivedProjectIds: computed,
      totalProjectIds: computed,
      currentProjectDetails: computed,
      joinedProjectIds: computed,
      favoriteProjectIds: computed,
      // helper actions
      processProjectAfterCreation: action,
      // fetch actions
      fetchPartialProjects: action,
      fetchProjects: action,
      fetchProjectDetails: action,
      fetchProjectAnalyticsCount: action,
      // favorites actions
      addProjectToFavorites: action,
      removeProjectFromFavorites: action,
      // project-view action
      updateProjectView: action,
      // CRUD actions
      createProject: action,
      updateProject: action,
      // collapsible actions
      setOpenCollapsibleSection: action,
      setLastCollapsibleAction: action,
      toggleOpenCollapsibleSection: action,
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
      .filter((project) => project.workspace === currentWorkspace.id && !!project.member_role && !project.archived_at)
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
          project.workspace === currentWorkspace.id &&
          !!project.member_role &&
          project.is_favorite &&
          !project.archived_at
      )
      .map((project) => project.id);
    return projectIds;
  }

  setOpenCollapsibleSection = (section: ProjectOverviewCollapsible[]) => {
    this.openCollapsibleSection = section;
    if (this.lastCollapsibleAction) this.lastCollapsibleAction = null;
  };

  setLastCollapsibleAction = (section: ProjectOverviewCollapsible) => {
    this.openCollapsibleSection = [...this.openCollapsibleSection, section];
  };

  toggleOpenCollapsibleSection = (section: ProjectOverviewCollapsible) => {
    if (this.openCollapsibleSection && this.openCollapsibleSection.includes(section)) {
      this.openCollapsibleSection = this.openCollapsibleSection.filter((s) => s !== section);
    } else {
      this.openCollapsibleSection = [...this.openCollapsibleSection, section];
    }
  };

  /**
   * @description process project after creation
   * @param workspaceSlug
   * @param data
   */
  processProjectAfterCreation = (workspaceSlug: string, data: TProject) => {
    runInAction(() => {
      set(this.projectMap, [data.id], data);
      // updating the user project role in workspaceProjectsPermissions
      set(this.rootStore.user.permission.workspaceProjectsPermissions, [workspaceSlug, data.id], data.member_role);
    });
  };

  /**
   * get Workspace projects partial data using workspace slug
   * @param workspaceSlug
   * @returns Promise<TPartialProject[]>
   *
   */
  fetchPartialProjects = async (workspaceSlug: string) => {
    try {
      this.loader = "init-loader";
      const projectsResponse = await this.projectService.getProjectsLite(workspaceSlug);
      runInAction(() => {
        projectsResponse.forEach((project) => {
          update(this.projectMap, [project.id], (p) => ({ ...p, ...project }));
        });
        this.loader = "loaded";
        if (!this.fetchStatus) this.fetchStatus = "partial";
      });
      return projectsResponse;
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * get Workspace projects using workspace slug
   * @param workspaceSlug
   * @returns Promise<TProject[]>
   *
   */
  fetchProjects = async (workspaceSlug: string) => {
    try {
      if (this.workspaceProjectIds && this.workspaceProjectIds.length > 0) {
        this.loader = "mutation";
      } else {
        this.loader = "init-loader";
      }
      const projectsResponse = await this.projectService.getProjects(workspaceSlug);
      runInAction(() => {
        projectsResponse.forEach((project) => {
          update(this.projectMap, [project.id], (p) => ({ ...p, ...project }));
        });
        this.loader = "loaded";
        this.fetchStatus = "complete";
      });
      return projectsResponse;
    } catch (error) {
      console.log("Failed to fetch project from workspace store");
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * Fetches project details using workspace slug and project id
   * @param workspaceSlug
   * @param projectId
   * @returns Promise<TProject>
   */
  fetchProjectDetails = async (workspaceSlug: string, projectId: string) => {
    try {
      const response = await this.projectService.getProject(workspaceSlug, projectId);
      runInAction(() => {
        update(this.projectMap, [projectId], (p) => ({ ...p, ...response }));
      });
      return response;
    } catch (error) {
      console.log("Error while fetching project details", error);
      throw error;
    }
  };

  /**
   * Fetches project analytics count using workspace slug and project id
   * @param workspaceSlug
   * @param params TProjectAnalyticsCountParams
   * @returns Promise<TProjectAnalyticsCount[]>
   */
  fetchProjectAnalyticsCount = async (
    workspaceSlug: string,
    params?: TProjectAnalyticsCountParams
  ): Promise<TProjectAnalyticsCount[]> => {
    try {
      const response = await this.projectService.getProjectAnalyticsCount(workspaceSlug, params);
      runInAction(() => {
        for (const analyticsData of response) {
          set(this.projectAnalyticsCountMap, [analyticsData.id], analyticsData);
        }
      });
      return response;
    } catch (error) {
      console.log("Failed to fetch project analytics count", error);
      throw error;
    }
  };

  /**
   * Returns project details using project id
   * @param projectId
   * @returns TProject | null
   */
  getProjectById = computedFn((projectId: string | undefined | null) => {
    const projectInfo = this.projectMap[projectId ?? ""] || undefined;
    return projectInfo;
  });

  /**
   * Returns project details using project identifier
   * @param projectIdentifier
   * @returns TProject | undefined
   */
  getProjectByIdentifier = computedFn((projectIdentifier: string) =>
    Object.values(this.projectMap).find((project) => project.identifier === projectIdentifier)
  );

  /**
   * Returns project lite using project id
   * This method is used just for type safety
   * @param projectId
   * @returns TPartialProject | null
   */
  getPartialProjectById = computedFn((projectId: string | undefined | null) => {
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
   * Returns project analytics count using project id
   * @param projectId
   * @returns TProjectAnalyticsCount[]
   */
  getProjectAnalyticsCountById = computedFn((projectId: string | undefined | null) => {
    if (!projectId) return undefined;
    return this.projectAnalyticsCountMap?.[projectId];
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
      const response = await this.rootStore.favorite.addFavorite(workspaceSlug.toString(), {
        entity_type: "project",
        entity_identifier: projectId,
        project_id: projectId,
        entity_data: { name: this.projectMap[projectId].name || "" },
      });
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
      const response = await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug.toString(), projectId);

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
   * @returns Promise<TProject>
   */
  createProject = async (workspaceSlug: string, data: any) => {
    try {
      const response = await this.projectService.createProject(workspaceSlug, data);
      this.processProjectAfterCreation(workspaceSlug, response);
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
   * @returns Promise<TProject>
   */
  updateProject = async (workspaceSlug: string, projectId: string, data: Partial<TProject>) => {
    const projectDetails = cloneDeep(this.getProjectById(projectId));
    try {
      runInAction(() => {
        set(this.projectMap, [projectId], { ...projectDetails, ...data });
        this.isUpdatingProject = true;
      });
      const response = await this.projectService.updateProject(workspaceSlug, projectId, data);
      runInAction(() => {
        this.isUpdatingProject = false;
      });
      return response;
    } catch (error) {
      console.log("Failed to create project from project store");
      runInAction(() => {
        set(this.projectMap, [projectId], projectDetails);
        this.isUpdatingProject = false;
      });
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
        if (this.rootStore.favorite.entityMap[projectId]) this.rootStore.favorite.removeFavoriteFromStore(projectId);
        delete this.rootStore.user.permission.workspaceProjectsPermissions[workspaceSlug][projectId];
      });
    } catch (error) {
      console.log("Failed to delete project from project store");
      throw error;
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
          this.rootStore.favorite.removeFavoriteFromStore(projectId);
        });
      })
      .catch((error) => {
        console.log("Failed to archive project from project store");
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
        throw error;
      });
  };
}
