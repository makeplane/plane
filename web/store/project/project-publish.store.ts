import { observable, action, makeObservable, runInAction } from "mobx";
import set from "lodash/set";
// types
import { ProjectRootStore } from "./";
// services
import { ProjectPublishService } from "services/project";

export type TProjectPublishViews = "list" | "gantt" | "kanban" | "calendar" | "spreadsheet";

export type TProjectPublishViewsSettings = {
  [key in TProjectPublishViews]: boolean;
};

export interface IProjectPublishSettings {
  id?: string;
  project?: string;
  comments: boolean;
  reactions: boolean;
  votes: boolean;
  views: TProjectPublishViewsSettings;
  inbox: string | null;
}

export interface IProjectPublishStore {
  // states
  generalLoader: boolean;
  fetchSettingsLoader: boolean;
  // observables
  projectPublishSettings: IProjectPublishSettings | "not-initialized";
  // project settings actions
  getProjectSettingsAsync: (workspaceSlug: string, projectId: string) => Promise<void>;
  updateProjectSettingsAsync: (
    workspaceSlug: string,
    projectId: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => Promise<void>;
  // project publish actions
  publishProject: (workspaceSlug: string, projectId: string, data: IProjectPublishSettings) => Promise<void>;
  unPublishProject: (workspaceSlug: string, projectId: string, projectPublishId: string) => Promise<void>;
}

export class ProjectPublishStore implements IProjectPublishStore {
  // states
  generalLoader: boolean = false;
  fetchSettingsLoader: boolean = false;
  // actions
  project_id: string | null = null;
  projectPublishSettings: IProjectPublishSettings | "not-initialized" = "not-initialized";
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
      project_id: observable.ref,
      projectPublishSettings: observable.ref,
      // project settings actions
      getProjectSettingsAsync: action,
      updateProjectSettingsAsync: action,
      // project publish actions
      publishProject: action,
      unPublishProject: action,
    });
    // root store
    this.projectRootStore = _projectRootStore;
    // services
    this.projectPublishService = new ProjectPublishService();
  }

  /**
   * Fetches project publish settings
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  getProjectSettingsAsync = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.fetchSettingsLoader = true;
      });
      const response = await this.projectPublishService.getProjectSettingsAsync(workspaceSlug, projectId);
      if (response && response.length > 0) {
        const _projectPublishSettings: IProjectPublishSettings = {
          id: response[0]?.id,
          comments: response[0]?.comments,
          reactions: response[0]?.reactions,
          votes: response[0]?.votes,
          views: {
            list: response[0]?.views?.list || false,
            kanban: response[0]?.views?.kanban || false,
            calendar: response[0]?.views?.calendar || false,
            gantt: response[0]?.views?.gantt || false,
            spreadsheet: response[0]?.views?.spreadsheet || false,
          },
          inbox: response[0]?.inbox || null,
          project: response[0]?.project || null,
        };
        runInAction(() => {
          this.projectPublishSettings = _projectPublishSettings;
          this.fetchSettingsLoader = false;
        });
      } else {
        runInAction(() => {
          this.projectPublishSettings = "not-initialized";
          this.fetchSettingsLoader = false;
        });
      }
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
   * @param projectId
   * @param data
   * @returns
   */
  publishProject = async (workspaceSlug: string, projectId: string, data: IProjectPublishSettings) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.createProjectSettingsAsync(workspaceSlug, projectId, data);
      if (response) {
        const _projectPublishSettings: IProjectPublishSettings = {
          id: response?.id || null,
          comments: response?.comments || false,
          reactions: response?.reactions || false,
          votes: response?.votes || false,
          views: { ...response?.views },
          inbox: response?.inbox || null,
          project: response?.project || null,
        };

        runInAction(() => {
          this.projectPublishSettings = _projectPublishSettings;
          set(this.projectRootStore.project.projectMap, [projectId, "is_deployed"], true);
          this.generalLoader = false;
        });
        return response;
      }
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
   * @param projectId
   * @param projectPublishId
   * @param data
   * @returns
   */
  updateProjectSettingsAsync = async (
    workspaceSlug: string,
    projectId: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.updateProjectSettingsAsync(
        workspaceSlug,
        projectId,
        projectPublishId,
        data
      );
      if (response) {
        const _projectPublishSettings: IProjectPublishSettings = {
          id: response?.id || null,
          comments: response?.comments || false,
          reactions: response?.reactions || false,
          votes: response?.votes || false,
          views: { ...response?.views },
          inbox: response?.inbox || null,
          project: response?.project || null,
        };
        runInAction(() => {
          this.projectPublishSettings = _projectPublishSettings;
          this.generalLoader = false;
        });
        return response;
      }
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
   * @param projectId
   * @param projectPublishId
   * @returns
   */
  unPublishProject = async (workspaceSlug: string, projectId: string, projectPublishId: string) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
      });
      const response = await this.projectPublishService.deleteProjectSettingsAsync(
        workspaceSlug,
        projectId,
        projectPublishId
      );
      runInAction(() => {
        this.projectPublishSettings = "not-initialized";
        set(this.projectRootStore.project.projectMap, [projectId, "is_deployed"], false);
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
