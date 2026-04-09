/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { API_BASE_URL } from "@plane/constants";
// plane imports
import type {
  IDepartmentBulkImportRequest,
  IDepartmentBulkImportResponse,
  IDepartmentBulkLinkRequest,
  IDepartmentBulkLinkResponse,
  IDepartmentBulkLinkCategoriesRequest,
  IDepartmentBulkLinkCategoriesResponse,
  IAutoJoinResult,
  IRejoinAllResult,
  IInstanceDepartment,
  IInstanceDepartmentCreate,
  IInstanceDepartmentUpdate,
  ILinkWorkspaceResult,
  TAutoJoinMode,
} from "@plane/services";
import { InstanceDepartmentService } from "@plane/services";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
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
  linkWorkspace: (id: string, workspaceId: string) => Promise<ILinkWorkspaceResult>;
  unlinkWorkspace: (id: string) => Promise<void>;
  exportDepartments: () => void;
  exportWorkspaceLinked: () => void;
  bulkImport: (data: IDepartmentBulkImportRequest) => Promise<IDepartmentBulkImportResponse>;
  bulkLinkWorkspace: (data: IDepartmentBulkLinkRequest) => Promise<IDepartmentBulkLinkResponse>;
  bulkLinkCategories: (data: IDepartmentBulkLinkCategoriesRequest) => Promise<IDepartmentBulkLinkCategoriesResponse>;
  exportLinkedCategories: (mainCategories: { id: string; name: string }[]) => void;
  autoJoin: (id: string, mode: TAutoJoinMode) => Promise<IAutoJoinResult>;
  rejoinAll: (mode: TAutoJoinMode) => Promise<IRejoinAllResult>;
  linkTaskCategories: (id: string, taskCategoryIds: string[]) => Promise<IInstanceDepartment>;
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
      exportDepartments: action,
      exportWorkspaceLinked: action,
      bulkImport: action,
      bulkLinkWorkspace: action,
      bulkLinkCategories: action,
      exportLinkedCategories: action,
      autoJoin: action,
      rejoinAll: action,
      linkTaskCategories: action,
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
        // Flatten tree into departments map so parent selects work
        this.departments = {};
        const flatten = (nodes: IInstanceDepartment[]) => {
          nodes.forEach((node) => {
            set(this.departments, [node.id], node);
            if (node.children?.length) flatten(node.children);
          });
        };
        flatten(data);
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

  linkWorkspace = async (id: string, workspaceId: string): Promise<ILinkWorkspaceResult> => {
    try {
      const result = await this.service.linkWorkspace(id, workspaceId);
      // Refresh department detail to get updated linked_workspace_detail
      const dept = await this.service.detail(id);
      runInAction(() => {
        set(this.departments, [dept.id], dept);
      });
      return result;
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

  exportDepartments = (): void => {
    window.open(`${API_BASE_URL}/api/instances/departments/export/`);
  };

  exportWorkspaceLinked = (): void => {
    void import("xlsx").then((XLSX) => {
      const flatten = (nodes: IInstanceDepartment[]): IInstanceDepartment[] =>
        nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

      const rows = flatten(this.tree)
        .filter((d) => d.linked_workspace_detail !== null)
        .map((d) => ({
          workspace_slug: d.linked_workspace_detail!.slug,
          code: d.code,
        }));

      const ws = XLSX.utils.json_to_sheet(rows, { header: ["workspace_slug", "code"] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Workspace Linked");

      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
      XLSX.writeFile(wb, `workspace-linked-departments_${timestamp}.xlsx`);
      return;
    });
  };

  autoJoin = async (id: string, mode: TAutoJoinMode): Promise<IAutoJoinResult> => {
    try {
      return await this.service.autoJoin(id, mode);
    } catch (error) {
      console.error("Error auto-joining department manager to projects", error);
      throw error;
    }
  };

  rejoinAll = async (mode: TAutoJoinMode): Promise<IRejoinAllResult> => {
    try {
      return await this.service.rejoinAll(mode);
    } catch (error) {
      console.error("Error rejoining all department managers to projects", error);
      throw error;
    }
  };

  bulkImport = async (data: IDepartmentBulkImportRequest): Promise<IDepartmentBulkImportResponse> => {
    try {
      const result = await this.service.bulkImport(data);
      if (result.total_created > 0) {
        await this.fetchTree();
      }
      return result;
    } catch (error) {
      console.error("Error bulk importing departments", error);
      throw error;
    }
  };

  bulkLinkWorkspace = async (data: IDepartmentBulkLinkRequest): Promise<IDepartmentBulkLinkResponse> => {
    try {
      return await this.service.bulkLinkWorkspace(data);
    } catch (error) {
      console.error("Error bulk linking departments to workspaces", error);
      throw error;
    }
  };

  bulkLinkCategories = async (
    data: IDepartmentBulkLinkCategoriesRequest
  ): Promise<IDepartmentBulkLinkCategoriesResponse> => {
    try {
      const result = await this.service.bulkLinkCategories(data);
      if (result.total_linked > 0) {
        await this.fetchTree();
      }
      return result;
    } catch (error) {
      console.error("Error bulk linking categories to departments", error);
      throw error;
    }
  };

  exportLinkedCategories = (mainCategories: { id: string; name: string }[]): void => {
    void import("xlsx").then((XLSX) => {
      const categoryNameById = new Map(mainCategories.map((c) => [c.id, c.name]));
      const flatten = (nodes: IInstanceDepartment[]): IInstanceDepartment[] =>
        nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

      const allDepts = flatten(this.tree);
      const hasDept = allDepts.some((d) => d.task_category_ids.length > 0);
      if (!hasDept) {
        setToast({ type: TOAST_TYPE.WARNING, title: "No linked categories to export" });
        return;
      }

      const rows = allDepts
        .filter((d) => d.task_category_ids.length > 0)
        .flatMap((d) =>
          d.task_category_ids.map((catId) => ({
            dept_code: d.code,
            category_name: categoryNameById.get(catId) ?? catId,
          }))
        );

      const ws = XLSX.utils.json_to_sheet(rows, { header: ["dept_code", "category_name"] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Linked Categories");

      const timestamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
      XLSX.writeFile(wb, `linked-categories_${timestamp}.xlsx`);
    });
  };

  linkTaskCategories = async (id: string, taskCategoryIds: string[]): Promise<IInstanceDepartment> => {
    try {
      const updated = await this.service.linkTaskCategories(id, taskCategoryIds);
      runInAction(() => {
        this.departments[id] = updated;
      });
      return updated;
    } catch (error) {
      console.error("Error linking task categories to department", error);
      throw error;
    }
  };
}
