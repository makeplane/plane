import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import reverse from "lodash/reverse";
import cloneDeep from "lodash/cloneDeep";
// stores
import { RootStore } from "store/root.store";
import { ViewStore } from "./view.store";
// types
import { TUserViewService, TViewService } from "services/view/types";
import { TView, TViewFilters, TViewTypes } from "@plane/types";
// constants
import { EViewPageType, TViewCRUD, generateViewStoreKey, viewLocalPayload } from "constants/view";

export type TLoader =
  | "view-loader"
  | "view-mutation-loader"
  | "view-detail-loader"
  | "create-submitting"
  | "edit-submitting"
  | "delete-submitting"
  | "duplicate-submitting"
  | undefined;

type TViewRootStore = {
  // observables
  loader: TLoader;
  viewMapCEN: ViewStore | undefined; // view map Create, Edit, and save as New
  viewMap: Record<string, Record<string, ViewStore>>; // workspaceSlug/projectId/TViewType.toString(), viewId -> ViewStore
  // computed
  viewIds: string[];
  viewById: (viewId: string) => ViewStore | undefined;
  localView: () => ViewStore | undefined;
  // actions
  fetch: (workspaceSlug: string, projectId: string | undefined, _loader?: TLoader) => Promise<void>;
  fetchById: (
    workspaceSlug: string,
    projectId: string | undefined,
    viewId: string,
    defaultFilters?: Partial<Record<keyof TViewFilters, string[]>> | undefined
  ) => Promise<void>;
  remove: (viewId: string) => Promise<void>;
  localViewHandler: (viewId: string | undefined, status: TViewCRUD) => void;
  create: () => Promise<void>;
  update: () => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRootStore implements TViewRootStore {
  // observables
  loader: TLoader = "view-loader";
  viewMapCEN: ViewStore | undefined = undefined;
  viewMap: Record<string, Record<string, ViewStore>> = {};

  constructor(
    private store: RootStore,
    private defaultViews: TView[] = [],
    private service: TViewService,
    private userService: TUserViewService,
    private viewPageType: EViewPageType,
    private viewType: TViewTypes
  ) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      viewMapCEN: observable,
      viewMap: observable,
      // computed
      viewIds: computed,
      // actions
      localViewHandler: action,
      fetch: action,
      fetchById: action,
      create: action,
      update: action,
      remove: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    const { workspaceSlug, projectId, currentViewType } = this.store.view;
    if (!workspaceSlug || !currentViewType) return [];

    const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, currentViewType);
    const views = this.viewMap?.[viewRootSlug] ? Object.values(this.viewMap?.[viewRootSlug]) : [];

    const localViews = views.filter((view) => view.is_local_view);
    let apiViews = views.filter((view) => !view.is_local_view);
    apiViews = reverse(sortBy(apiViews, "sort_order"));
    const _viewIds = [...localViews.map((view) => view.id), ...apiViews.map((view) => view.id)];
    return _viewIds.filter((view) => view !== undefined) as string[];
  }

  viewById = computedFn((viewId: string) => {
    const { workspaceSlug, projectId, currentViewType } = this.store.view;
    if (!workspaceSlug || !currentViewType) return undefined;

    const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, currentViewType);
    return this.viewMap?.[viewRootSlug]?.[viewId] || undefined;
  });

  localView = computedFn(() => this.viewMapCEN);

  // actions
  fetch = async (workspaceSlug: string, projectId: string | undefined, _loader: TLoader = "view-loader") => {
    try {
      runInAction(() => (this.loader = _loader));

      this.store.view.setWorkspaceSlug(workspaceSlug);
      this.store.view.setProjectId(projectId);
      this.store.view.setCurrentViewType(this.viewType);

      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);
      if (this.defaultViews && this.defaultViews.length > 0)
        runInAction(() => {
          this.defaultViews?.forEach((view) => {
            if (view.id)
              set(
                this.viewMap,
                [viewRootSlug, view.id],
                new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
              );
          });
        });

      const views = await this.service.fetch(workspaceSlug, projectId);
      if (!views) return;
      runInAction(() => {
        views.forEach((view) => {
          if (view.id)
            set(
              this.viewMap,
              [viewRootSlug, view.id],
              new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
            );
        });
        this.loader = undefined;
      });
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };

  fetchById = async (
    workspaceSlug: string,
    projectId: string | undefined,
    viewId: string,
    defaultFilters: Partial<Record<keyof TViewFilters, string[]>> | undefined = undefined
  ) => {
    try {
      runInAction(() => (this.loader = "view-detail-loader"));

      this.store.view.setWorkspaceSlug(workspaceSlug);
      this.store.view.setProjectId(projectId);
      this.store.view.setCurrentViewId(viewId);
      this.store.view.setCurrentViewType(this.viewType);
      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);

      const userView = await this.userService.fetch(workspaceSlug, projectId);
      if (!userView) return;

      let view: TView | undefined = undefined;
      if (["all-issues", "assigned", "created", "subscribed"].includes(viewId)) {
        const currentView = { ...this.viewById(viewId) } as TView;
        if (!currentView) return;
        view = currentView;
        defaultFilters && (view.filters = defaultFilters as TViewFilters);
      } else {
        const currentView = await this.service.fetchById(workspaceSlug, viewId, projectId);
        if (!currentView) return;
        view = currentView;
      }

      view?.display_filters && (view.display_filters = userView.display_filters);
      view?.display_properties && (view.display_properties = userView.display_properties);

      if (!view) return;
      runInAction(() => {
        if (view?.id)
          set(
            this.viewMap,
            [viewRootSlug, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
      });

      // fetching the issues
      const filterParams = this.viewMap?.[viewRootSlug]?.[viewId]?.appliedFiltersQueryParams?.params;
      this.store.issue.workspaceIssues.fetchIssues(workspaceSlug, viewId, "init-loader", filterParams);

      runInAction(() => (this.loader = undefined));
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };

  remove = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId, currentViewType } = this.store.view;
      if (!workspaceSlug || !currentViewType) return undefined;

      runInAction(() => (this.loader = "delete-submitting"));

      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);

      await this.service.remove?.(workspaceSlug, viewId, projectId);

      runInAction(() => {
        delete this.viewMap?.[viewRootSlug]?.[viewId];
        this.loader = undefined;
      });
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };

  localViewHandler = (viewId: string | undefined, status: TViewCRUD) => {
    const { workspaceSlug, projectId, currentViewType } = this.store.view;
    if (!workspaceSlug || !currentViewType) return undefined;

    if (status === "CLEAR") {
      runInAction(() => (this.viewMapCEN = undefined));
      return;
    }

    const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, currentViewType);

    let _view: Partial<TView> = {};
    if (status === "CREATE") _view = cloneDeep(viewLocalPayload);
    else if (status === "EDIT") {
      if (!viewId) return;
      _view = cloneDeep(this.viewMap?.[viewRootSlug]?.[viewId]);
    } else if (status === "SAVE_AS_NEW") {
      if (!viewId) return;
      const clonedView = cloneDeep(this.viewMap?.[viewRootSlug]?.[viewId]);
      _view = {
        id: "create",
        name: clonedView?.name,
        filters: clonedView?.filtersToUpdate?.filters,
        display_filters: clonedView?.filtersToUpdate?.display_filters,
        display_properties: clonedView?.filtersToUpdate?.display_properties,
      };
    } else return;

    runInAction(() => {
      if (_view.id)
        set(
          this,
          ["viewMapCEN"],
          new ViewStore(this.store, _view as TView, this.service, this.userService, this.viewPageType)
        );
    });
  };

  create = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.view;
      if (!workspaceSlug || !this.viewMapCEN) return;

      runInAction(() => (this.loader = "create-submitting"));

      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);

      const view = await this.service.create(workspaceSlug, this.viewMapCEN.filtersToUpdate, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id)
          set(
            this.viewMap,
            [viewRootSlug, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
        this.viewMapCEN = undefined;
        this.loader = undefined;
      });
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };

  update = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.view;
      if (!workspaceSlug || !this.viewMapCEN || !this.viewMapCEN.id) return;

      runInAction(() => (this.loader = "edit-submitting"));

      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);

      const view = await this.service.update(
        workspaceSlug,
        this.viewMapCEN.id,
        this.viewMapCEN.filtersToUpdate,
        projectId
      );
      if (!view) return;

      runInAction(() => {
        if (view.id)
          set(
            this.viewMap,
            [viewRootSlug, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
        this.viewMapCEN = undefined;
        this.loader = undefined;
      });
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };

  duplicate = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.view;
      if (!workspaceSlug || !this.service.duplicate) return;

      runInAction(() => (this.loader = "duplicate-submitting"));

      const viewRootSlug = generateViewStoreKey(workspaceSlug, projectId, this.viewType);

      const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id)
          set(
            this.viewMap,
            [viewRootSlug, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
        this.loader = undefined;
      });
    } catch {
      runInAction(() => (this.loader = undefined));
    }
  };
}
