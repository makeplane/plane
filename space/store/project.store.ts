// mobx
import { observable, action, makeObservable, runInAction, computed } from "mobx";
// service
import ProjectService from "@/services/project.service";
// store types
import { RootStore } from "@/store/root.store";
// types
import { TWorkspaceDetails, TProjectDetails, TProjectSettings } from "@/types/project";

export interface IProjectStore {
  // observables
  loader: boolean;
  error: any | undefined;
  settings: TProjectSettings | undefined;
  workspace: TWorkspaceDetails | undefined;
  project: TProjectDetails | undefined;
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
  error: any | undefined = undefined;
  settings: TProjectSettings | undefined = undefined;
  workspace: TWorkspaceDetails | undefined = undefined;
  project: TProjectDetails | undefined = undefined;
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
      // computed
      canReact: computed,
      canComment: computed,
      canVote: computed,
      // actions
      fetchProjectSettings: action,
      hydrate: action,
    });
    // services
    this.projectService = new ProjectService();
  }

  // computed
  get canReact() {
    return this.settings?.reactions ?? false;
  }
  get canComment() {
    return this.settings?.comments ?? false;
  }
  get canVote() {
    return this.settings?.votes ?? false;
  }

  fetchProjectSettings = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.getProjectSettings(workspace_slug, project_slug);

      if (response) {
        this.store.issueFilter.updateLayoutOptions(response?.views);
        runInAction(() => {
          this.project = response?.project_details;
          this.workspace = response?.workspace_detail;
          this.settings = response;
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

  hydrate = (projectSettings: TProjectSettings) => {
    const { workspace_detail, project_details } = projectSettings;
    this.workspace = workspace_detail;
    this.project = project_details;
  };
}
