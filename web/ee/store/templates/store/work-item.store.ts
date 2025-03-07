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

type TBaseWorkItemTemplateProps = {
  workspaceSlug: string;
} & (
  | {
      level: ETemplateLevel.PROJECT;
      projectId: string;
    }
  | {
      level: ETemplateLevel.WORKSPACE;
    }
);

type TFetchWorkItemTemplatesProps = TBaseWorkItemTemplateProps;

type TFetchWorkItemTemplateByIdProps = TFetchWorkItemTemplatesProps & {
  templateId: string;
};

type TCreateWorkItemTemplateProps = TBaseWorkItemTemplateProps & {
  templateData: Partial<TWorkItemTemplate>;
};

export interface IWorkItemTemplateStore extends IBaseTemplateStore<TWorkItemTemplate> {
  // computed function
  getAllWorkItemTemplates: (workspaceSlug: string) => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIds: (workspaceSlug: string) => string[];
  getAllWorkItemTemplatesForProject: (
    workspaceSlug: string,
    projectId: string
  ) => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIdsForProject: (workspaceSlug: string, projectId: string) => string[];
  getAllWorkItemTemplatesForProjectByTypeId: (
    workspaceSlug: string,
    projectId: string,
    typeId: string
  ) => IBaseTemplateInstance<TWorkItemTemplate>[];
  getAllWorkItemTemplateIdsForProjectByTypeId: (workspaceSlug: string, projectId: string, typeId: string) => string[];
  // actions
  fetchAllTemplates: (props: TFetchWorkItemTemplatesProps) => Promise<void>;
  fetchTemplateById: (props: TFetchWorkItemTemplateByIdProps) => Promise<void>;
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
   * @param workspaceSlug - The slug of the workspace
   * @returns All work item templates
   */
  getAllWorkItemTemplates = computedFn((workspaceSlug: string) =>
    this.getAllTemplates(workspaceSlug).filter((template) => {
      const typeId = template?.template_data?.type?.id;
      // If there's no work item type ID, include the template
      // Otherwise check if the ID is valid
      return !typeId || isValidId(typeId, this.rootStore.issueTypes.getIssueTypeIds(true));
    })
  );

  /**
   * @description Get all work item template ids
   * @param workspaceSlug - The slug of the workspace
   * @returns All work item template ids
   */
  getAllWorkItemTemplateIds = computedFn((workspaceSlug: string) =>
    this.getAllWorkItemTemplates(workspaceSlug).map((template) => template.id)
  );

  /**
   * @description Get all work item templates for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All work item templates for a project
   */
  getAllWorkItemTemplatesForProject = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllWorkItemTemplates(workspaceSlug).filter((template) => template.template_data.project === projectId)
  );

  /**
   * @description Get all work item template ids for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All work item template ids for a project
   */
  getAllWorkItemTemplateIdsForProject = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllWorkItemTemplatesForProject(workspaceSlug, projectId).map((template) => template.id)
  );

  /**
   * @description Get all work item templates for a project by type id
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @param typeId - The id of the type
   * @returns All work item templates for a project by type id
   */
  getAllWorkItemTemplatesForProjectByTypeId = computedFn((workspaceSlug: string, projectId: string, typeId: string) =>
    this.getAllWorkItemTemplatesForProject(workspaceSlug, projectId).filter(
      (template) => template.template_data.type?.id === typeId
    )
  );

  /**
   * @description Get all work item template ids for a project by type id
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @param typeId - The id of the type
   * @returns All work item template ids for a project by type id
   */
  getAllWorkItemTemplateIdsForProjectByTypeId = computedFn((workspaceSlug: string, projectId: string, typeId: string) =>
    this.getAllWorkItemTemplatesForProjectByTypeId(workspaceSlug, projectId, typeId).map((template) => template.id)
  );

  // actions
  /**
   * @description Fetch all templates
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.level - The level of the templates
   * @param props.projectId - The project id, required if the level is project
   */
  fetchAllTemplates = action(async (props: TFetchWorkItemTemplatesProps) => {
    const { workspaceSlug, level } = props;
    try {
      this.loader = "init-loader";
      // Use the correct service based on the level
      const listService =
        level === ETemplateLevel.PROJECT
          ? projectLevelService.list.bind(projectLevelService, workspaceSlug, props.projectId)
          : workspaceLevelService.list.bind(workspaceLevelService, workspaceSlug);
      // Fetch the templates
      const templates = await listService();
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
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.templateId - The template id
   * @param props.level - The level of the template
   * @param props.projectId - The project id, required if the level is project
   */
  fetchTemplateById = action(async (props: TFetchWorkItemTemplateByIdProps) => {
    const { workspaceSlug, templateId, level } = props;
    // if the template is already being fetched, return
    if (this.getTemplateFetchStatusById(templateId)) return;
    this.loader = "init-loader";
    try {
      // Use the correct service based on the level
      const retrieveService =
        level === ETemplateLevel.PROJECT
          ? projectLevelService.retrieve.bind(projectLevelService, workspaceSlug, props.projectId)
          : workspaceLevelService.retrieve.bind(workspaceLevelService, workspaceSlug);
      // Fetch the template
      const template = await retrieveService(templateId);
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
