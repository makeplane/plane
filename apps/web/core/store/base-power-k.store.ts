import { observable, action, makeObservable } from "mobx";
// plane imports
import type { EIssuesStoreType } from "@plane/types";
// components
import type { IPowerKCommandRegistry } from "@/components/power-k/core/registry";
import { PowerKCommandRegistry } from "@/components/power-k/core/registry";
import type { TPowerKContextType, TPowerKPageType } from "@/components/power-k/core/types";

export interface ModalData {
  store: EIssuesStoreType;
  viewId: string;
}

export interface IBasePowerKStore {
  // observables
  isPowerKModalOpen: boolean;
  isShortcutsListModalOpen: boolean;
  commandRegistry: IPowerKCommandRegistry;
  activeContext: TPowerKContextType | null;
  activePage: TPowerKPageType | null;
  topNavInputRef: React.RefObject<HTMLInputElement> | null;
  topNavSearchInputRef: React.RefObject<HTMLInputElement> | null;
  setActiveContext: (entity: TPowerKContextType | null) => void;
  setActivePage: (page: TPowerKPageType | null) => void;
  setTopNavInputRef: (ref: React.RefObject<HTMLInputElement> | null) => void;
  setTopNavSearchInputRef: (ref: React.RefObject<HTMLInputElement> | null) => void;
  // toggle actions
  togglePowerKModal: (value?: boolean) => void;
  toggleShortcutsListModal: (value?: boolean) => void;
}

export abstract class BasePowerKStore implements IBasePowerKStore {
  // observables
  isPowerKModalOpen: boolean = false;
  isShortcutsListModalOpen: boolean = false;
  commandRegistry: IPowerKCommandRegistry = new PowerKCommandRegistry();
  activeContext: TPowerKContextType | null = null;
  activePage: TPowerKPageType | null = null;
  topNavInputRef: React.RefObject<HTMLInputElement> | null = null;
  topNavSearchInputRef: React.RefObject<HTMLInputElement> | null = null;

  constructor() {
    makeObservable(this, {
      // observable
      isPowerKModalOpen: observable.ref,
      isShortcutsListModalOpen: observable.ref,
      commandRegistry: observable.ref,
      activeContext: observable,
      activePage: observable,
      topNavInputRef: observable.ref,
      topNavSearchInputRef: observable.ref,
      // toggle actions
      togglePowerKModal: action,
      toggleShortcutsListModal: action,
      setActiveContext: action,
      setActivePage: action,
      setTopNavInputRef: action,
      setTopNavSearchInputRef: action,
    });
  }

  /**
   * Sets the active context entity
   * @param entity
   */
  setActiveContext = (entity: TPowerKContextType | null) => {
    this.activeContext = entity;
  };

  /**
   * Sets the active page
   * @param page
   */
  setActivePage = (page: TPowerKPageType | null) => {
    this.activePage = page;
  };

  /**
   * Sets the top nav input ref for keyboard shortcut access
   * @param ref
   */
  setTopNavInputRef = (ref: React.RefObject<HTMLInputElement> | null) => {
    this.topNavInputRef = ref;
  };

  /**
   * Sets the top nav search input ref for keyboard shortcut access
   * @param ref
   */
  setTopNavSearchInputRef = (ref: React.RefObject<HTMLInputElement> | null) => {
    this.topNavSearchInputRef = ref;
  };

  /**
   * Toggles the command palette modal
   * @param value
   * @returns
   */
  togglePowerKModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isPowerKModalOpen = value;
    } else {
      this.isPowerKModalOpen = !this.isPowerKModalOpen;
    }
  };

  /**
   * Toggles the shortcut modal
   * @param value
   * @returns
   */
  toggleShortcutsListModal = (value?: boolean) => {
    if (value !== undefined) {
      this.isShortcutsListModalOpen = value;
    } else {
      this.isShortcutsListModalOpen = !this.isShortcutsListModalOpen;
    }
  };
}
