import axios, { AxiosInstance } from "axios";
import { SentryExternalLink, SentryIssue, SentryIssueStatus } from "../types/service";

/**
 * Service for interacting with Sentry API endpoints.
 * Handles authentication, token refresh, and issue management.
 */
export class SentryApiService {
  private client: AxiosInstance;

  /**
   * Creates SentryApiService with automatic token refresh.
   *
   * @param config - Service configuration with auth details and refresh callback
   */
  constructor(config: any) {
    this.client = axios.create({
      baseURL: `${config.base_url}/api/0`,
      headers: {
        Authorization: `Bearer ${config.access_token}`,
      },
    });

    // Set up automatic token refresh on 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const response = await config.auth_service.getRefreshToken(config.installation_id, config.refresh_token);

          await config.refresh_callback(response.token, response.refreshToken);

          const new_access_token = response.token;
          this.client = axios.create({
            baseURL: `${config.base_url}/api/0`,
            headers: {
              Authorization: `Bearer ${new_access_token}`,
            },
          });
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Retrieves a specific Sentry issue.
   *
   * @param orgSlug - Organization slug
   * @param issueId - Issue identifier
   * @returns Sentry issue data or undefined if not found
   */
  async getIssue(orgSlug: string, issueId: string): Promise<SentryIssue | undefined> {
    return this.client
      .get(`/organizations/${orgSlug}/issues/${issueId}/`)
      .then((res) => res.data)
      .catch((error) => {
        console.log(error);
        return error.response.data;
      });
  }

  /**
   * Retrieves all external issues linked to a Sentry issue.
   *
   * @param orgSlug - Organization slug
   * @param issueId - Issue identifier
   * @returns External issues data or undefined if not found
   */
  async getLinkedExternalIssues(orgSlug: string, issueId: string): Promise<SentryExternalLink[] | undefined> {
    return this.client
      .get(`/organizations/${orgSlug}/issues/${issueId}/external-issues/`)
      .then((res) => res.data)
      .catch((error) => {
        console.log(error);
        return error.response.data;
      });
  }

  /**
   * Updates a Sentry issue status.
   *
   * @param orgSlug - Organization slug
   * @param issueId - Issue identifier
   * @param data - Update data containing new status
   * @returns Updated issue data or undefined if failed
   */
  async updateIssue(
    orgSlug: string,
    issueId: string,
    data: { status: SentryIssueStatus }
  ): Promise<SentryIssue | undefined> {
    return this.client
      .put(`/organizations/${orgSlug}/issues/${issueId}/`, data)
      .then((res) => res.data)
      .catch((error) => console.log(error?.response?.data));
  }

  /**
   * Links a Sentry issue to an external issue tracker.
   *
   * @param installationId - Sentry app installation ID
   * @param issueId - Sentry issue ID
   * @param webUrl - External issue URL
   * @param project - Project name or identifier
   * @param identifier - External issue identifier
   * @returns Connection response data
   */
  async connectExternal(installationId: string, issueId: string, webUrl: string, project: string, identifier: string) {
    return this.client
      .post(`/sentry-app-installations/${installationId}/external-issues/`, {
        issueId,
        webUrl,
        project,
        identifier,
      })
      .then((res) => res.data)
      .catch((error) => {
        console.log(error);
      });
  }

  /**
   * Deletes a Sentry integration.
   *
   * @param installationId - Sentry app installation ID
   * @param organizationSlug - Organization slug
   * @returns Deletion response data
   */
  async deleteIntegration(installationId: string, organizationSlug: string) {
    return this.client
      .delete(`/organizations/${organizationSlug}/integrations/${installationId}/`)
      .then((res) => res.data)
      .catch((error) => console.log(error?.response?.data));
  }
}
