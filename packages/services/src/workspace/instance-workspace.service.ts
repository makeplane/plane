/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { IWorkspace, TWorkspacePaginationInfo } from "@plane/types";

export interface IWorkspaceProjectBulkImportResponse {
  created: Array<{ workspace_slug: string; name: string; identifier: string; skipped_members: string[] }>;
  updated?: Array<{ workspace_slug: string; name: string; identifier: string; skipped_members: string[] }>;
  skipped: Array<{ row_number: number; workspace_slug: string; name: string; reason: string }>;
  total_created: number;
  total_updated?: number;
  total_skipped: number;
}

export interface IWorkspaceModuleBulkImportResponse {
  created: Array<{ workspace_slug: string; project_name: string; name: string }>;
  skipped: Array<{
    row_number: number;
    workspace_slug: string;
    project_name: string;
    name: string;
    reason: string;
  }>;
  total_created: number;
  total_skipped: number;
}

export interface IWorkspaceBulkCreateResponse {
  created: IWorkspace[];
  skipped: Array<{ row_number: number; name: string; slug: string; reason: string }>;
  total_created: number;
  total_skipped: number;
}

export interface IWorkspaceProjectExportResponse {
  projects: Array<{
    workspace_slug: string;
    name: string;
    identifier: string;
    description: string;
    network: number;
    project_leader: string;
    members: string;
    member_roles: string;
  }>;
}

export interface IWorkspaceBulkAssignResponse {
  assigned: Array<{ email: string; workspace_slug: string; role: number }>;
  skipped: Array<{ row_number: number; email: string; workspace_slug: string; reason: string }>;
  total_assigned: number;
  total_skipped: number;
}

export interface IWorkspaceBulkRemoveResponse {
  removed: Array<{ workspace_slug: string; email: string }>;
  skipped: Array<{ row_number: number; workspace_slug: string; email: string; reason: string }>;
  total_removed: number;
  total_skipped: number;
}

export interface ISlugCheckResponse {
  slug: string;
  is_available: boolean;
}

export interface IWorkspaceOwnerOption {
  id: string;
  display_name: string;
  email: string;
}

export interface IWorkspaceOwnerOptionsResponse {
  // null when no unambiguous General Director resolves from staff data
  default_owner: IWorkspaceOwnerOption | null;
  // empty when the caller lacks staff-directory access
  candidates: IWorkspaceOwnerOption[];
}

export type TWorkspaceCreatePayload = Partial<IWorkspace> & { owner_id?: string };

import { APIService } from "../api.service";

/**
 * Service class for managing instance workspaces
 * Handles CRUD operations on instance workspaces
 * @extends APIService
 */
