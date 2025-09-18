import { action, computed, makeObservable, observable, runInAction } from "mobx";
import {
  EPageSharedUserAccess,
  type TPageCommentDescription,
  type TCollaborator,
  type TPage,
  type TPageExtended,
  type TPageSharedUser,
  type JSONContent,
} from "@plane/types";
import { RootStore } from "@/plane-web/store/root.store";
import { TBasePageServices, TPageInstance } from "@/store/pages/base-page";
import { CommentStore } from "./comments/comment.store";

// Define PageWithConfig interface to match comment store expectations
type PageWithConfig = {
  id?: string;
  _config: Record<string, string> | null;
  _getBasePath: ((params: { pageId: string; config: Record<string, string> }) => string) | null;
};

export type TCommentHandlers = {
  onDelete: (commentId: string) => Promise<void>;
  onRestore: (commentId: string) => Promise<void>;
  onResolve: (commentId: string) => Promise<void>;
  onUnresolve: (commentId: string) => Promise<void>;
  onFetchComments: () => Promise<void>;
  onCreateComment: (data: {
    description: TPageCommentDescription;
    reference_stripped?: string;
    parent_id?: string;
  }) => Promise<any>;
  onFetchThreadComments: (threadId: string) => Promise<void>;
  onUpdateComment: (data: {
    description: { description_html: string; description_json: JSONContent };
  }) => Promise<void>;
};

export type TDeletePageModalState = {
  visible: boolean;
  pages: TPageInstance[];
};

export type TExtendedPageInstance = TPageExtended & {
  asJSONExtended: TPageExtended;
  // computed
  currentUserSharedAccess: EPageSharedUserAccess | null;
  hasSharedAccess: boolean;
  canViewWithSharedAccess: boolean;
  canCommentWithSharedAccess: boolean;
  canEditWithSharedAccess: boolean;
  // page comment store
  comments: CommentStore;
  // modals state
  deletePageModal: TDeletePageModalState;
  // actions
  updateCollaborators: (collaborators: TCollaborator[]) => void;
  updateSharedUsers: (sharedUsers: TPageSharedUser[]) => void;
  appendSharedUsers: (sharedUsers: TPageSharedUser[]) => void;
  removeSharedUser: (userId: string) => void;
  updateSharedUserAccess: (userId: string, access: EPageSharedUserAccess) => void;
  addSharedUser: (userId: string, access?: EPageSharedUserAccess) => void;
  setSharedAccess: (value: EPageSharedUserAccess | null) => void;
  // modal actions
  openDeletePageModal: (pages: TPageInstance[]) => void;
  closeDeletePageModal: () => void;
};

export type TExtendedBasePagePermissions = {
  canCurrentUserCommentOnPage: boolean;
};

export class ExtendedBasePage implements TExtendedPageInstance {
  // shared page properties
  shared_access: EPageSharedUserAccess | null;
  is_shared: boolean;
  collaborators: TCollaborator[];
  sub_pages_count: number | undefined;
  team: string | null | undefined;
  parent_id: string | null | undefined;
  anchor?: string | null | undefined;
  sort_order: number | undefined;
  sharedUsers: TPageSharedUser[];
  comments: CommentStore;

  // modals state
  deletePageModal: TDeletePageModalState;

  // root store and services
  rootStore: RootStore;
  services: TBasePageServices;

  constructor(store: RootStore, page: TPage, services: TBasePageServices) {
    // Initialize shared page properties
    this.shared_access = page?.shared_access ?? null;
    this.is_shared = page?.is_shared || false;
    this.collaborators = [];
    this.sub_pages_count = !page?.sub_pages_count ? 0 : page.sub_pages_count;
    this.team = page?.team || null;
    this.parent_id = page?.parent_id === null ? null : page?.parent_id;
    this.anchor = page?.anchor || undefined;
    this.sort_order = page?.sort_order || undefined;
    this.sharedUsers = [];

    // Initialize modals state
    this.deletePageModal = {
      visible: false,
      pages: [],
    };

    this.rootStore = store;
    this.services = services;

    // Initialize page-specific comment store with context and service
    this.comments = new CommentStore(store, this as unknown as PageWithConfig);

    makeObservable(this, {
      // shared page properties
      shared_access: observable.ref,
      is_shared: observable.ref,
      collaborators: observable,
      sub_pages_count: observable.ref,
      team: observable.ref,
      parent_id: observable.ref,
      anchor: observable.ref,
      sort_order: observable.ref,
      sharedUsers: observable,
      // modals state
      deletePageModal: observable,
      // computed
      currentUserSharedAccess: computed,
      hasSharedAccess: computed,
      canViewWithSharedAccess: computed,
      canCommentWithSharedAccess: computed,
      canEditWithSharedAccess: computed,
      // actions
      updateCollaborators: action,
      updateSharedUsers: action,
      appendSharedUsers: action,
      removeSharedUser: action,
      updateSharedUserAccess: action,
      addSharedUser: action,
      setSharedAccess: action,
      // modal actions
      openDeletePageModal: action,
      closeDeletePageModal: action,
    });
  }

