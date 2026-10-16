/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TIssueType = {
  id: string;
  name: string;
  description: string;
  logo_props: Record<string, unknown>;
  is_epic: boolean;
  is_default: boolean;
  is_active: boolean;
  level: number;
  workspace: string;
  project_ids?: string[];
  created_at?: string;
  updated_at?: string;
};

export type TCreateIssueType = {
  name: string;
  description?: string;
  logo_props?: Record<string, unknown>;
  is_active?: boolean;
};

export type TUpdateIssueType = Partial<Pick<TIssueType, "name" | "description" | "logo_props" | "is_active">>;
