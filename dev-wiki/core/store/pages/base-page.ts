import set from "lodash/set";
import { action, computed, makeObservable, observable, reaction, runInAction } from "mobx";
// plane imports
import { EPageAccess } from "@plane/constants";
import { EditorRefApi } from "@plane/editor";
import { TCollaborator, TDocumentPayload, TLogoProps, TNameDescriptionLoader, TPage } from "@plane/types";
import { TChangeHandlerProps } from "@plane/ui";
import { convertHexEmojiToDecimal } from "@plane/utils";
// plane web store
import { ExtendedBasePage, TExtendedPageInstance } from "@/plane-web/store/pages/extended-base-page";
import { RootStore } from "@/plane-web/store/root.store";

export type TVersionToBeRestored = {
  versionId: string | null;
  descriptionHTML: string | null;
};

export type TRestorationState = {
  versionId: string | null;
  descriptionHTML: string | null;
  inProgress: boolean;
};

export type TBasePage = TPage & {
  // observables
  isSubmitting: TNameDescriptionLoader;
  editorRef: EditorRefApi | null;
  restoration: TRestorationState;
  isSyncingWithServer: "syncing" | "synced" | "error";
  // computed
  asJSON: TPage | undefined;
  isCurrentUserOwner: boolean;
  // helpers
  oldName: string;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
  cleanup: () => void;
  // actions
  update: (pageData: Partial<TPage>) => Promise<Partial<TPage> | undefined>;
  updateTitle: (title: string) => void;
  updateDescription: (document: TDocumentPayload) => Promise<void>;
  makePublic: (params: { shouldSync?: boolean }) => Promise<void>;
  makePrivate: (params: { shouldSync?: boolean }) => Promise<void>;
  lock: (params: { shouldSync?: boolean; recursive?: boolean }) => Promise<void>;
  unlock: (params: { shouldSync?: boolean; recursive?: boolean }) => Promise<void>;
  archive: (params: { shouldSync?: boolean; archived_at?: string | null }) => Promise<void>;
  restore: (params: { shouldSync?: boolean }) => Promise<void>;
  updatePageLogo: (value: TChangeHandlerProps) => Promise<void>;
  addToFavorites: () => Promise<void>;
  removePageFromFavorites: () => Promise<void>;
  duplicate: () => Promise<TPage | undefined>;
  mutateProperties: (data: Partial<TPage>, shouldUpdateName?: boolean) => void;
  setEditorRef: (editorRef: EditorRefApi | null) => void;
  setVersionToBeRestored: (versionId: string | null, descriptionHTML: string | null) => void;
  setRestorationStatus: (inProgress: boolean) => void;
  setSyncingStatus: (status: "syncing" | "synced" | "error") => void;
};

export type TBasePagePermissions = {
  canCurrentUserAccessPage: boolean;
  canCurrentUserEditPage: boolean;
  canCurrentUserDuplicatePage: boolean;
  canCurrentUserLockPage: boolean;
  canCurrentUserChangeAccess: boolean;
  canCurrentUserArchivePage: boolean;
  canCurrentUserDeletePage: boolean;
  canCurrentUserFavoritePage: boolean;
  canCurrentUserMovePage: boolean;
  isContentEditable: boolean;
};

export type TBasePageServices = {
  update: (payload: Partial<TPage>) => Promise<Partial<TPage>>;
  updateDescription: (document: TDocumentPayload) => Promise<void>;
  updateAccess: (payload: Pick<TPage, "access">) => Promise<void>;
  lock: (recursive: boolean) => Promise<void>;
  unlock: (recursive: boolean) => Promise<void>;
  archive: () => Promise<{
    archived_at: string;
  }>;
  restore: () => Promise<void>;
  duplicate: () => Promise<TPage>;
};

export type TPageInstance = TBasePage &
  TExtendedPageInstance &
  TBasePagePermissions & {
    getRedirectionLink: () => string;
    fetchSubPages: () => Promise<void>;
    parentPageIds: string[];
    subPageIds: string[];
    subPages: TPageInstance[];
  };

