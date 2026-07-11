/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TFileCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  is_default: boolean;
  pdf_only: boolean;
  workspace_id: string;
  file_count: number;
  created_at: string;
  updated_at: string;
};

export type TLibraryFileAttributes = {
  name: string;
  type: string;
  size: number;
};

export type TFileFolder = {
  id: string;
  name: string;
  parent: string | null;
  workspace_id: string;
  file_count: number;
  created_at: string;
  updated_at: string;
};

export type TFileTag = {
  id: string;
  name: string;
  color: string;
  workspace_id: string;
  file_count: number;
  created_at: string;
  updated_at: string;
};

export type TLibraryFile = {
  id: string;
  attributes: TLibraryFileAttributes;
  size: number;
  is_uploaded: boolean;
  workspace_id: string;
  folder_id: string | null;
  category_ids: string[];
  tag_ids: string[];
  /** Set when the file is tracked as a contract (PDF linked to "Contratos") */
  contract_id: string | null;
  contract_processing_status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR" | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TLibraryBulkAction =
  | { action: "move"; file_ids: string[]; folder_id?: string | null; new_folder_name?: string; parent_id?: string | null }
  | { action: "delete"; file_ids: string[] }
  | { action: "add_categories" | "remove_categories"; file_ids: string[]; category_ids: string[] }
  | { action: "add_tags" | "remove_tags"; file_ids: string[]; tag_ids: string[] };

export type TLibraryFileUploadResponse = {
  upload_data: {
    url: string;
    fields: Record<string, string>;
  };
  asset_id: string;
  asset: TLibraryFile;
};

export type TLibraryFileFilters = {
  /** OR'd within the group, like work-item filters ("none" = uncategorized) */
  categories?: string[];
  tags?: string[];
  search?: string;
  type?: string;
  /** e.g. "name", "-size", "created_at" — resolved by the database */
  order?: string;
};
