import { orderBy } from "lodash";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { TEMPLATE_KEYWORDS } from "@plane/constants";
import { TemplateHelperService } from "@plane/services";
import { TTemplateCategory, TTemplateKeywords } from "@plane/types";
// plane web imports
import { RootStore } from "@/plane-web/store/root.store";

export interface ITemplateHelperStore {
  // observables
  templateCategories: Record<string, TTemplateCategory>;
  // computed
  sortedTemplateCategories: TTemplateCategory[];
  // computed functions
  getIsTemplatePublishEnabled: (workspaceSlug: string) => boolean;
  getTemplateCategoryById: (id: string) => TTemplateCategory | undefined;
  getTemplateKeywords: () => readonly TTemplateKeywords[];
  // actions
  fetchTemplateCategories: () => Promise<void>;
}

/**
 * Store for managing template helper functions that are common across all template types
 * @extends {BaseStore}
 */
export class TemplateHelperStore implements ITemplateHelperStore {
  // observables
  templateCategories: ITemplateHelperStore["templateCategories"] = {};
  // root store
  private rootStore: RootStore;
  // services
  private templateCategoryService: TemplateHelperService;
  // constructor
  constructor(rootStore: RootStore) {
    // properties
    this.templateCategories = {};
    // root store
    this.rootStore = rootStore;
    // services
    this.templateCategoryService = new TemplateHelperService();

    makeObservable(this, {
      // observables
      templateCategories: observable,
      // computed
      sortedTemplateCategories: computed,
      // actions
      fetchTemplateCategories: action,
    });
  }

  // computed
  get sortedTemplateCategories() {
    return orderBy(Object.values(this.templateCategories), ["created_at"], ["desc"]);
  }

  // computed functions
  /**
   * @description Get the is template publish enabled flag for a workspace
   * @param workspaceSlug - The slug of the workspace
   * @returns True, if any of the template publish flags are enabled for the workspace
   */
  getIsTemplatePublishEnabled = computedFn((workspaceSlug: string) => {
    const isProjectTemplatePublishEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      "PROJECT_TEMPLATES_PUBLISH",
      false
    );
    return isProjectTemplatePublishEnabled;
  });

  /**
   * @description Get a template category by id
   * @param id - The id of the template category
   * @returns The template category
   */
  getTemplateCategoryById = computedFn((id: string) => this.templateCategories[id]);

  /**
   * @description Get all template keywords
   * @returns The template keywords
   */
  getTemplateKeywords = computedFn(() => TEMPLATE_KEYWORDS);

  // actions
  /**
   * @description Fetch template categories for a workspace
   * @param workspaceSlug - The slug of the workspace
   */
  fetchTemplateCategories = action(async () => {
    try {
      const templateCategories = await this.templateCategoryService.listCategories();
      runInAction(() => {
        for (const templateCategory of templateCategories) {
          set(this.templateCategories, templateCategory.id, templateCategory);
        }
      });
    } catch (error) {
      console.error("TemplateHelperStore.fetchTemplateCategories -> error", error);
      throw error;
    }
  });
}
