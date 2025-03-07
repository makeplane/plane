// plane imports
import { action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import {
  workspaceWorkItemTemplateService as workspaceLevelService,
  projectWorkItemTemplateService as projectLevelService,
} from "@plane/services";
import { IBaseTemplateActionCallbacks, TWorkItemTemplate } from "@plane/types";
import { isValidId } from "@plane/utils";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
import {
  BaseTemplateStore,
  IBaseTemplateInstance,
  IBaseTemplateStore,
  TWorkItemTemplateInstanceProps,
  WorkItemTemplateInstance,
} from "@/plane-web/store/templates";

type TCreateWorkItemTemplateProps = {
  workspaceSlug: string;
  templateData: Partial<TWorkItemTemplate>;
} & (
  | {
      level: ETemplateLevel.PROJECT;
      projectId: string;
    }
  | {
      level: ETemplateLevel.WORKSPACE;
    }
);

export interface IWorkItemTemplateStore extends IBaseTemplateStore<TWorkItemTemplate> {
  // computed function
  getAllWorkItemTemplates: () => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIds: () => string[];
  getAllWorkItemTemplatesForProject: (projectId: string) => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIdsForProject: (projectId: string) => string[];
  getAllWorkItemTemplatesForProjectByTypeId: (
    projectId: string,
    typeId: string
  ) => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIdsForProjectByTypeId: (projectId: string, typeId: string) => string[];
  // actions
  fetchAllTemplates: (workspaceSlug: string) => Promise<void>;
  fetchTemplateById: (workspaceSlug: string, templateId: string) => Promise<void>;
  createWorkItemTemplate: (props: TCreateWorkItemTemplateProps) => Promise<TWorkItemTemplate | undefined>;
  deleteWorkItemTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
}

export class WorkItemTemplateStore extends BaseTemplateStore<TWorkItemTemplate> implements IWorkItemTemplateStore {
  constructor(protected rootStore: RootStore) {
    super({
      root: rootStore,
      createTemplateInstance: (templateInstanceProps: TWorkItemTemplateInstanceProps) =>
        new WorkItemTemplateInstance(templateInstanceProps),
    });

    makeObservable(this, {
      // observables
      fetchAllTemplates: action,
      createWorkItemTemplate: action,
      deleteWorkItemTemplate: action,
    });
  }

  // computed functions
  /**
   * @description Get all work item templates
   * @returns All work item templates
   */
  getAllWorkItemTemplates = computedFn(() =>
    this.getAllTemplates().filter((template) => {
      const typeId = template?.template_data?.type?.id;
      // If there's no work item type ID, include the template
      // Otherwise check if the ID is valid
      return !typeId || isValidId(typeId, this.rootStore.issueTypes.getIssueTypeIds(true));
    })
  );

  /**
   * @description Get all work item template ids
   * @returns All work item template ids
   */
  getAllWorkItemTemplateIds = computedFn(() => this.getAllWorkItemTemplates().map((template) => template.id));

  /**
   * @description Get all work item templates for a project
   * @param projectId - The id of the project
   * @returns All work item templates for a project
   */
  getAllWorkItemTemplatesForProject = computedFn((projectId: string) =>
    this.getAllWorkItemTemplates().filter((template) => template.template_data.project === projectId)
  );

  /**
   * @description Get all work item template ids for a project
   * @param projectId - The id of the project
   * @returns All work item template ids for a project
   */
  getAllWorkItemTemplateIdsForProject = computedFn((projectId: string) =>
    this.getAllWorkItemTemplatesForProject(projectId).map((template) => template.id)
  );

  /**
   * @description Get all work item templates for a project by type id
   * @param projectId - The id of the project
   * @param typeId - The id of the type
   * @returns All work item templates for a project by type id
   */
  getAllWorkItemTemplatesForProjectByTypeId = computedFn((projectId: string, typeId: string) =>
    this.getAllWorkItemTemplatesForProject(projectId).filter((template) => template.template_data.type?.id === typeId)
  );

  /**
   * @description Get all work item template ids for a project by type id
   * @param projectId - The id of the project
   * @param typeId - The id of the type
   * @returns All work item template ids for a project by type id
   */
  getAllWorkItemTemplateIdsForProjectByTypeId = computedFn((projectId: string, typeId: string) =>
    this.getAllWorkItemTemplatesForProjectByTypeId(projectId, typeId).map((template) => template.id)
  );

  // actions
  /**
   * @description Fetch all templates
   * @param workspaceSlug - The workspace slug
   */
  fetchAllTemplates = action(async (workspaceSlug: string) => {
    try {
      this.loader = "init-loader";
      const templates = await workspaceLevelService.list(workspaceSlug);
      this.addOrUpdateTemplates(templates, (id, template) => {
        // Use the correct service based on the level
        const updateService = template.project
          ? projectLevelService.update.bind(projectLevelService, workspaceSlug, template.project)
          : workspaceLevelService.update.bind(workspaceLevelService, workspaceSlug);
        // Update the template
        return updateService(id, template);
      });
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("WorkItemTemplateStore.fetchAllTemplates -> error", error);
      throw error;
    }
  });

  /**
   * @description Fetch a template by id
   * @param workspaceSlug - The workspace slug
   * @param templateId - The template id
   */
  fetchTemplateById = action(async (workspaceSlug: string, templateId: string) => {
    // if the template is already being fetched, return
    if (this.getTemplateFetchStatusById(templateId)) return;
    this.loader = "init-loader";
    try {
      // Fetch the template
      const template = await workspaceLevelService.retrieve(workspaceSlug, templateId);
      this.addOrUpdateTemplates([template], (id, template) => {
        // Use the correct service based on the level
        const updateService = template.project
          ? projectLevelService.update.bind(projectLevelService, workspaceSlug, template.project)
          : workspaceLevelService.update.bind(workspaceLevelService, workspaceSlug);
        // Update the template
        return updateService(id, template);
      });
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("WorkItemTemplateStore.fetchTemplateById -> error", error);
      throw error;
    }
  });

  /**
   * @description Create a work item template
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.templateData - The template data
   * @param props.level - The level of the template
   * @param props.projectId - The project id, required if the level is project
   */
  createWorkItemTemplate = action(async (props: TCreateWorkItemTemplateProps) => {
    const { workspaceSlug, templateData, level } = props;
    // Use the correct service based on the level and create the create and update action callbacks
    const createUpdateActionCallbacks: Pick<IBaseTemplateActionCallbacks<TWorkItemTemplate>, "create" | "update"> = {
      create:
        level === ETemplateLevel.PROJECT
          ? projectLevelService.create.bind(projectLevelService, workspaceSlug, props.projectId)
          : workspaceLevelService.create.bind(workspaceLevelService, workspaceSlug),
      update:
        level === ETemplateLevel.PROJECT
          ? projectLevelService.update.bind(projectLevelService, workspaceSlug, props.projectId)
          : workspaceLevelService.update.bind(workspaceLevelService, workspaceSlug),
    };
    // create the template
    return this.createTemplate(templateData, createUpdateActionCallbacks);
  });

  /**
   * @description Delete a work item template
   * @param workspaceSlug - The workspace slug
   * @param templateId - The template id
   */
  deleteWorkItemTemplate = action(async (workspaceSlug: string, templateId: string) => {
    this.deleteTemplate(templateId, (template) => {
      const deleteService = template.project
        ? projectLevelService.destroy.bind(projectLevelService, workspaceSlug, template.project)
        : workspaceLevelService.destroy.bind(workspaceLevelService, workspaceSlug);
      return deleteService(template.id);
    });
  });
}
