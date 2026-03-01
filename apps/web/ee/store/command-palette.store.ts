/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types / constants
import { DEFAULT_CREATE_UPDATE_CUSTOMER_MODAL_DATA } from "@plane/constants";
import type {
  TCreateUpdateInitiativeModal,
  TCreateUpdateTeamspaceModal,
  TCreateUpdateTeamspaceViewModal,
  TCreateUpdateCustomerModal,
  TProfileSettingsTabs,
} from "@plane/types";
import {
  DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA,
  DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA,
} from "@/constants/teamspace";
// store
import type { IBaseCommandPaletteStore } from "@/store/base-command-palette.store";
import { BaseCommandPaletteStore } from "@/store/base-command-palette.store";
// local imports
import { DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA } from "@/constants/initiative";

export interface ICommandPaletteStore extends IBaseCommandPaletteStore {
  // observables
  createUpdateTeamspaceModal: TCreateUpdateTeamspaceModal;
  createUpdateTeamspaceViewModal: TCreateUpdateTeamspaceViewModal;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal;
  createUpdateCustomerModal: TCreateUpdateCustomerModal;
  profileSettingsModal: {
    activeTab: TProfileSettingsTabs | null;
    isOpen: boolean;
  };
  // computed
  isAnyModalOpen: boolean;
  // actions
  toggleCreateTeamspaceModal: (value?: TCreateUpdateTeamspaceModal) => void;
  toggleCreateTeamspaceViewModal: (value?: TCreateUpdateTeamspaceViewModal) => void;
  toggleCreateInitiativeModal: (value?: TCreateUpdateInitiativeModal) => void;
  toggleCreateCustomerModal: (value?: TCreateUpdateCustomerModal) => void;
  toggleProfileSettingsModal: (value: { activeTab?: TProfileSettingsTabs | null; isOpen?: boolean }) => void;
}

export class CommandPaletteStore extends BaseCommandPaletteStore implements ICommandPaletteStore {
  // observables
  createUpdateTeamspaceModal: TCreateUpdateTeamspaceModal = DEFAULT_CREATE_UPDATE_TEAM_MODAL_DATA;
  createUpdateTeamspaceViewModal: TCreateUpdateTeamspaceViewModal = DEFAULT_CREATE_UPDATE_TEAM_VIEW_MODAL_DATA;
  createUpdateInitiativeModal: TCreateUpdateInitiativeModal = DEFAULT_CREATE_UPDATE_INITIATIVE_MODAL_DATA;
  createUpdateCustomerModal: TCreateUpdateCustomerModal = DEFAULT_CREATE_UPDATE_CUSTOMER_MODAL_DATA;
  profileSettingsModal: ICommandPaletteStore["profileSettingsModal"] = {
    activeTab: "general",
    isOpen: false,
  };

  constructor() {
    super();
    makeObservable(this, {
      // observables
      createUpdateTeamspaceModal: observable,
      createUpdateTeamspaceViewModal: observable,
      createUpdateInitiativeModal: observable,
      createUpdateCustomerModal: observable,
      profileSettingsModal: observable,
      // computed
      isAnyModalOpen: computed,
      // actions
      toggleCreateTeamspaceModal: action,
      toggleCreateTeamspaceViewModal: action,
      toggleCreateInitiativeModal: action,
      toggleCreateCustomerModal: action,
      toggleProfileSettingsModal: action,
    });
  }

  /**
   * Checks whether any modal is open or not in the base command palette.
   * @returns boolean
   */
  get isAnyModalOpen(): boolean {
    return Boolean(
      super.getCoreModalsState() ||
      this.createUpdateTeamspaceModal.isOpen ||
      this.createUpdateTeamspaceViewModal.isOpen ||
      this.createUpdateInitiativeModal.isOpen ||
      this.createUpdateCustomerModal.isOpen
    );
  }

  /**
   * Toggles the create teamspace modal
   * @param value
   * @returns
   */
  toggleCreateTeamspaceModal = (value?: TCreateUpdateTeamspaceModal) => {
    if (value) {
      this.createUpdateTeamspaceModal = {
        isOpen: value.isOpen,
        teamspaceId: value.teamspaceId,
      };
    } else {
      this.createUpdateTeamspaceModal = {
        isOpen: !this.createUpdateTeamspaceModal.isOpen,
        teamspaceId: undefined,
      };
    }
  };

  /**
   * Toggles the create teamspace view modal
   * @param value
   * @returns
   */
  toggleCreateTeamspaceViewModal = (value?: TCreateUpdateTeamspaceViewModal) => {
    if (value) {
      this.createUpdateTeamspaceViewModal = {
        isOpen: value.isOpen,
        teamspaceId: value.teamspaceId,
      };
    } else {
      this.createUpdateTeamspaceViewModal = {
        isOpen: !this.createUpdateTeamspaceViewModal.isOpen,
        teamspaceId: undefined,
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
   * Toggles the create customer modal
   * @param value
   * @returns
   */
  toggleCreateCustomerModal = (value?: TCreateUpdateCustomerModal) => {
    if (value) {
      this.createUpdateCustomerModal = {
        isOpen: value.isOpen,
        customerId: value.customerId,
      };
    } else {
      this.createUpdateCustomerModal = {
        isOpen: !this.createUpdateCustomerModal.isOpen,
        customerId: undefined,
      };
    }
  };

  /**
   * Toggles the profile settings modal
   * @param value
   * @returns
   */
  toggleProfileSettingsModal: ICommandPaletteStore["toggleProfileSettingsModal"] = (payload) => {
    const updatedSettings: ICommandPaletteStore["profileSettingsModal"] = {
      ...this.profileSettingsModal,
      ...payload,
    };

    runInAction(() => {
      this.profileSettingsModal = updatedSettings;
    });
  };
}
