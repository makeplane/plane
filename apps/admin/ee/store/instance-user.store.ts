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
import { instanceUserService } from "@plane/services";
import type { TInstanceAdminCreatePayload, TInstanceUser, TInstanceUserListParams } from "@plane/types";
import type { RootStore } from "@/plane-admin/store/root.store";
import type { TInstanceUserOrderByOptions } from "@/plane-admin/constants/user-management";
import { set } from "lodash-es";

export interface IInstanceUserFilters {
  order_by?: TInstanceUserOrderByOptions;
}

export interface IInstanceUserStore {
  // observables
  users: Record<string, TInstanceUser>;
  loader: boolean;
  searchQuery: string;
  filters: IInstanceUserFilters;
  currentCursor: string | null;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount: number;

  // computed
  userIds: string[];

  // actions
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<IInstanceUserFilters>) => void;
  fetchUsers: (cursor?: string) => Promise<void>;
  createInstanceAdmin: (data: TInstanceAdminCreatePayload) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserRole: (userId: string, role: "user" | "admin") => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
}

export class InstanceUserStore implements IInstanceUserStore {
  users: Record<string, TInstanceUser> = {};
  loader: boolean = false;
  searchQuery: string = "";
  filters: IInstanceUserFilters = {
    order_by: "-is_active",
  };
  currentCursor: string | null = null;
  nextCursor: string | null = null;
  prevCursor: string | null = null;
  hasNextPage: boolean = false;
  hasPrevPage: boolean = false;
  totalCount: number = 0;

  constructor(private rootStore: RootStore) {
    makeObservable(this, {
      users: observable,
      loader: observable,
      searchQuery: observable,
      filters: observable,
      nextCursor: observable,
      prevCursor: observable,
      hasNextPage: observable,
      hasPrevPage: observable,
      totalCount: observable,
      userIds: computed,
      setSearchQuery: action,
      updateFilters: action,
      fetchUsers: action,
      createInstanceAdmin: action,
      deleteUser: action,
      toggleUserRole: action,
    });
  }

  get userIds() {
    return Object.keys(this.users);
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query;
    this.currentCursor = null;
    this.fetchUsers();
  };

  updateFilters = (filterUpdates: Partial<IInstanceUserFilters>) => {
    this.filters = { ...this.filters, ...filterUpdates };
    this.currentCursor = null;
    this.fetchUsers();
  };

  fetchUsers = async (cursor?: string) => {
    try {
      runInAction(() => {
        this.loader = true;
      });

      const params: TInstanceUserListParams = {
        per_page: 20,
      };

      if (this.searchQuery) {
        params.search = this.searchQuery;
      }

      if (this.filters.order_by) {
        params.order_by = this.filters.order_by;
      }

      if (cursor) {
        params.cursor = cursor;
      }

      const response = await instanceUserService.list(params);

      runInAction(() => {
        this.users = {};
        response.results.forEach((user) => {
          this.users[user.id] = user;
        });
        this.nextCursor = response.next_cursor;
        this.prevCursor = response.prev_cursor;
        this.hasNextPage = response.next_page_results;
        this.hasPrevPage = response.prev_page_results;
        this.totalCount = response.count;
        this.currentCursor = cursor || null;
        this.loader = false;
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  createInstanceAdmin = async (data: TInstanceAdminCreatePayload) => {
    try {
      await instanceUserService.create(data);
      await this.fetchUsers();
    } catch (error) {
      console.error("Failed to create instance admin:", error);
      throw error;
    }
  };

  deleteUser = async (userId: string) => {
    try {
      await instanceUserService.destroy(userId);
      await this.fetchUsers(this.currentCursor || undefined);
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  toggleUserRole = async (userId: string, role: "user" | "admin") => {
    try {
      await instanceUserService.updateRole(userId, { role });
      const userDetails = this.users[userId];
      const updatedDetails = { ...userDetails, is_instance_admin: role === "admin" };
      set(this.users, userId, updatedDetails);
    } catch (error) {
      console.error("Failed to toggle user role:", error);
      throw error;
    }
  };

  nextPage = async () => {
    if (this.hasNextPage && this.nextCursor) {
      await this.fetchUsers(this.nextCursor);
    }
  };

  prevPage = async () => {
    if (this.hasPrevPage && this.prevCursor) {
      await this.fetchUsers(this.prevCursor);
    }
  };
}
