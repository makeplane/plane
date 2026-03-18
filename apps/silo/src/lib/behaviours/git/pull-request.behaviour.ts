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

/*
 * Pull Request Behaviour
 * This behaviour addresses how a PR event is handled decoupled from any integration
 */

import { logger } from "@plane/logger";
import type { Client, ExIssue, IState } from "@plane/sdk";
import { env } from "@/env";
import { CONSTANTS, E_STATE_MAP_KEYS } from "@/helpers/constants";
import type { IssueReference, IssueWithReference } from "@/helpers/parser";
import { getReferredIssues } from "@/helpers/parser";
import type { verifyEntityConnections } from "@/types";
import type {
  IPullRequestService,
  IPullRequestDetails,
  TPullRequestError,
  IPullRequestEventData,
  IGitComment,
} from "@/types/behaviours/git";
import type { Either } from "@/types/either";
import { left, right } from "@/types/either";
import { STATE_GROUPS } from "@plane/constants";
import { processBatchPromises } from "@/helpers/methods";

/**
 * Pull Request Behaviour
 * This behaviour addresses how a PR event is handled for any integration
 */

export class PullRequestBehaviour {
  private static readonly WORKFLOW_TRANSITION_WARNING_MESSAGE =
    "⚠️ State transition attempt blocked by project workflow settings for the following Work Item(s)";
  // projectId and PR state map
  private readonly projectIdToPRStateMap: Record<string, Record<string, { id: string; name: string }>>;
  private readonly commentPrefix: string;
  private readonly oldCommentPrefix: string;
  private projectIdToSortedStateIds: Record<string, string[]> = {};

  constructor(
    // Identifiers
    private readonly providerName: string,
    private readonly workspaceSlug: string,

    // Services
    private readonly service: IPullRequestService,
    private readonly planeClient: Client,

    // entity connections
    private readonly entityConnections: ReturnType<typeof verifyEntityConnections>
  ) {
    this.projectIdToPRStateMap = this.getProjectIdToPRStateMap();
    this.commentPrefix = `Linked to Plane Work Item(s)`;
    this.oldCommentPrefix = `Pull Request Linked with Plane`;
  }

  /**
   * Handle a pull request event
   * @param data - The event data
   */
  public async handleEvent(data: IPullRequestEventData): Promise<void> {
    try {
      const pullRequestResult = await this.fetchPullRequest(data);
      if (!pullRequestResult.success) {
        logger.error(`Failed to fetch pull request: ${pullRequestResult.error.message}`);
        return;
      }
      const pullRequestDetails = pullRequestResult.data;

      let pullRequestText = `${pullRequestDetails.title}\n${pullRequestDetails.description}`;
      const _pullRequestLog: any = {
        title: pullRequestDetails.title,
        //  first 100 characters of the description and last 100 characters of the description
        description:
          pullRequestDetails?.description?.substring(0, 100) +
          "........................." +
          pullRequestDetails?.description?.substring(pullRequestDetails?.description?.length - 100),
        number: pullRequestDetails.number,
        url: pullRequestDetails.url,
        repository: pullRequestDetails.repository,
      };
      pullRequestText = this.removeEscapeCharactersFromBrackets(pullRequestText);
      const references = getReferredIssues(pullRequestText);
      if (references.closingReferences.length === 0 && references.nonClosingReferences.length === 0) {
        logger.info("No issue references found, skipping...", {
          providerName: this.providerName,
          pullRequestLog: _pullRequestLog,
          workspaceSlug: this.workspaceSlug,
        });
        return;
      }

      const event = this.classifyPullRequestEvent(pullRequestDetails);
      if (!event) {
        logger.info("No event found, skipping...", {
          providerName: this.providerName,
          pullRequestLog: _pullRequestLog,
          workspaceSlug: this.workspaceSlug,
        });
        return;
      }

      // Determine which references to process
      const referredIssues = [...references.closingReferences, ...references.nonClosingReferences];
      // store in the projectIdToSortedStateIds map
      await this.getProjectIdToSortedStateIds(Object.keys(this.projectIdToPRStateMap));
      const updateResults = await this.updateReferencedIssues(referredIssues, pullRequestDetails, event);
      const validIssues = updateResults
        .map((result) => result.result)
        .filter((result): result is IssueWithReference => result !== null);
      const workflowTransitionBlockedIssues = updateResults
        .filter((result) => result.stateTransitionSkipped)
        .map((result) => result.result)
        .filter((result): result is IssueWithReference => result !== null);

      if (validIssues.length > 0) {
        await this.manageCommentOnPullRequest(
          pullRequestDetails,
          validIssues,
          references.nonClosingReferences,
          workflowTransitionBlockedIssues
        );
      }
    } catch (error) {
      logger.error("Error handling pull request", {
        error: error,
        providerName: this.providerName,
        workspaceSlug: this.workspaceSlug,
      });
    }
  }

