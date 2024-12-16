import axios, { AxiosInstance } from "axios";
import { E_IMPORTER_KEYS } from "@silo/core";
import { JiraResource, JiraProject, JiraStates, JiraPriority, ILabelConfig } from "@silo/jira/";

export class JiraServerDataService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL });
  }

  /**
   * @description get workspaces
   * @property workspaceId: string
   * @property userId: string
   * @returns workspaces | undefined
   */
  async getResources(workspaceId: string, userId: string): Promise<JiraResource[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/resources/`, {
        workspaceId,
        userId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get projects
   * @property workspaceId: string
   * @property userId: string
   * @returns projects | undefined
   */
  async getProjects(workspaceId: string, userId: string): Promise<JiraProject[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/projects/`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project states
   * @property workspaceId: string
   * @property userId: string
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
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/states/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project priorities
   * @property workspaceId: string
   * @property userId: string
   * @property projectId: string
   * @returns priorities | undefined
   */
  async getProjectPriorities(
    workspaceId: string,
    userId: string,
    projectId: string
  ): Promise<JiraPriority[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/priorities/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project labels
   * @property workspaceId: string
   * @property userId: string
   * @returns project | undefined
   */
  async getProjectLabels(workspaceId: string, userId: string): Promise<ILabelConfig[] | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/labels/`, { workspaceId, userId })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * @description get project issues count
   * @property workspaceId: string
   * @property userId: string
   * @property projectId: string
   * @returns project | undefined
   */
  async getProjectIssuesCount(workspaceId: string, userId: string, projectId: string): Promise<number | undefined> {
    return this.axiosInstance
      .post(`/api/${E_IMPORTER_KEYS.JIRA_SERVER.toLowerCase().replaceAll("_", "-")}/issue-count/`, {
        workspaceId,
        userId,
        projectId,
      })
      .then((res) => res.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
