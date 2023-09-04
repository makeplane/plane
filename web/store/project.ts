import { observable, action, computed, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectServices } from "services/project.service";

export interface IProject {
  id: string;
  name: string;
  workspaceSlug: string;
}

export interface IProjectStore {
  loader: boolean;
  error: any | null;

  projectLeaveModal: boolean;
  projectLeaveDetails: IProject | any;

  handleProjectLeaveModal: (project: IProject | null) => void;

  leaveProject: (workspace_slug: string, project_slug: string, user: any) => Promise<void>;
}

class ProjectStore implements IProjectStore {
  loader: boolean = false;
  error: any | null = null;

  projectLeaveModal: boolean = false;
  projectLeaveDetails: IProject | null = null;

  // root store
  rootStore;
  // service
  projectService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      projectLeaveModal: observable,
      projectLeaveDetails: observable.ref,
      // action
      handleProjectLeaveModal: action,
      leaveProject: action,
      // computed
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectServices();
  }

  handleProjectLeaveModal = (project: IProject | null = null) => {
    if (project && project?.id) {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = project;
    } else {
      this.projectLeaveModal = !this.projectLeaveModal;
      this.projectLeaveDetails = null;
    }
  };

  leaveProject = async (workspace_slug: string, project_slug: string, user: any) => {
    try {
      this.loader = true;
      this.error = null;

      const response = await this.projectService.leaveProject(workspace_slug, project_slug, user);

      runInAction(() => {
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      this.loader = false;
      this.error = error;
      return error;
    }
  };
}

export default ProjectStore;
