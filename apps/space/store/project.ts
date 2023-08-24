// mobx
import { observable, action, makeObservable, runInAction } from "mobx";
// service
import ProjectService from "services/project.service";
// types
import { IProjectStore, IWorkspace, IProject, IProjectSettings } from "./types";

class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  projectsList: IProject[] | null = null;
  workspace: IWorkspace | null = null;
  project: IProject | null = null;
  workspaceProjectSettings: IProjectSettings | null = null;
  // root store
  rootStore;
  // service
  projectService;

  constructor(_rootStore: any | null = null) {
    makeObservable(this, {
      // observable
      projectsList: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      workspaceProjectSettings: observable.ref,
      loader: observable,
      error: observable.ref,
      // action
      getWorkspaceProjectsListAsync: action,
      getProjectSettingsAsync: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
  }

  getWorkspaceProjectsListAsync = async (workspace_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.getWorkspaceProjectsListAsync(workspace_slug);

      if (response && response.length > 0) {
        const _projectsList: IProject[] = response.map((_project: IProject) => {
          const _p = { ..._project };
          return {
            id: _p?.id,
            identifier: _p?.identifier,
            name: _p?.name,
            description: _p?.description,
            cover_image: _p?.cover_image,
            icon_prop: _p?.icon_prop,
            emoji: _p?.emoji,
          };
        });

        runInAction(() => {
          this.projectsList = [..._projectsList];
          this.loader = false;
        });
      } else {
        this.loader = false;
      }

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };

  getProjectSettingsAsync = async (workspace_slug: string, project_slug: string) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.getProjectSettingsAsync(workspace_slug, project_slug);

      if (response) {
        const _project: IProject = { ...response?.project_details };
        const _workspace: IWorkspace = { ...response?.workspace_detail };
        const _workspaceProjectSettings: IProjectSettings = {
          comments: response?.comments,
          reactions: response?.reactions,
          votes: response?.votes,
          views: { ...response?.views },
        };
        runInAction(() => {
          this.project = _project;
          this.workspace = _workspace;
          this.workspaceProjectSettings = _workspaceProjectSettings;
          this.loader = false;
        });
      }
      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      throw error;
    }
  };
}

export default ProjectStore;
