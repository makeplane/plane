// types
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// stores
import { RootStore } from "store/root.store";
import { ViewsStore } from "./view.store";
// types
import { TViewService } from "services/view/types";
import { TView } from "@plane/types";
import { set } from "lodash";

export type TLoader = "" | undefined;

type TViewRoot = {
  // observables
  viewMap: Record<string, ViewsStore>;
  // computed
  viewIds: string[];
  // actions
  fetch: () => Promise<void>;
  create: (view: Partial<TView>) => Promise<void>;
  delete: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRoot implements TViewRoot {
  viewMap: Record<string, ViewsStore> = {};

  constructor(private store: RootStore, private service: TViewService) {
    makeObservable(this, {
      // observables
      viewMap: observable,
      // computed
      viewIds: computed,
      // actions
      fetch: action,
      create: action,
      delete: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    return Object.keys(this.viewMap);
  }

  get views() {
    return Object.values(this.viewMap);
  }

  // actions
  fetch = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const views = await this.service.fetch(workspaceSlug, projectId);
    if (!views) return;

    runInAction(() => {
      views.forEach((view) => {
        set(this.viewMap, [view.id], new ViewsStore(this.store, view, this.service));
      });
    });
  };

  create = async (data: Partial<TView>) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.create(workspaceSlug, data, projectId);
    if (!view) return;

    runInAction(() => {
      set(this.viewMap, [view.id], new ViewsStore(this.store, view, this.service));
    });
  };

  delete = async (viewId: string) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    await this.service.remove(workspaceSlug, viewId, projectId);

    runInAction(() => {
      delete this.viewMap[viewId];
    });
  };

  duplicate = async (viewId: string) => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug) return;

    const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
    if (!view) return;

    runInAction(() => {
      set(this.viewMap, [view.id], new ViewsStore(this.store, view, this.service));
    });
  };
}
