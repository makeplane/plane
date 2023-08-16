// services
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class IssueService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getPublicIssues(workspace_slug: string, project_slug: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspace_slug}/project-boards/${project_slug}/issues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default IssueService;
