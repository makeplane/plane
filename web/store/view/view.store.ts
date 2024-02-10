import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import update from "lodash/update";
import concat from "lodash/concat";
import pull from "lodash/pull";
import isEqual from "lodash/isEqual";
// store
import { RootStore } from "store/root.store";
// types
import { TUserViewService, TViewService } from "services/view/types";
import {
  TView,
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
  TViewFilterProps,
  TViewAccess,
} from "@plane/types";
// helpers
import { FiltersHelper } from "./helpers/filters_helpers";

type TLoader = "filters_submit" | "filters_submitting" | "update" | "updating" | undefined;

export type TViewStore = TView & {
  // observables
  loader: TLoader;
  filtersToUpdate: Partial<TView>;
  // computed
  appliedFilters: TViewFilterProps | undefined;
  appliedFiltersQueryParams: string | undefined;
  isFiltersApplied: boolean;
  isFiltersUpdateEnabled: boolean;
  // helper actions
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setFilters: (filterKey: keyof TViewFilters | undefined, filterValue: "clear_all" | string) => void;
  setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  setDisplayProperties: (displayPropertyKey: keyof TViewDisplayProperties) => void;
  resetChanges: () => void;
  saveChanges: () => Promise<void>;
  // actions
  update: (viewData: Partial<TView>) => Promise<void>;
  lockView: () => Promise<void>;
  unlockView: () => Promise<void>;
  makeFavorite: () => Promise<void>;
  removeFavorite: () => Promise<void>;
};

export class ViewStore extends FiltersHelper implements TViewStore {
  id: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  name: string | undefined;
  description: string | undefined;
  query: string | undefined;
  filters: TViewFilters;
  display_filters: TViewDisplayFilters;
  display_properties: TViewDisplayProperties;
  access: TViewAccess | undefined;
  owned_by: string | undefined;
  sort_order: number | undefined;
  is_locked: boolean = false;
  is_pinned: boolean = false;
  is_favorite: boolean = false;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  is_local_view: boolean = false;
  is_create: boolean = false;
  is_editable: boolean = false;
  loader: TLoader = undefined;
  filtersToUpdate: Partial<TView> = {
    name: "",
    description: "",
    filters: undefined,
    display_filters: undefined,
    display_properties: undefined,
  };

