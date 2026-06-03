/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import { InstanceService } from "@plane/services";
import type { IAdminUserOption, IInstanceAdmin } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export type TAdminGrantPayload = { allowed_menus?: string[]; is_super_admin?: boolean };

export interface IAdminManagementStore {
  // observables
  isLoading: boolean;
  admins: Record<string, IInstanceAdmin>;
  // computed
  adminIds: string[];
  // actions
  fetchAdmins: () => Promise<IInstanceAdmin[]>;
  createAdmin: (data: { email: string } & TAdminGrantPayload) => Promise<IInstanceAdmin>;
  updateAdmin: (adminId: string, data: TAdminGrantPayload) => Promise<IInstanceAdmin>;
  removeAdmin: (adminId: string) => Promise<void>;
  searchUserCandidates: (search?: string) => Promise<IAdminUserOption[]>;
}

/** God-mode Administrators page CRUD. Current-admin identity
 * (is_super_admin / allowed_menus) lives on user.store currentUser —
 * never duplicated here. */
export class AdminManagementStore implements IAdminManagementStore {
  isLoading = false;
  admins: Record<string, IInstanceAdmin> = {};
  // services
  instanceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      isLoading: observable.ref,
      admins: observable,
      adminIds: computed,
      fetchAdmins: action,
      createAdmin: action,
      updateAdmin: action,
      removeAdmin: action,
    });
    this.instanceService = new InstanceService();
  }

  get adminIds() {
    return Object.keys(this.admins);
  }

  fetchAdmins = async () => {
    try {
      this.isLoading = true;
      const admins = await this.instanceService.admins();
      runInAction(() => {
        this.admins = Object.fromEntries(admins.map((admin) => [admin.id, admin]));
        this.isLoading = false;
      });
      return admins;
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
      throw error;
    }
  };

  createAdmin = async (data: { email: string } & TAdminGrantPayload) => {
    const admin = await this.instanceService.createAdmin(data);
    runInAction(() => {
      this.admins[admin.id] = admin;
    });
    return admin;
  };

  updateAdmin = async (adminId: string, data: TAdminGrantPayload) => {
    const admin = await this.instanceService.updateAdmin(adminId, data);
    runInAction(() => {
      this.admins[admin.id] = admin;
    });
    return admin;
  };

  removeAdmin = async (adminId: string) => {
    await this.instanceService.deleteAdmin(adminId);
    runInAction(() => {
      delete this.admins[adminId];
    });
  };

  // Transient search results for the Add-admin picker — not stored as
  // observable state (each keystroke replaces the list locally in the dialog).
  searchUserCandidates = async (search?: string) => this.instanceService.adminUserOptions(search);
}
