// mobx
import { observable, action, makeObservable, runInAction } from "mobx";
// service
import ProjectService from "@/services/project.service";
// types
import { TIssueBoardKeys } from "@/types/issue";
import { IWorkspace, IProject, IProjectSettings } from "@/types/project";

export interface IProjectStore {
  loader: boolean;
  error: any | null;
  workspace: IWorkspace | null;
  project: IProject | null;
  deploySettings: IProjectSettings | null;
  viewOptions: any;
  activeBoard: TIssueBoardKeys | null;
  fetchProjectSettings: (workspace_slug: string, project_slug: string) => Promise<void>;
  setActiveBoard: (value: TIssueBoardKeys) => void;
}

export class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;
  // data
  workspace: IWorkspace | null = null;
  project: IProject | null = null;
  deploySettings: IProjectSettings | null = null;
  viewOptions: any = null;
  activeBoard: TIssueBoardKeys | null = null;
  // root store
  rootStore;
  // service
  projectService;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // loaders and error observables
      loader: observable,
      error: observable.ref,
      // observable
      workspace: observable.ref,
      project: observable.ref,
      deploySettings: observable.ref,
      viewOptions: observable.ref,
      activeBoard: observable.ref,
      // actions
      fetchProjectSettings: action,
      setActiveBoard: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
  }

  fetchProjectSettings = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.getProjectSettings(workspace_slug, project_slug);

      if (response) {
        const currentProject: IProject = { ...response?.project_details };
        const currentWorkspace: IWorkspace = { ...response?.workspace_detail };
        const currentViewOptions = { ...response?.views };
        const currentDeploySettings = { ...response };
        runInAction(() => {
          this.project = currentProject;
          this.workspace = currentWorkspace;
          this.viewOptions = currentViewOptions;
          this.deploySettings = currentDeploySettings;
          this.loader = false;
        });
      }
      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  setActiveBoard = (boardValue: TIssueBoardKeys) => {
    this.activeBoard = boardValue;
  };
}
