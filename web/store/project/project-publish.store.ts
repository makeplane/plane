import set from "lodash/set";
import unset from "lodash/unset";
import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { ProjectPublishService } from "@/services/project";
import { ProjectRootStore } from "./";
// services

export type TProjectPublishViews = "list" | "gantt" | "kanban" | "calendar" | "spreadsheet";

export type TProjectPublishViewsSettings = {
  [key in TProjectPublishViews]: boolean;
};

export interface IProjectPublishSettings {
  anchor?: string;
  id?: string;
  project?: string;
  is_comments_enabled: boolean;
  is_reactions_enabled: boolean;
  is_votes_enabled: boolean;
  view_props: TProjectPublishViewsSettings;
  inbox: string | null;
}

export interface IProjectPublishStore {
  // states
  generalLoader: boolean;
  fetchSettingsLoader: boolean;
  // observables
  publishSettingsMap: Record<string, IProjectPublishSettings>; // projectID => IProjectPublishSettings
  // helpers
  getPublishSettingsByProjectID: (projectID: string) => IProjectPublishSettings | undefined;
  // actions
  fetchPublishSettings: (workspaceSlug: string, projectID: string) => Promise<IProjectPublishSettings>;
  updatePublishSettings: (
    workspaceSlug: string,
    projectID: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => Promise<IProjectPublishSettings>;
  publishProject: (
    workspaceSlug: string,
    projectID: string,
    data: IProjectPublishSettings
  ) => Promise<IProjectPublishSettings>;
  unPublishProject: (workspaceSlug: string, projectID: string, projectPublishId: string) => Promise<void>;
}

export class ProjectPublishStore implements IProjectPublishStore {
  // states
  generalLoader: boolean = false;
  fetchSettingsLoader: boolean = false;
  // observables
  publishSettingsMap: Record<string, IProjectPublishSettings> = {};
  // root store
  projectRootStore: ProjectRootStore;
  // services
  projectPublishService;

  constructor(_projectRootStore: ProjectRootStore) {
    makeObservable(this, {
      // states
      generalLoader: observable.ref,
      fetchSettingsLoader: observable.ref,
      // observables
      publishSettingsMap: observable,
      // actions
      fetchPublishSettings: action,
      updatePublishSettings: action,
      publishProject: action,
      unPublishProject: action,
    });
    // root store
    this.projectRootStore = _projectRootStore;
    // services
    this.projectPublishService = new ProjectPublishService();
  }

  /**
   * @description returns the publish settings of a particular project
   * @param {string} projectID
   * @returns {IProjectPublishSettings | undefined}
   */
  getPublishSettingsByProjectID = (projectID: string): IProjectPublishSettings | undefined =>
    this.publishSettingsMap?.[projectID] ?? undefined;

  /**
   * Fetches project publish settings
   * @param workspaceSlug
   * @param projectID
   * @returns
   */
  fetchPublishSettings = async (workspaceSlug: string, projectID: string) => {
    try {
      runInAction(() => {
        this.fetchSettingsLoader = true;
      });
      const response = await this.projectPublishService.getProjectSettingsAsync(workspaceSlug, projectID);

      runInAction(() => {
        set(this.publishSettingsMap, [projectID], response);
        this.fetchSettingsLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.fetchSettingsLoader = false;
      });
      throw error;
    }
  };

  /**
   * Publishes project and updates project publish status in the store
   * @param workspaceSlug
   * @param projectID
   * @param data
   * @returns
   */
  publishProject = async (workspaceSlug: string, projectID: string, data: IProjectPublishSettings) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.createProjectSettingsAsync(workspaceSlug, projectID, data);
      runInAction(() => {
        set(this.publishSettingsMap, [projectID], response);
        set(this.projectRootStore.project.projectMap, [projectID, "is_deployed"], true);
        this.generalLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
      });
      throw error;
    }
  };

  /**
   * Updates project publish settings
   * @param workspaceSlug
   * @param projectID
   * @param projectPublishId
   * @param data
   * @returns
   */
  updatePublishSettings = async (
    workspaceSlug: string,
    projectID: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.updateProjectSettingsAsync(
        workspaceSlug,
        projectID,
        projectPublishId,
        data
      );
      runInAction(() => {
        set(this.publishSettingsMap, [projectID], response);
        this.generalLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
      });
      throw error;
    }
  };

  /**
   * Unpublishes project and updates project publish status in the store
   * @param workspaceSlug
   * @param projectID
   * @param projectPublishId
   * @returns
   */
  unPublishProject = async (workspaceSlug: string, projectID: string, projectPublishId: string) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.deleteProjectSettingsAsync(
        workspaceSlug,
        projectID,
        projectPublishId
      );
      runInAction(() => {
        unset(this.publishSettingsMap, [projectID]);
        set(this.projectRootStore.project.projectMap, [projectID, "is_deployed"], false);
        this.generalLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
      });
      throw error;
    }
  };
}
