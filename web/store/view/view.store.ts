import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// store
import { RootStore } from "store/root.store";
// types
import { TViewService } from "services/view/types";
import {
  TView,
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
  TViewFilterProps,
  TViewFilterPartialProps,
  TViewAccess,
} from "@plane/types";

type TLoader = "submitting" | "submit" | undefined;

export type TViewsStore = TView & {
  // observables
  loader: TLoader;
  filtersToUpdate: TViewFilterPartialProps;
  // computed
  appliedFilters: TViewFilterProps | undefined;
  appliedFiltersQueryParams: undefined;
  // helper actions
  updateFilters: (filters: Partial<TViewFilters>) => void;
  updateDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  updateDisplayProperties: (display_properties: Partial<TViewDisplayProperties>) => void;
  resetFilterChanges: () => void;
  saveFilterChanges: () => void;
  // actions
  lockView: () => Promise<void>;
  unlockView: () => Promise<void>;
  makeFavorite: () => Promise<void>;
  removeFavorite: () => Promise<void>;
  update: (viewData: Partial<TView>) => Promise<void>;
};

export class ViewsStore implements TViewsStore {
  id: string;
  workspace: string;
  project: string | undefined;
  name: string;
  description: string;
  query: string;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
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
  filtersToUpdate: TViewFilterPartialProps = {
    filters: {},
    display_filters: {},
    display_properties: {},
  };

  constructor(private store: RootStore, _view: TView, private service: TViewService) {
    this.id = _view.id;
    this.workspace = _view.workspace;
    this.project = _view.project;
    this.name = _view.name;
    this.description = _view.description;
    this.query = _view.query;
    this.filters = _view.filters;
    this.display_filters = _view.display_filters;
    this.display_properties = _view.display_properties;
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
    return undefined;
  }

  get appliedFiltersQueryParams() {
    return undefined;
  }

  // helper actions
  updateFilters = (filters: Partial<TViewFilters>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.filters = filters;
    });
  };

  updateDisplayFilters = async (display_filters: Partial<TViewDisplayFilters>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.display_filters = display_filters;
    });
  };

  updateDisplayProperties = async (display_properties: Partial<TViewDisplayProperties>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.display_properties = display_properties;
    });
  };

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

  saveFilterChanges = async () => {
    this.loader = "submitting";
    if (this.appliedFilters) await this.update(this.appliedFilters);
    this.loader = undefined;
  };

  // actions
  lockView = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.lock(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_locked = view.is_locked;
    });
  };

  unlockView = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.unlock(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_locked = view.is_locked;
    });
  };

  makeFavorite = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.makeFavorite(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_favorite = view.is_locked;
    });
  };

  removeFavorite = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.removeFavorite(workspaceSlug, this.id, projectId);
    if (!view) return;

    runInAction(() => {
      this.is_favorite = view.is_locked;
    });
  };

  update = async (viewData: Partial<TView>) => {
    try {
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
    } catch (error) {
      console.log(error);
    }
  };
}
