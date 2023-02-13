// services
import APIService from "services/api.service";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class AppInstallationsService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async addGithubApp(workspaceSlug: string, installation_id: string): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/github-installations/${installation_id}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default new AppInstallationsService();
