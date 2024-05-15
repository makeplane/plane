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
  settings: IProjectSettings | null;
  activeLayout: TIssueBoardKeys;
  layoutOptions: Record<TIssueBoardKeys, boolean>;
  canReact: boolean;
  canComment: boolean;
  canVote: boolean;
  fetchProjectSettings: (workspace_slug: string, project_slug: string) => Promise<void>;
  setActiveLayout: (value: TIssueBoardKeys) => void;
  hydrate: (projectSettings: any) => void;
}

export class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;
  // data
  workspace: IWorkspace | null = null;
  project: IProject | null = null;
  settings: IProjectSettings | null = null;
  activeLayout: TIssueBoardKeys = "list";
  layoutOptions: Record<TIssueBoardKeys, boolean> = {
    list: true,
    kanban: true,
    calendar: false,
    gantt: false,
    spreadsheet: false,
  };
  canReact: boolean = false;
  canComment: boolean = false;
  canVote: boolean = false;
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
      workspace: observable,
      project: observable,
      settings: observable,
      layoutOptions: observable,
      activeLayout: observable.ref,
      canReact: observable.ref,
      canComment: observable.ref,
      canVote: observable.ref,
      // actions
      fetchProjectSettings: action,
      setActiveLayout: action,
      hydrate: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
  }

  hydrate = (projectSettings: any) => {
    const { workspace_detail, project_details, views, votes, comments, reactions } = projectSettings;
    this.workspace = workspace_detail;
    this.project = project_details;
    this.layoutOptions = views;
    this.canComment = comments;
    this.canVote = votes;
    this.canReact = reactions;
  };

  setActiveLayout = (boardValue: TIssueBoardKeys) => {
    this.activeLayout = boardValue;
  };

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
          this.layoutOptions = currentViewOptions;
          this.settings = currentDeploySettings;
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
}
