import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "store/root.store";
import { ViewStore } from "./view.store";
// types
import { TViewService } from "services/view/types";
import { TView } from "@plane/types";

export type TLoader = "init-loader" | "mutation-loader" | "submitting" | undefined;

type TViewRootStore = {
  // observables
  loader: TLoader;
  viewMap: Record<string, ViewStore>;
  // computed
  viewIds: string[];
  // helper actions
  viewById: (viewId: string) => ViewStore | undefined;
  // actions
  fetch: (_loader?: TLoader) => Promise<void>;
  localViewCreate: (view: TView) => Promise<void>;
  clearLocalView: (viewId: string) => Promise<void>;
  create: (view: Partial<TView>) => Promise<void>;
  remove: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRootStore implements TViewRootStore {
  // observables
  loader: TLoader = "init-loader";
  viewMap: Record<string, ViewStore> = {};

  constructor(private store: RootStore, private service: TViewService, private defaultViews: TView[] = []) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      viewMap: observable,
      // computed
      viewIds: computed,
      // actions
      fetch: action,
      localViewCreate: action,
      clearLocalView: action,
      create: action,
      remove: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    const views = Object.values(this.viewMap);
    return views.filter((view) => !view?.is_create).map((view) => view.id) as string[];
  }

  // helper actions
  viewById = (viewId: string) => this.viewMap?.[viewId] || undefined;

  // actions
  fetch = async (_loader: TLoader = "init-loader") => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    runInAction(() => {
      if (this.defaultViews && this.defaultViews.length > 0)
        this.defaultViews?.forEach((view) => {
          if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
        });
    });

    this.loader = _loader;
    const views = await this.service.fetch(workspaceSlug, projectId);
    if (!views) return;

    runInAction(() => {
      views.forEach((view) => {
        if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
      });
      this.loader = undefined;
    });
  };

  localViewCreate = async (view: TView) => {
    runInAction(() => {
      if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
    });
  };

  clearLocalView = async (viewId: string) => {
    runInAction(() => {
      if (viewId) delete this.viewMap[viewId];
    });
  };

  create = async (data: Partial<TView>) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.create(workspaceSlug, data, projectId);
    if (!view) return;

    runInAction(() => {
      if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
    });
  };

  remove = async (viewId: string) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !viewId) return;

    await this.service.remove?.(workspaceSlug, viewId, projectId);

    runInAction(() => {
      delete this.viewMap[viewId];
    });
  };

  duplicate = async (viewId: string) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !this.service.duplicate) return;

    const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
    if (!view) return;

    runInAction(() => {
      if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
    });
  };
}
