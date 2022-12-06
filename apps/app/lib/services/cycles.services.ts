// api routes
import { CYCLES_ENDPOINT, CYCLE_DETAIL } from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectCycleServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createCycle(workspaceSlug: string, projectId: string, data: any): Promise<any> {
    return this.post(CYCLES_ENDPOINT(workspaceSlug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycles(workspaceSlug: string, projectId: string): Promise<any> {
    return this.get(CYCLES_ENDPOINT(workspaceSlug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycleIssues(workspaceSlug: string, projectId: string, cycleId: string): Promise<any> {
    return this.get(CYCLE_DETAIL(workspaceSlug, projectId, cycleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCycle(
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: any
  ): Promise<any> {
    return this.put(
      CYCLE_DETAIL(workspaceSlug, projectId, cycleId).replace("cycle-issues/", ""),
      data
    )
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCycle(workspaceSlug: string, projectId: string, cycleId: string): Promise<any> {
    return this.delete(CYCLE_DETAIL(workspaceSlug, projectId, cycleId).replace("cycle-issues/", ""))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectCycleServices();
