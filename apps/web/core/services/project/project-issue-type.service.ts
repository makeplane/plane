import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type TIssueTypeIconProps = {
  name: string;
  color?: string;
  background_color?: string;
};

export type TIssueTypeProperty = {
  is_default: boolean | undefined;
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

  // 添加缓存清除方法
  clearCache(workspaceSlug: string, projectId: string): void {
    const cacheKey = `${workspaceSlug}-${projectId}`;
    projectIssueTypesCache.delete(cacheKey);
  }

  async fetchProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<TIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 新增：创建工作项类型，请求风格与其他服务保持一致
  async createProjectIssueType(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssueType>
  ): Promise<TIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`, data)
      .then((response) => {
        // 清除缓存以确保下次获取最新数据
        this.clearCache(workspaceSlug, projectId);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 新增：删除工作项类型
  async deleteProjectIssueType(workspaceSlug: string, projectId: string, issueTypeId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/`)
      .then((response) => {
        // 清除缓存以确保下次获取最新数据
        this.clearCache(workspaceSlug, projectId);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data.msg;
      });
  }

  // 新增：创建工作项类型属性
  async createIssueTypeProperty(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    data: Partial<TIssueTypeProperty>
  ): Promise<TIssueTypeProperty> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/issue-properties/`, data)
      .then((response) => {
        // 清除缓存以确保下次获取最新数据（包含新属性）
        this.clearCache(workspaceSlug, projectId);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 新增：获取工作项类型属性列表
  async fetchIssueTypeProperties(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string
  ): Promise<TIssueTypeProperty[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // 新增：删除工作项类型属性
  async deleteIssueTypeProperty(
    workspaceSlug: string,
    projectId: string,
    issueTypeId: string,
    propertyId: string
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/${issueTypeId}/issue-properties/${propertyId}/`)
      .then((response) => {
        // 清除缓存以确保下次获取最新数据
        this.clearCache(workspaceSlug, projectId);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  
}