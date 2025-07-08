// plane imports
import { API_BASE_URL } from "@plane/constants";
import { type TDescriptionVersionsListResponse, type TDescriptionVersionDetails } from "@plane/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class IntakeWorkItemVersionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listDescriptionVersions(
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string
  ): Promise<TDescriptionVersionsListResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-work-items/${intakeWorkItemId}/description-versions/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieveDescriptionVersion(
    workspaceSlug: string,
    projectId: string,
    intakeWorkItemId: string,
    versionId: string
  ): Promise<TDescriptionVersionDetails> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-work-items/${intakeWorkItemId}/description-versions/${versionId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
