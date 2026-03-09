/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { IInstanceDepartment, IInstanceDepartmentCreate, IInstanceDepartmentUpdate } from "@plane/services";
import { InstanceDepartmentService } from "@plane/services";
import type { TLoader } from "@plane/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IInstanceDepartmentStore {
  // observables
  loader: TLoader;
  departments: Record<string, IInstanceDepartment>;
  tree: IInstanceDepartment[];
  // computed
  departmentIds: string[];
  // actions
  fetchDepartments: () => Promise<IInstanceDepartment[]>;
  fetchTree: () => Promise<IInstanceDepartment[]>;
  createDepartment: (data: IInstanceDepartmentCreate) => Promise<IInstanceDepartment>;
  updateDepartment: (id: string, data: IInstanceDepartmentUpdate) => Promise<IInstanceDepartment>;
  deleteDepartment: (id: string) => Promise<void>;
  linkWorkspace: (id: string, workspaceId: string) => Promise<void>;
  unlinkWorkspace: (id: string) => Promise<void>;
}

export class InstanceDepartmentStore implements IInstanceDepartmentStore {
  loader: TLoader = "init-loader";
  departments: Record<string, IInstanceDepartment> = {};
  tree: IInstanceDepartment[] = [];

  private service: InstanceDepartmentService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      loader: observable,
      departments: observable,
      tree: observable,
      departmentIds: computed,
      fetchDepartments: action,
      fetchTree: action,
      createDepartment: action,
      updateDepartment: action,
      deleteDepartment: action,
      linkWorkspace: action,
      unlinkWorkspace: action,
    });
    this.service = new InstanceDepartmentService();
  }

  get departmentIds(): string[] {
    return Object.keys(this.departments);
  }

  fetchDepartments = async (): Promise<IInstanceDepartment[]> => {
    try {
      this.loader = this.departmentIds.length > 0 ? "mutation" : "init-loader";
      const data = await this.service.list();
      runInAction(() => {
        this.departments = {};
        data.forEach((dept: IInstanceDepartment) => {
          set(this.departments, [dept.id], dept);
        });
      });
      return data;
    } catch (error) {
      console.error("Error fetching departments", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  fetchTree = async (): Promise<IInstanceDepartment[]> => {
    try {
      this.loader = "mutation";
      const data = await this.service.getTree();
      runInAction(() => {
        set(this, "tree", data);
      });
      return data;
    } catch (error) {
      console.error("Error fetching department tree", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  createDepartment = async (data: IInstanceDepartmentCreate): Promise<IInstanceDepartment> => {
    try {
      this.loader = "mutation";
      const dept = await this.service.create(data);
      runInAction(() => {
        set(this.departments, [dept.id], dept);
      });
      return dept;
    } catch (error) {
      console.error("Error creating department", error);
      throw error;
    } finally {
      runInAction(() => {
        this.loader = "loaded";
      });
    }
  };

  updateDepartment = async (id: string, data: IInstanceDepartmentUpdate): Promise<IInstanceDepartment> => {
    try {
      const dept = await this.service.update(id, data);
      runInAction(() => {
        set(this.departments, [dept.id], dept);
      });
      return dept;
    } catch (error) {
      console.error("Error updating department", error);
      throw error;
    }
  };

  deleteDepartment = async (id: string): Promise<void> => {
    try {
      await this.service.deleteDepartment(id);
      runInAction(() => {
        delete this.departments[id];
      });
    } catch (error) {
      console.error("Error deleting department", error);
      throw error;
    }
  };

  linkWorkspace = async (id: string, workspaceId: string): Promise<void> => {
    try {
      await this.service.linkWorkspace(id, workspaceId);
      // Refresh department detail to get updated linked_workspace_detail
      const dept = await this.service.detail(id);
      runInAction(() => {
        set(this.departments, [dept.id], dept);
      });
    } catch (error) {
      console.error("Error linking workspace", error);
      throw error;
    }
  };

  unlinkWorkspace = async (id: string): Promise<void> => {
    try {
      await this.service.unlinkWorkspace(id);
      const dept = await this.service.detail(id);
      runInAction(() => {
        set(this.departments, [dept.id], dept);
      });
    } catch (error) {
      console.error("Error unlinking workspace", error);
      throw error;
    }
  };
}
