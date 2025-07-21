// plane imports
import { action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import {
  workspaceWorkItemTemplateService as workspaceLevelService,
  projectWorkItemTemplateService as projectLevelService,
} from "@plane/services";
import { IBaseTemplateActionCallbacks, TWorkItemTemplate, ITemplateService } from "@plane/types";
import { buildWorkItemTypeBlueprint, isValidId } from "@plane/utils";
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
  isAnyWorkItemTemplatesAvailable: (workspaceSlug: string) => boolean;
  isAnyWorkItemTemplatesAvailableForProject: (workspaceSlug: string, projectId: string) => boolean;
  // helper actions
  updateWorkItemTemplatesWithDefaultType: (workspaceSlug: string, projectId: string) => void;
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
      fetchTemplateById: action,
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

  /**
   * @description Check if any work item templates are available
   * @param workspaceSlug - The slug of the workspace
   * @returns True if any work item templates are available, false otherwise
   */
  isAnyWorkItemTemplatesAvailable = computedFn(
    (workspaceSlug: string) => this.getAllWorkItemTemplates(workspaceSlug).length > 0
  );

  /**
   * @description Check if any work item templates are available for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns True if any work item templates are available for a project, false otherwise
   */
  isAnyWorkItemTemplatesAvailableForProject = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.getAllWorkItemTemplatesForProject(workspaceSlug, projectId).length > 0
  );

  // helper actions
  private getWorkItemTemplateServices = computedFn(
    (props: TBaseWorkItemTemplateProps): ITemplateService<TWorkItemTemplate> => ({
      list:
        props.level === ETemplateLevel.PROJECT
          ? projectLevelService.list.bind(projectLevelService, props.workspaceSlug, props.projectId)
          : workspaceLevelService.list.bind(workspaceLevelService, props.workspaceSlug),
      retrieve:
        props.level === ETemplateLevel.PROJECT
          ? projectLevelService.retrieve.bind(projectLevelService, props.workspaceSlug, props.projectId)
          : workspaceLevelService.retrieve.bind(workspaceLevelService, props.workspaceSlug),
      create:
        props.level === ETemplateLevel.PROJECT
          ? projectLevelService.create.bind(projectLevelService, props.workspaceSlug, props.projectId)
          : workspaceLevelService.create.bind(workspaceLevelService, props.workspaceSlug),
      update:
        props.level === ETemplateLevel.PROJECT
          ? projectLevelService.update.bind(projectLevelService, props.workspaceSlug, props.projectId)
          : workspaceLevelService.update.bind(workspaceLevelService, props.workspaceSlug),
      destroy:
        props.level === ETemplateLevel.PROJECT
          ? projectLevelService.destroy.bind(projectLevelService, props.workspaceSlug, props.projectId)
          : workspaceLevelService.destroy.bind(workspaceLevelService, props.workspaceSlug),
    })
  );

  /**
   * @description Update work item templates with default type
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   */
  updateWorkItemTemplatesWithDefaultType = action((workspaceSlug: string, projectId: string) => {
    const defaultWorkItemType = this.rootStore.issueTypes.getProjectDefaultWorkItemTypeId(projectId);
    if (!defaultWorkItemType) return;

    const currentProjectWorkItemTemplates = this.getAllWorkItemTemplatesForProject(workspaceSlug, projectId);
    if (currentProjectWorkItemTemplates.length === 0) return;

    const defaultTypeBlueprint = buildWorkItemTypeBlueprint(defaultWorkItemType, this.rootStore.issueTypes.getIssueTypeById);

    for (const template of currentProjectWorkItemTemplates) {
      const templateData = template.template_data;
      const hasMainType = Boolean(templateData.type?.id);
      const subWorkitemsNeedingType = templateData.sub_workitems?.filter((subWorkitem) => !subWorkitem.type?.id) || [];

      if (!hasMainType || subWorkitemsNeedingType.length > 0) {
        const updatedTemplateData = {
          ...templateData,
          type: hasMainType ? templateData.type : defaultTypeBlueprint,
          sub_workitems:
            templateData.sub_workitems?.map((subWorkitem) => ({
              ...subWorkitem,
              type: subWorkitem.type?.id ? subWorkitem.type : defaultTypeBlueprint,
            })) || [],
        };

        template.mutateInstance({ template_data: updatedTemplateData });
      }
    }
  });

  // actions
  /**
   * @description Fetch all templates
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.level - The level of the templates
   * @param props.projectId - The project id, required if the level is project
   */
  fetchAllTemplates = action(async (props: TFetchWorkItemTemplatesProps) => {
    try {
      this.loader = "init-loader";
      // Use the correct service based on the level
      const workItemTemplateService = this.getWorkItemTemplateServices(props);
      // Fetch the templates
      const templates = await workItemTemplateService.list();
      this.addOrUpdateTemplates(templates, (id, template) => {
        // Use the correct service based on the level
        const updateService = this.getWorkItemTemplateServices({
          workspaceSlug: props.workspaceSlug,
          ...(template.project
            ? { level: ETemplateLevel.PROJECT, projectId: template.project }
            : { level: ETemplateLevel.WORKSPACE }),
        }).update;
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
    const { templateId } = props;
    // if the template is already being fetched, return
    if (this.getTemplateFetchStatusById(templateId)) return;
    this.loader = "init-loader";
    try {
      // Use the correct service based on the level
      const retrieveService = this.getWorkItemTemplateServices(props).retrieve;
      // Fetch the template
      const template = await retrieveService(templateId);
      this.addOrUpdateTemplates([template], (id, template) => {
        // Use the correct service based on the level
        const updateService = this.getWorkItemTemplateServices({
          workspaceSlug: props.workspaceSlug,
          ...(template.project
            ? { level: ETemplateLevel.PROJECT, projectId: template.project }
            : { level: ETemplateLevel.WORKSPACE }),
        }).update;
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
    const { templateData } = props;
    // Use the correct service based on the level and create the create and update action callbacks
    const workItemTemplateService = this.getWorkItemTemplateServices(props);
    const createUpdateActionCallbacks: Pick<IBaseTemplateActionCallbacks<TWorkItemTemplate>, "create" | "update"> = {
      create: workItemTemplateService.create,
      update: workItemTemplateService.update,
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
      const deleteService = this.getWorkItemTemplateServices({
        workspaceSlug,
        ...(template.project
          ? { level: ETemplateLevel.PROJECT, projectId: template.project }
          : { level: ETemplateLevel.WORKSPACE }),
      }).destroy;
      return deleteService(template.id);
    });
  });
}
