// plane imports
import { action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { ETemplateLevel } from "@plane/constants";
import {
  workspacePageTemplateService as workspaceLevelService,
  projectPageTemplateService as projectLevelService,
} from "@plane/services";
import { IBaseTemplateActionCallbacks, ITemplateService, TPageTemplate } from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
import { BaseTemplateStore, IBaseTemplateInstance, IBaseTemplateStore } from "@/plane-web/store/templates";
import { PageTemplateInstance, TPageTemplateInstanceProps } from "../instance/page";

type TBasePageTemplateProps = {
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

type TFetchPageTemplatesProps = TBasePageTemplateProps;

type TFetchPageTemplateByIdProps = TFetchPageTemplatesProps & {
  templateId: string;
};

type TCreatePageTemplateProps = TBasePageTemplateProps & {
  templateData: Partial<TPageTemplate>;
};

export interface IPageTemplateStore extends IBaseTemplateStore<TPageTemplate> {
  // computed function
  getAllPageTemplatesForProject: (workspaceSlug: string, projectId: string) => IBaseTemplateInstance<TPageTemplate>[];
  getAllPageTemplateIdsForProject: (workspaceSlug: string, projectId: string) => string[];
  isAnyPageTemplatesAvailable: (workspaceSlug: string) => boolean;
  isAnyPageTemplatesAvailableForProject: (workspaceSlug: string, projectId: string) => boolean;
  // actions
  fetchAllTemplates: (props: TFetchPageTemplatesProps) => Promise<void>;
  fetchTemplateById: (props: TFetchPageTemplateByIdProps) => Promise<void>;
  createPageTemplate: (props: TCreatePageTemplateProps) => Promise<TPageTemplate | undefined>;
  deletePageTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
}

export class PageTemplateStore extends BaseTemplateStore<TPageTemplate> implements IPageTemplateStore {
  constructor(protected rootStore: RootStore) {
    super({
      root: rootStore,
      createTemplateInstance: (templateInstanceProps: TPageTemplateInstanceProps) =>
        new PageTemplateInstance(templateInstanceProps),
    });

    makeObservable(this, {
      // observables
      fetchAllTemplates: action,
      fetchTemplateById: action,
      createPageTemplate: action,
      deletePageTemplate: action,
    });
  }

  // computed functions
  /**
   * @description Get all page templates for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All page templates for a project
   */
  getAllPageTemplatesForProject = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllTemplates(workspaceSlug).filter((template) => template.template_data.project === projectId)
  );

  /**
   * @description Get all page template ids for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns All page template ids for a project
   */
  getAllPageTemplateIdsForProject = computedFn((workspaceSlug: string, projectId: string) =>
    this.getAllPageTemplatesForProject(workspaceSlug, projectId).map((template) => template.id)
  );

  /**
   * @description Check if any page templates are available
   * @param workspaceSlug - The slug of the workspace
   * @returns True if any page templates are available, false otherwise
   */
  isAnyPageTemplatesAvailable = computedFn((workspaceSlug: string) => this.getAllTemplates(workspaceSlug).length > 0);

  /**
   * @description Check if any page templates are available for a project
   * @param workspaceSlug - The slug of the workspace
   * @param projectId - The id of the project
   * @returns True if any page templates are available for a project, false otherwise
   */
  isAnyPageTemplatesAvailableForProject = computedFn(
    (workspaceSlug: string, projectId: string) =>
      this.getAllPageTemplatesForProject(workspaceSlug, projectId).length > 0
  );

  // helper actions
  private getPageTemplateServices = computedFn(
    (props: TBasePageTemplateProps): ITemplateService<TPageTemplate> => ({
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

  // actions
  /**
   * @description Fetch all templates
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.level - The level of the templates
   * @param props.projectId - The project id, required if the level is project
   */
  fetchAllTemplates = action(async (props: TFetchPageTemplatesProps) => {
    try {
      this.loader = "init-loader";
      // Use the correct service based on the level
      const pageTemplateService = this.getPageTemplateServices(props);
      // Fetch the templates
      const templates = await pageTemplateService.list();
      this.addOrUpdateTemplates(templates, (id, template) => {
        // Use the correct service based on the level
        const updateService = this.getPageTemplateServices({
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
      console.error("PageTemplateStore.fetchAllTemplates -> error", error);
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
  fetchTemplateById = action(async (props: TFetchPageTemplateByIdProps) => {
    const { templateId } = props;
    // if the template is already being fetched, return
    if (this.getTemplateFetchStatusById(templateId)) return;
    this.loader = "init-loader";
    try {
      // Use the correct service based on the level
      const retrieveService = this.getPageTemplateServices(props).retrieve;
      // Fetch the template
      const template = await retrieveService(templateId);
      this.addOrUpdateTemplates([template], (id, template) => {
        // Use the correct service based on the level
        const updateService = this.getPageTemplateServices({
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
      console.error("PageTemplateStore.fetchTemplateById -> error", error);
      throw error;
    }
  });

  /**
   * @description Create a page template
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.templateData - The template data
   * @param props.level - The level of the template
   * @param props.projectId - The project id, required if the level is project
   */
  createPageTemplate = action(async (props: TCreatePageTemplateProps) => {
    const { templateData } = props;
    // Use the correct service based on the level and create the create and update action callbacks
    const pageTemplateService = this.getPageTemplateServices(props);
    const createUpdateActionCallbacks: Pick<IBaseTemplateActionCallbacks<TPageTemplate>, "create" | "update"> = {
      create: pageTemplateService.create,
      update: pageTemplateService.update,
    };
    // create the template
    return this.createTemplate(templateData, createUpdateActionCallbacks);
  });

  /**
   * @description Delete a page template
   * @param workspaceSlug - The workspace slug
   * @param templateId - The template id
   */
  deletePageTemplate = action(async (workspaceSlug: string, templateId: string) => {
    this.deleteTemplate(templateId, (template) => {
      const deleteService = this.getPageTemplateServices({
        workspaceSlug,
        ...(template.project
          ? { level: ETemplateLevel.PROJECT, projectId: template.project }
          : { level: ETemplateLevel.WORKSPACE }),
      }).destroy;
      return deleteService(template.id);
    });
  });
}
