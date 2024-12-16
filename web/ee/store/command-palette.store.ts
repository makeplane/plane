import { action, computed, makeObservable, observable } from "mobx";
// types / constants
import { TCreateUpdateTeamModal, TCreateUpdateTeamViewModal } from "@plane/types";
import {
  DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA,
  DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA,
} from "@/plane-web/constants/teams";
// store
import { BaseCommandPaletteStore, IBaseCommandPaletteStore } from "@/store/base-command-palette.store";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // observables
  createUpdateTeamModal: TCreateUpdateTeamModal;
  createUpdateTeamViewModal: TCreateUpdateTeamViewModal;
  // computed
  isAnyModalOpen: boolean;
  // actions
  toggleCreateTeamModal: (value?: TCreateUpdateTeamModal) => void;
  toggleCreateTeamViewModal: (value?: TCreateUpdateTeamViewModal) => void;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  // observables
  createUpdateTeamModal: TCreateUpdateTeamModal = DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA;
  createUpdateTeamViewModal: TCreateUpdateTeamViewModal = DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA;

  constructor() {
    super();
    makeObservable(this, {
      // observables
      createUpdateTeamModal: observable,
      createUpdateTeamViewModal: observable,
      // computed
      isAnyModalOpen: computed,
      // actions
      toggleCreateTeamModal: action,
      toggleCreateTeamViewModal: action,
    });
  }

  /**
   * Checks whether any modal is open or not in the base command palette.
   * @returns boolean
   */
  get isAnyModalOpen(): boolean {
    return Boolean(
      super.getCoreModalsState() || this.createUpdateTeamModal.isOpen || this.createUpdateTeamViewModal.isOpen
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
}
