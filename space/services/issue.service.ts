import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";
// types
import { TIssuesResponse } from "@/types/issue";

class IssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchPublicIssues(anchor: string, params: any): Promise<TIssuesResponse> {
    return this.get(`/api/public/anchor/${anchor}/issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueById(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueVotes(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueVote(anchor: string, issueID: string, data: any): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueVote(anchor: string, issueID: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/votes/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueReactions(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueReaction(anchor: string, issueID: string, data: any): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueReaction(anchor: string, issueID: string, reactionId: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/reactions/${reactionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getIssueComments(anchor: string, issueID: string): Promise<any> {
    return this.get(`/api/public/anchor/${anchor}/issues/${issueID}/comments/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createIssueComment(anchor: string, issueID: string, data: any): Promise<any> {
    return this.post(`/api/public/anchor/${anchor}/issues/${issueID}/comments/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateIssueComment(anchor: string, issueID: string, commentId: string, data: any): Promise<any> {
    return this.patch(`/api/public/anchor/${anchor}/issues/${issueID}/comments/${commentId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteIssueComment(anchor: string, issueID: string, commentId: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/issues/${issueID}/comments/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createCommentReaction(
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

  async deleteCommentReaction(anchor: string, commentId: string, reactionHex: string): Promise<any> {
    return this.delete(`/api/public/anchor/${anchor}/comments/${commentId}/reactions/${reactionHex}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

export default IssueService;
