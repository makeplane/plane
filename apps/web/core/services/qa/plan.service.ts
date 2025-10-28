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

  async updatePlan(workspaceSlug: string, planId: string, data: any): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/test/plane/${planId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePlan(workspaceSlug: string, planId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/plane/${planId}/`)
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
}