  /**
   * Fetch the pull request details
   * @param data - The event data
   * @returns The pull request details
   */
  private async fetchPullRequest(data: IPullRequestEventData): Promise<Either<TPullRequestError, IPullRequestDetails>> {
    try {
      const pullRequest = await this.service.getPullRequest(
        data.owner,
        data.repositoryName,
        data.pullRequestIdentifier
      );
      return right(pullRequest);
    } catch (error) {
      return left({
        message: `Failed to fetch pull request details for ${data.owner}/${data.repositoryName}#${data.pullRequestIdentifier}`,
        details: error,
      });
    }
  }

  /**
   * Classify the pull request event
   * @param pullRequestDetails - The pull request details
   * @returns The event
   */
  protected classifyPullRequestEvent(pullRequestDetails: IPullRequestDetails): string | undefined {
    if (pullRequestDetails.state === "closed") {
      return pullRequestDetails.merged ? E_STATE_MAP_KEYS.MR_MERGED : E_STATE_MAP_KEYS.MR_CLOSED;
    }

    if (pullRequestDetails.draft) {
      return E_STATE_MAP_KEYS.DRAFT_MR_OPENED;
    }

    if (!pullRequestDetails.draft && pullRequestDetails.mergeable && pullRequestDetails.mergeable_state === "clean") {
      return E_STATE_MAP_KEYS.MR_READY_FOR_MERGE;
    }

    if (pullRequestDetails.state === "open") {
      return E_STATE_MAP_KEYS.MR_OPENED;
    }

    return undefined;
  }

  /**
   * Update the referenced issues
   * @param references - The references
   * @param prDetails - The pull request details
   * @param event - The PR event
   * @returns The updated issues
   */
  private async updateReferencedIssues(
    references: IssueReference[],
    prDetails: IPullRequestDetails,
    event: string
  ): Promise<{ result: IssueWithReference | null; stateTransitionSkipped: boolean }[]> {
    return Promise.all(references.map((reference) => this.updateSingleIssue(reference, prDetails, event)));
  }

  private getProjectIdToPRStateMap() {
    if (!this.entityConnections) {
      return {};
    }
    return this.entityConnections.reduce(
      (acc, entityConnection) => {
        if (entityConnection.project_id) {
          acc[entityConnection.project_id.toString()] = entityConnection.config?.states?.mergeRequestEventMapping;
        }
        return acc;
      },
      {} as Record<string, Record<string, { id: string; name: string }>>
    );
  }

  /**
   * Get the project ID to sorted state IDs map
   * @param planeProjectIds - The Plane project IDs
   * @returns The project ID to sorted state IDs map
   */
  private async getProjectIdToSortedStateIds(planeProjectIds: string[]) {
    // get all the states for the projects from plane
    // sort by state groups and then by sequence
    const fetchStates = async (projectId: string) => {
      const states = await this.planeClient.state.list(this.workspaceSlug, projectId);
      const sortedStates = this.sortStates(states.results);
      this.projectIdToSortedStateIds[projectId] = sortedStates.map((state) => state.id);
    };
    await processBatchPromises(planeProjectIds, fetchStates, 2);
  }

  /**
   * Sort states by group and sequence
   * @param states - The states
   * @returns The sorted states
   */
  private sortStates(states: IState[]) {
    // sorts by state groups and then by sequence
    return states.sort((stateA, stateB) => {
      if (stateA.group === stateB.group) {
        return stateA.sequence - stateB.sequence;
      }
      return Object.keys(STATE_GROUPS).indexOf(stateA.group) - Object.keys(STATE_GROUPS).indexOf(stateB.group);
    });
  }

  /**
   * Check if the backward state movement should be skipped
   * @param projectId - The project ID
   * @returns Whether the backward state movement should be skipped
   */
  private shouldSkipBackwardStateMovement(projectId: string): boolean {
    const skipBackwardStateMovementEConnections = this.entityConnections.filter(
      (connection) => connection.config?.skipBackwardStateMovement && connection.project_id === projectId
    );
    return skipBackwardStateMovementEConnections.length > 0;
  }

