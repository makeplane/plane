// types
import { action, computed, makeObservable, observable } from "mobx";
// stores
import { RootStore } from "store/root.store";
import { Views } from "./view.store";
// types
import { TViewService } from "services/view/types";
import { TView } from "@plane/types";
import { set } from "lodash";

export type TLoader = "" | undefined;

type TViewRoot = {
  // observables
  viewMap: Record<string, Views>;
  // computed
  viewIds: string[];

  // actions
  fetch: () => Promise<void>;
  create: (view: Partial<TView>) => Promise<void>;
  delete: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRoot implements TViewRoot {
  viewMap: Record<string, Views> = {};

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
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const views = await this.service.fetch(workspaceSlug, projectId);
      if (!views) return;

      views.forEach((view) => {
        set(this.viewMap, [view.id], new Views(this.store, view, this.service));
      });
    } catch (error) {
      console.log(error);
    }
  };

  create = async (_view: Partial<TView>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.create(workspaceSlug, _view, projectId);
      if (!view) return;

      set(this.viewMap, [view.id], new Views(this.store, view, this.service));
    } catch (error) {
      console.log(error);
    }
  };

  delete = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      await this.service.remove(workspaceSlug, viewId, projectId);

      delete this.viewMap[viewId];
    } catch (error) {
      console.log(error);
    }
  };

  duplicate = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
      if (!view) return;

      set(this.viewMap, [view.id], new Views(this.store, view, this.service));
    } catch (error) {
      console.log(error);
    }
  };
}
