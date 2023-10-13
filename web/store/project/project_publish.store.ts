import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
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

  projectPublishModal: boolean;
  project_id: string | null;
  projectPublishSettings: IProjectPublishSettings | "not-initialized";

  handleProjectModal: (project_id: string | null) => void;

  getProjectSettingsAsync: (workspace_slug: string, project_slug: string, user: any) => Promise<void>;
  publishProject: (
    workspace_slug: string,
    project_slug: string,
    data: IProjectPublishSettings,
    user: any
  ) => Promise<void>;
  updateProjectSettingsAsync: (
    workspace_slug: string,
    project_slug: string,
    project_publish_id: string,
    data: IProjectPublishSettings,
    user: any
  ) => Promise<void>;
  unPublishProject: (
    workspace_slug: string,
    project_slug: string,
    project_publish_id: string,
    user: any
  ) => Promise<void>;
}

export class ProjectPublishStore implements IProjectPublishStore {
  generalLoader: boolean = false;
  fetchSettingsLoader: boolean = false;
  error: any | null = null;

  projectPublishModal: boolean = false;
  project_id: string | null = null;
  projectPublishSettings: IProjectPublishSettings | "not-initialized" = "not-initialized";

  // root store
  rootStore;
  // service
  projectPublishService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      generalLoader: observable,
      fetchSettingsLoader: observable,
      error: observable,

      projectPublishModal: observable,
      project_id: observable,
      projectPublishSettings: observable.ref,
      // action
      handleProjectModal: action,
      getProjectSettingsAsync: action,
      publishProject: action,
      updateProjectSettingsAsync: action,
      unPublishProject: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectPublishService = new ProjectPublishService();
  }

  handleProjectModal = (project_id: string | null = null) => {
    if (project_id) {
      this.projectPublishModal = !this.projectPublishModal;
      this.project_id = project_id;
    } else {
      this.projectPublishModal = !this.projectPublishModal;
      this.project_id = null;
      this.projectPublishSettings = "not-initialized";
    }
  };

  getProjectSettingsAsync = async (workspace_slug: string, project_slug: string) => {
    try {
      this.fetchSettingsLoader = true;
      this.error = null;

      const response = await this.projectPublishService.getProjectSettingsAsync(workspace_slug, project_slug);

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
        this.projectPublishSettings = "not-initialized";
        this.fetchSettingsLoader = false;
        this.error = null;
      }
      return response;
    } catch (error) {
      this.fetchSettingsLoader = false;
      this.error = error;
      return error;
    }
  };

  publishProject = async (workspace_slug: string, project_slug: string, data: IProjectPublishSettings) => {
    try {
      this.generalLoader = true;
      this.error = null;

      const response = await this.projectPublishService.createProjectSettingsAsync(workspace_slug, project_slug, data);

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
      this.generalLoader = false;
      this.error = error;
      return error;
    }
  };

  updateProjectSettingsAsync = async (
    workspace_slug: string,
    project_slug: string,
    project_publish_id: string,
    data: IProjectPublishSettings
  ) => {
    try {
      this.generalLoader = true;
      this.error = null;

      const response = await this.projectPublishService.updateProjectSettingsAsync(
        workspace_slug,
        project_slug,
        project_publish_id,
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
      this.generalLoader = false;
      this.error = error;
      return error;
    }
  };

  unPublishProject = async (workspace_slug: string, project_slug: string, project_publish_id: string) => {
    try {
      this.generalLoader = true;
      this.error = null;

      const response = await this.projectPublishService.deleteProjectSettingsAsync(
        workspace_slug,
        project_slug,
        project_publish_id
      );

      runInAction(() => {
        this.projectPublishSettings = "not-initialized";
        this.generalLoader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      this.generalLoader = false;
      this.error = error;
      return error;
    }
  };
}
