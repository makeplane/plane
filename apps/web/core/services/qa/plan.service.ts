// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class PlanService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getPlans(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plane/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPlan(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/plane/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePlan(workspaceSlug: string, data: any): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/test/plane/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlanModules(workspaceSlug: string, queries?: any): Promise<any[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plan/module/`, { params: queries })
      .then((response) => response?.data || [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPlanModule(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/plan/module/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePlanModule(workspaceSlug: string, moduleIds: Array<string>): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/plan/module/`, {
      ids: moduleIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePlan(workspaceSlug: string, planIds: Array<string>): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/plane/`, {
      ids: planIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlanAssignees(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plane-assignee`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPlanAssignee(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/plane-assignee`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePlanAssignee(workspaceSlug: string, assigneeId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/plane-assignee/${assigneeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePlanAssignee(workspaceSlug: string, assigneeId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/plane-assignee/${assigneeId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlanCases(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plane/case/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async cancelPlanCase(workspaceSlug: string, planCaseId: string): Promise<any> {
    const data = { id: planCaseId };
    return this.post(`/api/workspaces/${workspaceSlug}/test/plan/cancel/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
    async getPlanCaseList(
    workspaceSlug: string,
    plan_id: string,
    queries?: { page?: number; page_size?: number; module_id?: string | null; name__icontains?: string }
  ): Promise<{ data: Array<{ id: string; name: string; priority: number; assignees: string[]; result: string; created_by: string | null }>; count: number }> {
    const params = { plan_id, ...(queries || {}) } as any;
    return this.get(`/api/workspaces/${workspaceSlug}/test/plan/case-list/`, { params })
      .then((response) => ({ data: response?.data.data ?? [], count: Number(response?.data.count || 0) }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async caseExecute(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/plan/execute/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlanCaseDetail(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plan/case-detail/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addCaseBug(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/plan/add-bug/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlanCaseRecord(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/plan/records/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

}
