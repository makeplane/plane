// helpers
import { STICKIES_PER_PAGE, API_BASE_URL } from "@plane/constants";
import { TSticky } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class StickyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createSticky(workspaceSlug: string, payload: Partial<TSticky>) {
    return this.post(`/api/workspaces/${workspaceSlug}/stickies/`, payload)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getStickies(
    workspaceSlug: string,
    cursor: string,
    query?: string,
    per_page?: number
  ): Promise<{ results: TSticky[]; total_pages: number }> {
    return this.get(`/api/workspaces/${workspaceSlug}/stickies/`, {
      params: {
        cursor,
        per_page: per_page || STICKIES_PER_PAGE,
        query,
      },
    })
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getSticky(workspaceSlug: string, id: string) {
    return this.get(`/api/workspaces/${workspaceSlug}/stickies/${id}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async updateSticky(workspaceSlug: string, id: string, data: Partial<TSticky>) {
    return await this.patch(`/api/workspaces/${workspaceSlug}/stickies/${id}/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async deleteSticky(workspaceSlug: string, id: string) {
    return await this.delete(`/api/workspaces/${workspaceSlug}/stickies/${id}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
