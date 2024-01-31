import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// store
import { RootStore } from "store/root.store";
// types
import { TViewService } from "services/view/types";
import {
  TView,
  TFilters,
  TDisplayFilters,
  TDisplayProperties,
  TFilterProps,
  TFilterPartialProps,
  TViewAccess,
} from "@plane/types";
// helpers
import { FiltersHelper } from "./filters_helpers";

type TLoader = "submitting" | "submit" | undefined;

export type TViewsStore = TView & {
  // observables
  loader: TLoader;
  filtersToUpdate: TFilterPartialProps;
  // computed
  appliedFilters: TFilterProps | undefined;
  appliedFiltersQueryParams: string | undefined;
  // helper actions
  updateFilters: (filters: Partial<TFilters>) => void;
  updateDisplayFilters: (display_filters: Partial<TDisplayFilters>) => void;
  updateDisplayProperties: (display_properties: Partial<TDisplayProperties>) => void;
  resetFilterChanges: () => void;
  saveFilterChanges: () => void;
  // actions
  lockView: () => Promise<void>;
  unlockView: () => Promise<void>;
  makeFavorite: () => Promise<void>;
  removeFavorite: () => Promise<void>;
  update: (viewData: Partial<TView>) => Promise<void>;
};

export class ViewsStore extends FiltersHelper implements TViewsStore {
  id: string;
  workspace: string;
  project: string | undefined;
  name: string;
  description: string;
  query: string;
  filters: TFilters;
  display_filters: TDisplayFilters;
  display_properties: TDisplayProperties;
  access: TViewAccess;
  owned_by: string;
  sort_order: number;
  is_locked: boolean;
  is_pinned: boolean;
  is_favorite: boolean;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;

  loader: TLoader = undefined;
  filtersToUpdate: TFilterPartialProps = {
    filters: {},
    display_filters: {},
    display_properties: {},
  };

  constructor(private store: RootStore, _view: TView, private service: TViewService) {
    super();
    this.id = _view.id;
    this.workspace = _view.workspace;
    this.project = _view.project;
    this.name = _view.name;
    this.description = _view.description;
    this.query = _view.query;
    this.filters = this.computedFilters(_view.filters);
    this.display_filters = this.computedDisplayFilters(_view.display_filters);
    this.display_properties = this.computedDisplayProperties(_view.display_properties);
    this.access = _view.access;
    this.owned_by = _view.owned_by;
    this.sort_order = _view.sort_order;
    this.is_locked = _view.is_locked;
    this.is_pinned = _view.is_pinned;
    this.is_favorite = _view.is_favorite;
    this.created_by = _view.created_by;
    this.updated_by = _view.updated_by;
    this.created_at = _view.created_at;
    this.updated_at = _view.updated_at;

    makeObservable(this, {
      // observables
      loader: observable,
      filtersToUpdate: observable.ref,
      // computed
      appliedFilters: computed,
      appliedFiltersQueryParams: computed,
      // helper actions
      updateFilters: action,
      updateDisplayFilters: action,
      updateDisplayProperties: action,
      resetFilterChanges: action,
      saveFilterChanges: action,
      // actions
      update: action,
      lockView: action,
      unlockView: action,
    });
  }

  // computed
  get appliedFilters() {
    return {
      filters: this.computedFilters(this.filters, this.filtersToUpdate.filters),
      display_filters: this.computedDisplayFilters(this.display_filters, this.filtersToUpdate.display_filters),
      display_properties: this.computedDisplayProperties(
        this.display_properties,
        this.filtersToUpdate.display_properties
      ),
    };
  }

  get appliedFiltersQueryParams() {
    const filters = this.appliedFilters;
    return this.computeAppliedFiltersQueryParameters(filters, [])?.query || undefined;
  }

  // helper actions
  /**
   * @description This method is used to update the filters of the view
   * @param filters: Partial<TFilters>
   */
  updateFilters = (filters: Partial<TFilters>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.filters = filters;
    });
  };

  /**
   * @description This method is used to update the display filters of the view
   * @param display_filters: Partial<TDisplayFilters>
   */
  updateDisplayFilters = async (display_filters: Partial<TDisplayFilters>) => {
    const appliedFilters = this.appliedFilters;

    const layout = appliedFilters.display_filters.layout;
    const sub_group_by = appliedFilters.display_filters.sub_group_by;
    const group_by = appliedFilters.display_filters.group_by;
    const sub_issue = appliedFilters.display_filters.sub_issue;

    if (group_by === undefined) display_filters.sub_group_by = undefined;

    if (layout === "kanban") {
      if (sub_group_by === group_by) display_filters.group_by = undefined;
      if (group_by === null) display_filters.group_by = "state";
    }

    if (layout === "spreadsheet" && sub_issue === true) display_filters.sub_issue = false;

    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.display_filters = display_filters;
    });
  };

  /**
   * @description This method is used to update the display properties of the view
   * @param display_properties: Partial<TDisplayProperties>
   */
  updateDisplayProperties = async (display_properties: Partial<TDisplayProperties>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.display_properties = display_properties;
    });
  };

  /**
   * @description This method is used to reset the changes made to the filters
   */
  resetFilterChanges = () => {
    runInAction(() => {
      this.loader = undefined;
      this.filtersToUpdate = {
        filters: {},
        display_filters: {},
        display_properties: {},
      };
    });
  };

  /**
   * @description This method is used to save the changes made to the filters
   */
  saveFilterChanges = async () => {
    this.loader = "submitting";
    if (this.appliedFilters) await this.update(this.appliedFilters);
    this.loader = undefined;
  };

  // actions
  /**
   * @description This method is used to update the view lock
   * @returns
   */
  lockView = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.lock(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_locked = view.is_locked;
    });
  };

  /**
   * @description This method is used to remove the view lock
   * @returns
   */
  unlockView = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.unlock(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_locked = view.is_locked;
    });
  };

  /**
   * @description This method is used to update the view favorite
   * @returns
   */
  makeFavorite = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.makeFavorite(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_favorite = view.is_locked;
    });
  };

  /**
   * @description This method is used to remove the view favorite
   * @returns
   */
  removeFavorite = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.removeFavorite(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_favorite = view.is_locked;
    });
  };

  /**
   * @description This method is used to update the view
   * @param viewData
   */
  update = async (viewData: Partial<TView>) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.update(workspaceSlug, this.id, viewData, projectId);
    if (!view) return;

    runInAction(() => {
      Object.keys(viewData).forEach((key) => {
        const _key = key as keyof TView;
        set(this, _key, viewData[_key]);
      });
    });
  };
}