  /**
   * Update a single issue
   * @param reference - The reference
   * @param prDetails - The pull request details
   * @param event - The PR event
   * @returns The updated issue
   */
  private async updateSingleIssue(
    reference: IssueReference,
    prDetails: IPullRequestDetails,
    event: string
  ): Promise<{ result: IssueWithReference | null; stateTransitionSkipped: boolean }> {
    let issue: ExIssue | null = null;
    let stateTransitionSkipped = false;

    try {
      issue = await this.planeClient.issue.getIssueByIdentifier(
        this.workspaceSlug,
        reference.identifier,
        reference.sequence,
        true
      );

      const targetState = this.projectIdToPRStateMap[issue.project]?.[event];
      // check if the target state is after the current state in the sorted state ids
      // and if the skip backward state movement is enabled for the project
      const sortedStateIds = this.projectIdToSortedStateIds[issue.project];
      const shouldNotUpdateState =
        targetState && sortedStateIds
          ? sortedStateIds.indexOf(targetState.id) < sortedStateIds.indexOf(issue.state) &&
            this.shouldSkipBackwardStateMovement(issue.project)
          : false;

      if (shouldNotUpdateState) {
        logger.info(
          `[${this.providerName.toUpperCase()}] Target state is behind the current state and skip backward state movement is enabled, state update will be skipped`,
          {
            targetState: targetState?.id,
            currentState: issue.state,
            sortedStateIds: sortedStateIds,
            projectId: issue.project,
            issueId: issue.id,
          }
        );
      }
      if (targetState && reference.isClosing && !shouldNotUpdateState) {
        try {
          await this.planeClient.issue.update(this.workspaceSlug, issue.project, issue.id, { state: targetState.id });
          logger.info(
            `[${this.providerName.toUpperCase()}] Issue ${reference.identifier}-${reference.sequence} updated to state ${targetState.name}`
          );
        } catch (error: any) {
          stateTransitionSkipped = this.isStateTransitionSkipped(error);

          if (!stateTransitionSkipped) {
            throw error;
          }

          logger.info(
            `[${this.providerName.toUpperCase()}] State transition blocked by workflow settings for ${reference.identifier}-${reference.sequence}`
          );
        }
      }

      // Create link to pull request
      const linkTitle = `[${prDetails.number}] ${prDetails.title}`;
      await this.planeClient.issue.createLink(this.workspaceSlug, issue.project, issue.id, linkTitle, prDetails.url);

      return { result: { reference, issue }, stateTransitionSkipped };
    } catch (error: any) {
      stateTransitionSkipped = stateTransitionSkipped || this.isStateTransitionSkipped(error);

      // Handle permission errors
      if (error?.detail && error?.detail.includes(CONSTANTS.NO_PERMISSION_ERROR)) {
        logger.info(
          `[${this.providerName.toUpperCase()}] No permission to process event: ${error.detail} ${reference.identifier}-${reference.sequence}`
        );
      }

      // Handle 404 errors (issue not found)
      if (error?.status === 404 || (error?.detail && error?.detail.includes("not found"))) {
        logger.info(
          `[${this.providerName.toUpperCase()}] Issue not found: ${reference.identifier}-${reference.sequence}`
        );
        return { result: null, stateTransitionSkipped };
      }

      // Generic error handling
      logger.error(
        `[${this.providerName.toUpperCase()}] Error updating issue ${reference.identifier}-${reference.sequence}`,
        error
      );

      // If we managed to get the issue before the error, still return it
      if (issue) {
        return { result: { reference, issue }, stateTransitionSkipped };
      }

      return { result: null, stateTransitionSkipped };
    }
  }

  /**
   * Manage a comment on the pull request
   * @param prDetails - The pull request details
   * @param validIssues - The valid issues
   * @param nonClosingReferences - The non-closing references
   */
  private async manageCommentOnPullRequest(
    prDetails: IPullRequestDetails,
    validIssues: IssueWithReference[],
    nonClosingReferences: IssueReference[],
    workflowTransitionBlockedIssues: IssueWithReference[] = []
  ): Promise<void> {
    const body = this.generateCommentBody(validIssues, nonClosingReferences);
    const comments = await this.fetchExistingComments(prDetails);
    const existingComment = this.findExistingPlaneComment(comments);

    if (existingComment) {
      await this.updateExistingComment(prDetails, existingComment.id, body);
    } else {
      await this.createNewComment(prDetails, body);
    }

    if (workflowTransitionBlockedIssues.length > 0) {
      await this.createWorkflowTransitionWarningComment(prDetails, workflowTransitionBlockedIssues);
    }
  }

  /**
   * Fetch existing comments on the pull request
   * @param prDetails - The pull request details
   * @returns The existing comments
   */
  private async fetchExistingComments(prDetails: IPullRequestDetails): Promise<IGitComment[]> {
    return this.service.getPullRequestComments(
      prDetails.repository.owner,
      prDetails.repository.name,
      prDetails.number.toString()
    );
  }

  /**
   * Find an existing comment on the pull request
   * @param comments - The comments
   * @param prefix - The prefix
   * @returns The existing comment
   */
  protected findExistingComment(comments: IGitComment[], prefix: string, oldPrefix: string): IGitComment | undefined {
    return comments.find((comment) => comment.body.startsWith(prefix) || comment.body.startsWith(oldPrefix));
  }

