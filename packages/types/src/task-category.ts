export interface IMainTaskCategory {
  id: string;
  name: string;
  description?: string;
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

export interface IMainTaskCategoryUpdate {
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ISubTaskCategory {
  id: string;
  main_category: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ISubTaskCategoryCreate {
  main_category: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface ISubTaskCategoryUpdate {
  main_category?: string;
  name?: string;
  sort_order?: number;
  is_active?: boolean;
}
