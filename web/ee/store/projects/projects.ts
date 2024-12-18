/* eslint-disable no-useless-catch */

import { action, computed, makeObservable, observable, runInAction } from "mobx";

// store
import { ProjectService } from "@/plane-web/services";
import { TProject, TProjectFeatures } from "@/plane-web/types";
import { ProjectStore as CeProjectStore, IProjectStore as ICeProjectStore } from "@/store/project/project.store";
import { CoreRootStore } from "@/store/root.store";
import { IProjectAttachmentStore, ProjectAttachmentStore } from "./project-details/attachment.store";
import { IProjectLinkStore, ProjectLinkStore } from "./project-details/link.store";
import { IProjectReactionStore, ProjectReactionStore } from "./project-details/project_reaction.store";
import { IProjectUpdateStore, ProjectUpdateStore } from "./project-details/updates.store";

export interface IProjectStore extends ICeProjectStore {
  reactionStore: IProjectReactionStore;
  attachmentStore: IProjectAttachmentStore;
  featuresLoader: boolean;
  features: Record<string, TProjectFeatures>;
  //computed
  publicProjectIds: string[];
  privateProjectIds: string[];
  myProjectIds: string[];
  // actions
  filteredProjectCount: (filter: string) => number | undefined;
  toggleFeatures: (workspaceSlug: string, projectId: string, data: Partial<TProject>) => Promise<void>;
  fetchFeatures: (workspaceSlug: string, projectId: string) => Promise<void>;
  // store
  linkStore: IProjectLinkStore;
  updatesStore: IProjectUpdateStore;
}

export class ProjectStore extends CeProjectStore implements IProjectStore {
  features: Record<string, TProjectFeatures> = {};
  featuresLoader: boolean = false;
  //store
  linkStore: IProjectLinkStore;
  attachmentStore: IProjectAttachmentStore;
  updatesStore: IProjectUpdateStore;
  reactionStore: IProjectReactionStore;
  // services
  projectService;
  constructor(public store: CoreRootStore) {
    super(store);
    makeObservable(this, {
      // observables
      featuresLoader: observable.ref,
      features: observable,
      // computed
      publicProjectIds: computed,
      privateProjectIds: computed,
      myProjectIds: computed,
      // actions
      filteredProjectCount: action,
    });
    this.linkStore = new ProjectLinkStore(this);
    this.attachmentStore = new ProjectAttachmentStore(this);
    this.updatesStore = new ProjectUpdateStore();
    this.reactionStore = new ProjectReactionStore();

    // services
    this.projectService = new ProjectService();
  }

  // computed
  /**
   * Returns public project IDs belong to current workspace.
   */
  get publicProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.network === 2)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns private project IDs belong to current workspace.
   */
  get myProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.is_member)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns private project IDs belong to current workspace.
   */
  get privateProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.network === 0)
      .map((project) => project.id);
    return projectIds;
  }
  /**
   * Returns private project IDs belong to current workspace.
   */
  filteredProjectCount = (filter: string) => {
    console.log(this, filter);
    switch (filter) {
      case "all_projects":
        return this.totalProjectIds?.length;
      case "public":
        return this.publicProjectIds.length;
      case "private":
        return this.privateProjectIds.length;
      case "my_projects":
        return this.myProjectIds.length;
      default:
        return 0;
    }
  };

  // actions
  fetchFeatures = async (workspaceSlug: string, projectId: string): Promise<void> => {
    try {
      this.featuresLoader = true;
      const response = await this.projectService.getFeatures(workspaceSlug, projectId);
      runInAction(() => {
        this.features[projectId] = response;
      });
    } catch (error) {
      console.error("Error fetching project features", error);
      throw error;
    } finally {
      runInAction(() => {
        this.featuresLoader = false;
      });
    }
  };

  toggleFeatures = async (workspaceSlug: string, projectId: string, data: Partial<TProject>): Promise<void> => {
    const initialState = this.features[projectId];
    try {
      this.features[projectId] = {
        ...this.features[projectId],
        ...data,
      };
      await this.projectService.toggleFeatures(workspaceSlug, projectId, data);
    } catch (error) {
      console.error(error);
      this.features[projectId] = initialState;
      throw error;
    }
  };
}
