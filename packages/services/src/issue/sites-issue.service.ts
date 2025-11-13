// plane imports
import { API_BASE_URL } from "@plane/constants";
import type { IPublicIssue, TIssuePublicComment, TPublicIssuesResponse } from "@plane/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing issues within plane sites application
 * Extends the APIService class to handle HTTP requests to the issue-related endpoints
 * @extends {APIService}
 * @remarks This service is only available for plane sites
 */
export class SitesIssueService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a paginated list of issues for a specific anchor
   * @param {string} anchor - The anchor identifier
   * @param {any} params - Optional query parameters
   * @returns {Promise<TPublicIssuesResponse>} Promise resolving to a paginated list of issues
   * @throws {Error} If the API request fails
   */
  async list(anchor: string, params: any): Promise<TPublicIssuesResponse> {
    return this.get(`/api/public/anchor/${anchor}/issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves details of a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @returns {Promise<IPublicIssue>} Promise resolving to the issue details
   * @throws {Error} If the API request fails
   */
  async retrieve(anchor: string, issueID: string): Promise<IPublicIssue> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves the votes associated with a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @returns {Promise<any>} Promise resolving to the votes
   * @throws {Error} If the API request fails
   */
  async listVotes(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a new vote for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {any} data - The vote data
   * @returns {Promise<any>} Promise resolving to the created vote
   * @throws {Error} If the API request fails
   */
  async addVote(anchor: string, issueID: string, data: any): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a vote for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async removeVote(anchor: string, issueID: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves the reactions associated with a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @returns {Promise<any>} Promise resolving to the reactions
   * @throws {Error} If the API request fails
   */
  async listReactions(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a new reaction for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {any} data - The reaction data
   * @returns {Promise<any>} Promise resolving to the created reaction
   * @throws {Error} If the API request fails
   */
  async addReaction(anchor: string, issueID: string, data: any): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a reaction for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {string} reactionId - The reaction identifier
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async removeReaction(anchor: string, issueID: string, reactionId: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/${reactionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Retrieves the comments associated with a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @returns {Promise<any>} Promise resolving to the comments
   * @throws {Error} If the API request fails
   */
  async listComments(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a new comment for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {any} data - The comment data
   * @returns {Promise<TIssuePublicComment>} Promise resolving to the created comment
   * @throws {Error} If the API request fails
   */
  async addComment(anchor: string, issueID: string, data: any): Promise<TIssuePublicComment> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/comments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Updates a comment for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {string} commentId - The comment identifier
   * @param {any} data - The updated comment data
   * @returns {Promise<any>} Promise resolving to the updated comment
   * @throws {Error} If the API request fails
   */
  async updateComment(anchor: string, issueID: string, commentId: string, data: any): Promise<any> {
    return this.patch(`/api/public/anchor/${anchor}/issues/${issueID}/comments/${commentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a comment for a specific issue
   * @param {string} anchor - The anchor identifier
   * @param {string} issueID - The issue identifier
   * @param {string} commentId - The comment identifier
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async removeComment(anchor: string, issueID: string, commentId: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/comments/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Creates a new reaction for a specific comment
   * @param {string} anchor - The anchor identifier
   * @param {string} commentId - The comment identifier
   * @param {any} data - The reaction data
   * @returns {Promise<any>} Promise resolving to the created reaction
   * @throws {Error} If the API request fails
   */
  async addCommentReaction(
    anchor: string,
    commentId: string,
    data: {
      reaction: string;
    }
  ): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/comments/${commentId}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  /**
   * Deletes a reaction for a specific comment
   * @param {string} anchor - The anchor identifier
   * @param {string} commentId - The comment identifier
   * @param {string} reactionHex - The reaction identifier
   * @returns {Promise<any>} Promise resolving to the deletion response
   * @throws {Error} If the API request fails
   */
  async removeCommentReaction(anchor: string, commentId: string, reactionHex: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/comments/${commentId}/reactions/${reactionHex}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
