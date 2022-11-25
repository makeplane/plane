// api routes
import { CYCLES_ENDPOINT, CYCLE_DETAIL } from "constants/api-routes";
// services
import APIService from "lib/services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class ProjectCycleServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createCycle(workspace_slug: string, projectId: string, data: any): Promise<any> {
    return this.post(CYCLES_ENDPOINT(workspace_slug, projectId), data)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycles(workspace_slug: string, projectId: string): Promise<any> {
    return this.get(CYCLES_ENDPOINT(workspace_slug, projectId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycleIssues(workspace_slug: string, projectId: string, cycleId: string): Promise<any> {
    return this.get(CYCLE_DETAIL(workspace_slug, projectId, cycleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getCycle(workspace_slug: string, projectId: string, cycleId: string): Promise<any> {
    return this.get(CYCLE_DETAIL(workspace_slug, projectId, cycleId))
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateCycle(
    workspace_slug: string,
    projectId: string,
    cycleId: string,
    data: any
  ): Promise<any> {
    return this.put(
      CYCLE_DETAIL(workspace_slug, projectId, cycleId).replace("cycle-issues/", ""),
      data
    )
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteCycle(workspace_slug: string, projectId: string, cycleId: string): Promise<any> {
    return this.delete(
      CYCLE_DETAIL(workspace_slug, projectId, cycleId).replace("cycle-issues/", "")
    )
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ProjectCycleServices();
