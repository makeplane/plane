// Job Grade — standalone parent entity
export interface IJobGrade {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IJobGradeCreate {
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IJobGradeUpdate {
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Job Position — child of JobGrade
export interface IJobPosition {
  id: string;
  job_grade: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IJobPositionCreate {
  job_grade: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IJobPositionUpdate {
  job_grade?: string;
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Bulk import
export interface IJobPositionImportRow {
  type: string;
  grade_name?: string;
  name: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface IJobPositionBulkImportSkipped {
  row_number: number;
  name: string;
  reason: string;
}

export interface IJobPositionBulkImportRequest {
  grades: Array<{ name: string; description?: string; sort_order?: number; is_active?: boolean }>;
  positions: Array<{
    grade_name: string;
    name: string;
    description?: string;
    sort_order?: number;
    is_active?: boolean;
  }>;
}

export interface IJobPositionBulkImportResponse {
  grade_created: IJobGrade[];
  grade_skipped: IJobPositionBulkImportSkipped[];
  position_created: IJobPosition[];
  position_skipped: IJobPositionBulkImportSkipped[];
  total_grade_created: number;
  total_grade_skipped: number;
  total_position_created: number;
  total_position_skipped: number;
}
