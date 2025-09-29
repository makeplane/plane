/* eslint-disable no-useless-catch */

import { set, update } from "lodash-es";
import { action, makeObservable, observable, reaction, runInAction } from "mobx";
// store
import { ProjectService } from "@/plane-web/services";
import { RootStore } from "@/plane-web/store/root.store";
import {
  TProject,
  TProjectAttributesParams,
  TProjectAttributesResponse,
  TProjectFeatures,
  TProjectFeaturesList,
} from "@/plane-web/types";
import { IProjectAttachmentStore, ProjectAttachmentStore } from "./project-details/attachment.store";
import { IProjectLinkStore, ProjectLinkStore } from "./project-details/link.store";
import { IProjectReactionStore, ProjectReactionStore } from "./project-details/project_reaction.store";
import { IProjectUpdateStore, ProjectUpdateStore } from "./project-details/updates.store";

export interface IProjectStore {
  reactionStore: IProjectReactionStore;
  attachmentStore: IProjectAttachmentStore;
  featuresLoader: boolean;
  features: Record<string, TProjectFeatures>; // projectId -> project features
  projectCreationLoader: boolean;
  // computed methods
  isProjectFeatureEnabled: (projectId: string, featureKey: keyof TProjectFeaturesList) => boolean;
  // helpers
  getProjectFeatures: (projectId: string) => TProjectFeatures | undefined;
  // actions
  toggleProjectFeatures: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectFeaturesList>,
    shouldSync?: boolean
  ) => Promise<void>;
  createProjectUsingTemplate: (
    workspaceSlug: string,
    templateId: string,
    handleNextStep: (projectId: string) => void,
    data: Partial<TProject>
  ) => Promise<TProject>;
  fetchProjectFeatures: (workspaceSlug: string) => Promise<void>;
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
  projectCreationLoader: boolean = false;
  //store
  rootStore: RootStore;
  linkStore: IProjectLinkStore;
  attachmentStore: IProjectAttachmentStore;
  updatesStore: IProjectUpdateStore;
  reactionStore: IProjectReactionStore;
  // services
  projectService;
  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      featuresLoader: observable.ref,
      features: observable,
      projectCreationLoader: observable,
      // actions
      createProjectUsingTemplate: action,
      fetchProjectFeatures: action,
      fetchProjectAttributes: action,
    });
    this.rootStore = store;
    this.linkStore = new ProjectLinkStore(this);
    this.attachmentStore = new ProjectAttachmentStore(this);
    this.updatesStore = new ProjectUpdateStore();
    this.reactionStore = new ProjectReactionStore();
    // services
    this.projectService = new ProjectService();

    // reaction to add project features when a new project is added to  project map
    reaction(
      () => ({
        projectIds: Object.keys(this.rootStore.projectRoot.project.projectMap),
      }),
      ({ projectIds }) => {
        for (const projectId of projectIds) {
          if (!this.features[projectId]) {
            this.features[projectId] = {
              is_project_updates_enabled: false,
              is_epic_enabled: false,
              is_issue_type_enabled: false,
              is_time_tracking_enabled: false,
              is_workflow_enabled: false,
              project_id: projectId,
            };
          }
        }
      }
    );
  }

  // computed methods
  /**
   * @description check if a project feature is enabled
   * @param { string } projectId
   * @param { keyof TProjectFeatures } featureKey
   * @returns { boolean }
   */
  isProjectFeatureEnabled = (projectId: string, featureKey: keyof TProjectFeaturesList): boolean => {
    const projectFeatures = this.features[projectId];
    return projectFeatures?.[featureKey] ?? false;
  };

  // helpers
  /**
   * Get project feature by project id
   * @param projectId
   * @returns project feature
   */
  getProjectFeatures = (projectId: string): TProjectFeatures | undefined => this.features[projectId];

  // actions
  /**
   * Creates a project in the workspace using a template
   * @param workspaceSlug
   * @param templateId
   * @param handleNextStep
   * @param data
   * @returns Promise<TProject>
   */
  createProjectUsingTemplate = async (
    workspaceSlug: string,
    templateId: string,
    handleNextStep: (projectId: string) => void,
    data: Partial<TProject>
  ) => {
    try {
      const response = await this.projectService.createProjectUsingTemplate(workspaceSlug, templateId, data);
      this.projectCreationLoader = true;
      await new Promise((resolve) => setTimeout(resolve, 5000));
      handleNextStep(response.id);
      this.projectCreationLoader = false;
      this.rootStore.projectRoot.project.processProjectAfterCreation(workspaceSlug, response);

      // Get template detail to set project features
      const template = this.rootStore.templatesRoot.projectTemplates.getTemplateById(templateId);
      if (template && response.id) {
        set(this.features, response.id, {
          is_project_updates_enabled: template.template_data.is_project_updates_enabled,
          is_epic_enabled: template.template_data.is_epic_enabled,
          is_issue_type_enabled: template.template_data.is_issue_type_enabled,
          is_time_tracking_enabled: template.template_data.is_time_tracking_enabled,
          is_workflow_enabled: template.template_data.is_workflow_enabled,
          project_id: response.id,
        });
      }
      // fetch project work item types and epics
      await this.rootStore.issueTypes.fetchAll(workspaceSlug, response.id);

      return response;
    } catch (error) {
      this.projectCreationLoader = false;
      console.error("Error creating project using template", error);
      throw error;
    }
  };

  fetchProjectFeatures = async (workspaceSlug: string): Promise<void> => {
    try {
      this.featuresLoader = true;
      const projectFeatures = await this.projectService.getProjectFeatures(workspaceSlug);
      runInAction(() => {
        for (const feature of projectFeatures) {
          this.features[feature.project_id] = feature;
        }
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

  toggleProjectFeatures = async (
    workspaceSlug: string,
    projectId: string,
    data: Partial<TProjectFeaturesList>,
    shouldSync: boolean = true
  ): Promise<void> => {
    const initialState = this.features[projectId];
    try {
      this.features[projectId] = {
        ...this.features[projectId],
        ...data,
      };
      if (shouldSync) {
        await this.projectService.toggleProjectFeatures(workspaceSlug, projectId, data);
      }
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
