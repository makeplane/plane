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

// 定义测试计划状态类型

// 定义测试计划数据类型（根据实际API响应更新）
export interface TestPlan {
  id: string;
  name: string;
  begin_time: string | null;
  end_time: string | null;
  repository: string; // 这里是repository的ID，不是对象
  assignees: PlanAssignee[];
  cases: any[]; // 测试用例数组，暂时定义为any[]
  state: number; // 测试用例数组，暂时定义为any[]
}

export interface TestPlanResponse {
  count: number;
  data: TestPlan[];
}

// 更新分配人员数据结构
export interface PlanAssignee {
  id: string;
  first_name: string;
  last_name: string;
  avatar: string;
  avatar_url: string | null;
  is_bot: boolean;
  display_name: string;
}

interface CreatedBy {
  display_name: string;
}

interface Project {
  name: string;
}
