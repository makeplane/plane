import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExIssue, Paginated } from "@/types/types";

export class EpicService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string, projectId: string): Promise<Paginated<ExIssue>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/epics/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async getEpic(slug: string, projectId: string, epicId: string): Promise<ExIssue> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/epics/${epicId}/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}
