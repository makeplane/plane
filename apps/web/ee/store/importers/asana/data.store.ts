import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// constants
import { SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
// silo types
import { AsanaWorkspace, AsanaProject, AsanaSection, AsanaCustomField, AsanaEnumOption } from "@plane/etl/asana";
// plane web services
import { IAdditionalUsersResponse } from "@plane/types";
import { AsanaService } from "@/plane-web/services/importers/asana/data.service";
// plane web store types
import { RootStore } from "@/plane-web/store/root.store";

export interface IAsanaDataStore {
  // observables
  isLoading: boolean;
  error: object;
  asanaWorkspaces: Record<string, AsanaWorkspace>; // workspaceGid -> workspace
  asanaProjects: Record<string, Record<string, AsanaProject>>; // workspaceGid -> projectGid -> project
  asanaSections: Record<string, Record<string, AsanaSection>>; // projectGid -> sectionGid -> section
  asanaPriorities: Record<string, Record<string, AsanaCustomField>>; // projectGid -> priorityGid -> priority
  asanaTaskCount: Record<string, number>; // projectGid -> issueCount
  additionalUsersData: IAdditionalUsersResponse;
  // computed
  asanaWorkspaceIds: string[];
  // computed functions
  getAsanaProjectsByWorkspaceGid: (workspaceGid: string) => AsanaProject[];
  getAsanaSectionByProjectGid: (projectGid: string) => AsanaSection[];
  getAsanaPrioritiesByProjectGid: (projectGid: string) => AsanaCustomField[];
  getAsanaWorkspaceById: (workspaceGid: string) => AsanaWorkspace | undefined;
  getAsanaProjectById: (workspaceGid: string, projectId: string) => AsanaProject | undefined;
  getAsanaSectionById: (projectId: string, sectionGid: string) => AsanaSection | undefined;
  getAsanaPriorityOptionById: (
    projectId: string,
    priorityGid: string,
    optionGid: string
  ) => AsanaEnumOption | undefined;
  getAsanaIssueCountByProjectId: (projectId: string) => number;
  // actions
  fetchAsanaWorkspaces: (workspaceId: string, userId: string) => Promise<AsanaWorkspace[] | undefined>;
  fetchAsanaProjects: (
    workspaceId: string,
    userId: string,
    workspaceGid: string
  ) => Promise<AsanaProject[] | undefined>;
  fetchAsanaSections: (workspaceId: string, userId: string, projectGid: string) => Promise<AsanaSection[] | undefined>;
  fetchAsanaPriorities: (
    workspaceId: string,
    userId: string,
    projectGid: string
  ) => Promise<AsanaCustomField[] | undefined>;
  fetchAsanaTaskCount: (workspaceId: string, userId: string, projectGid: string) => Promise<number | undefined>;
  fetchAdditionalUsers: (
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    workspaceGid: string,
  ) => Promise<IAdditionalUsersResponse | undefined>;
}

export class AsanaDataStore implements IAsanaDataStore {
  // observables
  isLoading: boolean = false;
  error: object = {};
  asanaWorkspaces: Record<string, AsanaWorkspace> = {}; // workspaceGid -> workspace
  asanaProjects: Record<string, Record<string, AsanaProject>> = {}; // workspaceGid -> projectGid -> project
  asanaSections: Record<string, Record<string, AsanaSection>> = {}; // projectGid -> sectionGid -> section
  asanaPriorities: Record<string, Record<string, AsanaCustomField>> = {}; // projectGid -> priorityGid -> priority
  asanaTaskCount: Record<string, number> = {}; // projectGid -> issueCount
  additionalUsersData: IAdditionalUsersResponse = {
    additionalUserCount: 0,
    occupiedUserCount: 0
  };
  // service
  service: AsanaService;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      isLoading: observable.ref,
      error: observable,
      asanaWorkspaces: observable,
      asanaProjects: observable,
      asanaSections: observable,
      asanaPriorities: observable,
      asanaTaskCount: observable,
      // computed
      asanaWorkspaceIds: computed,
      // actions
      fetchAsanaWorkspaces: action,
      fetchAsanaProjects: action,
      fetchAsanaSections: action,
      fetchAsanaPriorities: action,
      fetchAsanaTaskCount: action,
      fetchAdditionalUsers: action
    });
    this.service = new AsanaService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));
  }

  // computed
  /**
   * @description Returns the list of workspace ids
   * @returns { string[] }
   */
  get asanaWorkspaceIds(): string[] {
    return Object.keys(this.asanaWorkspaces);
  }

  // computed functions
  /**
   * @description Returns the list of projects by workspace id
   * @param { string } workspaceGid
   * @returns { AsanaProject[] | undefined }
   */
  getAsanaProjectsByWorkspaceGid = computedFn((workspaceGid: string): AsanaProject[] => {
    const workspaceProjects = this.asanaProjects[workspaceGid];
    if (!workspaceProjects) return [];
    return Object.values(workspaceProjects);
  });

  /**
   * @description Returns the list of sections by project id
   * @param { string } projectGid
   * @returns { AsanaSection[] | undefined }
   */
  getAsanaSectionByProjectGid = computedFn((projectGid: string): AsanaSection[] => {
    const projectSections = this.asanaSections[projectGid];
    if (!projectSections) return [];
    return Object.values(projectSections);
  });

  /**
   * @description Returns the list of priorities by project id
   * @param { string } projectGid
   * @returns { AsanaCustomField[] | undefined }
   */
  getAsanaPrioritiesByProjectGid = computedFn((projectGid: string): AsanaCustomField[] => {
    const projectPriorities = this.asanaPriorities[projectGid];
    if (!projectPriorities) return [];
    return Object.values(projectPriorities);
  });

  /**
   * @description Returns the workspace by workspace id
   * @param { string } workspaceGid
   * @returns { AsanaWorkspace | undefined }
   */
  getAsanaWorkspaceById = computedFn(
    (workspaceGid: string): AsanaWorkspace | undefined => this.asanaWorkspaces[workspaceGid]
  );

  /**
   * @description Returns the project by workspace id and project id
   * @param { string } workspaceGid
   * @param { string } projectGid
   * @returns { AsanaProject | undefined }
   */
  getAsanaProjectById = computedFn(
    (workspaceGid: string, projectGid: string): AsanaProject | undefined =>
      this.asanaProjects[workspaceGid]?.[projectGid]
  );

  /**
   * @description Returns the section by project id and section id
   * @param { string } projectGid
   * @param { string } sectionGid
   * @returns { AsanaSection | undefined }
   */
  getAsanaSectionById = computedFn(
    (projectGid: string, sectionGid: string): AsanaSection | undefined => this.asanaSections[projectGid]?.[sectionGid]
  );

  /**
   * @description Returns the priority by project id and priority id
   * @param { string } projectGid
   * @param { string } priorityGid
   * @param { string } optionGid
   * @returns { AsanaEnumOption | undefined }
   */
  getAsanaPriorityOptionById = computedFn(
    (projectGid: string, priorityGid: string, optionGid: string): AsanaEnumOption | undefined =>
      this.asanaPriorities[projectGid]?.[priorityGid]?.enum_options?.find((option) => option.gid === optionGid)
  );

  /**
   * @description Returns the issue count by project id
   * @param { string } projectGid
   * @returns { number }
   */
  getAsanaIssueCountByProjectId = computedFn((projectGid: string): number => this.asanaTaskCount[projectGid] || 0);

  // actions
  /**
   * @description Fetches the list of Asana workspaces
   * @param { string } workspaceId
   * @param { string } userId
   * @returns { Promise<AsanaWorkspace[] | undefined> }
   */
  fetchAsanaWorkspaces = async (workspaceId: string, userId: string): Promise<AsanaWorkspace[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const workspaces = await this.service.getWorkspaces(workspaceId, userId);
      if (workspaces) {
        runInAction(() => {
          workspaces.forEach((workspace) => {
            if (!workspace.gid) return;
            this.asanaWorkspaces[workspace.gid] = workspace;
          });
        });
      }
      this.isLoading = false;
      return workspaces;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Asana projects
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } workspaceGid
   * @returns { Promise<AsanaProject[] | undefined> }
   */
  fetchAsanaProjects = async (
    workspaceId: string,
    userId: string,
    workspaceGid: string
  ): Promise<AsanaProject[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const projects = await this.service.getWorkspaceProjects(workspaceId, userId, workspaceGid);
      if (projects) {
        runInAction(() => {
          projects.forEach((project) => {
            if (!project.gid) return;
            if (!this.asanaProjects[workspaceGid]) {
              this.asanaProjects[workspaceGid] = {};
            }
            this.asanaProjects[workspaceGid][project.gid] = project;
          });
        });
      }
      this.isLoading = false;
      return projects;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Asana sections
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } projectGid
   * @returns { Promise<AsanaSection[] | undefined> }
   */
  fetchAsanaSections = async (
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<AsanaSection[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const sections = await this.service.getProjectSections(workspaceId, userId, projectGid);
      if (sections && sections.length > 0) {
        runInAction(() => {
          sections.forEach((section) => {
            if (!section.gid) return;
            if (!this.asanaSections[projectGid]) {
              this.asanaSections[projectGid] = {};
            }
            this.asanaSections[projectGid][section.gid] = section;
          });
        });
        this.isLoading = false;
        return sections;
      } else {
        this.isLoading = false;
        return undefined;
      }
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the list of Asana priorities
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } projectGid
   * @returns { Promise<AsanaCustomField[] | undefined> }
   */
  fetchAsanaPriorities = async (
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<AsanaCustomField[] | undefined> => {
    this.isLoading = true;
    this.error = {};

    try {
      const priorities = await this.service.getProjectPriorities(workspaceId, userId, projectGid);
      if (priorities) {
        runInAction(() => {
          priorities.forEach((priority) => {
            if (!priority.gid) return;
            if (!this.asanaPriorities[projectGid]) {
              this.asanaPriorities[projectGid] = {};
            }
            this.asanaPriorities[projectGid][priority.gid] = priority;
          });
        });
      }
      this.isLoading = false;
      return priorities;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

  /**
   * @description Fetches the issue count by project id
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } projectGid
   * @returns { Promise<number | undefined> }
   */
  fetchAsanaTaskCount = async (
    workspaceId: string,
    userId: string,
    projectGid: string
  ): Promise<number | undefined> => {
    try {
      const issueCount = await this.service.getProjectTaskCount(workspaceId, userId, projectGid);
      if (issueCount) {
        runInAction(() => {
          if (!this.asanaTaskCount[projectGid]) {
            this.asanaTaskCount[projectGid] = 0;
          }
          this.asanaTaskCount[projectGid] = issueCount.num_tasks;
        });
      }
      this.isLoading = false;
      return issueCount?.num_tasks;
    } catch (error) {
      this.error = error as unknown as object;
      this.isLoading = false;
    }
  };

    /**
   * @description Fetches additional users on import
   * @param { string } workspaceId
   * @param { string } userId
   * @param { string } workspaceSlug
   * @returns { Promise<IAdditionalUsersResponse | undefined> }
   */
    fetchAdditionalUsers = async (
      workspaceId: string,
      userId: string,
      workspaceSlug: string,
      workspaceGid: string
    ): Promise<IAdditionalUsersResponse | undefined> => {
      try {
        const additionalUserResponse = (await this.service.getAdditionalUsers(workspaceId, userId, workspaceSlug, workspaceGid)) as IAdditionalUsersResponse;
        if (additionalUserResponse?.additionalUserCount) {
          runInAction(() => {
            this.additionalUsersData = additionalUserResponse
          });
        }
        return additionalUserResponse;
      } catch (error) {
        this.error = error as unknown as object;
      }
    };
}
