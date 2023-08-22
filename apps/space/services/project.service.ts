// services
import APIService from "services/api.service";

class ProjectService extends APIService {
  constructor() {
    super(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getProjectSettingsAsync(workspace_slug: string, project_slug: string): Promise<any> {
    return this.get(`/api/public/workspaces/${workspace_slug}/project-boards/${project_slug}/settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default ProjectService;
