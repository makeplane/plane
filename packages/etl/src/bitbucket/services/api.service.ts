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
import type {
  BitbucketApiProps,
  BitbucketPaginatedResponse,
  BitbucketPRComment,
  BitbucketPullRequestActivity,
  BitbucketPullRequest,
  BitbucketRepository,
  BitbucketTokenResponse,
  BitbucketUser,
} from "../types";

const BITBUCKET_API_BASE_PATH = "/rest/api/1.0";
const AUTH_USER_HEADER_NAMES = ["x-ausername", "x-authenticated-user"] as const;
const CURRENT_USER_CANDIDATE_SLUGS = ["~current", "current"] as const;

const getHeaderValue = (headers: Record<string, unknown>, headerName: string): string | undefined => {
  const value = headers[headerName] ?? headers[headerName.toLowerCase()];
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const normalizeUsername = (value: string): string | undefined => {
  const normalizedValue = value.trim();
  if (!normalizedValue || normalizedValue.toLowerCase() === "anonymous") {
    return undefined;
  }

  return normalizedValue.replace(/^~/, "");
};

export class BitbucketService {
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private refreshToken?: string;
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly refreshCallback?: (accessToken: string, refreshToken: string) => Promise<void>;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(props: BitbucketApiProps) {
    this.baseUrl = props.baseUrl.replace(/\/+$/, "");
    this.refreshToken = props.refreshToken;
    this.clientId = props.clientId;
    this.clientSecret = props.clientSecret;
    this.refreshCallback = props.refreshCallback;

    this.client = axios.create({
      baseURL: `${this.baseUrl}${BITBUCKET_API_BASE_PATH}`,
      headers: {
        Authorization: `Bearer ${props.accessToken}`,
        Accept: "application/json",
      },
    });

    if (this.refreshToken && this.clientId && this.clientSecret) {
      this.setupRefreshInterceptor();
    }
  }

  private setupRefreshInterceptor(): void {
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            if (this.isRefreshing && this.refreshPromise) {
              const newAccessToken = await this.refreshPromise;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client.request(originalRequest);
            }

            this.isRefreshing = true;
            this.refreshPromise = this.performTokenRefresh();

            const newAccessToken = await this.refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client.request(originalRequest);
          } catch {
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
    const params = new URLSearchParams({
      client_id: this.clientId!,
      client_secret: this.clientSecret!,
      refresh_token: this.refreshToken!,
      grant_type: "refresh_token",
    });

    const { data } = await axios.post<BitbucketTokenResponse>(
      `${this.baseUrl}/rest/oauth2/latest/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    this.refreshToken = data.refresh_token;
    this.client.defaults.headers.Authorization = `Bearer ${data.access_token}`;

    if (this.refreshCallback) {
      await this.refreshCallback(data.access_token, data.refresh_token);
    }

    return data.access_token;
  }

  async getPullRequest(projectKey: string, repoSlug: string, prId: string): Promise<BitbucketPullRequest> {
    const { data } = await this.client.get<BitbucketPullRequest>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}`
    );
    return data;
  }

  async getPullRequestComments(projectKey: string, repoSlug: string, prId: string): Promise<BitbucketPRComment[]> {
    const activities = await this.getPaginatedValues<BitbucketPullRequestActivity>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/activities`
    );

    const commentsById = new Map<string, BitbucketPRComment>();

    for (const activity of activities) {
      if (!activity.action?.toUpperCase().includes("COMMENT")) {
        continue;
      }

      const comment = activity.comment;
      if (!comment || comment.id === undefined || comment.deleted) {
        continue;
      }

      const commentId = comment.id.toString();
      const existingComment = commentsById.get(commentId);
      const nextUpdatedDate = comment.updatedDate ?? comment.createdDate ?? 0;
      const previousUpdatedDate = existingComment?.updatedDate ?? existingComment?.createdDate ?? 0;

      if (!existingComment || nextUpdatedDate >= previousUpdatedDate) {
        commentsById.set(commentId, comment);
      }
    }

    return [...commentsById.values()];
  }

  async getPullRequestComment(
    projectKey: string,
    repoSlug: string,
    prId: string,
    commentId: string
  ): Promise<BitbucketPRComment> {
    const { data } = await this.client.get<BitbucketPRComment>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/comments/${commentId}`
    );
    return data;
  }

  async createPullRequestComment(
    projectKey: string,
    repoSlug: string,
    prId: string,
    text: string
  ): Promise<BitbucketPRComment> {
    const { data } = await this.client.post<BitbucketPRComment>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/comments`,
      {
        text,
      }
    );
    return data;
  }

  async updatePullRequestComment(
    projectKey: string,
    repoSlug: string,
    prId: string,
    commentId: string,
    version: number,
    text: string
  ): Promise<BitbucketPRComment> {
    const { data } = await this.client.put<BitbucketPRComment>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/comments/${commentId}`,
      {
        text,
        version,
      }
    );
    return data;
  }

  async deletePullRequestComment(
    projectKey: string,
    repoSlug: string,
    prId: string,
    commentId: string,
    version: number
  ): Promise<void> {
    await this.client.delete(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/pull-requests/${prId}/comments/${commentId}`,
      {
        params: {
          version,
        },
      }
    );
  }

  async createRepositoryWebhook(
    projectKey: string,
    repoSlug: string,
    url: string,
    secret: string,
    events: string[]
  ): Promise<{ id: number }> {
    const body: Record<string, unknown> = {
      name: "Plane",
      url,
      active: true,
      events,
    };
    if (secret) {
      body.configuration = { secret };
    }
    const { data } = await this.client.post<{ id: number }>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/webhooks`,
      body
    );
    return data;
  }

  async deleteRepositoryWebhook(projectKey: string, repoSlug: string, webhookId: string): Promise<void> {
    await this.client.delete(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}/webhooks/${encodeURIComponent(webhookId)}`
    );
  }

  async getRepository(projectKey: string, repoSlug: string): Promise<BitbucketRepository> {
    const { data } = await this.client.get<BitbucketRepository>(
      `/projects/${encodeURIComponent(projectKey)}/repos/${encodeURIComponent(repoSlug)}`
    );
    return data;
  }

  async getRepositoriesForProject(projectKey: string): Promise<BitbucketRepository[]> {
    return this.getPaginatedValues<BitbucketRepository>(`/projects/${encodeURIComponent(projectKey)}/repos`);
  }

  async getRepositories(): Promise<BitbucketRepository[]> {
    return this.getPaginatedValues<BitbucketRepository>("/repos");
  }

  async getCurrentUser(): Promise<BitbucketUser> {
    for (const userSlug of CURRENT_USER_CANDIDATE_SLUGS) {
      const currentUser = await this.tryGetUserBySlug(userSlug);
      if (currentUser) {
        return currentUser;
      }
    }

    const { headers } = await this.client.get<BitbucketPaginatedResponse<BitbucketUser>>("/users", {
      params: {
        limit: 1,
      },
    });

    let authenticatedUsername = AUTH_USER_HEADER_NAMES.map((headerName) =>
      getHeaderValue(headers as Record<string, unknown>, headerName)
    )
      .map((headerValue) => (headerValue ? normalizeUsername(headerValue) : undefined))
      .find((username) => Boolean(username));

    if (!authenticatedUsername) {
      try {
        const profileProbeResponse = await this.client.get("/profile/recent/repos", {
          params: {
            limit: 1,
          },
        });
        authenticatedUsername = AUTH_USER_HEADER_NAMES.map((headerName) =>
          getHeaderValue(profileProbeResponse.headers as Record<string, unknown>, headerName)
        )
          .map((headerValue) => (headerValue ? normalizeUsername(headerValue) : undefined))
          .find((username) => Boolean(username));
      } catch {
        // Some Bitbucket deployments may disable profile APIs; fall through to hard failure.
      }
    }

    if (authenticatedUsername) {
      const userBySlug = await this.tryGetUserBySlug(authenticatedUsername);
      if (userBySlug) {
        return userBySlug;
      }

      const userSearch = await this.client.get<BitbucketPaginatedResponse<BitbucketUser>>("/users", {
        params: {
          filter: authenticatedUsername,
          limit: 25,
        },
      });

      const exactUser = userSearch.data.values.find(
        (user) => user.slug.toLowerCase() === authenticatedUsername.toLowerCase()
      );
      if (exactUser) {
        return exactUser;
      }
    }

    throw new Error("Unable to determine authenticated Bitbucket user from personal access token");
  }

  private async tryGetUserBySlug(userSlug: string): Promise<BitbucketUser | undefined> {
    const normalizedUserSlug = userSlug.trim();
    if (!normalizedUserSlug) {
      return undefined;
    }

    const slugWithoutPrefix = normalizedUserSlug.replace(/^~/, "");
    const candidateSlugs = [...new Set([normalizedUserSlug, slugWithoutPrefix, `~${slugWithoutPrefix}`])].filter(
      (slug) => Boolean(slug)
    );

    for (const candidateSlug of candidateSlugs) {
      try {
        const { data } = await this.client.get<BitbucketUser>(`/users/${encodeURIComponent(candidateSlug)}`);
        return data;
      } catch {
        continue;
      }
    }

    return undefined;
  }

  private async getPaginatedValues<T>(
    url: string,
    params: Record<string, string | number | undefined> = {},
    maxPages = 100
  ): Promise<T[]> {
    const values: T[] = [];
    let start = 0;
    let page = 0;

    while (page < maxPages) {
      const { data } = await this.client.get<BitbucketPaginatedResponse<T>>(url, {
        params: {
          ...params,
          start,
        },
      });

      values.push(...(data.values || []));

      if (data.isLastPage || typeof data.nextPageStart !== "number") {
        break;
      }

      start = data.nextPageStart;
      page++;
    }

    return values;
  }
}

export const createBitbucketService = (baseUrl: string, accessToken: string): BitbucketService => {
  if (!baseUrl || !accessToken) {
    throw new Error("Bitbucket baseUrl and access token are required");
  }

  return new BitbucketService({
    baseUrl,
    accessToken,
  });
};

export const createBitbucketOAuthService = (
  baseUrl: string,
  accessToken: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  refreshCallback: (accessToken: string, refreshToken: string) => Promise<void>
): BitbucketService => {
  if (!baseUrl || !accessToken || !refreshToken || !clientId || !clientSecret) {
    throw new Error("Bitbucket baseUrl, accessToken, refreshToken, clientId, and clientSecret are required for OAuth");
  }

  return new BitbucketService({
    baseUrl,
    accessToken,
    refreshToken,
    clientId,
    clientSecret,
    refreshCallback,
  });
};
