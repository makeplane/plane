import { action, computed, makeObservable, observable, runInAction } from "mobx";
// store
import { RootStore } from "../root.store";
// service
import { PageService } from "services/page.service";
// types
import { TPage } from "@plane/types";
// constants
import { EPageAccess } from "constants/page";

export type TLoader = "submitting" | "submitted" | "saved" | undefined;

export interface IPageStore {
  // observables
  loader: TLoader;
  data: TPage;
  // computed
  isContentEditable: boolean;
  // helper actions
  updateDescription: (description: string) => void;
  // actions
  makePublic: () => Promise<void>;
  makePrivate: () => Promise<void>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  addToFavorites: () => Promise<void>;
  removeFromFavorites: () => Promise<void>;
}

export class PageStore implements IPageStore {
  loader: TLoader = undefined;
  data: TPage;
  // service
  pageService: PageService;

  constructor(private store: RootStore, page: TPage) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      data: observable,
      // computed
      isContentEditable: computed,
      // helper actions
      updateDescription: action,
      // actions
      makePublic: action,
      makePrivate: action,
      lock: action,
      unlock: action,
      addToFavorites: action,
      removeFromFavorites: action,
    });

    this.data = {
      id: page?.id || undefined,
      name: page?.name || undefined,
      description_html: page?.description_html || undefined,
      color: page?.color || undefined,
      labels: page?.labels || undefined,
      owned_by: page?.owned_by || undefined,
      access: page?.access || EPageAccess.PUBLIC,
      is_favorite: page?.is_favorite || false,
      is_locked: page?.is_locked || false,
      archived_at: page?.archived_at || undefined,
      workspace: page?.workspace || undefined,
      project: page?.project || undefined,
      created_by: page?.created_by || undefined,
      updated_by: page?.updated_by || undefined,
      created_at: page?.created_at || undefined,
      updated_at: page?.updated_at || undefined,
    };

    this.pageService = new PageService();
  }

  // computed
  get isContentEditable() {
    const currentUserId = this.store.user.currentUser?.id;
    if (!currentUserId) return false;

    const isOwner = this.data.owned_by === currentUserId;
    const isPublic = this.data.access === EPageAccess.PUBLIC;
    const isLocked = this.data.is_locked;

    if (isOwner) return true;
    if (!isOwner && isPublic) return true;
    if (!isOwner && !isLocked) return true;

    return false;
  }

  updateDescription = async () => {};

  makePublic = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _access = this.data.access;
    runInAction(() => (this.data.access = EPageAccess.PUBLIC));

    await this.pageService
      .update(workspaceSlug, projectId, this.data.id, {
        access: EPageAccess.PUBLIC,
      })
      .catch(() => {
        runInAction(() => (this.data.access = _access));
      });
  };

  makePrivate = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _access = this.data.access;
    runInAction(() => (this.data.access = EPageAccess.PRIVATE));

    await this.pageService
      .update(workspaceSlug, projectId, this.data.id, {
        access: EPageAccess.PRIVATE,
      })
      .catch(() => {
        runInAction(() => (this.data.access = _access));
      });
  };

  lock = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _is_locked = this.data.is_locked;
    runInAction(() => (this.data.is_locked = true));

    await this.pageService.lock(workspaceSlug, projectId, this.data.id).catch(() => {
      runInAction(() => (this.data.is_locked = _is_locked));
    });
  };

  unlock = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _is_locked = this.data.is_locked;
    runInAction(() => (this.data.is_locked = false));

    await this.pageService.unlock(workspaceSlug, projectId, this.data.id).catch(() => {
      runInAction(() => (this.data.is_locked = _is_locked));
    });
  };

  addToFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _is_favorite = this.data.is_favorite;
    runInAction(() => (this.data.is_favorite = true));

    await this.pageService.makeFavorite(workspaceSlug, projectId, this.data.id).catch(() => {
      runInAction(() => (this.data.is_favorite = _is_favorite));
    });
  };

  removeFromFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.data.id) return undefined;

    const _is_favorite = this.data.is_favorite;
    runInAction(() => (this.data.is_favorite = false));

    await this.pageService.removeFavorite(workspaceSlug, projectId, this.data.id).catch(() => {
      runInAction(() => (this.data.is_favorite = _is_favorite));
    });
  };
}