export class InstanceWorkspaceService extends APIService {
  /**
   * Constructor for InstanceWorkspaceService
   * @param BASE_URL - Base URL for API requests
   */
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a paginated list of workspaces for the current instance
   * @param {string} nextPageCursor - Optional cursor to retrieve the next page of results
   * @returns {Promise<TWorkspacePaginationInfo>} Promise resolving to a paginated list of workspaces
   * @throws {Error} If the API request fails
   */
  async list(params?: { search?: string; cursor?: string }): Promise<TWorkspacePaginationInfo> {
    return this.get(`/api/instances/workspaces/`, {
      params: {
        cursor: params?.cursor,
        search: params?.search || undefined,
      },
    })
      .then((response) => response?.data as TWorkspacePaginationInfo)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  /**
   * Checks if a workspace slug is available
   * @param {string} slug - The workspace slug to check
   * @returns {Promise<ISlugCheckResponse>} Promise resolving to slug availability status
   * @throws {Error} If the API request fails
   */
  async slugCheck(slug: string): Promise<ISlugCheckResponse> {
    const params = new URLSearchParams({ slug });
    return this.get(`/api/instances/workspace-slug-check/?${params.toString()}`)
      .then((response) => response?.data as ISlugCheckResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  /**
   * Creates a new workspace
   * @param {Partial<IWorkspace>} data - Workspace data for creation
   * @returns {Promise<IWorkspace>} Promise resolving to the created workspace
   * @throws {Error} If the API request fails
   */
  async create(data: TWorkspaceCreatePayload): Promise<IWorkspace> {
    return this.post("/api/instances/workspaces/", data)
      .then((response) => response?.data as IWorkspace)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  /**
   * Retrieves the default workspace owner (the General Director) and candidate
   * users for the create-workspace owner picker
   * @param {string} search - Optional search query against the staff directory
   * @returns {Promise<IWorkspaceOwnerOptionsResponse>} default owner + candidates
   * @throws {Error} If the API request fails
   */
  async getOwnerOptions(search?: string): Promise<IWorkspaceOwnerOptionsResponse> {
    return this.get("/api/instances/workspaces/owner-options/", {
      params: { search: search || undefined },
    })
      .then((response) => response?.data as IWorkspaceOwnerOptionsResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  /**
   * Bulk creates workspaces from a parsed array. Slug is auto-generated on the backend.
   * @param workspaces - Array of workspace objects with name and optional organization_size
   * @returns Promise resolving to created/skipped summary
   */
  async bulkCreate(
    workspaces: Array<{ name: string; organization_size?: string }>
  ): Promise<IWorkspaceBulkCreateResponse> {
    return this.post("/api/instances/workspaces/bulk-create/", {
      workspaces,
    })
      .then((response) => response?.data as IWorkspaceBulkCreateResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  async bulkAssignMembers(
    members: Array<{ email: string; workspace_slug: string; role: number }>
  ): Promise<IWorkspaceBulkAssignResponse> {
    return this.post("/api/instances/workspaces/bulk-assign-members/", {
      members,
    })
      .then((response) => response?.data as IWorkspaceBulkAssignResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  async bulkRemoveMembers(
    members: Array<{ workspace_slug: string; email: string }>
  ): Promise<IWorkspaceBulkRemoveResponse> {
    return this.post<IWorkspaceBulkRemoveResponse>("/api/instances/workspaces/bulk-remove-members/", {
      members,
    })
      .then((response) => response?.data as IWorkspaceBulkRemoveResponse)
      .catch((error: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = (error as Record<string, unknown>)?.response?.data;
        throw errorData;
      });
  }

  async bulkImportProjects(
    projects: Array<{
      workspace_slug: string;
      name: string;
      description?: string;
      network?: number;
      project_leader?: string;
      members?: string;
      member_roles?: string;
    }>
  ): Promise<IWorkspaceProjectBulkImportResponse> {
    return this.post("/api/instances/bulk-import-projects/", {
      projects,
    })
      .then((response) => response?.data as IWorkspaceProjectBulkImportResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  async bulkImportModules(
    modules: Array<{
      workspace_slug: string;
      project_name: string;
      name: string;
      description?: string;
      status?: string;
      start_date?: string;
      target_date?: string;
    }>
  ): Promise<IWorkspaceModuleBulkImportResponse> {
    return this.post("/api/instances/bulk-import-modules/", { modules })
      .then((response) => response?.data as IWorkspaceModuleBulkImportResponse)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }

  async exportProjects(workspaceSlugs?: string[]): Promise<IWorkspaceProjectExportResponse> {
    const params = workspaceSlugs?.length ? `?workspace_slugs=${encodeURIComponent(workspaceSlugs.join(","))}` : "";
    return this.get<IWorkspaceProjectExportResponse>(`/api/instances/bulk-export-projects/${params}`)
      .then((response) => response?.data as IWorkspaceProjectExportResponse)
      .catch((error: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = (error as Record<string, unknown>)?.response?.data;
        throw errorData;
      });
  }

  async destroy(workspaceSlug: string): Promise<void> {
    return this.delete(`/api/instances/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data as void)
      .catch((error: unknown) => {
        const errorData = (error as { response?: { data?: unknown } })?.response?.data;
        throw errorData;
      });
  }
}