  get asJSONExtended(): TPageExtended {
    return {
      shared_access: this.shared_access,
      is_shared: this.is_shared,
      collaborators: this.collaborators,
      sub_pages_count: this.sub_pages_count,
      team: this.team,
      parent_id: this.parent_id,
      anchor: this.anchor,
      sort_order: this.sort_order,
      sharedUsers: this.sharedUsers,
    };
  }

  /**
   * @description returns the shared access level for the current user
   * null: owner, "0": view, "1": comment, "2": edit
   */
  get currentUserSharedAccess() {
    return this.shared_access;
  }

  /**
   * @description returns true if the current user has shared access (not owner)
   */
  get hasSharedAccess() {
    return this.shared_access !== null && this.shared_access !== undefined;
  }

  /**
   * @description returns true if the current user can view the page based on shared access
   */
  get canViewWithSharedAccess() {
    if (!this.hasSharedAccess) return false;
    const access = this.shared_access;
    if (access === null) return false;
    return access >= 0; // 0: view, 1: comment, 2: edit
  }

  /**
   * @description returns true if the current user can comment on the page based on shared access
   */
  get canCommentWithSharedAccess() {
    if (!this.hasSharedAccess) return false;
    const access = this.shared_access;
    if (access === null) return false;
    return access >= 1; // 1: comment, 2: edit
  }

  /**
   * @description returns true if the current user can edit the page based on shared access
   */
  get canEditWithSharedAccess() {
    if (!this.hasSharedAccess) return false;
    const access = this.shared_access;
    if (access === null) return false;
    return access >= 2; // 2: edit
  }

  /**
   * @description update the collaborators
   * @param collaborators
   */
  updateCollaborators = (collaborators: TCollaborator[]) => {
    this.collaborators = collaborators;
  };

  /**
   * @description update the shared users
   * @param sharedUsers
   */
  updateSharedUsers = (sharedUsers: TPageSharedUser[]) => {
    runInAction(() => {
      this.sharedUsers = sharedUsers;
    });
  };

  appendSharedUsers = (sharedUsers: TPageSharedUser[]) => {
    runInAction(() => {
      // Merge new users with existing ones, avoiding duplicates
      const existingUserIds = new Set(this.sharedUsers.map((user) => user.user_id));
      const newUsers = sharedUsers.filter((user) => !existingUserIds.has(user.user_id));
      this.sharedUsers = [...this.sharedUsers, ...newUsers];
    });
  };

  removeSharedUser = (userId: string) => {
    runInAction(() => {
      this.sharedUsers = this.sharedUsers.filter((user) => user.user_id !== userId);
    });
  };

  updateSharedUserAccess = (userId: string, access: EPageSharedUserAccess) => {
    runInAction(() => {
      const userIndex = this.sharedUsers.findIndex((user) => user.user_id === userId);
      if (userIndex !== -1) {
        this.sharedUsers[userIndex] = { ...this.sharedUsers[userIndex], access };
      }
    });
  };

  addSharedUser = (userId: string, access: EPageSharedUserAccess = EPageSharedUserAccess.VIEW) => {
    runInAction(() => {
      const existingUser = this.sharedUsers.find((user) => user.user_id === userId);
      if (!existingUser) {
        this.sharedUsers.push({ user_id: userId, access });
      }
    });
  };

  setSharedAccess = (value: EPageSharedUserAccess | null) => {
    runInAction(() => {
      this.shared_access = value;
    });
  };

  /**
   * @description opens the delete page modal with specified pages
   * @param pages - array of pages to delete
   */
  openDeletePageModal = (pages: TPageInstance[]) => {
    runInAction(() => {
      this.deletePageModal = {
        visible: true,
        pages,
      };
    });
  };

  /**
   * @description closes the delete page modal
   */
  closeDeletePageModal = () => {
    runInAction(() => {
      this.deletePageModal = {
        visible: false,
        pages: [],
      };
    });
  };
}
