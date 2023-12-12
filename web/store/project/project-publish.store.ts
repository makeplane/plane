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
  generalLoader: boolean;
  fetchSettingsLoader: boolean;
  error: any | null;

  projectPublishSettings: IProjectPublishSettings | "not-initialized";

  getProjectSettingsAsync: (workspaceSlug: string, projectId: string) => Promise<void>;
  publishProject: (workspaceSlug: string, projectId: string, data: IProjectPublishSettings) => Promise<void>;
  updateProjectSettingsAsync: (
    workspaceSlug: string,
    projectId: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => Promise<void>;
  unPublishProject: (workspaceSlug: string, projectId: string, projectPublishId: string) => Promise<void>;
}

export class ProjectPublishStore implements IProjectPublishStore {
  // states
  generalLoader: boolean = false;
  fetchSettingsLoader: boolean = false;
  error: any | null = null;

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
      error: observable.ref,

      // observables
      project_id: observable.ref,
      projectPublishSettings: observable.ref,

      // actions
      getProjectSettingsAsync: action,
      publishProject: action,
      updateProjectSettingsAsync: action,
      unPublishProject: action,
    });

    this.projectRootStore = _projectRootStore;

    // services
    this.projectPublishService = new ProjectPublishService();
  }

  getProjectSettingsAsync = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.fetchSettingsLoader = true;
        this.error = null;
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
          this.error = null;
        });
      } else {
        runInAction(() => {
          this.projectPublishSettings = "not-initialized";
          this.fetchSettingsLoader = false;
          this.error = null;
        });
      }
      return response;
    } catch (error) {
      runInAction(() => {
        this.fetchSettingsLoader = false;
        this.error = error;
      });

      return error;
    }
  };

  publishProject = async (workspaceSlug: string, projectId: string, data: IProjectPublishSettings) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
        this.error = null;
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

        const _projectMap = set(
          this.projectRootStore.projects.projectMap,
          [workspaceSlug, projectId, "is_deployed"],
          true
        );
        runInAction(() => {
          this.projectPublishSettings = _projectPublishSettings;
          this.projectRootStore.projects.projectMap = _projectMap;
          this.generalLoader = false;
          this.error = null;
        });

        return response;
      }
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
        this.error = error;
      });

      return error;
    }
  };

  updateProjectSettingsAsync = async (
    workspaceSlug: string,
    projectId: string,
    projectPublishId: string,
    data: IProjectPublishSettings
  ) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
        this.error = null;
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
          this.error = null;
        });

        return response;
      }
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
        this.error = error;
      });

      return error;
    }
  };

  unPublishProject = async (workspaceSlug: string, projectId: string, projectPublishId: string) => {
    try {
      runInAction(() => {
        this.generalLoader = true;
        this.error = null;
      });

      const response = await this.projectPublishService.deleteProjectSettingsAsync(
        workspaceSlug,
        projectId,
        projectPublishId
      );

      const _projectMap = set(
        this.projectRootStore.projects.projectMap,
        [workspaceSlug, projectId, "is_deployed"],
        false
      );
      runInAction(() => {
        this.projectPublishSettings = "not-initialized";
        this.projectRootStore.projects.projectMap = _projectMap;
        this.generalLoader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.generalLoader = false;
        this.error = error;
      });

      return error;
    }
  };
}
