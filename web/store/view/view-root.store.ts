import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
// stores
import { RootStore } from "store/root.store";
import { ViewStore } from "./view.store";
// types
import { TViewService } from "services/view/types";
import { TView } from "@plane/types";

export type TLoader = "" | undefined;

type TViewRootStore = {
  // observables
  viewMap: Record<string, ViewStore>;
  // computed
  viewIds: string[];
  // helper actions
  viewById: (viewId: string) => ViewStore | undefined;
  // actions
  fetch: () => Promise<void>;
  create: (view: Partial<TView>) => Promise<void>;
  remove: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRootStore implements TViewRootStore {
  viewMap: Record<string, ViewStore> = {};

  constructor(private store: RootStore, private service: TViewService) {
    makeObservable(this, {
      // observables
      viewMap: observable.ref,
      // computed
      viewIds: computed,
      // actions
      fetch: action,
      create: action,
      remove: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    return Object.keys(this.viewMap);
  }

  // helper actions
  viewById = (viewId: string) => this.viewMap?.[viewId] || undefined;

  // actions
  fetch = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const views = await this.service.fetch(workspaceSlug, projectId);
    if (!views) return;

    runInAction(() => {
      views.forEach((view) => {
        if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
      });
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
