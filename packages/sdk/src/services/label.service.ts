import { APIService } from "@/services/api.service";
// types
import {
  ClientOptions,
  ExcludedProps,
  ExIssueLabel,
  Optional,
  Paginated,
} from "@/types/types";

export class LabelService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async list(
    slug: string,
    projectId: string,
  ): Promise<Paginated<ExIssueLabel>> {
    return this.get(`/api/v1/workspaces/${slug}/projects/${projectId}/labels/`)
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async create(
    slug: string,
    projectId: string,
    payload: Omit<Optional<ExIssueLabel>, ExcludedProps>,
  ): Promise<ExIssueLabel> {
    return this.post(
      `/api/v1/workspaces/${slug}/projects/${projectId}/labels/`,
      payload,
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async update(
    slug: string,
    projectId: string,
    labelId: string,
    payload: Omit<Optional<ExIssueLabel>, ExcludedProps>,
  ) {
    return this.patch(
      `/api/v1/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`,
      payload,
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }

  async destroy(slug: string, projectId: string, labelId: string) {
    return this.delete(
      `/api/v1/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`,
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error;
      });
  }
}
