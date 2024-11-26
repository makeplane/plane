import { API_BASE_URL } from "@plane/constants";
import APIService from "../api.service";

export default class IntakeIssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string, params = {}) {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
