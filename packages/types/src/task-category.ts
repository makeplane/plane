export interface IMainTaskCategory {
  id: string;
  name: string;
  code?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IMainTaskCategoryCreate {
  name: string;
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IMainTaskCategoryUpdate {
  name?: string;
  code?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ISubTaskCategory {
  id: string;
  main_category: string;
  name: string;
  code?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ISubTaskCategoryCreate {
  main_category: string;
  name: string;
  code?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ISubTaskCategoryUpdate {
  main_category?: string;
  name?: string;
  code?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ITaskCategoryImportRow {
  type: string;
  main_category_name?: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ITaskCategoryBulkImportRequest {
  main_categories: Array<{ name: string; description?: string; sort_order?: number; is_active?: boolean }>;
  sub_categories: Array<{ main_category_name: string; name: string; sort_order?: number; is_active?: boolean }>;
}

export interface ITaskCategoryBulkImportSkipped {
  row_number: number;
  name: string;
  reason: string;
}

export interface ITaskCategoryBulkImportResponse {
  main_created: IMainTaskCategory[];
  main_skipped: ITaskCategoryBulkImportSkipped[];
  sub_created: ISubTaskCategory[];
  sub_skipped: ITaskCategoryBulkImportSkipped[];
  total_main_created: number;
  total_main_skipped: number;
  total_sub_created: number;
  total_sub_skipped: number;
}