export class BasePage extends ExtendedBasePage implements TBasePage {
  // loaders
  isSubmitting: TNameDescriptionLoader = "saved";
  editorRef: EditorRefApi | null = null;
  restoration: TRestorationState = {
    versionId: null,
    descriptionHTML: null,
    inProgress: false,
  };
  isSyncingWithServer: "syncing" | "synced" | "error" = "syncing";
  // page properties
  id: string | undefined;
  name: string | undefined;
  logo_props: TLogoProps | undefined;
  description_html: string | undefined;
  is_description_empty: boolean;
  color: string | undefined;
  label_ids: string[] | undefined;
  owned_by: string | undefined;
  access: EPageAccess | undefined;
  is_favorite: boolean;
  is_locked: boolean;
  archived_at: string | null | undefined;
  workspace: string | undefined;
  project_ids?: string[] | undefined;
  created_by: string | undefined;
  updated_by: string | undefined;
  created_at: Date | undefined;
  updated_at: Date | undefined;
  deleted_at: Date | undefined;
  moved_to_page: string | null;
  moved_to_project: string | null;
  // helpers
  oldName: string = "";
  // services
  services: TBasePageServices;
  // reactions
  disposers: Array<() => void> = [];
  // root store
  rootStore: RootStore;
  constructor(
    private store: RootStore,
    page: TPage,
    services: TBasePageServices
  ) {
    super(store, page, services);

    this.id = page?.id || undefined;
    this.name = page?.name;
    this.logo_props = page?.logo_props || undefined;
    this.description_html = page?.description_html || undefined;
    this.color = page?.color || undefined;
    this.label_ids = page?.label_ids || undefined;
    this.owned_by = page?.owned_by || undefined;
    this.access = page?.access || EPageAccess.PUBLIC;
    this.is_favorite = page?.is_favorite || false;
    this.is_locked = page?.is_locked || false;
    this.archived_at = page?.archived_at || undefined;
    this.workspace = page?.workspace || undefined;
    this.project_ids = page?.project_ids || undefined;
    this.created_by = page?.created_by || undefined;
    this.updated_by = page?.updated_by || undefined;
    this.created_at = page?.created_at || undefined;
    this.updated_at = page?.updated_at || undefined;
    this.oldName = page?.name || "";
    this.deleted_at = page?.deleted_at || undefined;
    this.moved_to_page = page?.moved_to_page || null;
    this.moved_to_project = page?.moved_to_project || null;
    this.is_description_empty = page?.is_description_empty || false;

    makeObservable(this, {
      // loaders
      isSubmitting: observable.ref,
      editorRef: observable.ref,
      // page properties
      id: observable.ref,
      name: observable.ref,
      logo_props: observable,
      description_html: observable.ref,
      color: observable.ref,
      label_ids: observable,
      owned_by: observable.ref,
      access: observable.ref,
      is_favorite: observable.ref,
      is_locked: observable.ref,
      archived_at: observable.ref,
      workspace: observable.ref,
      project_ids: observable,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      deleted_at: observable.ref,
      moved_to_page: observable.ref,
      moved_to_project: observable.ref,
      restoration: observable,
      isSyncingWithServer: observable.ref,
      // helpers
      oldName: observable.ref,
      setIsSubmitting: action,
      cleanup: action,
      // computed
      asJSON: computed,
      isCurrentUserOwner: computed,
      // actions
      update: action,
      updateTitle: action,
      updateDescription: action,
      makePublic: action,
      makePrivate: action,
      lock: action,
      unlock: action,
      archive: action,
      restore: action,
      updatePageLogo: action,
      addToFavorites: action,
      removePageFromFavorites: action,
      duplicate: action,
      mutateProperties: action,
      setEditorRef: action,
      setVersionToBeRestored: action,
      setRestorationStatus: action,
      setSyncingStatus: action,
    });

    this.rootStore = store;
    this.services = services;

    const titleDisposer = reaction(
      () => this.name,
      (name) => {
        this.isSubmitting = "submitting";
        this.services
          .update({
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
    this.disposers.push(titleDisposer);
  }

  // computed
  get asJSON() {
    return {
      id: this.id,
      name: this.name,
      description_html: this.description_html,
      color: this.color,
      label_ids: this.label_ids,
      owned_by: this.owned_by,
      access: this.access,
      logo_props: this.logo_props,
      is_favorite: this.is_favorite,
      is_locked: this.is_locked,
      archived_at: this.archived_at,
      workspace: this.workspace,
      project_ids: this.project_ids,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
      moved_to_page: this.moved_to_page,
      moved_to_project: this.moved_to_project,
      is_description_empty: this.is_description_empty,
      isSyncingWithServer: this.isSyncingWithServer,
      version_to_be_restored: this.restoration.versionId
        ? {
            versionId: this.restoration.versionId,
            descriptionHTML: this.restoration.descriptionHTML,
          }
        : null,
      ...this.asJSONExtended,
    };
  }

  get isCurrentUserOwner() {
    const currentUserId = this.store.user.data?.id;
    if (!currentUserId) return false;
    return this.owned_by === currentUserId;
  }

  /**
   * @description update the submitting state
   * @param value
   */
  setIsSubmitting = (value: TNameDescriptionLoader) => {
    runInAction(() => {
      this.isSubmitting = value;
    });
  };

  cleanup = () => {
    this.disposers.forEach((disposer) => {
      disposer();
    });
  };

  /**
   * @description update the page
   * @param {Partial<TPage>} pageData
   */
  update = async (pageData: Partial<TPage>) => {
    const currentPage = { ...this.asJSON };
    try {
      runInAction(() => {
        if (pageData.hasOwnProperty("parent_id") && pageData.parent_id !== this.parent_id) {
          if (pageData.parent_id === null && this.parent_id) {
            const pageDetails = this.rootStore.workspacePages.getPageById(this.parent_id);
            const newSubPagesCount = (pageDetails?.sub_pages_count ?? 1) - 1;
            pageDetails?.mutateProperties({ sub_pages_count: newSubPagesCount });
          } else if (pageData.parent_id) {
            const pageDetails = this.rootStore.workspacePages.getPageById(pageData.parent_id);
            const newSubPagesCount = (pageDetails?.sub_pages_count ?? 0) + 1;
            pageDetails?.mutateProperties({ sub_pages_count: newSubPagesCount });
          }
        }

        Object.keys(pageData).forEach((key) => {
          const currentPageKey = key as keyof TPage;
          set(this, key, pageData[currentPageKey] || undefined);
        });

        // Update the updated_at field locally to ensure reactions trigger
        this.updated_at = new Date();
      });

      return await this.services.update(pageData);
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
   * @description update the page title
   * @param title
   */
  updateTitle = (title: string) => {
    this.oldName = this.name ?? "";
    this.name = title;
  };

  /**
   * @description update the page description
   * @param {TDocumentPayload} document
   */
  updateDescription = async (document: TDocumentPayload) => {
    const currentDescription = this.description_html;
    runInAction(() => {
      this.description_html = document.description_html;
    });

    try {
      await this.services.updateDescription(document);
    } catch (error) {
      runInAction(() => {
        this.description_html = currentDescription;
      });
      throw error;
    }
  };

  /**
   * @description make the page public
   */
  makePublic = async ({ shouldSync = true }) => {
    const pageAccess = this.access;
    const oldIsShared = this.is_shared;
    runInAction(() => {
      this.access = EPageAccess.PUBLIC;
      this.is_shared = false;
    });

    if (shouldSync) {
      try {
        await this.services.updateAccess({
          access: EPageAccess.PUBLIC,
        });
      } catch (error) {
        runInAction(() => {
          this.access = pageAccess;
          this.is_shared = oldIsShared;
        });
        throw error;
      }
    }
  };

  /**
   * @description make the page private
   */
  makePrivate = async ({ shouldSync = true }) => {
    const pageAccess = this.access;
    runInAction(() => {
      this.access = EPageAccess.PRIVATE;
    });

    if (shouldSync) {
      try {
        await this.services.updateAccess({
          access: EPageAccess.PRIVATE,
        });
      } catch (error) {
        runInAction(() => {
          this.access = pageAccess;
        });
        throw error;
      }
    }
  };

  /**
   * @description lock the page
   */
  lock = async ({ shouldSync = true, recursive = true }) => {
    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = true));

    if (shouldSync) {
      await this.services.lock(recursive).catch((error) => {
        runInAction(() => {
          this.is_locked = pageIsLocked;
        });
        throw error;
      });
    }
  };

  /**
   * @description unlock the page
   */
  unlock = async ({ shouldSync = true, recursive = true }) => {
    const pageIsLocked = this.is_locked;
    runInAction(() => (this.is_locked = false));

    if (shouldSync) {
      await this.services.unlock(recursive).catch((error) => {
        runInAction(() => {
          this.is_locked = pageIsLocked;
        });
        throw error;
      });
    }
  };

  /**
   * @description archive the page
   */
  archive = async ({ shouldSync = true, archived_at }: { shouldSync?: boolean; archived_at?: string | null }) => {
    if (!this.id) return undefined;

    try {
      runInAction(() => {
        this.archived_at = archived_at ?? new Date().toISOString();
      });

      if (this.rootStore.favorite.entityMap[this.id]) this.rootStore.favorite.removeFavoriteFromStore(this.id);

      if (shouldSync) {
        const response = await this.services.archive();
        runInAction(() => {
          this.archived_at = response.archived_at;
        });
      }
    } catch (error) {
      console.error(error);
      runInAction(() => {
        this.archived_at = null;
      });
    }
  };

  /**
   * @description restore the page
   */
  restore = async ({ shouldSync = true }: { shouldSync?: boolean }) => {
    const archivedAtBeforeRestore = this.archived_at;

    try {
      runInAction(() => {
        this.archived_at = null;
      });

      if (shouldSync) {
        await this.services.restore();
      }
    } catch (error) {
      console.error(error);
      runInAction(() => {
        this.archived_at = archivedAtBeforeRestore;
      });
      throw error;
    }
  };

  updatePageLogo = async (value: TChangeHandlerProps) => {
    const originalLogoProps = { ...this.logo_props };
    try {
      let logoValue = {};
      if (value?.type === "emoji")
        logoValue = {
          value: convertHexEmojiToDecimal(value.value.unified),
          url: value.value.imageUrl,
        };
      else if (value?.type === "icon") logoValue = value.value;

      const logoProps: TLogoProps = {
        in_use: value?.type,
        [value?.type]: logoValue,
      };

      runInAction(() => {
        this.logo_props = logoProps;
      });
      await this.services.update({
        logo_props: logoProps,
      });
    } catch (error) {
      console.error("Error in updating page logo", error);
      runInAction(() => {
        this.logo_props = originalLogoProps as TLogoProps;
      });
      throw error;
    }
  };

  /**
   * @description add the page to favorites
   */
  addToFavorites = async () => {
    // const { workspaceSlug } = this.store.router;
    // const projectId = this.project_ids?.[0] ?? null;
    // if (!workspaceSlug || !this.id) return undefined;
    //
    // const pageIsFavorite = this.is_favorite;
    // runInAction(() => {
    //   this.is_favorite = true;
    // });
    // await this.rootStore.favorite
    //   .addFavorite(workspaceSlug.toString(), {
    //     entity_type: "page",
    //     entity_identifier: this.id,
    //     project_id: projectId,
    //     entity_data: { name: this.name || "" },
    //   })
    //   .catch((error) => {
    //     runInAction(() => {
    //       this.is_favorite = pageIsFavorite;
    //     });
    //     throw error;
    //   });
  };

  /**
   * @description remove the page from favorites
   */
  removePageFromFavorites = async () => {
    // const { workspaceSlug } = this.store.router;
    // if (!workspaceSlug || !this.id) return undefined;
    //
    // const pageIsFavorite = this.is_favorite;
    // runInAction(() => {
    //   this.is_favorite = false;
    // });
    //
    // await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, this.id).catch((error) => {
    //   runInAction(() => {
    //     this.is_favorite = pageIsFavorite;
    //   });
    //   throw error;
    // });
  };

  /**
   * @description duplicate the page
   */
  duplicate = async () => await this.services.duplicate();

  /**
   * @description mutate multiple properties at once
   * @param data Partial<TPage>
   */
  mutateProperties = (data: Partial<TPage>, shouldUpdateName: boolean = true) => {
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof TPage];
      if (key === "name" && !shouldUpdateName) return;
      set(this, key, value);
    });
  };

  setEditorRef = (editorRef: EditorRefApi | null) => {
    runInAction(() => {
      this.editorRef = editorRef;
    });
  };

  /**
   * @description set the version to be restored data
   * @param versionId
   * @param descriptionHTML
   */
  setVersionToBeRestored = (versionId: string | null, descriptionHTML: string | null) => {
    runInAction(() => {
      this.restoration = {
        ...this.restoration,
        versionId,
        descriptionHTML,
      };
    });
  };

  setRestorationStatus = (inProgress: boolean) => {
    runInAction(() => {
      this.restoration = {
        ...this.restoration,
        inProgress,
      };
    });
  };

  setSyncingStatus = (status: "syncing" | "synced" | "error") => {
    runInAction(() => {
      this.isSyncingWithServer = status;
    });
  };
}