  constructor(
    private store: RootStore,
    _view: TView,
    private service: TViewService,
    private userService: TUserViewService
  ) {
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
    this.is_local_view = _view.is_local_view;
    this.is_create = _view.is_create;
    this.is_editable = _view.is_editable;
    this.filtersToUpdate = {
      filters: this.computedFilters(_view.filters),
      display_filters: this.computedDisplayFilters(_view.display_filters),
      display_properties: this.computedDisplayProperties(_view.display_properties),
    };

    makeObservable(this, {
      // observables
      id: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      name: observable.ref,
      description: observable.ref,
      query: observable.ref,
      filters: observable,
      display_filters: observable,
      display_properties: observable,
      access: observable.ref,
      owned_by: observable.ref,
      sort_order: observable.ref,
      is_locked: observable.ref,
      is_pinned: observable.ref,
      is_favorite: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      is_local_view: observable.ref,
      is_create: observable.ref,
      is_editable: observable.ref,
      loader: observable.ref,
      filtersToUpdate: observable,
      // computed
      appliedFilters: computed,
      appliedFiltersQueryParams: computed,
      isFiltersApplied: computed,
      isFiltersUpdateEnabled: computed,
      // helper actions
      setName: action,
      setFilters: action,
      setDisplayFilters: action,
      setDisplayProperties: action,
      resetChanges: action,
      saveChanges: action,
      // actions
      update: action,
      lockView: action,
      unlockView: action,
      makeFavorite: action,
      removeFavorite: action,
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
    if (!filters) return undefined;
    return this.computeAppliedFiltersQueryParameters(filters, [])?.query || undefined;
  }

  get isFiltersApplied() {
    const filters = this.appliedFilters?.filters;
    let isFiltersApplied = false;
    Object.keys(filters).forEach((key) => {
      const _key = key as keyof TViewFilters;
      if (filters[_key]?.length > 0) isFiltersApplied = true;
    });
    return isFiltersApplied;
  }

  get isFiltersUpdateEnabled() {
    const filters = this.filters;
    const appliedFilters = this.appliedFilters?.filters;
    let isFiltersUpdateEnabled = false;
    Object.keys(appliedFilters).forEach((key) => {
      const _key = key as keyof TViewFilters;
      if (!isEqual(appliedFilters[_key].slice().sort(), filters[_key].slice().sort())) isFiltersUpdateEnabled = true;
    });
    return isFiltersUpdateEnabled;
  }

  // helper actions
  setName = (name: string) => {
    runInAction(() => {
      this.filtersToUpdate.name = name;
    });
  };

  setDescription = (description: string) => {
    runInAction(() => {
      this.filtersToUpdate.description = description;
    });
  };

  setFilters = (filterKey: keyof TViewFilters | undefined = undefined, filterValue: "clear_all" | string) => {
    runInAction(() => {
      if (filterKey === undefined) {
        if (filterValue === "clear_all") set(this.filtersToUpdate, ["filters"], {});
      } else
        update(this.filtersToUpdate, ["filters", filterKey], (_values = []) => {
          if (filterValue === "clear_all") return [];
          if (_values.includes(filterValue)) return pull(_values, filterValue);
          return concat(_values, filterValue);
        });
    });
  };

  setDisplayFilters = async (display_filters: Partial<TViewDisplayFilters>) => {
    const appliedFilters = this.appliedFilters;

    const layout = appliedFilters?.display_filters?.layout;
    const sub_group_by = appliedFilters?.display_filters?.sub_group_by;
    const group_by = appliedFilters?.display_filters?.group_by;
    const sub_issue = appliedFilters?.display_filters?.sub_issue;

    if (group_by === undefined && display_filters.sub_group_by) display_filters.sub_group_by = undefined;
    if (layout === "kanban") {
      if (sub_group_by === group_by) display_filters.group_by = undefined;
      if (group_by === null) display_filters.group_by = "state";
    }
    if (layout === "spreadsheet" && sub_issue === true) display_filters.sub_issue = false;

    runInAction(() => {
      Object.keys(display_filters).forEach((key) => {
        const _key = key as keyof TViewDisplayFilters;
        set(this.filtersToUpdate, ["display_filters", _key], display_filters[_key]);
      });
    });
  };

  setDisplayProperties = async (displayPropertyKey: keyof TViewDisplayProperties) => {
    runInAction(() => {
      update(this.filtersToUpdate, ["display_properties", displayPropertyKey], (_value: boolean = true) => !_value);
    });
  };

  resetChanges = () => {
    runInAction(() => {
      this.filtersToUpdate = {
        name: this.name,
        description: this.description,
        filters: this.filters,
        display_filters: this.display_filters,
        display_properties: this.display_properties,
      };
    });
  };

  saveChanges = async () => {
    try {
      if (this.filtersToUpdate) await this.update(this.filtersToUpdate);
    } catch {
      Object.keys(this.filtersToUpdate).forEach((key) => {
        const _key = key as keyof TView;
        set(this, _key, this.filtersToUpdate[_key]);
      });
    }
  };

  // actions
  update = async (viewData: Partial<TView>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.id) return;

      const view = await this.service.update(workspaceSlug, this.id, viewData, projectId);
      if (!view) return;

      runInAction(() => {
        Object.keys(viewData).forEach((key) => {
          const _key = key as keyof TView;
          set(this, _key, viewData[_key]);
        });
      });
    } catch {
      this.resetChanges();
    }
  };

  lockView = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.id || !this.service.lock) return;

      const view = await this.service.lock(workspaceSlug, this.id, projectId);
      if (!view) return;

      runInAction(() => {
        this.is_locked = view.is_locked;
      });
    } catch {
      this.is_locked = this.is_locked;
    }
  };

  unlockView = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.id || !this.service.unlock) return;

      const view = await this.service.unlock(workspaceSlug, this.id, projectId);
      if (!view) return;

      runInAction(() => {
        this.is_locked = view.is_locked;
      });
    } catch {
      this.is_locked = this.is_locked;
    }
  };

  makeFavorite = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.id || !this.service.makeFavorite) return;

      const view = await this.service.makeFavorite(workspaceSlug, this.id, projectId);
      if (!view) return;

      runInAction(() => {
        this.is_favorite = view.is_locked;
      });
    } catch {
      this.is_favorite = this.is_favorite;
    }
  };

  removeFavorite = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.id || !this.service.removeFavorite) return;

      const view = await this.service.removeFavorite(workspaceSlug, this.id, projectId);
      if (!view) return;

      runInAction(() => {
        this.is_favorite = view.is_locked;
      });
    } catch {
      this.is_favorite = this.is_favorite;
    }
  };
}
