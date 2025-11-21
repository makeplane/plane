// plane imports
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";


export type ModuleCountResponse = { total: number } & Record<string, number>;

export class CaseService extends APIService {
  constructor() {
    super(API_BASE_URL);
   }

   async createReviewModule(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/review/module/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async getReviewModules(workspaceSlug: string, queries?: any): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/module/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteReviewModule(workspaceSlug: string, data: { ids: string[] }): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/review/module/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

    //获取评审枚举值
    async getReviewEnums(workspaceSlug: string): Promise<any> {
      return this.get(`/api/workspaces/${workspaceSlug}/test/review/enums/`)
        .then((response) => response?.data)
        .catch((error) => {
            throw error?.response?.data;
        });
  }

  async getReviews(workspaceSlug: string, queries?: any): Promise<{ data: any[]; count: number }> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/`, {
      params: queries,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createReview(workspaceSlug: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/review/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateReview(workspaceSlug: string, data: any): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/test/review/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
    async deleteReview(workspaceSlug: string, data: { ids: string[] }): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/test/review/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getReviewCases(workspaceSlug: string, id: string): Promise<string[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/${id}/cases/`)
      .then((response) => (Array.isArray(response?.data?.ids) ? response.data.ids.map(String) : []))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getReviewCaseList(
    workspaceSlug: string,
    review_id: string,
    queries?: { page?: number; page_size?: number; module_id?: string | null; name__icontains?: string }
  ): Promise<{ data: Array<{ id: string; name: string; priority: number; assignees: string[]; result: string; created_by: string | null }>; count: number }> {
    const params = { review_id, ...(queries || {}) } as any;
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/case-list/`, { params })
      .then((response) => ({ data: response?.data.data ?? [], count: Number(response?.data.count || 0) }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async CaseCancel(workspaceSlug: string, data: { ids: string[] }): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/test/review/cancel-case/`, data)
      .then(() => {})
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getModuleCount(workspaceSlug: string, review_id: string): Promise<ModuleCountResponse> {
    const query = {review_id}
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/module-count/`, {params: query})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

    async getRecords(workspaceSlug: string, review_id: string, case_id: string): Promise<any> {
    const query = {review_id, case_id}
    return this.get(`/api/workspaces/${workspaceSlug}/test/review/records/`, {params: query})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

}
