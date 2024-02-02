import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// types
import { TUserViewService } from "services/view/types";
import {
  TUserView,
  TViewFilters,
  TViewDisplayFilters,
  TViewDisplayProperties,
  TViewFilterProps,
  TViewFilterPartialProps,
} from "@plane/types";
// helpers
import { FiltersHelper } from "../helpers/filters_helpers";

type TLoader = "submitting" | "submit" | undefined;

export type TUserViewStore = TUserView & {
  // observables
  loader: TLoader;
  filtersToUpdate: TViewFilterPartialProps;
  // computed
  appliedFilters: TViewFilterProps | undefined;
  appliedFiltersQueryParams: string | undefined;
  // helper actions
  updateFilters: (filters: Partial<TViewFilters>) => void;
  updateDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) => void;
  updateDisplayProperties: (display_properties: Partial<TViewDisplayProperties>) => void;
  resetFilterChanges: () => void;
  saveFilterChanges: () => void;
  // actions
  update: (viewData: Partial<TUserView>) => Promise<void>;
};

export class UserViewStore extends FiltersHelper implements TUserViewStore {
  id: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  module: string | undefined;
  cycle: string | undefined;
  filters: TViewFilters | undefined;
  display_filters: TViewDisplayFilters | undefined;
  display_properties: TViewDisplayProperties | undefined;
  user: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;

  loader: TLoader = undefined;
  filtersToUpdate: TViewFilterPartialProps = {
    filters: {},
    display_filters: {},
    display_properties: {},
  };

  constructor(
    _view: TUserView,
    private service: TUserViewService,
    private workspaceSlug: string,
    private projectId: string | undefined,
    private featureId: string | undefined // moduleId/cycleId
  ) {
    super();
    this.id = _view.id;
    this.workspace = _view.workspace;
    this.project = _view.project;
    this.filters = _view.filters ? this.computedFilters(_view.filters) : undefined;
    this.display_filters = _view.display_filters ? this.computedDisplayFilters(_view.display_filters) : undefined;
    this.display_properties = _view.display_properties
      ? this.computedDisplayProperties(_view.display_properties)
      : undefined;
    this.user = _view.user;
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
    });
  }

  // computed
  get appliedFilters() {
    return {
      filters: this.filters ? this.computedFilters(this.filters, this.filtersToUpdate.filters) : undefined,
      display_filters: this.display_filters
        ? this.computedDisplayFilters(this.display_filters, this.filtersToUpdate.display_filters)
        : undefined,
      display_properties: this.display_properties
        ? this.computedDisplayProperties(this.display_properties, this.filtersToUpdate.display_properties)
        : undefined,
    };
  }

  get appliedFiltersQueryParams() {
    const filters = this.appliedFilters;
    if (!filters) return undefined;
    return this.computeAppliedFiltersQueryParameters(filters, [])?.query || undefined;
  }

  // helper actions
  updateFilters = (filters: Partial<TViewFilters>) => {
    runInAction(() => {
      this.loader = "submit";
      this.filtersToUpdate.filters = filters;
    });
  };

  updateDisplayFilters = async (display_filters: Partial<TViewDisplayFilters>) => {
    const appliedFilters = this.appliedFilters;

    const layout = appliedFilters?.display_filters?.layout;
    const sub_group_by = appliedFilters?.display_filters?.sub_group_by;
    const group_by = appliedFilters?.display_filters?.group_by;
    const sub_issue = appliedFilters?.display_filters?.sub_issue;

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
  update = async (viewData: Partial<TViewFilterProps>) => {
    if (!this.workspaceSlug || !this.id) return;

    const view = await this.service.update(this.workspaceSlug, viewData, this.projectId, this.featureId);
    if (!view) return;

    runInAction(() => {
      Object.keys(viewData).forEach((key) => {
        const _key = key as keyof TViewFilterProps;
        set(this, _key, viewData[_key]);
      });
    });
  };
}
