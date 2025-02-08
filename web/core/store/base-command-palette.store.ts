import { observable, action, makeObservable } from "mobx";
import {
  EIssuesStoreType,
  TCreateModalStoreTypes,
  DEFAULT_CREATE_PAGE_MODAL_DATA,
  EPageAccess,
  TCreatePageModal,
} from "@plane/constants";

export interface ModalData {
  store: EIssuesStoreType;
  viewId: string;
}

export interface IBaseCommandPaletteStore {
  // observables
  isCommandPaletteOpen: boolean;
  isShortcutModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isCreateCycleModalOpen: boolean;
  isCreateModuleModalOpen: boolean;
  isCreateViewModalOpen: boolean;
  createPageModal: TCreatePageModal;
  isCreateIssueModalOpen: boolean;
  isDeleteIssueModalOpen: boolean;
  isBulkDeleteIssueModalOpen: boolean;
  createIssueStoreType: TCreateModalStoreTypes;
  allStickiesModal: boolean;
  // toggle actions
  toggleCommandPaletteModal: (value?: boolean) => void;
  toggleShortcutModal: (value?: boolean) => void;
  toggleCreateProjectModal: (value?: boolean) => void;
  toggleCreateCycleModal: (value?: boolean) => void;
  toggleCreateViewModal: (value?: boolean) => void;
  toggleCreatePageModal: (value?: TCreatePageModal) => void;
  toggleCreateIssueModal: (value?: boolean, storeType?: TCreateModalStoreTypes) => void;
  toggleCreateModuleModal: (value?: boolean) => void;
  toggleDeleteIssueModal: (value?: boolean) => void;
  toggleBulkDeleteIssueModal: (value?: boolean) => void;
  toggleAllStickiesModal: (value?: boolean) => void;
}

export abstract class BaseCommandPaletteStore implements IBaseCommandPaletteStore {
  // observables
  isCommandPaletteOpen: boolean = false;
  isShortcutModalOpen: boolean = false;
  isCreateProjectModalOpen: boolean = false;
  isCreateCycleModalOpen: boolean = false;
  isCreateModuleModalOpen: boolean = false;
  isCreateViewModalOpen: boolean = false;
  isCreateIssueModalOpen: boolean = false;
  isDeleteIssueModalOpen: boolean = false;
  isBulkDeleteIssueModalOpen: boolean = false;
  createPageModal: TCreatePageModal = DEFAULT_CREATE_PAGE_MODAL_DATA;
  createIssueStoreType: TCreateModalStoreTypes = EIssuesStoreType.PROJECT;
  allStickiesModal: boolean = false;

  constructor() {
    makeObservable(this, {
      // observable
      isCommandPaletteOpen: observable.ref,
      isShortcutModalOpen: observable.ref,
      isCreateProjectModalOpen: observable.ref,
      isCreateCycleModalOpen: observable.ref,
      isCreateModuleModalOpen: observable.ref,
      isCreateViewModalOpen: observable.ref,
      isCreateIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      isBulkDeleteIssueModalOpen: observable.ref,
      createPageModal: observable,
      createIssueStoreType: observable,
      allStickiesModal: observable,
      // projectPages: computed,
      // toggle actions
      toggleCommandPaletteModal: action,
      toggleShortcutModal: action,
      toggleCreateProjectModal: action,
      toggleCreateCycleModal: action,
      toggleCreateViewModal: action,
      toggleCreatePageModal: action,
      toggleCreateIssueModal: action,
      toggleCreateModuleModal: action,
      toggleDeleteIssueModal: action,
      toggleBulkDeleteIssueModal: action,
      toggleAllStickiesModal: action,
    });
  }

  /**
   * Returns whether any base modal is open
   * @protected - allows access from child classes
   */
  protected getCoreModalsState(): boolean {
    return Boolean(
      this.isCreateIssueModalOpen ||
        this.isCreateCycleModalOpen ||
        this.isCreateProjectModalOpen ||
        this.isCreateModuleModalOpen ||
        this.isCreateViewModalOpen ||
        this.isShortcutModalOpen ||
        this.isBulkDeleteIssueModalOpen ||
        this.isDeleteIssueModalOpen ||
        this.createPageModal.isOpen ||
        this.allStickiesModal
    );
  }

  /**
   * Toggles the command palette modal
   * @param value
   * @returns
   */
  toggleCommandPaletteModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isCommandPaletteOpen = value;
    } else {
      this.isCommandPaletteOpen = !this.isCommandPaletteOpen;
    }
  };

  /**
   * Toggles the shortcut modal
   * @param value
   * @returns
   */
  toggleShortcutModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isShortcutModalOpen = value;
    } else {
      this.isShortcutModalOpen = !this.isShortcutModalOpen;
    }
  };

  /**
   * Toggles the create project modal
   * @param value
   * @returns
   */
  toggleCreateProjectModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isCreateProjectModalOpen = value;
    } else {
      this.isCreateProjectModalOpen = !this.isCreateProjectModalOpen;
    }
  };

  /**
   * Toggles the create cycle modal
   * @param value
   * @returns
   */
  toggleCreateCycleModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isCreateCycleModalOpen = value;
    } else {
      this.isCreateCycleModalOpen = !this.isCreateCycleModalOpen;
    }
  };

  /**
   * Toggles the create view modal
   * @param value
   * @returns
   */
  toggleCreateViewModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isCreateViewModalOpen = value;
    } else {
      this.isCreateViewModalOpen = !this.isCreateViewModalOpen;
    }
  };

  /**
   * Toggles the create page modal along with the page access
   * @param value
   * @returns
   */
  toggleCreatePageModal = (value?: TCreatePageModal) => {
    if (value) {
      this.createPageModal = {
        isOpen: value.isOpen,
        pageAccess: value.pageAccess || EPageAccess.PUBLIC,
      };
    } else {
      this.createPageModal = {
        isOpen: !this.createPageModal.isOpen,
        pageAccess: EPageAccess.PUBLIC,
      };
    }
  };

  /**
   * Toggles the create issue modal
   * @param value
   * @param storeType
   * @returns
   */
  toggleCreateIssueModal = (value?: boolean, storeType?: TCreateModalStoreTypes) => {
    if (value !== undefined) {
      this.isCreateIssueModalOpen = value;
      this.createIssueStoreType = storeType || EIssuesStoreType.PROJECT;
    } else {
      this.isCreateIssueModalOpen = !this.isCreateIssueModalOpen;
      this.createIssueStoreType = EIssuesStoreType.PROJECT;
    }
  };

  /**
   * Toggles the delete issue modal
   * @param value
   * @returns
   */
  toggleDeleteIssueModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isDeleteIssueModalOpen = value;
    } else {
      this.isDeleteIssueModalOpen = !this.isDeleteIssueModalOpen;
    }
  };

  /**
   * Toggles the create module modal
   * @param value
   * @returns
   */
  toggleCreateModuleModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isCreateModuleModalOpen = value;
    } else {
      this.isCreateModuleModalOpen = !this.isCreateModuleModalOpen;
    }
  };

  /**
   * Toggles the bulk delete issue modal
   * @param value
   * @returns
   */
  toggleBulkDeleteIssueModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isBulkDeleteIssueModalOpen = value;
    } else {
      this.isBulkDeleteIssueModalOpen = !this.isBulkDeleteIssueModalOpen;
    }
  };

  /**
   * Toggles the all stickies modal
   * @param value
   * @returns
   */
  toggleAllStickiesModal = (value?: boolean) => {
    if (value) {
      this.allStickiesModal = value;
    } else {
      this.allStickiesModal = !this.allStickiesModal;
    }
  };
}
