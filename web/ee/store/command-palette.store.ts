import { action, computed, makeObservable, observable } from "mobx";
// types / constants
import { TCreateUpdateInitiativeModal, TCreateUpdateTeamModal, TCreateUpdateTeamViewModal } from "@plane/types";
import {
  DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA,
  DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA,
} from "@/plane-web/constants/teams";
// store
import { BaseCommandPaletteStore, IBaseCommandPaletteStore } from "@/store/base-command-palette.store";
import { DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA } from "../constants/initiative";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // observables
  createUpdateTeamModal: TCreateUpdateTeamModal;
  createUpdateTeamViewModal: TCreateUpdateTeamViewModal;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal;
  allStickiesModal: boolean;
  // computed
  isAnyModalOpen: boolean;
  // actions
  toggleCreateTeamModal: (value?: TCreateUpdateTeamModal) => void;
  toggleCreateTeamViewModal: (value?: TCreateUpdateTeamViewModal) => void;
  toggleCreateInitiativeModal: (value?: TCreateUpdateInitiativeModal) => void;
  toggleAllStickiesModal: (value?: boolean) => void;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  // observables
  createUpdateTeamModal: TCreateUpdateTeamModal = DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA;
  createUpdateTeamViewModal: TCreateUpdateTeamViewModal = DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal = DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA;
  allStickiesModal: boolean = false;
  constructor() {
    super();
    makeObservable(this, {
      // observables
      createUpdateTeamModal: observable,
      createUpdateTeamViewModal: observable,
      createUpdateInitiativeModal: observable,
      allStickiesModal: observable,
      // computed
      isAnyModalOpen: computed,
      // actions
      toggleCreateTeamModal: action,
      toggleCreateTeamViewModal: action,
      toggleCreateInitiativeModal: action,
      toggleAllStickiesModal: action,
    });
  }

  /**
   * Checks whether any modal is open or not in the base command palette.
   * @returns boolean
   */
  get isAnyModalOpen(): boolean {
    return Boolean(
      super.getCoreModalsState() ||
        this.createUpdateTeamModal.isOpen ||
        this.createUpdateTeamViewModal.isOpen ||
        this.createUpdateInitiativeModal.isOpen ||
        this.allStickiesModal
    );
  }

  /**
   * Toggles the create team modal
   * @param value
   * @returns
   */
  toggleCreateTeamModal = (value?: TCreateUpdateTeamModal) => {
    if (value) {
      this.createUpdateTeamModal = {
        isOpen: value.isOpen,
        teamId: value.teamId,
      };
    } else {
      this.createUpdateTeamModal = {
        isOpen: !this.createUpdateTeamModal.isOpen,
        teamId: undefined,
      };
    }
  };

  /**
   * Toggles the create team view modal
   * @param value
   * @returns
   */
  toggleCreateTeamViewModal = (value?: TCreateUpdateTeamViewModal) => {
    if (value) {
      this.createUpdateTeamViewModal = {
        isOpen: value.isOpen,
        teamId: value.teamId,
      };
    } else {
      this.createUpdateTeamViewModal = {
        isOpen: !this.createUpdateTeamViewModal.isOpen,
        teamId: undefined,
      };
    }
  };

  /**
   * Toggles the create initiative modal
   * @param value
   * @returns
   */
  toggleCreateInitiativeModal = (value?: TCreateUpdateInitiativeModal) => {
    if (value) {
      this.createUpdateInitiativeModal = {
        isOpen: value.isOpen,
        initiativeId: value.initiativeId,
      };
    } else {
      this.createUpdateInitiativeModal = {
        isOpen: !this.createUpdateInitiativeModal.isOpen,
        initiativeId: undefined,
      };
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
