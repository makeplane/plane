// types
import {
  IAnalyticsParams,
  IAnalyticsResponse,
  IDefaultAnalyticsResponse,
  IExportAnalyticsFormData,
  ISaveAnalyticsFormData,
} from "@plane/types";
// constants
import { API_BASE_URL } from "@plane/constants";
// services
import APIService from "./api.service";

/**
 * Service class for handling workspace analytics operations
 * Provides methods for fetching, saving, and exporting analytics data
 * @extends {APIService}
 */
export default class AnalyticsService extends APIService {
  /**
   * Creates an instance of AnalyticsService
   * Initializes with the base API URL
   */
  constructor() {
    super(API_BASE_URL);
  }

  /**
   * Retrieves analytics data for a specific workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {IAnalyticsParams} params - Parameters for filtering analytics data
   * @param {string|number} [params.project] - Optional project identifier that will be converted to string
   * @returns {Promise<IAnalyticsResponse>} The analytics data for the workspace
   * @throws {Error} Throws response data if the request fails
   */
  async getAnalytics(workspaceSlug: string, params: IAnalyticsParams): Promise<IAnalyticsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/analytics/`, {
      params: {
        ...params,
        project: params?.project ? params.project.toString() : null,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves default analytics data for a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {Partial<IAnalyticsParams>} [params] - Optional parameters for filtering default analytics
   * @param {string|number} [params.project] - Optional project identifier that will be converted to string
   * @returns {Promise<IDefaultAnalyticsResponse>} The default analytics data
   * @throws {Error} Throws response data if the request fails
   */
  async getDefaultAnalytics(
    workspaceSlug: string,
    params?: Partial<IAnalyticsParams>
  ): Promise<IDefaultAnalyticsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/default-analytics/`, {
      params: {
        ...params,
        project: params?.project ? params.project.toString() : null,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Saves analytics view configuration for a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {ISaveAnalyticsFormData} data - The analytics configuration data to save
   * @returns {Promise<any>} The response from saving the analytics view
   * @throws {Error} Throws response data if the request fails
   */
  async save(workspaceSlug: string, data: ISaveAnalyticsFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/analytic-view/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Exports analytics data for a workspace
   * @param {string} workspaceSlug - The unique identifier for the workspace
   * @param {IExportAnalyticsFormData} data - Configuration for the analytics export
   * @returns {Promise<any>} The exported analytics data
   * @throws {Error} Throws response data if the request fails
   */
  async export(workspaceSlug: string, data: IExportAnalyticsFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/export-analytics/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
