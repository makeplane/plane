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

export type TLibraryFile = {
  id: string;
  attributes: TLibraryFileAttributes;
  size: number;
  is_uploaded: boolean;
  workspace_id: string;
  category_ids: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TLibraryFileUploadResponse = {
  upload_data: {
    url: string;
    fields: Record<string, string>;
  };
  asset_id: string;
  asset: TLibraryFile;
};

export type TLibraryFileFilters = {
  category?: string;
  search?: string;
  type?: string;
};
