import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TIssueTypeIconProps = {
  name: string;
  color?: string;
  background_color?: string;
};

export type TIssueType = {
  id: string;
  name: string;
  logo_props?: {
    icon?: TIssueTypeIconProps;
  };
};

export const projectIssueTypesCache: Map<string, Record<string, TIssueType>> = new Map();

export class ProjectIssueTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}