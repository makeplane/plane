// plane types
// helpers
import { API_BASE_URL } from "@plane/constants";
import { TProjectUpdatesComment } from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";
import { FileUploadService } from "@/services/file-upload.service";

export class ProjectUpdateCommentService extends APIService {
  private fileUploadService: FileUploadService;

  constructor() {
    super(API_BASE_URL);
    // upload service
    this.fileUploadService = new FileUploadService();
  }

  async getProjectUpdateComments(
    workspaceSlug: string,
    projectId: string,
    updateId: string
  ): Promise<TProjectUpdatesComment[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectUpdateComment(
    workspaceSlug: string,
    projectId: string,
    updateId: string,
    data: Partial<TProjectUpdatesComment>
  ): Promise<TProjectUpdatesComment> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${updateId}/comments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchProjectUpdateComment(
    workspaceSlug: string,
    projectId: string,
    commentId: string,
    data: Partial<TProjectUpdatesComment>
  ): Promise<void> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${commentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectUpdateComment(workspaceSlug: string, projectId: string, commentId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/updates/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
