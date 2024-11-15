// types
import {
  TDuplicateIssuePayload,
  TDuplicateIssueResponse,
  TPlannerData,
  TPlannerStatusData,
  TProjectPlannerInput,
} from "@plane/types";
import { PI_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";

export class PIService extends APIService {
  constructor() {
    super(PI_BASE_URL);
  }

  async getDuplicateIssues(data: Partial<TDuplicateIssuePayload>): Promise<TDuplicateIssueResponse> {
    return this.post(`/api/v1/dupes/issues/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async createPlanner(data: TProjectPlannerInput): Promise<TPlannerData> {
    return this.post(`/api/v1/actions/create/`, data)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async getPlannerStatusData(taskId: string): Promise<TPlannerStatusData> {
    return this.get(`/api/v1/actions/status/${taskId}`)
      .then((res) => res?.data)
      .catch((err) => {
        throw err?.response?.data;
      });
  }
}
