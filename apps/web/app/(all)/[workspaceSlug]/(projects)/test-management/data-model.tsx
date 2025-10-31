// 定义用例库数据类型
export interface Repository {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  description: string;
  created_by: CreatedBy;
  updated_by: string | null;
  project: Project | null;
  workspace: object;
}

export interface RepositoryResponse {
  count: number;
  data: Repository[];
}

interface CreatedBy {
  display_name: string;
}

interface Project {
  name: string;
}
