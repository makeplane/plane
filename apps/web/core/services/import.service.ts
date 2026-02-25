// [FA-CUSTOM] Import service for CSV/XLSX file-based imports

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

// === Types ===

export type TImportJobStatus =
  | "uploading"
  | "mapping"
  | "queued"
  | "processing"
  | "completed"
  | "completed_with_errors"
  | "failed";

export type TImportErrorEntry = {
  row: number | string;
  error: string;
  data: Record<string, string>;
};

export type TImportJob = {
  id: string;
  token: string;
  file_name: string;
  file_format: "csv" | "xlsx";
  total_rows: number;
  detected_preset: string;
  status: TImportJobStatus;
  column_mapping: Record<string, string>;
  status_mapping: Record<string, string>;
  assignee_mapping: Record<string, string>;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  progress: number;
  error_log: TImportErrorEntry[];
  detected_columns: string[];
  unique_statuses: string[];
  unique_assignees: string[];
  preview_rows: Record<string, string>[];
  initiated_by: string;
  initiated_by_detail: {
    id: string;
    display_name: string;
    avatar: string;
  };
  created_at: string;
  updated_at: string;
};

export type TStatusSuggestion = {
  state_id: string;
  state_name: string;
  confidence: number;
};

export type TAssigneeSuggestion = {
  user_id: string;
  display_name: string;
  confidence: number;
};

export type TProjectState = {
  id: string;
  name: string;
  group: string;
  color: string;
};

export type TProjectMember = {
  member__id: string;
  member__display_name: string;
  member__email: string;
};

export type TUploadResponse = TImportJob & {
  status_suggestions: Record<string, TStatusSuggestion>;
  assignee_suggestions: Record<string, TAssigneeSuggestion>;
  project_states: TProjectState[];
  project_members: TProjectMember[];
};

// === Service ===

export class ImportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async uploadFile(workspaceSlug: string, projectId: string, file: File): Promise<TUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/import-issues/upload/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res?.data as TUploadResponse;
  }

  async getImportJob(workspaceSlug: string, projectId: string, token: string): Promise<TImportJob> {
    const res = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import-issues/${token}/`);
    return res?.data as TImportJob;
  }

  async updateMapping(
    workspaceSlug: string,
    projectId: string,
    token: string,
    data: Partial<Pick<TImportJob, "column_mapping" | "status_mapping" | "assignee_mapping">>
  ): Promise<void> {
    await this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import-issues/${token}/`, data);
  }

  async startImport(workspaceSlug: string, projectId: string, token: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import-issues/${token}/start/`);
  }

  async getImportHistory(workspaceSlug: string, projectId: string): Promise<TImportJob[]> {
    const res = await this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import-issues/history/`);
    return res?.data as TImportJob[];
  }
}
