import { action, computed, makeObservable } from "mobx";

// store
import { RootStore } from "store/root.store";
// types
import { TViewService } from "services/view/types";
import { TView, TViewFilters, TViewDisplayFilters, TViewDisplayProperties, TViewAccess } from "@plane/types";

export type TViews = TView & {
  // computed
  user: undefined;
  // actions
  updateName: (name: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;
  updateFilters: (filters: TViewFilters) => Promise<void>;
  updateDisplayFilters: (display_filters: TViewDisplayFilters) => Promise<void>;
  updateDisplayProperties: (display_properties: TViewDisplayProperties) => Promise<void>;
  lockView: () => Promise<void>;
  unlockView: () => Promise<void>;
};

export class Views implements TViews {
  id: string;
  workspace: string;
  project: string | undefined;
  name: string;
  description: string | undefined;
  query: string;
  filters: undefined;
  display_filters: undefined;
  display_properties: undefined;
  access: TViewAccess;
  owned_by: string;
  sort_order: number;
  is_locked: boolean;
  is_pinned: boolean;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;

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
    this.created_by = _view.created_by;
    this.updated_by = _view.updated_by;
    this.created_at = _view.created_at;
    this.updated_at = _view.updated_at;

    makeObservable(this, {
      // computed
      user: computed,
      // actions
      updateName: action,
      updateDescription: action,
      updateFilters: action,
      updateDisplayFilters: action,
      updateDisplayProperties: action,
      lockView: action,
      unlockView: action,
    });
  }

  // computed
  get user() {
    return undefined;
  }

  // actions
  updateName = async (name: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.update(workspaceSlug, this.id, { name: name }, projectId);
      if (!view) return;

      this.name = view.name;
    } catch (error) {
      console.log(error);
    }
  };

  updateDescription = async (description: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.update(workspaceSlug, this.id, { description: description }, projectId);
      if (!view) return;

      this.description = view.description;
    } catch (error) {
      console.log(error);
    }
  };

  updateFilters = async (filters: any) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.update(workspaceSlug, this.id, { filters: filters }, projectId);
      if (!view) return;

      this.filters = view.filters;
    } catch (error) {
      console.log(error);
    }
  };

  updateDisplayFilters = async (display_filters: any) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.update(workspaceSlug, this.id, { display_filters: display_filters }, projectId);
      if (!view) return;

      this.display_filters = view.display_filters;
    } catch (error) {
      console.log(error);
    }
  };

  updateDisplayProperties = async (display_properties: any) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.update(
        workspaceSlug,
        this.id,
        { display_properties: display_properties },
        projectId
      );
      if (!view) return;

      this.display_properties = view.display_properties;
    } catch (error) {
      console.log(error);
    }
  };

  lockView = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.lock(workspaceSlug, this.id, projectId);
      if (!view) return;

      this.is_locked = view.is_locked;
    } catch (error) {
      console.log(error);
    }
  };

  unlockView = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !projectId) return;

      const view = await this.service.unlock(workspaceSlug, this.id, projectId);
      if (!view) return;

      this.is_locked = view.is_locked;
    } catch (error) {
      console.log(error);
    }
  };
}
