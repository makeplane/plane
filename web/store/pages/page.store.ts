import set from "lodash/set";
import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
// types
import { TPage } from "@plane/types";
// constants
import { EPageAccess } from "@/constants/page";
import { EUserProjectRoles } from "@/constants/project";
// services
import { PageService } from "@/services/page.service";
import { RootStore } from "../root.store";

export type TLoader = "submitting" | "submitted" | "saved" | undefined;

export interface IPageStore extends TPage {
  // observables
  isSubmitting: "submitting" | "submitted" | "saved";
  loader: TLoader;
  // computed
  asJSON: TPage | undefined;
  isCurrentUserOwner: boolean; // it will give the user is the owner of the page or not
  canCurrentUserEditPage: boolean; // it will give the user permission to read the page or write the page
  canCurrentUserDuplicatePage: boolean;
  canCurrentUserLockPage: boolean;
  canCurrentUserChangeAccess: boolean;
  canCurrentUserArchivePage: boolean;
  canCurrentUserDeletePage: boolean;
  isContentEditable: boolean;
  // helpers
  oldName: string;
  updateTitle: (name: string) => void;
  updateDescription: (description: string) => void;
  setIsSubmitting: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  cleanup: () => void;
  // actions
  update: (pageData: Partial<TPage>) => Promise<TPage | undefined>;
  makePublic: () => Promise<void>;
  makePrivate: () => Promise<void>;
  lock: () => Promise<void>;
  unlock: () => Promise<void>;
  archive: () => Promise<void>;
  restore: () => Promise<void>;
  addToFavorites: () => Promise<void>;
  removeFromFavorites: () => Promise<void>;
}

export class PageStore implements IPageStore {
  // loaders
  isSubmitting: "submitting" | "submitted" | "saved" = "saved";
  loader: TLoader = undefined;
  // page properties
  id: string | undefined;
  name: string | undefined;
  description_html: string | undefined;
  color: string | undefined;
  labels: string[] | undefined;
  owned_by: string | undefined;
  access: EPageAccess | undefined;
  is_favorite: boolean;
  is_locked: boolean;
  archived_at: string | null | undefined;
  workspace: string | undefined;
  project: string | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  // helpers
  oldName: string = "";
  // reactions
  disposers: Array<() => void> = [];
  // service
  pageService: PageService;

  constructor(
    private store: RootStore,
    page: TPage
  ) {
    this.id = page?.id || undefined;
    this.name = page?.name;
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
    this.oldName = page?.name || "";

    makeObservable(this, {
      // loaders
      isSubmitting: observable.ref,
      loader: observable.ref,
      // page properties
      id: observable.ref,
      name: observable.ref,
      description_html: observable.ref,
      color: observable.ref,
      labels: observable,
      owned_by: observable.ref,
      access: observable.ref,
      is_favorite: observable.ref,
      is_locked: observable.ref,
      archived_at: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // helpers
      oldName: observable,
      // computed
      asJSON: computed,
      isCurrentUserOwner: computed,
      canCurrentUserEditPage: computed,
      canCurrentUserDuplicatePage: computed,
      canCurrentUserLockPage: computed,
      canCurrentUserChangeAccess: computed,
      canCurrentUserArchivePage: computed,
      canCurrentUserDeletePage: computed,
      isContentEditable: computed,
      // helper actions
      updateTitle: action,
      updateDescription: action.bound,
      setIsSubmitting: action,
      cleanup: action,
      // actions
      update: action,
      makePublic: action,
      makePrivate: action,
      lock: action,
      unlock: action,
      archive: action,
      restore: action,
      addToFavorites: action,
      removeFromFavorites: action,
    });

    this.pageService = new PageService();

    const titleDisposer = reaction(
      () => this.name,
      (name) => {
        const { workspaceSlug, projectId } = this.store.router;
        if (!workspaceSlug || !projectId || !this.id) return;
        this.isSubmitting = "submitting";
        this.pageService
          .update(workspaceSlug, projectId, this.id, {
            name,
          })
          .catch(() =>
            runInAction(() => {
              this.name = this.oldName;
            })
          )
          .finally(() =>
            runInAction(() => {
              this.isSubmitting = "submitted";
            })
          );
      },
      { delay: 2000 }
    );

    const descriptionDisposer = reaction(
      () => this.description_html,
      (description_html) => {
        //TODO: Fix reaction to only run when the data is changed, not when the page is loaded
        const { workspaceSlug, projectId } = this.store.router;
        if (!workspaceSlug || !projectId || !this.id) return;
        this.isSubmitting = "submitting";
        this.pageService
          .update(workspaceSlug, projectId, this.id, {
            description_html,
          })
          .finally(() =>
            runInAction(() => {
              this.isSubmitting = "submitted";
            })
          );
      },
      { delay: 3000 }
    );

    this.disposers.push(titleDisposer, descriptionDisposer);
  }

