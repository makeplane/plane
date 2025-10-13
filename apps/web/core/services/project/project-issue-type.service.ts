import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TIssueTypeIconProps = {
  name: string;
  color?: string;
  background_color?: string;
};

export type TIssueTypeProperty = {
  id: string;
  issue_type: string;
  display_name: string;
  property_type: "TEXT" | "NUMBER" | "DATE" | "DATETIME" | "SELECT" | "MULTI_SELECT" | "BOOLEAN" | "URL" | "EMAIL";
  relation_type?: string | null;
  is_multi: boolean;
  is_active: boolean;
  is_required: boolean;
  logo_props: {
    icon?: {
      name: string;
      color?: string;
      background_color?: string;
    };
    in_use?: string;
  };
  default_value: any[];
  settings: {
    display_format?: string;
  };
  options: any[];
  sort_order: number;
  project: string;
  created_at: string;
  updated_at: string;
};

export type TIssueType = {
  id: string;
  name: string;
  description?: string;
  logo_props?: {
    icon?: TIssueTypeIconProps;
    in_use?: string;
  };
  is_epic?: boolean;
  is_default?: boolean;
  is_active?: boolean;
  level?: number;
  external_source?: string | null;
  external_id?: string | null;
  workspace?: string;
  created_at?: string;
  updated_at?: string;
  properties?: TIssueTypeProperty[];
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