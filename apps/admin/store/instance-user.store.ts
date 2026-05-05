/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { IInstanceUser, IInstanceUserPaginatedResponse, IInstanceUserBulkImportResponse } from "@plane/services";
import { InstanceUserService } from "@plane/services";
import type { TLoader } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IInstanceUserStore {
  // observables
  loader: TLoader;
  users: Record<string, IInstanceUser>;
  paginationInfo: Omit<IInstanceUserPaginatedResponse, "results"> | undefined;
  // computed
  userIds: string[];
  // actions
  hydrate: (data: Record<string, IInstanceUser>) => void;
  fetchUsers: (search?: string) => Promise<IInstanceUser[]>;
  fetchNextUsers: () => Promise<IInstanceUser[]>;
  createUser: (data: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
  }) => Promise<IInstanceUser>;
  fetchUserDetail: (userId: string) => Promise<IInstanceUser>;
  updateUser: (
    userId: string,
    data: Partial<{ first_name: string; last_name: string; is_active: boolean }>
  ) => Promise<IInstanceUser>;
  addUserToWorkspace: (userId: string, workspaceId: string, role: number) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<{ password: string }>;
  bulkImportUsers: (file: File) => Promise<IInstanceUserBulkImportResponse>;
}

export class InstanceUserStore implements IInstanceUserStore {
  loader: TLoader = "init-loader";
  users: Record<string, IInstanceUser> = {};
  paginationInfo: Omit<IInstanceUserPaginatedResponse, "results"> | undefined = undefined;

  private service: InstanceUserService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      loader: observable,
      users: observable,
      paginationInfo: observable,
      userIds: computed,
      hydrate: action,
      fetchUsers: action,
      fetchNextUsers: action,
      createUser: action,
      fetchUserDetail: action,
      updateUser: action,
      addUserToWorkspace: action,
      resetUserPassword: action,
      bulkImportUsers: action,
    });
    this.service = new InstanceUserService();
  }

  get userIds(): string[] {
    return Object.keys(this.users);
  }

  hydrate = (data: Record<string, IInstanceUser>) => {
    if (data) this.users = data;
  };

  fetchUsers = async (search?: string): Promise<IInstanceUser[]> => {
    try {
      this.loader = this.userIds.length > 0 ? "mutation" : "init-loader";
      const data = await this.service.list({ search });
      runInAction(() => {
        this.users = {};
        const { results, ...paginationInfo } = data;
        results.forEach((user: IInstanceUser) => {
          set(this.users, [user.id], user);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching users", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchNextUsers = async (): Promise<IInstanceUser[]> => {
    if (!this.paginationInfo || !this.paginationInfo.next_page_results) return [];
    try {
      this.loader = "pagination";
      const data = await this.service.list({ cursor: this.paginationInfo.next_cursor });
      runInAction(() => {
        const { results, ...paginationInfo } = data;
        results.forEach((user: IInstanceUser) => {
          set(this.users, [user.id], user);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching next users", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  createUser = async (data: {
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
  }): Promise<IInstanceUser> => {
    try {
      this.loader = "mutation";
      const user = await this.service.create(data);
      runInAction(() => {
        set(this.users, [user.id], user);
      });
      return user;
    } catch (error) {
      console.error("Error creating user", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchUserDetail = async (userId: string): Promise<IInstanceUser> => {
    try {
      const user = await this.service.detail(userId);
      runInAction(() => {
        set(this.users, [user.id], user);
      });
      return user;
    } catch (error) {
      console.error("Error fetching user detail", error);
      throw error;
    }
  };

  updateUser = async (
    userId: string,
    data: Partial<{ first_name: string; last_name: string; is_active: boolean }>
  ): Promise<IInstanceUser> => {
    try {
      const user = await this.service.update(userId, data);
      runInAction(() => {
        set(this.users, [user.id], user);
      });
      return user;
    } catch (error) {
      console.error("Error updating user", error);
      throw error;
    }
  };

  addUserToWorkspace = async (userId: string, workspaceId: string, role: number): Promise<void> => {
    await this.service.addToWorkspace(userId, { workspace_id: workspaceId, role });
    await this.fetchUserDetail(userId);
  };

  resetUserPassword = async (userId: string): Promise<{ password: string }> => {
    return await this.service.resetPassword(userId);
  };

  bulkImportUsers = async (file: File): Promise<IInstanceUserBulkImportResponse> => {
    try {
      this.loader = "mutation";
      const result = await this.service.bulkImport(file);
      // Refresh user list to include newly created users
      if (result.total_created > 0) {
        try {
          await this.fetchUsers();
        } catch {
          // list refresh failure is non-fatal — import already succeeded
        }
      }
      return result;
    } catch (error) {
      console.error("Error bulk importing users", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };
}
