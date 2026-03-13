/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type {
  IInstanceStaff,
  IInstanceStaffCreate,
  IInstanceStaffUpdate,
  IInstanceStaffPaginatedResponse,
  IInstanceStaffStats,
  IInstanceStaffBulkImportResponse,
} from "@plane/services";
import { InstanceStaffService } from "@plane/services";
import type { TLoader } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IInstanceStaffStore {
  // observables
  loader: TLoader;
  staff: Record<string, IInstanceStaff>;
  paginationInfo: Omit<IInstanceStaffPaginatedResponse, "results"> | undefined;
  stats: IInstanceStaffStats | undefined;
  // computed
  staffIds: string[];
  // actions
  fetchStaff: (params?: Record<string, unknown>) => Promise<IInstanceStaff[]>;
  fetchNextStaff: () => Promise<IInstanceStaff[]>;
  createStaff: (data: IInstanceStaffCreate) => Promise<IInstanceStaff>;
  updateStaff: (id: string, data: IInstanceStaffUpdate) => Promise<IInstanceStaff>;
  deleteStaff: (id: string) => Promise<void>;
  transferStaff: (id: string, deptId: string) => Promise<IInstanceStaff>;
  deactivateStaff: (id: string) => Promise<IInstanceStaff>;
  bulkImport: (file: File, defaultPassword: string, skipExisting: boolean) => Promise<IInstanceStaffBulkImportResponse>;
  fetchStats: () => Promise<IInstanceStaffStats>;
}

export class InstanceStaffStore implements IInstanceStaffStore {
  loader: TLoader = "init-loader";
  staff: Record<string, IInstanceStaff> = {};
  paginationInfo: Omit<IInstanceStaffPaginatedResponse, "results"> | undefined = undefined;
  stats: IInstanceStaffStats | undefined = undefined;

  private service: InstanceStaffService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      loader: observable,
      staff: observable,
      paginationInfo: observable,
      stats: observable,
      staffIds: computed,
      fetchStaff: action,
      fetchNextStaff: action,
      createStaff: action,
      updateStaff: action,
      deleteStaff: action,
      transferStaff: action,
      deactivateStaff: action,
      bulkImport: action,
      fetchStats: action,
    });
    this.service = new InstanceStaffService();
  }

  get staffIds(): string[] {
    return Object.keys(this.staff);
  }

  fetchStaff = async (params?: Record<string, unknown>): Promise<IInstanceStaff[]> => {
    try {
      this.loader = this.staffIds.length > 0 ? "mutation" : "init-loader";
      const data = await this.service.list(params);
      runInAction(() => {
        this.staff = {};
        const { results, ...paginationInfo } = data;
        results.forEach((member: IInstanceStaff) => {
          set(this.staff, [member.id], member);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching staff", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchNextStaff = async (): Promise<IInstanceStaff[]> => {
    if (!this.paginationInfo || !this.paginationInfo.next_page_results) return [];
    try {
      this.loader = "pagination";
      const data = await this.service.list({ cursor: this.paginationInfo.next_cursor });
      runInAction(() => {
        const { results, ...paginationInfo } = data;
        results.forEach((member: IInstanceStaff) => {
          set(this.staff, [member.id], member);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return data.results;
    } catch (error) {
      console.error("Error fetching next staff", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  createStaff = async (data: IInstanceStaffCreate): Promise<IInstanceStaff> => {
    try {
      this.loader = "mutation";
      const member = await this.service.create(data);
      runInAction(() => {
        set(this.staff, [member.id], member);
      });
      return member;
    } catch (error) {
      console.error("Error creating staff", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  updateStaff = async (id: string, data: IInstanceStaffUpdate): Promise<IInstanceStaff> => {
    try {
      const member = await this.service.update(id, data);
      runInAction(() => {
        set(this.staff, [member.id], member);
      });
      return member;
    } catch (error) {
      console.error("Error updating staff", error);
      throw error;
    }
  };

  deleteStaff = async (id: string): Promise<void> => {
    try {
      await this.service.deleteStaff(id);
      runInAction(() => {
        delete this.staff[id];
      });
    } catch (error) {
      console.error("Error deleting staff", error);
      throw error;
    }
  };

  transferStaff = async (id: string, deptId: string): Promise<IInstanceStaff> => {
    try {
      const member = await this.service.transfer(id, deptId);
      runInAction(() => {
        set(this.staff, [member.id], member);
      });
      return member;
    } catch (error) {
      console.error("Error transferring staff", error);
      throw error;
    }
  };

  deactivateStaff = async (id: string): Promise<IInstanceStaff> => {
    try {
      const member = await this.service.deactivate(id);
      runInAction(() => {
        set(this.staff, [member.id], member);
      });
      return member;
    } catch (error) {
      console.error("Error deactivating staff", error);
      throw error;
    }
  };

  bulkImport = async (
    file: File,
    defaultPassword: string,
    skipExisting: boolean
  ): Promise<IInstanceStaffBulkImportResponse> => {
    try {
      this.loader = "mutation";
      return await this.service.bulkImport(file, defaultPassword, skipExisting);
    } catch (error) {
      console.error("Error bulk importing staff", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchStats = async (): Promise<IInstanceStaffStats> => {
    try {
      const data = await this.service.stats();
      runInAction(() => {
        set(this, "stats", data);
      });
      return data;
    } catch (error) {
      console.error("Error fetching staff stats", error);
      throw error;
    }
  };
}
