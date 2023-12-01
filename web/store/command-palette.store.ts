import { observable, action, makeObservable, computed } from "mobx";
// types
import { RootStore } from "./root";
// services
import { ProjectService } from "services/project";
import { PageService } from "services/page.service";

export enum EProjectStore {
  PROJECT = "ProjectStore",
  PROJECT_VIEW = "ProjectViewStore",
  PROFILE = "ProfileStore",
  MODULE = "ModuleStore",
  CYCLE = "CycleStore",
}

export interface ModalData {
  store: EProjectStore;
  viewId: string;
}

export interface ICommandPaletteStore {
  isCommandPaletteOpen: boolean;
  isShortcutModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  isCreateCycleModalOpen: boolean;
  isCreateModuleModalOpen: boolean;
  isCreateViewModalOpen: boolean;
  isCreatePageModalOpen: boolean;
  isCreateIssueModalOpen: boolean;
  isDeleteIssueModalOpen: boolean;
  isBulkDeleteIssueModalOpen: boolean;

  // computed
  isAnyModalOpen: boolean;

  toggleCommandPaletteModal: (value?: boolean) => void;
  toggleShortcutModal: (value?: boolean) => void;
  toggleCreateProjectModal: (value?: boolean) => void;
  toggleCreateCycleModal: (value?: boolean) => void;
  toggleCreateViewModal: (value?: boolean) => void;
  toggleCreatePageModal: (value?: boolean) => void;
  toggleCreateIssueModal: (value?: boolean, storeType?: EProjectStore) => void;
  toggleCreateModuleModal: (value?: boolean) => void;
  toggleDeleteIssueModal: (value?: boolean) => void;
  toggleBulkDeleteIssueModal: (value?: boolean) => void;

  createIssueStoreType: EProjectStore;
}

class CommandPaletteStore implements ICommandPaletteStore {
  isCommandPaletteOpen: boolean = false;
  isShortcutModalOpen: boolean = false;
  isCreateProjectModalOpen: boolean = false;
  isCreateCycleModalOpen: boolean = false;
  isCreateModuleModalOpen: boolean = false;
  isCreateViewModalOpen: boolean = false;
  isCreatePageModalOpen: boolean = false;
  isCreateIssueModalOpen: boolean = false;
  isDeleteIssueModalOpen: boolean = false;
  isBulkDeleteIssueModalOpen: boolean = false;
  // root store
  rootStore;
  // service
  projectService;
  pageService;

  createIssueStoreType: EProjectStore = EProjectStore.PROJECT;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      isCommandPaletteOpen: observable.ref,
      isShortcutModalOpen: observable.ref,
      isCreateProjectModalOpen: observable.ref,
      isCreateCycleModalOpen: observable.ref,
      isCreateModuleModalOpen: observable.ref,
      isCreateViewModalOpen: observable.ref,
      isCreatePageModalOpen: observable.ref,
      isCreateIssueModalOpen: observable.ref,
      isDeleteIssueModalOpen: observable.ref,
      isBulkDeleteIssueModalOpen: observable.ref,
      // computed
      isAnyModalOpen: computed,
      // projectPages: computed,
      // action
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
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.pageService = new PageService();
  }

  get isAnyModalOpen() {
    return Boolean(
      this.isCreateIssueModalOpen ||
        this.isCreateCycleModalOpen ||
        this.isCreatePageModalOpen ||
        this.isCreateProjectModalOpen ||
        this.isCreateModuleModalOpen ||
        this.isCreateViewModalOpen ||
        this.isShortcutModalOpen ||
        this.isBulkDeleteIssueModalOpen ||
        this.isDeleteIssueModalOpen
    );
  }

  toggleCommandPaletteModal = (value?: boolean) => {
    if (value) {
      this.isCommandPaletteOpen = value;
    } else {
      this.isCommandPaletteOpen = !this.isCommandPaletteOpen;
    }
  };

  toggleShortcutModal = (value?: boolean) => {
    if (value) {
      this.isShortcutModalOpen = value;
    } else {
      this.isShortcutModalOpen = !this.isShortcutModalOpen;
    }
  };

  toggleCreateProjectModal = (value?: boolean) => {
    if (value) {
      this.isCreateProjectModalOpen = value;
    } else {
      this.isCreateProjectModalOpen = !this.isCreateProjectModalOpen;
    }
  };

  toggleCreateCycleModal = (value?: boolean) => {
    if (value) {
      this.isCreateCycleModalOpen = value;
    } else {
      this.isCreateCycleModalOpen = !this.isCreateCycleModalOpen;
    }
  };

  toggleCreateViewModal = (value?: boolean) => {
    if (value) {
      this.isCreateViewModalOpen = value;
    } else {
      this.isCreateViewModalOpen = !this.isCreateViewModalOpen;
    }
  };

  toggleCreatePageModal = (value?: boolean) => {
    if (value) {
      this.isCreatePageModalOpen = value;
    } else {
      this.isCreatePageModalOpen = !this.isCreatePageModalOpen;
    }
  };

  toggleCreateIssueModal = (value?: boolean, storeType?: EProjectStore) => {
    if (value) {
      this.isCreateIssueModalOpen = value;
      this.createIssueStoreType = storeType || EProjectStore.PROJECT;
    } else {
      this.isCreateIssueModalOpen = !this.isCreateIssueModalOpen;
      this.createIssueStoreType = EProjectStore.PROJECT;
    }
  };

  toggleDeleteIssueModal = (value?: boolean) => {
    if (value) {
      this.isDeleteIssueModalOpen = value;
    } else {
      this.isDeleteIssueModalOpen = !this.isDeleteIssueModalOpen;
    }
  };

  toggleCreateModuleModal = (value?: boolean) => {
    if (value) {
      this.isCreateModuleModalOpen = value;
    } else {
      this.isCreateModuleModalOpen = !this.isCreateModuleModalOpen;
    }
  };

  toggleBulkDeleteIssueModal = (value?: boolean) => {
    if (value) {
      this.isBulkDeleteIssueModalOpen = value;
    } else {
      this.isBulkDeleteIssueModalOpen = !this.isBulkDeleteIssueModalOpen;
    }
  };
}

export default CommandPaletteStore;