  /**
   * Find an existing Plane comment on the pull request
   * @param comments - The comments
   * @returns The existing comment
   */
  private findExistingPlaneComment(comments: IGitComment[]): IGitComment | undefined {
    return this.findExistingComment(comments, this.commentPrefix, this.oldCommentPrefix);
  }

  /**
   * Update an existing comment on the pull request
   * @param prDetails - The pull request details
   * @param commentId - The comment ID
   * @param body - The body
   */
  private async updateExistingComment(
    prDetails: IPullRequestDetails,
    commentId: string | number,
    body: string
  ): Promise<void> {
    await this.service.updatePullRequestComment(
      prDetails.repository.owner,
      prDetails.repository.name,
      commentId.toString(),
      body,
      prDetails.pull_request_id
    );
    logger.info(
      `Updated comment for pull request ${prDetails.number} in repo ${prDetails.repository.owner}/${prDetails.repository.name}`
    );
  }

  /**
   * Create a new comment on the pull request
   * @param prDetails - The pull request details
   * @param body - The body
   */
  private async createNewComment(prDetails: IPullRequestDetails, body: string): Promise<void> {
    await this.service.createPullRequestComment(
      prDetails.repository.owner,
      prDetails.repository.name,
      prDetails.number.toString(),
      body
    );
    logger.info(
      `Created new comment for pull request ${prDetails.number} in repo ${prDetails.repository.owner}/${prDetails.repository.name}`
    );
  }

  private generateCommentBody(issues: IssueWithReference[], nonClosingReferences: IssueReference[]): string {
    let body = `${this.commentPrefix}\n\n`;

    const { closingIssues, nonClosingIssues } = this.categorizeIssues(issues, nonClosingReferences);

    body += this.formatIssueSection(closingIssues);

    if (nonClosingIssues.length > 0) {
      body += `\n\nReferences\n\n${this.formatIssueSection(nonClosingIssues)}`;
    }

    body += `\n\nThis comment was auto-generated by [Plane](https://plane.so)\n`;
    return body;
  }

  private async createWorkflowTransitionWarningComment(
    prDetails: IPullRequestDetails,
    closingIssues: IssueWithReference[]
  ): Promise<void> {
    const body = `${PullRequestBehaviour.WORKFLOW_TRANSITION_WARNING_MESSAGE}\n\n${this.formatIssueSection(closingIssues)}\n\nThis comment was auto-generated by [Plane](https://plane.so)\n`;
    await this.service.createPullRequestComment(
      prDetails.repository.owner,
      prDetails.repository.name,
      prDetails.number.toString(),
      body
    );
    logger.info(
      `Created workflow transition warning comment for pull request ${prDetails.number} in repo ${prDetails.repository.owner}/${prDetails.repository.name}`
    );
  }

  private isStateTransitionSkipped(error: any): boolean {
    const possibleMessages = [
      error?.error,
      error?.detail,
      error?.message,
      error?.response?.data?.error,
      error?.response?.data?.detail,
    ].filter((message): message is string => typeof message === "string");

    return possibleMessages.some((message) => message.toLowerCase().includes("state transition is not allowed"));
  }

  /**
   * Categorize issues
   * @param issues - The issues
   * @param nonClosingReferences - The non-closing references
   * @returns The categorized issues
   */
  private categorizeIssues(
    issues: IssueWithReference[],
    nonClosingReferences: IssueReference[]
  ): { closingIssues: IssueWithReference[]; nonClosingIssues: IssueWithReference[] } {
    const closingIssues = issues.filter(
      ({ reference }) => !this.isNonClosingReference(reference, nonClosingReferences)
    );

    const nonClosingIssues = issues.filter(({ reference }) =>
      this.isNonClosingReference(reference, nonClosingReferences)
    );

    return { closingIssues, nonClosingIssues };
  }

  /**
   * Check if an issue is a non-closing reference
   * @param reference - The reference
   * @param nonClosingReferences - The non-closing references
   * @returns Whether the issue is a non-closing reference
   */
  private isNonClosingReference(reference: IssueReference, nonClosingReferences: IssueReference[]): boolean {
    return nonClosingReferences.some(
      (ref) => ref.identifier === reference.identifier && ref.sequence === reference.sequence
    );
  }

  /**
   * Format an issue section
   * @param issues - The issues
   * @returns The formatted issue section
   */
  private formatIssueSection(issues: IssueWithReference[]): string {
    return issues
      .map(
        ({ reference, issue }) =>
          `- [[${reference.identifier}-${reference.sequence}] ${issue.name}](${env.APP_BASE_URL}/${this.workspaceSlug}/projects/${issue.project}/issues/${issue.id})\n`
      )
      .join("");
  }

  private removeEscapeCharactersFromBrackets(text: string): string {
    return text.replace(/\\\[/g, "[").replace(/\\\]/g, "]");
  }
}