  // computed
  get asJSON() {
    return {
      id: this.id,
      name: this.name,
      description_html: this.description_html,
      color: this.color,
      labels: this.labels,
      owned_by: this.owned_by,
      access: this.access,
      is_favorite: this.is_favorite,
      is_locked: this.is_locked,
      archived_at: this.archived_at,
      workspace: this.workspace,
      project: this.project,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  get isCurrentUserOwner() {
    const currentUserId = this.store.user.data?.id;
    if (!currentUserId) return false;
    return this.owned_by === currentUserId;
  }

  /**
   * @description returns true if the current logged in user can edit the page
   */
  get canCurrentUserEditPage() {
    const currentUserProjectRole = this.store.user.membership.currentProjectRole;
    return this.isCurrentUserOwner || (!!currentUserProjectRole && currentUserProjectRole >= EUserProjectRoles.MEMBER);
  }

  /**
   * @description returns true if the current logged in user can create a duplicate the page
   */
  get canCurrentUserDuplicatePage() {
    const currentUserProjectRole = this.store.user.membership.currentProjectRole;
    return this.isCurrentUserOwner || (!!currentUserProjectRole && currentUserProjectRole >= EUserProjectRoles.MEMBER);
  }

  /**
   * @description returns true if the current logged in user can lock the page
   */
  get canCurrentUserLockPage() {
    const currentUserProjectRole = this.store.user.membership.currentProjectRole;
    return this.isCurrentUserOwner || (!!currentUserProjectRole && currentUserProjectRole >= EUserProjectRoles.MEMBER);
  }

  /**
   * @description returns true if the current logged in user can change the access of the page
   */
  get canCurrentUserChangeAccess() {
    return this.isCurrentUserOwner;
  }

  /**
   * @description returns true if the current logged in user can archive the page
   */
  get canCurrentUserArchivePage() {
    const currentUserProjectRole = this.store.user.membership.currentProjectRole;
    return this.isCurrentUserOwner || currentUserProjectRole === EUserProjectRoles.ADMIN;
  }

  /**
   * @description returns true if the current logged in user can delete the page
   */
  get canCurrentUserDeletePage() {
    const currentUserProjectRole = this.store.user.membership.currentProjectRole;
    return this.isCurrentUserOwner || currentUserProjectRole === EUserProjectRoles.ADMIN;
  }

  /**
   * @description returns true if the page can be edited
   */
  get isContentEditable() {
    const isOwner = this.isCurrentUserOwner;
    const currentUserRole = this.store.user.membership.currentProjectRole;
    const isPublic = this.access === EPageAccess.PUBLIC;
    const isArchived = this.archived_at;
    const isLocked = this.is_locked;

    return (
      !isArchived &&
      !isLocked &&
      (isOwner || (isPublic && !!currentUserRole && currentUserRole >= EUserProjectRoles.MEMBER))
    );
  }

  updateTitle = action("updateTitle", (name: string) => {
    this.oldName = this.name ?? "";
    this.name = name;
  });

  updateDescription = action("updateDescription", (description_html: string) => {
    this.description_html = description_html;
  });

  setIsSubmitting = action("setIsSubmitting", (isSubmitting: "submitting" | "submitted" | "saved") => {
    this.isSubmitting = isSubmitting;
  });

  cleanup = action("cleanup", () => {
    this.disposers.forEach((disposer) => {
      disposer();
    });
  });

  /**
   * @description update the page
   * @param {Partial<TPage>} pageData
   */
  update = async (pageData: Partial<TPage>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const currentPage = this.asJSON;
    try {
      const currentPageResponse = await this.pageService.update(workspaceSlug, projectId, this.id, currentPage);
      if (currentPageResponse)
        runInAction(() => {
          Object.keys(pageData).forEach((key) => {
            const currentPageKey = key as keyof TPage;
            set(this, key, currentPageResponse?.[currentPageKey] || undefined);
          });
        });
    } catch (error) {
      runInAction(() => {
        Object.keys(pageData).forEach((key) => {
          const currentPageKey = key as keyof TPage;
          set(this, key, currentPage?.[currentPageKey] || undefined);
        });
      });
      throw error;
    }
  };

  /**
   * @description make the page public
   */
  makePublic = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageAccess = this.access;
    runInAction(() => (this.access = EPageAccess.PUBLIC));

    try {
      await this.pageService.update(workspaceSlug, projectId, this.id, {
        access: EPageAccess.PUBLIC,
      });
    } catch (error) {
      runInAction(() => {
        this.access = pageAccess;
      });
      throw error;
    }
  };

  /**
   * @description make the page private
   */
  makePrivate = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageAccess = this.access;
    runInAction(() => (this.access = EPageAccess.PRIVATE));

    try {
      await this.pageService.update(workspaceSlug, projectId, this.id, {
        access: EPageAccess.PRIVATE,
      });
    } catch (error) {
      runInAction(() => {
        this.access = pageAccess;
      });
      throw error;
    }
  };

  /**
   * @description lock the page
   */
  lock = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = true));

    await this.pageService.lock(workspaceSlug, projectId, this.id).catch((error) => {
      runInAction(() => {
        this.is_locked = pageIsLocked;
      });
      throw error;
    });
  };

  /**
   * @description unlock the page
   */
  unlock = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = false));

    await this.pageService.unlock(workspaceSlug, projectId, this.id).catch((error) => {
      runInAction(() => {
        this.is_locked = pageIsLocked;
      });
      throw error;
    });
  };

  /**
   * @description archive the page
   */
  archive = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    try {
      const response = await this.pageService.archive(workspaceSlug, projectId, this.id);
      runInAction(() => {
        this.archived_at = response.archived_at;
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description restore the page
   */
  restore = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    try {
      await this.pageService.restore(workspaceSlug, projectId, this.id);
      runInAction(() => {
        this.archived_at = null;
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description add the page to favorites
   */
  addToFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsFavorite = this.is_favorite;
    runInAction(() => {
      this.is_favorite = true;
    });

    await this.pageService.addToFavorites(workspaceSlug, projectId, this.id).catch((error) => {
      runInAction(() => {
        this.is_favorite = pageIsFavorite;
      });
      throw error;
    });
  };

  /**
   * @description remove the page from favorites
   */
  removeFromFavorites = async () => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId || !this.id) return undefined;

    const pageIsFavorite = this.is_favorite;
    runInAction(() => {
      this.is_favorite = false;
    });

    await this.pageService.removeFromFavorites(workspaceSlug, projectId, this.id).catch((error) => {
      runInAction(() => {
        this.is_favorite = pageIsFavorite;
      });
      throw error;
    });
  };
}
