import { APIService } from "@/services/api.service";
// types
import { ClientOptions, ExcludedProps, ExProject, Optional, Paginated } from "@/types/types";

export class ProjectService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(slug: string): Promise<Paginated<ExProject>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listProjects(slug: string, cursor?: string): Promise<Paginated<ExProject>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/`, {
      params: {
        ...(cursor && { cursor }),
        per_page: 20,
      },
    })
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listAllProjects(slug: string): Promise<ExProject[]> {
    let cursor: string | undefined;
    const projects: ExProject[] = [];
    let hasMore = true;
    while (hasMore) {
      const response = await this.listProjects(slug, cursor);
      projects.push(...response.results);
      hasMore = response.next_page_results;
      cursor = response.next_cursor;
    }
    return projects;
  }

  async getProject(slug: string, id: string): Promise<ExProject> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${id}`)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(slug: string, payload: Omit<Optional<ExProject>, ExcludedProps>) {
    return this.post(`/api/v1/workspaces/${slug}/projects/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(slug: string, projectId: string, payload: Omit<Optional<ExProject>, ExcludedProps>) {
    return this.patch(`/api/v1/workspaces/${slug}/projects/${projectId}/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
