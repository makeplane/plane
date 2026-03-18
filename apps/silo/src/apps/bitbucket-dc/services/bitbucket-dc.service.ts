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

import type {
  BitbucketPRComment,
  BitbucketPullRequest,
  BitbucketUser,
  BitbucketService as BitbucketAPIService,
} from "@plane/etl/bitbucket";
import { createBitbucketService, createBitbucketOAuthService } from "@plane/etl/bitbucket";
import type { IGitComment, IPullRequestDetails, IPullRequestService } from "@/types/behaviours/git";

export type BitbucketServiceOptions = {
  baseUrl: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  refreshCallback?: (accessToken: string, refreshToken: string) => Promise<void>;
};

export class BitbucketIntegrationService implements IPullRequestService {
  private apiService: BitbucketAPIService;

  constructor(
    private readonly baseUrl: string,
    accessToken: string,
    options?: Omit<BitbucketServiceOptions, "baseUrl" | "accessToken">
  ) {
    if (options?.refreshToken && options?.clientId && options?.clientSecret && options?.refreshCallback) {
      this.apiService = createBitbucketOAuthService(
        baseUrl,
        accessToken,
        options.refreshToken,
        options.clientId,
        options.clientSecret,
        options.refreshCallback
      );
    } else {
      this.apiService = createBitbucketService(baseUrl, accessToken);
    }
  }

  async getPullRequest(owner: string, repo: string, pullRequestIdentifier: string): Promise<IPullRequestDetails> {
    const pullRequest = await this.apiService.getPullRequest(owner, repo, pullRequestIdentifier);
    return this.transformPullRequest(pullRequest, owner, repo);
  }

  async getPullRequestComments(owner: string, repo: string, pullRequestIdentifier: string): Promise<IGitComment[]> {
    const comments = await this.apiService.getPullRequestComments(owner, repo, pullRequestIdentifier);
    return comments.map((comment) => this.transformComment(comment));
  }

  async createPullRequestComment(
    owner: string,
    repo: string,
    pullRequestIdentifier: string,
    body: string
  ): Promise<IGitComment> {
    const comment = await this.apiService.createPullRequestComment(owner, repo, pullRequestIdentifier, body);
    return this.transformComment(comment);
  }

  async updatePullRequestComment(
    owner: string,
    repo: string,
    commentId: string,
    body: string,
    pullRequestIdentifier?: number
  ): Promise<IGitComment> {
    if (typeof pullRequestIdentifier !== "number") {
      throw new Error("Bitbucket requires pullRequestIdentifier to update pull request comments");
    }

    const pullRequestId = pullRequestIdentifier.toString();
    const existingComment = await this.apiService.getPullRequestComment(owner, repo, pullRequestId, commentId);

    const updatedComment = await this.apiService.updatePullRequestComment(
      owner,
      repo,
      pullRequestId,
      commentId,
      existingComment.version,
      body
    );

    return this.transformComment(updatedComment);
  }

  async deletePullRequestComment(
    owner: string,
    repo: string,
    commentId: string,
    pullRequestIdentifier: number
  ): Promise<void> {
    const pullRequestId = pullRequestIdentifier.toString();
    const existingComment = await this.apiService.getPullRequestComment(owner, repo, pullRequestId, commentId);

    await this.apiService.deletePullRequestComment(owner, repo, pullRequestId, commentId, existingComment.version);
  }

  private transformPullRequest(
    pullRequest: BitbucketPullRequest,
    owner: string,
    repositoryName: string
  ): IPullRequestDetails {
    const state = pullRequest.state;

    let normalizedState: "open" | "closed" = "open";
    let merged = false;

    if (state === "MERGED") {
      normalizedState = "closed";
      merged = true;
    } else if (state === "DECLINED") {
      normalizedState = "closed";
    } else if (state !== "OPEN") {
      normalizedState = pullRequest.open ? "open" : "closed";
    }

    const defaultUrl = `${this.baseUrl}/projects/${owner}/repos/${repositoryName}/pull-requests/${pullRequest.id}/overview`;

    return {
      pull_request_id: pullRequest.id,
      title: pullRequest.title,
      description: pullRequest.description || "",
      number: pullRequest.id,
      url: pullRequest.links?.self?.[0]?.href || defaultUrl,
      repository: {
        owner,
        name: repositoryName,
        id: pullRequest.toRef?.repository?.id || pullRequest.id,
      },
      state: normalizedState,
      merged,
      draft: false,
      mergeable: null,
      mergeable_state: null,
    };
  }

  private transformComment(comment: BitbucketPRComment): IGitComment {
    const user = this.extractUser(comment.author);

    return {
      id: comment.id,
      body: comment.text || "",
      created_at: this.formatDate(comment.createdDate),
      updated_at: this.formatDate(comment.updatedDate),
      user: {
        id: user.id,
        login: user.slug,
        name: user.displayName,
      },
    };
  }

  private extractUser(author: BitbucketPRComment["author"]): BitbucketUser {
    if (!author) {
      return {
        id: "",
        slug: "",
        displayName: "",
      };
    }

    if ("slug" in author) {
      return author;
    }

    return (
      author.user || {
        id: "",
        slug: "",
        displayName: "",
      }
    );
  }

  private formatDate(timestamp?: number): string {
    if (typeof timestamp !== "number") {
      return new Date(0).toISOString();
    }

    return new Date(timestamp).toISOString();
  }
}
