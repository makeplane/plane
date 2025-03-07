import set from "lodash/set";
import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { IBaseTemplateActionCallbacks, TBaseTemplate, TBaseTemplateWithData } from "@plane/types";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";

export type TBaseTemplateInstanceProps<T extends TBaseTemplateWithData> = {
  root: RootStore;
  updateActionCallback: IBaseTemplateActionCallbacks<T>["update"];
  baseTemplateData: T;
};

export interface IBaseTemplateInstance<T extends TBaseTemplateWithData>
  extends TBaseTemplate<T["template_type"], T["template_data"]> {
  // computed
  asJSON: T;
  // helper actions
  updateInstance: (templateData: Partial<T>) => void;
  // actions
  update: (templateData: Partial<T>) => Promise<void>;
}

export abstract class BaseTemplateInstance<T extends TBaseTemplateWithData> implements IBaseTemplateInstance<T> {
  // properties
  id: T["id"];
  name: T["name"];
  description_html: T["description_html"];
  template_type: T["template_type"];
  template_data: T["template_data"];
  workspace: T["workspace"];
  project: T["project"];
  created_at: T["created_at"];
  updated_at: T["updated_at"];

  // root store
  protected rootStore: TBaseTemplateInstanceProps<T>["root"];

  // service
  protected updateActionCallback: TBaseTemplateInstanceProps<T>["updateActionCallback"];

  constructor(protected store: TBaseTemplateInstanceProps<T>) {
    const { root, updateActionCallback, baseTemplateData } = store;

    // properties
    this.id = baseTemplateData.id;
    this.name = baseTemplateData.name;
    this.description_html = baseTemplateData.description_html;
    this.template_type = baseTemplateData.template_type;
    this.template_data = baseTemplateData.template_data;
    this.workspace = baseTemplateData.workspace;
    this.project = baseTemplateData.project;
    this.created_at = baseTemplateData.created_at;
    this.updated_at = baseTemplateData.updated_at;

    // root store
    this.rootStore = root;

    // service
    this.updateActionCallback = updateActionCallback;

    makeObservable(this, {
      // observables
      id: observable.ref,
      name: observable.ref,
      description_html: observable.ref,
      template_type: observable.ref,
      template_data: observable,
      workspace: observable.ref,
      project: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // actions
      updateInstance: action,
      update: action,
    });
  }

  // computed
  /**
   * @description Returns the template as JSON
   */
  get asJSON(): T {
    const baseObject = {
      id: this.id,
      name: this.name,
      description_html: this.description_html,
      template_type: this.template_type,
      template_data: this.template_data,
      workspace: this.workspace,
      project: this.project,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
    // always make sure that all the fields are present in the base object
    // return the base object as the type T
    return baseObject as T;
  }

  // helper actions
  /**
   * @description Update template instance
   * @param templateData Template data
   */
  updateInstance = action((templateData: Partial<T>): void => {
    if (!this.id) return;
    runInAction(() => {
      for (const key in templateData) {
        if (templateData.hasOwnProperty(key)) {
          const templateKey = key as keyof T;
          set(this, templateKey, templateData[templateKey]);
        }
      }
    });
  });

  // actions
  /**
   * @description Updates the template on the server and updates the instance
   * @param workspaceSlug Workspace slug
   * @param templateData Template data
   */
  update = action(async (templateData: Partial<T>): Promise<void> => {
    if (!this.id) return;

    try {
      const updatedTemplate = await this.updateActionCallback(this.id, templateData);
      this.updateInstance(updatedTemplate);
    } catch (error) {
      console.error("BaseTemplateInstance.update -> error", error);
      throw error;
    }
  });
}
