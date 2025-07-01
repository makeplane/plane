/* eslint-disable no-useless-catch */
// helpers
import { API_BASE_URL  } from "@plane/constants";
// plane web types
import {
  TWorklog,
  TWorklogDownload,
  TWorklogDownloadPaginatedInfo,
  TWorklogIssueTotalCount,
  TWorklogPaginatedInfo,
  TWorklogQueryParams,
} from "@/plane-web/types";
// services
import { APIService } from "@/services/api.service";

export class WorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * @description fetching workspace worklogs
   * @param { string } workspaceSlug
   * @param { TWorklogQueryParams } params
   * @returns { TWorklogPaginatedInfo | undefined }
   */
  async fetchWorkspaceWorklogs(
    workspaceSlug: string,
    params: TWorklogQueryParams
  ): Promise<TWorklogPaginatedInfo | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/worklogs/`, { params });
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description fetching issue worklogs by issueId
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @returns { TWorklog[] | undefined }
   */
  async fetchWorklogsByIssueId(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TWorklog[] | undefined> {
    try {
      const { data } = await this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description fetching issue worklogs by issueId
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @returns { TWorklogIssueTotalCount | undefined }
   */
  async fetchWorklogCountByIssueId(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<TWorklogIssueTotalCount | undefined> {
    try {
      const { data } = await this.get(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/total-worklogs/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description create issue worklog
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { Partial<TWorklog> } payload
   * @returns { TWorklog | undefined }
   */
  async createWorklog(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    payload: Partial<TWorklog>
  ): Promise<TWorklog | undefined> {
    try {
      const { data } = await this.post(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description update issue worklog
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { string } worklogId
   * @param { Partial<TWorklog> } payload
   * @returns { TWorklog | undefined }
   */
  async updateWorklogById(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    worklogId: string,
    payload: Partial<TWorklog>
  ): Promise<TWorklog | undefined> {
    try {
      const { data } = await this.patch(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
        payload
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description update issue worklog
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } issueId
   * @param { string } worklogId
   * @returns { void }
   */
  async deleteWorklogById(workspaceSlug: string, projectId: string, issueId: string, worklogId: string): Promise<void> {
    try {
      const { data } = await this.delete(
        `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`
      );
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description fetching workspace worklog downloads
   * @param { string } workspaceSlug
   * @param { string } params
   * @returns { TWorklogDownloadPaginatedInfo | undefined }
   */
  async fetchWorkspaceWorklogDownloads(
    workspaceSlug: string,
    params: TWorklogQueryParams
  ): Promise<TWorklogDownloadPaginatedInfo | undefined> {
    try {
      const { data } = await this.get(`/api/workspaces/${workspaceSlug}/export-worklogs/`, { params });
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description create worklog download
   * @param { string } workspaceSlug
   * @param { Partial<TWorklogDownload> } payload
   * @param { TWorklogQueryParams } params
   * @returns { TWorklogDownload | undefined }
   */
  async createWorklogDownload(
    workspaceSlug: string,
    payload: Partial<TWorklogDownload>,
    params: TWorklogQueryParams
  ): Promise<TWorklogDownload | undefined> {
    try {
      const { data } = await this.post(`/api/workspaces/${workspaceSlug}/export-worklogs/`, payload, { params });
      return data || undefined;
    } catch (error) {
      throw error;
    }
  }
}

const worklogService = new WorklogService();

export default worklogService;
