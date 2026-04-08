/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { AxiosInstance } from "axios";
import axios from "axios";
import type { GitlabUser, GitlabIssue, GitlabNote, TGitlabProjectWebhook } from "@/gitlab/types";

export class GitLabService {
  client: AxiosInstance;
  baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private refreshCallback: (access_token: string, refresh_token: string) => Promise<void>;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(
    access_token: string,
    refresh_token: string,
    refresh_callback: (access_token: string, refresh_token: string) => Promise<void>,
    baseUrl: string = "https://gitlab.com",
    clientId?: string,
    clientSecret?: string
  ) {
    this.baseUrl = baseUrl;
    this.clientId = clientId || process.env.GITLAB_CLIENT_ID || "";
    this.clientSecret = clientSecret || process.env.GITLAB_CLIENT_SECRET || "";
    this.refreshToken = refresh_token;
    this.refreshCallback = refresh_callback;

    this.client = axios.create({
      baseURL: baseUrl + "/api/v4",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh for 401 errors that haven't been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          console.log("[GitLab] 401 received, attempting token refresh...");

          try {
            // If already refreshing, wait for the existing refresh to complete
            if (this.isRefreshing && this.refreshPromise) {
              console.log("[GitLab] Refresh already in progress, waiting...");
              const newAccessToken = await this.refreshPromise;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client.request(originalRequest);
            }

            // Start the refresh process
            this.isRefreshing = true;
            this.refreshPromise = this.performTokenRefresh();

            const newAccessToken = await this.refreshPromise;
            console.log("[GitLab] Token refresh successful, retrying original request...");
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client.request(originalRequest);
          } catch (refreshError: any) {
            // Token refresh failed - reject with the original 401 error for clarity
            console.error("[GitLab] Token refresh failed:", refreshError?.message || refreshError);
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async performTokenRefresh(): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/oauth/token`, {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    const newAccessToken = response.data.access_token;
    const newRefreshToken = response.data.refresh_token;

    // Update the stored refresh token for future refreshes
    this.refreshToken = newRefreshToken;

    // Update the default Authorization header for future requests
    this.client.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

    // Persist the new tokens via callback
    await this.refreshCallback(newAccessToken, newRefreshToken);

    return newAccessToken;
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

  async createIssue(
    projectId: number,
    issue: { title: string; description: string; labels?: string[] }
  ): Promise<GitlabIssue> {
    const response = await this.client.post(`/projects/${projectId}/issues`, issue);
    return response.data;
  }

  async updateIssue(
    projectId: number,
    issueIId: number,
    issue: { title?: string; description?: string; labels?: string[] }
  ): Promise<GitlabIssue> {
    const response = await this.client.put(`/projects/${projectId}/issues/${issueIId}`, issue);
    return response.data;
  }

  async getIssues(projectId: number) {
    const response = await this.client.get(`/projects/${projectId}/issues`);
    return response.data;
  }

  async getIssueById(issueId: number): Promise<GitlabIssue> {
    const response = await this.client.get(`/issues/${issueId}`);
    return response.data;
  }

  async getIssue(projectId: number, issueIId: number): Promise<GitlabIssue> {
    const response = await this.client.get(`/projects/${projectId}/issues/${issueIId}`);
    return response.data;
  }

  async createIssueComment(projectId: number, issueIId: number, body: string): Promise<GitlabNote> {
    const response = await this.client.post(`/projects/${projectId}/issues/${issueIId}/notes`, { body });
    return response.data;
  }

  async getIssueComment(projectId: number, issueIId: number, noteId: number): Promise<GitlabNote> {
    const response = await this.client.get(`/projects/${projectId}/issues/${issueIId}/notes/${noteId}`);
    return response.data;
  }

  async getIssueComments(projectId: number, issueIId: number): Promise<GitlabNote[]> {
    const response = await this.client.get(`/projects/${projectId}/issues/${issueIId}/notes`);
    return response.data;
  }

  async updateIssueComment(projectId: number, issueIId: number, noteId: number, body: string): Promise<GitlabNote> {
    const response = await this.client.put(`/projects/${projectId}/issues/${issueIId}/notes/${noteId}`, { body });
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

  async getProjectWebhook(projectId: string, hookId: string): Promise<TGitlabProjectWebhook> {
    const response = await this.client.get(`/projects/${projectId}/hooks/${hookId}`);
    return response.data;
  }

  async updateProjectWebhook(
    projectId: string,
    hookId: string,
    url: string,
    webhookData: Partial<TGitlabProjectWebhook>
  ) {
    const response = await this.client.put(`/projects/${projectId}/hooks/${hookId}`, {
      url,
      ...webhookData,
    });
    return response.data;
  }

  async addWebhookToProject(projectId: string, url: string, token: string, events: Map<string, boolean>) {
    const response = await this.client.post(`/projects/${projectId}/hooks`, {
      url,
      token,
      ...Object.fromEntries(events),
    });
    return response.data;
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
  }

  /**
   *
   * @param groupId - entityId or gitlab group id
   * @param hookId - webhookId or gitlab hook id
   * @returns
   */
  async removeWebhookFromGroup(groupId: string, hookId: string) {
    const response = await this.client.delete(`/groups/${groupId}/hooks/${hookId}`);
    return response.data;
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
    const response = await this.client.get("/projects?membership=true&pages=100");
    return response.data;
  }

  async getAllProjects() {
    const allProjects = [];
    const perPage = 100;
    const currentPage = 1;
    let totalPages = 1;

    // Fetch first page to get pagination info
    const firstResponse = await this.client.get("/projects", {
      params: {
        membership: true,
        per_page: perPage,
        page: currentPage,
      },
    });

    allProjects.push(...firstResponse.data);

    // Get total pages from response headers
    const totalPagesHeader = firstResponse.headers["x-total-pages"];
    if (totalPagesHeader) {
      totalPages = parseInt(totalPagesHeader, 10);
    }

    // Fetch remaining pages if there are more
    if (totalPages > 1) {
      const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const pagePromises = remainingPages.map((page) =>
        this.client.get("/projects", {
          params: {
            membership: true,
            per_page: perPage,
            page,
          },
        })
      );

      const responses = await Promise.all(pagePromises);
      responses.forEach((response) => {
        allProjects.push(...response.data);
      });
    }

    return allProjects;
  }
}
