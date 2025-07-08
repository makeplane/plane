import axios, { AxiosInstance } from "axios";
import { GitlabUser } from "@/gitlab/types";

export class GitLabService {
  client: AxiosInstance;

  constructor(
    access_token: string,
    refresh_token: string,
    refresh_callback: (access_token: string, refresh_token: string) => Promise<void>,
    hostname: string = "gitlab.com"
  ) {
    this.client = axios.create({
      baseURL: "https://" + hostname + "/api/v4",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const response = await axios.post("https://gitlab.com/oauth/token", {
            client_id: process.env.GITLAB_CLIENT_ID,
            client_secret: process.env.GITLAB_CLIENT_SECRET,
            refresh_token: refresh_token,
            grant_type: "refresh_token",
          });

          await refresh_callback(response.data.access_token, response.data.refresh_token);

          const new_access_token = response.data.access_token;
          this.client.defaults.headers.Authorization = `Bearer ${new_access_token}`;
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async createMergeRequestComment(projectId: number, mergeRequestIid: number, body: string) {
    const response = await this.client.post(`/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`, { body });
    return response.data;
  }

  async getMergeRequestComments(projectId: number, mergeRequestIid: number) {
    const response = await this.client.get(`/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`);
    return response.data;
  }

  async updateMergeRequestComment(projectId: number, mergeRequestIid: number, noteId: number, body: string) {
    const response = await this.client.put(`/projects/${projectId}/merge_requests/${mergeRequestIid}/notes/${noteId}`, {
      body,
    });
    return response.data;
  }

  async getUser(): Promise<GitlabUser> {
    const response = await this.client.get("/user");
    return response.data;
  }

  async getRepos() {
    const response = await this.client.get("/projects");
    return response.data;
  }

  async createIssue(projectId: number, issue: { title: string; description: string }) {
    const response = await this.client.post(`/projects/${projectId}/issues`, issue);
    return response.data;
  }

  async updateIssue(projectId: number, issueId: number, issue: { title?: string; description?: string }) {
    const response = await this.client.put(`/projects/${projectId}/issues/${issueId}`, issue);
    return response.data;
  }

  async createIssueComment(projectId: number, issueId: number, body: string) {
    const response = await this.client.post(`/projects/${projectId}/issues/${issueId}/notes`, { body });
    return response.data;
  }

  async updateIssueComment(projectId: number, noteId: number, body: string) {
    const response = await this.client.put(`/projects/${projectId}/issues/notes/${noteId}`, { body });
    return response.data;
  }

  async getIssues(projectId: number) {
    const response = await this.client.get(`/projects/${projectId}/issues`);
    return response.data;
  }

  async getLabels(projectId: number) {
    const response = await this.client.get(`/projects/${projectId}/labels`);
    return response.data;
  }

  async getUsersForRepo(projectId: number) {
    const response = await this.client.get(`/projects/${projectId}/members`);
    return response.data;
  }

  async addWebhookToProject(projectId: string, url: string, token: string) {
    try {
      const response = await this.client.post(`/projects/${projectId}/hooks`, {
        url,
        token,
        push_events: true,
        merge_requests_events: true,
        pipeline_events: true,
        tag_push_events: true,
        issues_events: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param projectId - entityId or gitlab project id
   * @param hookId - webhookId or gitlab hook id
   * @returns
   */
  async removeWebhookFromProject(projectId: string, hookId: string) {
    try {
      const response = await this.client.delete(`/projects/${projectId}/hooks/${hookId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing webhook from gitlab project", error);
    }
  }

  async addWebhookToGroup(groupId: string, url: string, token: string) {
    try {
      const response = await this.client.post(`/groups/${groupId}/hooks`, {
        url,
        token,
        push_events: true,
        merge_requests_events: true,
        pipeline_events: true,
        tag_push_events: true,
        issues_events: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param groupId - entityId or gitlab group id
   * @param hookId - webhookId or gitlab hook id
   * @returns
   */
  async removeWebhookFromGroup(groupId: string, hookId: string) {
    try {
      const response = await this.client.delete(`/groups/${groupId}/hooks/${hookId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getGroups() {
    try {
      const response = await this.client.get("/groups?owned=true&membership=true&pages=100");
      return response.data;
    } catch (error) {
      console.error("Error removing webhook from gitlab group", error);
    }
  }

  async getProjects() {
    try {
      const response = await this.client.get("/projects?membership=true&pages=100");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
