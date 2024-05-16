// mobx
import { observable, action, makeObservable, runInAction } from "mobx";
// service
import ProjectService from "@/services/project.service";
// store types
import { RootStore } from "@/store/root.store";
// types
import { IWorkspace, IProject, IProjectSettings } from "@/types/project";

export interface IProjectStore {
  // observables
  loader: boolean;
  error: any | null;
  workspace: IWorkspace | null;
  project: IProject | null;
  settings: IProjectSettings | null;
  canReact: boolean;
  canComment: boolean;
  canVote: boolean;
  // actions
  fetchProjectSettings: (workspace_slug: string, project_slug: string) => Promise<void>;
  hydrate: (projectSettings: any) => void;
}

export class ProjectStore implements IProjectStore {
  // observables
  loader: boolean = false;
  error: any | null = null;
  workspace: IWorkspace | null = null;
  project: IProject | null = null;
  settings: IProjectSettings | null = null;
  canReact: boolean = false;
  canComment: boolean = false;
  canVote: boolean = false;
  // service
  projectService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // loaders and error observables
      loader: observable,
      error: observable.ref,
      // observable
      workspace: observable,
      project: observable,
      settings: observable,
      canReact: observable.ref,
      canComment: observable.ref,
      canVote: observable.ref,
      // actions
      fetchProjectSettings: action,

      hydrate: action,
      // computed
    });

    // services
    this.projectService = new ProjectService();
  }

  hydrate = (projectSettings: any) => {
    const { workspace_detail, project_details, votes, comments, reactions } = projectSettings;
    this.workspace = workspace_detail;
    this.project = project_details;
    this.canComment = comments;
    this.canVote = votes;
    this.canReact = reactions;
  };

  fetchProjectSettings = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.getProjectSettings(workspace_slug, project_slug);

      if (response) {
        const currentProject: IProject = { ...response?.project_details };
        const currentWorkspace: IWorkspace = { ...response?.workspace_detail };
        const currentDeploySettings = { ...response };
        this.store.issueFilter.updateLayoutOptions(response?.views);
        runInAction(() => {
          this.project = currentProject;
          this.workspace = currentWorkspace;
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
