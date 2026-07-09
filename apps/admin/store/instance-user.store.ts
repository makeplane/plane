/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// plane imports
import { InstanceUserService } from "@plane/services";
import type { IUser, TLoader, TPaginationInfo } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IInstanceUserStore {
  // observables
  loader: TLoader;
  users: Record<string, IUser>;
  paginationInfo: TPaginationInfo | undefined;
  // computed
  userIds: string[];
  // helpers
  getUserById: (userId: string) => IUser | undefined;
  // fetch actions
  fetchUsers: () => Promise<IUser[]>;
  fetchNextUsers: () => Promise<IUser[]>;
  // update actions
  updateUser: (userId: string, data: { is_active: boolean }) => Promise<IUser>;
}

export class InstanceUserStore implements IInstanceUserStore {
  // observables
  loader: TLoader = "init-loader";
  users: Record<string, IUser> = {};
  paginationInfo: TPaginationInfo | undefined = undefined;
  // services
  instanceUserService: InstanceUserService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      users: observable,
      paginationInfo: observable,
      // computed
      userIds: computed,
      // fetch actions
      fetchUsers: action,
      fetchNextUsers: action,
      // update actions
      updateUser: action,
    });
    this.instanceUserService = new InstanceUserService();
  }

  // computed
  get userIds() {
    return Object.keys(this.users);
  }

  getUserById = (userId: string) => this.users[userId];

  // fetch actions
  fetchUsers = async (): Promise<IUser[]> => {
    try {
      this.loader = this.userIds.length > 0 ? "mutation" : "init-loader";
      const data = await this.instanceUserService.list();
      runInAction(() => {
        const { results, ...paginationInfo } = data;
        results.forEach((user: IUser) => {
          set(this.users, [user.id], user);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching users", error);
      throw error;
    } finally {
      runInAction(() => { this.loader = "loaded"; });
    }
  };

  fetchNextUsers = async (): Promise<IUser[]> => {
    if (!this.paginationInfo || this.paginationInfo.next_page_results === false) return [];
    try {
      this.loader = "pagination";
      const data = await this.instanceUserService.list(this.paginationInfo.next_cursor);
      runInAction(() => {
        const { results, ...paginationInfo } = data;
        results.forEach((user: IUser) => {
          set(this.users, [user.id], user);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching next users", error);
      throw error;
    } finally {
      runInAction(() => { this.loader = "loaded"; });
    }
  };

  // update actions
  updateUser = async (userId: string, data: { is_active: boolean }): Promise<IUser> => {
    try {
      this.loader = "mutation";
      const updated = await this.instanceUserService.update(userId, data);
      runInAction(() => {
        set(this.users, [userId], updated);
      });
      return updated;
    } catch (error) {
      console.error("Error updating user", error);
      throw error;
    } finally {
      runInAction(() => { this.loader = "loaded"; });
    }
  };
}
