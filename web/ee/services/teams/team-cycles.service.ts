// services
import { ICycle } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class TeamCycleService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Fetches all cycles for a team
   * @param workspaceSlug
   * @param teamId
   * @returns Promise<ICycle[]>
   */
  async getTeamCycles(workspaceSlug: string, teamId: string): Promise<ICycle[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/cycles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
