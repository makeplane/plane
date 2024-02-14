import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import reverse from "lodash/reverse";
// stores
import { RootStore } from "store/root.store";
import { ViewStore } from "./view.store";
// types
import { TUserViewService, TViewService } from "services/view/types";
import { TView, TViewTypes } from "@plane/types";
// constants
import { EViewPageType } from "constants/view";

export type TLoader = "init-loader" | "mutation-loader" | "submitting" | undefined;

type TViewRootStore = {
  // observables
  loader: TLoader;
  viewMap: Record<string, Record<string, Record<string, ViewStore>>>; // workspaceSlug/projectId, public/private, viewId -> ViewStore
  // computed
  viewIds: string[];
  viewById: (viewId: string) => ViewStore | undefined;
  // actions
  localViewCreate: (workspaceSlug: string, projectId: string | undefined, view: TView) => Promise<void>;
  fetch: (workspaceSlug: string, projectId: string | undefined, _loader?: TLoader) => Promise<void>;
  fetchById: (workspaceSlug: string, projectId: string | undefined, viewId: string) => Promise<void>;
  create: (workspaceSlug: string, projectId: string | undefined, view: Partial<TView>) => Promise<void>;
  remove: (workspaceSlug: string, projectId: string | undefined, viewId: string) => Promise<void>;
  duplicate: (workspaceSlug: string, projectId: string | undefined, viewId: string) => Promise<void>;
};

export class ViewRootStore implements TViewRootStore {
  // observables
  loader: TLoader = "init-loader";
  viewMap: Record<string, Record<string, Record<string, ViewStore>>> = {};

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
      viewMap: observable,
      // computed
      viewIds: computed,
      // actions
      localViewCreate: action,
      fetch: action,
      fetchById: action,
      create: action,
      remove: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return [];

    const viewRootSlug = projectId ? projectId : workspaceSlug;
    const views = this.viewMap?.[viewRootSlug]?.[this.viewType]
      ? Object.values(this.viewMap?.[viewRootSlug]?.[this.viewType])
      : [];

    const localViews = views.filter((view) => view.is_local_view);
    let apiViews = views.filter((view) => !view.is_local_view && !view.is_create);
    apiViews = reverse(sortBy(apiViews, "sort_order"));
    const _viewIds = [...localViews.map((view) => view.id), ...apiViews.map((view) => view.id)];
    return _viewIds as string[];
  }

  viewById = computedFn((viewId: string) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return undefined;

    const viewRootSlug = projectId ? projectId : workspaceSlug;
    return this.viewMap?.[viewRootSlug]?.[this.viewType]?.[viewId] || undefined;
  });

  // actions
  localViewCreate = async (workspaceSlug: string, projectId: string | undefined, view: TView) => {
    const viewRootSlug = projectId ? projectId : workspaceSlug;

    runInAction(() => {
      if (view.id)
        set(
          this.viewMap,
          [viewRootSlug, this.viewType, view.id],
          new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
        );
    });
  };

  fetch = async (workspaceSlug: string, projectId: string | undefined, _loader: TLoader = "init-loader") => {
    try {
      const viewRootSlug = projectId ? projectId : workspaceSlug;

      this.loader = _loader;

      if (this.defaultViews && this.defaultViews.length > 0)
        runInAction(() => {
          this.defaultViews?.forEach((view) => {
            if (view.id)
              set(
                this.viewMap,
                [viewRootSlug, this.viewType, view.id],
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
              [viewRootSlug, this.viewType, view.id],
              new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
            );
        });
        this.loader = undefined;
      });
    } catch {}
  };

  fetchById = async (workspaceSlug: string, projectId: string | undefined, viewId: string) => {
    try {
      const viewRootSlug = projectId ? projectId : workspaceSlug;

      const userView = await this.userService.fetch(workspaceSlug, projectId);
      if (!userView) return;

      let view: TView | undefined = undefined;

      if (["all-issues", "assigned", "created", "subscribed"].includes(viewId)) {
        const currentView = { ...this.viewById(viewId) } as TView;
        if (!currentView) return;

        view = currentView;
        view.filters = userView.filters;
        view.display_filters = userView.display_filters;
        view.display_properties = userView.display_properties;
      } else {
        const currentView = await this.service.fetchById(workspaceSlug, viewId, projectId);
        if (!currentView) return;

        view = currentView;
        view?.display_filters && (view.display_filters = userView.display_filters);
        view?.display_properties && (view.display_properties = userView.display_properties);
      }

      if (!view) return;
      runInAction(() => {
        if (view?.id)
          set(
            this.viewMap,
            [viewRootSlug, this.viewType, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
      });
    } catch {}
  };

  create = async (workspaceSlug: string, projectId: string | undefined, data: Partial<TView>) => {
    try {
      const viewRootSlug = projectId ? projectId : workspaceSlug;

      const view = await this.service.create(workspaceSlug, data, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id)
          set(
            this.viewMap,
            [viewRootSlug, this.viewType, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
      });

      if (data.id) this.remove(workspaceSlug, projectId, data.id);
    } catch {}
  };

  remove = async (workspaceSlug: string, projectId: string | undefined, viewId: string) => {
    try {
      const viewRootSlug = projectId ? projectId : workspaceSlug;

      if (
        this.viewMap?.[viewRootSlug]?.[this.viewType]?.[viewId] != undefined &&
        !this.viewMap?.[viewRootSlug]?.[this.viewType]?.[viewId]?.is_create
      )
        await this.service.remove?.(workspaceSlug, viewId, projectId);

      runInAction(() => {
        delete this.viewMap?.[viewRootSlug]?.[this.viewType]?.[viewId];
      });
    } catch {}
  };

  duplicate = async (workspaceSlug: string, projectId: string | undefined, viewId: string) => {
    try {
      if (!this.service.duplicate) return;

      const viewRootSlug = projectId ? projectId : workspaceSlug;

      const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id)
          set(
            this.viewMap,
            [viewRootSlug, this.viewType, view.id],
            new ViewStore(this.store, view, this.service, this.userService, this.viewPageType)
          );
      });
    } catch {}
  };
}
