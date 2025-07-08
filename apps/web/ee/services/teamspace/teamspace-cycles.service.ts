// services
import { ICycle } from "@plane/types";
// helpers
import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export class TeamspaceCycleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all cycles for a teamspace
   * @param workspaceSlug
   * @param teamspaceId
   * @returns Promise<ICycle[]>
   */
  async getTeamspaceCycles(workspaceSlug: string, teamspaceId: string): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
