import { action, makeObservable, observable, reaction, runInAction } from "mobx";

import { IIssueLabel, IPage } from "@plane/types";
import { PageService } from "services/page.service";

import { RootStore } from "./root.store";

export interface IPageStore {
  // Page Properties
  access: number;
  archived_at: string | null;
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html: string;
  description_stripped: string | null;
  id: string;
  is_favorite: boolean;
  label_details: IIssueLabel[];
  is_locked: boolean;
  labels: string[];
  name: string;
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;

  // Actions
  makePublic: () => Promise<void>;
  makePrivate: () => Promise<void>;
  lockPage: () => Promise<void>;
  unlockPage: () => Promise<void>;
  addToFavorites: () => Promise<void>;
  removeFromFavorites: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateDescription: (description: string) => Promise<void>;

  // Reactions
  disposers: Array<() => void>;

  // Helpers
  oldName: string;
  cleanup: () => void;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (isSubmitting: "submitting" | "submitted" | "saved") => void;
}

export class PageStore implements IPageStore {
  access = 0;
  isSubmitting: "submitting" | "submitted" | "saved" = "saved";
  archived_at: string | null;
  color: string;
  created_at: Date;
  created_by: string;
  description: string;
  description_html = "";
  description_stripped: string | null;
  id: string;
  is_favorite = false;
  is_locked = true;
  labels: string[];
  name = "";
  owned_by: string;
  project: string;
  updated_at: Date;
  updated_by: string;
  workspace: string;
  oldName = "";
  label_details: IIssueLabel[] = [];
  disposers: Array<() => void> = [];

  pageService;
  // root store
  rootStore;

  constructor(page: IPage, _rootStore: RootStore) {
    makeObservable(this, {
      name: observable.ref,
      description_html: observable.ref,
      is_favorite: observable.ref,
      is_locked: observable.ref,
      isSubmitting: observable.ref,
      access: observable.ref,

      makePublic: action,
      makePrivate: action,
      addToFavorites: action,
      removeFromFavorites: action,
      updateName: action,
      updateDescription: action,
      setIsSubmitting: action,
      cleanup: action,
    });
    this.created_by = page?.created_by || "";
    this.created_at = page?.created_at || new Date();
    this.color = page?.color || "";
    this.archived_at = page?.archived_at || null;
    this.name = page?.name || "";
    this.description = page?.description || "";
    this.description_stripped = page?.description_stripped || "";
    this.description_html = page?.description_html || "";
    this.access = page?.access || 0;
    this.workspace = page?.workspace || "";
    this.updated_by = page?.updated_by || "";
    this.updated_at = page?.updated_at || new Date();
    this.project = page?.project || "";
    this.owned_by = page?.owned_by || "";
    this.labels = page?.labels || [];
    this.label_details = page?.label_details || [];
    this.is_locked = page?.is_locked || false;
    this.id = page?.id || "";
    this.is_favorite = page?.is_favorite || false;
    this.oldName = page?.name || "";

    this.rootStore = _rootStore;
    this.pageService = new PageService();

    const descriptionDisposer = reaction(
      () => this.description_html,
      (description_html) => {
        //TODO: Fix reaction to only run when the data is changed, not when the page is loaded
        const { projectId, workspaceSlug } = this.rootStore.app.router;
        if (!projectId || !workspaceSlug) return;
        this.isSubmitting = "submitting";
        this.pageService.patchPage(workspaceSlug, projectId, this.id, { description_html }).finally(() => {
          runInAction(() => {
            this.isSubmitting = "submitted";
          });
        });
      },
      { delay: 3000 }
    );

    const pageTitleDisposer = reaction(
      () => this.name,
      (name) => {
        const { projectId, workspaceSlug } = this.rootStore.app.router;
        if (!projectId || !workspaceSlug) return;
        this.isSubmitting = "submitting";
        this.pageService
          .patchPage(workspaceSlug, projectId, this.id, { name })
          .catch(() => {
            runInAction(() => {
              this.name = this.oldName;
            });
          })
          .finally(() => {
            runInAction(() => {
              this.isSubmitting = "submitted";
            });
          });
      },
      { delay: 2000 }
    );

    this.disposers.push(descriptionDisposer, pageTitleDisposer);
  }

  updateName = action("updateName", async (name: string) => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.oldName = this.name;
    this.name = name;
  });

  updateDescription = action("updateDescription", async (description_html: string) => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.description_html = description_html;
  });

  cleanup = action("cleanup", () => {
    this.disposers.forEach((disposer) => {
      disposer();
    });
  });

  setIsSubmitting = action("setIsSubmitting", (isSubmitting: "submitting" | "submitted" | "saved") => {
    this.isSubmitting = isSubmitting;
  });

  lockPage = action("lockPage", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.is_locked = true;

    await this.pageService.lockPage(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => {
        this.is_locked = false;
      });
    });
  });

  unlockPage = action("unlockPage", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.is_locked = false;

    await this.pageService.unlockPage(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => {
        this.is_locked = true;
      });
    });
  });

  /**
   * Add Page to users favorites list
   */
  addToFavorites = action("addToFavorites", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.is_favorite = true;

    await this.pageService.addPageToFavorites(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => {
        this.is_favorite = false;
      });
    });
  });

  /**
   * Remove page from the users favorites list
   */
  removeFromFavorites = action("removeFromFavorites", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.is_favorite = false;

    await this.pageService.removePageFromFavorites(workspaceSlug, projectId, this.id).catch(() => {
      runInAction(() => {
        this.is_favorite = true;
      });
    });
  });

  /**
   * make a page public
   * @returns
   */
  makePublic = action("makePublic", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.access = 0;

    this.pageService.patchPage(workspaceSlug, projectId, this.id, { access: 0 }).catch(() => {
      runInAction(() => {
        this.access = 1;
      });
    });
  });

  /**
   * Make a page private
   * @returns
   */
  makePrivate = action("makePrivate", async () => {
    const { projectId, workspaceSlug } = this.rootStore.app.router;
    if (!projectId || !workspaceSlug) return;

    this.access = 1;

    this.pageService.patchPage(workspaceSlug, projectId, this.id, { access: 1 }).catch(() => {
      runInAction(() => {
        this.access = 0;
      });
    });
  });
}
