/* eslint-disable no-useless-catch */

import update from "lodash/update";
import { action, makeObservable, observable, runInAction } from "mobx";

// store
import { ProjectService } from "@/plane-web/services";
import { TProject, TProjectAttributesParams, TProjectAttributesResponse, TProjectFeatures } from "@/plane-web/types";
import { CoreRootStore } from "@/store/root.store";
import { IProjectAttachmentStore, ProjectAttachmentStore } from "./project-details/attachment.store";
import { IProjectLinkStore, ProjectLinkStore } from "./project-details/link.store";
import { IProjectReactionStore, ProjectReactionStore } from "./project-details/project_reaction.store";
import { IProjectUpdateStore, ProjectUpdateStore } from "./project-details/updates.store";

export interface IProjectStore {
  reactionStore: IProjectReactionStore;
  attachmentStore: IProjectAttachmentStore;
  featuresLoader: boolean;
  features: Record<string, TProjectFeatures>;
  // actions
  toggleFeatures: (workspaceSlug: string, projectId: string, data: Partial<TProject>) => Promise<void>;
  fetchFeatures: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchProjectAttributes: (
    workspaceSlug: string,
    params?: TProjectAttributesParams
  ) => Promise<TProjectAttributesResponse[]>;
  // store
  linkStore: IProjectLinkStore;
  updatesStore: IProjectUpdateStore;
}

export class ProjectStore implements IProjectStore {
  features: Record<string, TProjectFeatures> = {};
  featuresLoader: boolean = false;
  //store
  rootStore: CoreRootStore;
  linkStore: IProjectLinkStore;
  attachmentStore: IProjectAttachmentStore;
  updatesStore: IProjectUpdateStore;
  reactionStore: IProjectReactionStore;
  // services
  projectService;
  constructor(public store: CoreRootStore) {
    makeObservable(this, {
      // observables
      featuresLoader: observable.ref,
      features: observable,
      // actions
      fetchProjectAttributes: action,
    });
    this.rootStore = store;
    this.linkStore = new ProjectLinkStore(this);
    this.attachmentStore = new ProjectAttachmentStore(this);
    this.updatesStore = new ProjectUpdateStore();
    this.reactionStore = new ProjectReactionStore();

    // services
    this.projectService = new ProjectService();
  }

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

  /**
   * Fetches project attributes.
   * @param workspaceSlug
   * @param params optional params to filter attributes to filter projects
   * @returns array of project attributes
   */
  fetchProjectAttributes = async (workspaceSlug: string, params?: TProjectAttributesParams) => {
    try {
      const response = await this.projectService.getProjectAttributes(workspaceSlug, params);
      runInAction(() => {
        for (const attribute of response) {
          const { project_id, ...rest } = attribute;
          update(this.store.projectRoot.project.projectMap, [project_id], (p) => ({ ...p, ...rest }));
        }
      });
      return response;
    } catch (error) {
      console.log("Error while fetching project attributes", error);
      throw error;
    }
  };
}
