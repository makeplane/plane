import { action, computed, makeObservable, observable, runInAction } from "mobx";
// store
import { RootStore } from "../root.store";
// service
import { PageService } from "services/page.service";
// types
import { TPage, TPageAccess } from "@plane/types";
// constants
import { EPageAccess } from "constants/page";

export type TLoader = "submitting" | "submitted" | "saved" | undefined;

export interface IPageStore extends TPage {
  // observables
  loader: TLoader;
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
  id: string | undefined;
  name: string | undefined;
  description_html: string | undefined;
  color: string | undefined;
  labels: string[] | undefined;
  owned_by: string | undefined;
  access: TPageAccess | undefined;
  is_favorite: boolean;
  is_locked: boolean;
  archived_at: string | undefined;
  workspace: string | undefined;
  project: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;

  loader: TLoader = undefined;
  // service
  pageService: PageService;

  constructor(private store: RootStore, page: TPage) {
    this.id = page?.id || undefined;
    this.name = page?.name || undefined;
    this.description_html = page?.description_html || undefined;
    this.color = page?.color || undefined;
    this.labels = page?.labels || undefined;
    this.owned_by = page?.owned_by || undefined;
    this.access = page?.access || EPageAccess.PUBLIC;
    this.is_favorite = page?.is_favorite || false;
    this.is_locked = page?.is_locked || false;
    this.archived_at = page?.archived_at || undefined;
    this.workspace = page?.workspace || undefined;
    this.project = page?.project || undefined;
    this.created_by = page?.created_by || undefined;
    this.updated_by = page?.updated_by || undefined;
    this.created_at = page?.created_at || undefined;
    this.updated_at = page?.updated_at || undefined;

    makeObservable(this, {
      // observables
      loader: observable.ref,
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

    this.pageService = new PageService();
  }

  // computed
  get isContentEditable() {
    const currentUserId = this.store.user.currentUser?.id;
    if (!currentUserId) return false;

    const isOwner = this.owned_by === currentUserId;
    const isPublic = this.access === EPageAccess.PUBLIC;
    const isLocked = this.is_locked;

    if (isOwner) return true;
    if (!isOwner && isPublic) return true;
    if (!isOwner && !isLocked) return true;

    return false;
  }

  updateDescription = async () => {};

  makePublic = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageAccess = this.access;
    runInAction(() => (this.access = EPageAccess.PUBLIC));

    await this.pageService
      .update(workspaceSlug, projectId, this.id, {
        access: EPageAccess.PUBLIC,
      })
      .catch(() => {
        runInAction(() => (this.access = pageAccess));
      });
  };

  makePrivate = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageAccess = this.access;
    runInAction(() => (this.access = EPageAccess.PRIVATE));

    await this.pageService
      .update(workspaceSlug, projectId, this.id, {
        access: EPageAccess.PRIVATE,
      })
      .catch(() => {
        runInAction(() => (this.access = pageAccess));
      });
  };

  lock = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = true));

    await this.pageService.lock(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => (this.is_locked = pageIsLocked));
    });
  };

  unlock = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = false));

    await this.pageService.unlock(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => (this.is_locked = pageIsLocked));
    });
  };

  addToFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsFavorite = this.is_favorite;
    runInAction(() => (this.is_favorite = true));

    await this.pageService.makeFavorite(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => (this.is_favorite = pageIsFavorite));
    });
  };

  removeFromFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.app.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsFavorite = this.is_favorite;
    runInAction(() => (this.is_favorite = false));

    await this.pageService.removeFavorite(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => (this.is_favorite = pageIsFavorite));
    });
  };
}
