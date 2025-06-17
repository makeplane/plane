// plane imports
import { action, makeObservable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { projectTemplateService } from "@plane/services";
import { IBaseTemplateActionCallbacks, TProjectTemplate, ITemplateService } from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";
import {
  BaseTemplateStore,
  IBaseTemplateStore,
  TProjectTemplateInstanceProps,
  ProjectTemplateInstance,
} from "@/plane-web/store/templates";

type TBaseProjectTemplateProps = {
  workspaceSlug: string;
};

type TFetchProjectTemplatesProps = TBaseProjectTemplateProps;

type TFetchProjectTemplateByIdProps = TFetchProjectTemplatesProps & {
  templateId: string;
};

type TCreateProjectTemplateProps = TBaseProjectTemplateProps & {
  templateData: Partial<TProjectTemplate>;
};

export interface IProjectTemplateStore extends IBaseTemplateStore<TProjectTemplate> {
  // computed function
  isAnyProjectTemplatesAvailable: (workspaceSlug: string) => boolean;
  // actions
  fetchAllTemplates: (props: TFetchProjectTemplatesProps) => Promise<void>;
  fetchTemplateById: (props: TFetchProjectTemplateByIdProps) => Promise<void>;
  createProjectTemplate: (props: TCreateProjectTemplateProps) => Promise<TProjectTemplate | undefined>;
  deleteProjectTemplate: (workspaceSlug: string, templateId: string) => Promise<void>;
}

export class ProjectTemplateStore extends BaseTemplateStore<TProjectTemplate> implements IProjectTemplateStore {
  constructor(protected rootStore: RootStore) {
    super({
      root: rootStore,
      createTemplateInstance: (templateInstanceProps: TProjectTemplateInstanceProps) =>
        new ProjectTemplateInstance(templateInstanceProps),
    });

    makeObservable(this, {
      // observables
      fetchAllTemplates: action,
      fetchTemplateById: action,
      createProjectTemplate: action,
      deleteProjectTemplate: action,
    });
  }

  // computed functions
  /**
   * @description Check if any project templates are available
   * @param workspaceSlug - The slug of the workspace
   * @returns True if any project templates are available, false otherwise
   */
  isAnyProjectTemplatesAvailable = computedFn(
    (workspaceSlug: string) => this.getAllTemplates(workspaceSlug).length > 0
  );

  // helper actions
  private getProjectTemplateServices = computedFn(
    (props: TBaseProjectTemplateProps): ITemplateService<TProjectTemplate> => ({
      list: projectTemplateService.list.bind(projectTemplateService, props.workspaceSlug),
      retrieve: projectTemplateService.retrieve.bind(projectTemplateService, props.workspaceSlug),
      create: projectTemplateService.create.bind(projectTemplateService, props.workspaceSlug),
      update: projectTemplateService.update.bind(projectTemplateService, props.workspaceSlug),
      destroy: projectTemplateService.destroy.bind(projectTemplateService, props.workspaceSlug),
    })
  );

  // actions
  /**
   * @description Fetch all templates
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   */
  fetchAllTemplates = action(async (props: TFetchProjectTemplatesProps) => {
    try {
      this.loader = "init-loader";
      // Use the correct service based on the level
      const projectTemplateService = this.getProjectTemplateServices(props);
      // Fetch the templates
      const templates = await projectTemplateService.list();
      this.addOrUpdateTemplates(templates, (id, template) => projectTemplateService.update(id, template));
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("ProjectTemplateStore.fetchAllTemplates -> error", error);
      throw error;
    }
  });

  /**
   * @description Fetch a template by id
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.templateId - The template id
   */
  fetchTemplateById = action(async (props: TFetchProjectTemplateByIdProps) => {
    const { templateId } = props;
    // if the template is already being fetched, return
    if (this.getTemplateFetchStatusById(templateId)) return;
    this.loader = "init-loader";
    try {
      // Use the correct service based on the level
      const projectTemplateService = this.getProjectTemplateServices(props);
      // Fetch the template
      const template = await projectTemplateService.retrieve(templateId);
      this.addOrUpdateTemplates([template], (id, template) => projectTemplateService.update(id, template));
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      console.error("ProjectTemplateStore.fetchTemplateById -> error", error);
      throw error;
    }
  });

  /**
   * @description Create a project template
   * @param props - The props
   * @param props.workspaceSlug - The workspace slug
   * @param props.templateData - The template data
   */
  createProjectTemplate = action(async (props: TCreateProjectTemplateProps) => {
    const { templateData } = props;
    // Use the correct service based on the level and create the create and update action callbacks
    const projectTemplateService = this.getProjectTemplateServices(props);
    const createUpdateActionCallbacks: Pick<IBaseTemplateActionCallbacks<TProjectTemplate>, "create" | "update"> = {
      create: projectTemplateService.create,
      update: projectTemplateService.update,
    };
    // create the template
    return this.createTemplate(templateData, createUpdateActionCallbacks);
  });

  /**
   * @description Delete a project template
   * @param workspaceSlug - The workspace slug
   * @param templateId - The template id
   */
  deleteProjectTemplate = action(async (workspaceSlug: string, templateId: string) => {
    this.deleteTemplate(templateId, (template) => {
      const deleteService = this.getProjectTemplateServices({
        workspaceSlug,
      }).destroy;
      return deleteService(template.id);
    });
  });
}
