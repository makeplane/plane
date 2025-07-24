import axios, { AxiosInstance } from "axios";
import { JiraResource, JiraProject, JiraStates, JiraPriority, ImportedJiraUser } from "@plane/etl/jira";
import { IAdditionalUsersResponse } from "@plane/types";

export class JiraService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials: true });
  }

  /**
   * @description get workspaces
   * @property workspaceId: string
   * @property userId: string
   * @returns workspaces | undefined
   */
  async getResources(workspaceId: string, userId: string): Promise<JiraResource[] | undefined> {
    return this.axiosInstance
      .post(`/api/jira/resources/`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get projects
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @returns projects | undefined
   */
  async getProjects(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined
  ): Promise<JiraProject[] | undefined> {
    return this.axiosInstance
      .post(`/api/jira/projects/`, { workspaceId, userId, cloudId: resourceId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project states
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @property projectId: string
   * @returns states | undefined
   */
  async getProjectStates(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined,
    projectId: string
  ): Promise<JiraStates[] | undefined> {
    return this.axiosInstance
      .post(`/api/jira/states/`, { workspaceId, userId, cloudId: resourceId, projectId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project priorities
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @property projectId: string
   * @returns priorities | undefined
   */
  async getProjectPriorities(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined,
    projectId: string
  ): Promise<JiraPriority[] | undefined> {
    return this.axiosInstance
      .post(`/api/jira/priorities/`, { workspaceId, userId, cloudId: resourceId, projectId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project labels
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @property projectId: string
   * @returns project | undefined
   */
  async getProjectLabels(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined,
    projectId: string
  ): Promise<string[] | undefined> {
    return this.axiosInstance
      .post(`/api/jira/labels/`, { workspaceId, userId, cloudId: resourceId, projectId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property resourceId: string
   * @property projectId: string
   * @returns project | undefined
   */
  async getProjectIssuesCount(
    workspaceId: string,
    userId: string,
    resourceId: string | undefined,
    projectId: string
  ): Promise<number | undefined> {
    return this.axiosInstance
      .post(`/api/jira/issue-count/`, { workspaceId, userId, cloudId: resourceId, projectId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property workspaceSlug: string
   * @property jiraEmails: string[]
   */
  async getAdditionalUsers(
    workspaceId: string,
    userId: string,
    workspaceSlug: string,
    userData: ImportedJiraUser[]
  ): Promise<IAdditionalUsersResponse | undefined> {
    return this.axiosInstance
      .post(`/api/jira/additional-users/${workspaceId}/${workspaceSlug}/${userId}`, { userData })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
