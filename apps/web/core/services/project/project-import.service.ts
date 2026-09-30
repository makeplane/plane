/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

/** What the import is allowed to bring in; the server treats an absent field as enabled. */
export type TWorkItemImportOptions = {
  assignees: boolean;
  subscribers: boolean;
  relations: boolean;
  parents: boolean;
  dates: boolean;
  labels: boolean;
  modules: boolean;
  cycles: boolean;
};

export type TWorkItemImportResult = {
  message: string;
  project_id: string;
  project_identifier: string;
  project_name: string;
  created_work_items: number;
  warnings: string[];
  history_id: string;
};

export class ProjectImportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async importWorkItems(
    workspaceSlug: string,
    projectId: string,
    file: File,
    options: TWorkItemImportOptions
  ): Promise<TWorkItemImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);
    const lower = file.name.toLowerCase();
    const provider = lower.endsWith(".json") ? "json" : lower.endsWith(".xlsx") ? "xlsx" : "csv";
    formData.append("provider", provider);
    Object.entries(options).forEach(([name, enabled]) => formData.append(name, enabled ? "true" : "false"));

    return this.post(`/api/workspaces/${workspaceSlug}/import-work-items/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getImportHistory(workspaceSlug: string, cursor: string, perPage: number) {
    return this.get(`/api/workspaces/${workspaceSlug}/import-work-items/`, {
      params: { per_page: perPage, cursor },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
