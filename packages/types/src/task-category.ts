/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface IMainTaskCategory {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IMainTaskCategoryCreate {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export type IMainTaskCategoryUpdate = Partial<IMainTaskCategoryCreate>;

export interface ISubTaskCategory {
  id: string;
  name: string;
  main_category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ISubTaskCategoryCreate {
  name: string;
  main_category: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export type ISubTaskCategoryUpdate = Partial<ISubTaskCategoryCreate>;
