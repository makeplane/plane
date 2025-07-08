/*
 * Pull Request Behaviour
 * This behaviour addresses how a PR event is handled decoupled from any integration
 */

import { Client, ExIssue } from "@plane/sdk";
import { env } from "@/env";
import { CONSTANTS, E_STATE_MAP_KEYS } from "@/helpers/constants";
import { getReferredIssues, IssueReference, IssueWithReference } from "@/helpers/parser";
import { logger } from "@/logger";
import { verifyEntityConnections } from "@/types";
import {
  IPullRequestService,
  IPullRequestDetails,
  TPullRequestError,
  IPullRequestEventData,
  IGitComment,
} from "@/types/behaviours/git";
import { Either, left, right } from "@/types/either";

/**
 * Pull Request Behaviour
 * This behaviour addresses how a PR event is handled for any integration
 */

export class PullRequestBehaviour {
  // projectId and PR state map
  private readonly projectIdToPRStateMap: Record<string, Record<string, { id: string; name: string }>>;
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

      const pullRequestText = `${pullRequestDetails.title}\n${pullRequestDetails.description}`;
      const references = getReferredIssues(pullRequestText);
      if (references.closingReferences.length === 0 && references.nonClosingReferences.length === 0) {
        logger.info("No issue references found, skipping...");
        return;
      }

      const event = this.classifyPullRequestEvent(pullRequestDetails);
      if (!event) {
        logger.info("No event found, skipping...");
        return;
      }

      // Determine which references to process
      const isClosingEvent = [E_STATE_MAP_KEYS.MR_CLOSED, E_STATE_MAP_KEYS.MR_MERGED].includes(
        event as E_STATE_MAP_KEYS
      );
      const referredIssues = isClosingEvent
        ? references.closingReferences
        : [...references.closingReferences, ...references.nonClosingReferences];

      const updateResults = await this.updateReferencedIssues(referredIssues, pullRequestDetails, event);

      const validIssues = updateResults.filter((result): result is IssueWithReference => result !== null);

      if (validIssues.length > 0) {
        await this.manageCommentOnPullRequest(pullRequestDetails, validIssues, references.nonClosingReferences);
      }
    } catch (error) {
      logger.error(`Error handling pull request: ${(error as Error)?.stack}`);
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
  ): Promise<(IssueWithReference | null)[]> {
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
  ): Promise<IssueWithReference | null> {
    let issue: ExIssue | null = null;

    try {
      issue = await this.planeClient.issue.getIssueByIdentifier(
        this.workspaceSlug,
        reference.identifier,
        reference.sequence
      );

      // get the PR state for the event from projectId and PR state map
      // for gitlab we get the state from config directly
      const targetState = this.projectIdToPRStateMap[issue.project]?.[event];
      if (targetState) {
        await this.planeClient.issue.update(this.workspaceSlug, issue.project, issue.id, { state: targetState.id });
        logger.info(
          `[${this.providerName.toUpperCase()}] Issue ${reference.identifier}-${reference.sequence} updated to state ${targetState.name}`
        );
      }

      // Create link to pull request
      const linkTitle = `[${prDetails.number}] ${prDetails.title}`;
      await this.planeClient.issue.createLink(this.workspaceSlug, issue.project, issue.id, linkTitle, prDetails.url);

      return { reference, issue };
    } catch (error: any) {
      // Handle permission errors
      if (error?.detail && error?.detail.includes(CONSTANTS.NO_PERMISSION_ERROR)) {
        logger.info(
          `[${this.providerName.toUpperCase()}] No permission to process event: ${error.detail} ${reference.identifier}-${reference.sequence}`
        );

        // If we managed to get the issue before the error, still return it
        if (issue) {
          return { reference, issue };
        }

        return null;
      }

      // Handle 404 errors (issue not found)
      if (error?.status === 404 || (error?.detail && error?.detail.includes("not found"))) {
        logger.info(
          `[${this.providerName.toUpperCase()}] Issue not found: ${reference.identifier}-${reference.sequence}`
        );
        return null;
      }

      // Generic error handling
      logger.error(
        `[${this.providerName.toUpperCase()}] Error updating issue ${reference.identifier}-${reference.sequence}`,
        error
      );

      // If we managed to get the issue before the error, still return it
      if (issue) {
        return { reference, issue };
      }

      return null;
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
    nonClosingReferences: IssueReference[]
  ): Promise<void> {
    const body = this.generateCommentBody(validIssues, nonClosingReferences);
    const comments = await this.fetchExistingComments(prDetails);
    const existingComment = this.findExistingPlaneComment(comments);

    if (existingComment) {
      await this.updateExistingComment(prDetails, existingComment.id, body);
    } else {
      await this.createNewComment(prDetails, body);
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
    ) as Promise<IGitComment[]>;
  }

  /**
   * Find an existing comment on the pull request
   * @param comments - The comments
   * @param prefix - The prefix
   * @returns The existing comment
   */
  protected findExistingComment(comments: IGitComment[], prefix: string): IGitComment | undefined {
    return comments.find((comment) => comment.body.startsWith(prefix));
  }

  /**
   * Find an existing Plane comment on the pull request
   * @param comments - The comments
   * @returns The existing comment
   */
  private findExistingPlaneComment(comments: IGitComment[]): IGitComment | undefined {
    const commentPrefix = `Pull Request Linked with Plane`;
    return this.findExistingComment(comments, commentPrefix);
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
      body
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
    const commentPrefix = `Pull Request Linked with Plane Work Items`;
    let body = `${commentPrefix}\n\n`;

    const { closingIssues, nonClosingIssues } = this.categorizeIssues(issues, nonClosingReferences);

    body += this.formatIssueSection(closingIssues);

    if (nonClosingIssues.length > 0) {
      body += `\n\nReferences\n\n${this.formatIssueSection(nonClosingIssues)}`;
    }

    body += `\n\nComment Automatically Generated by [Plane](https://plane.so)\n`;
    return body;
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
          `- [${reference.identifier}-${reference.sequence}] [${issue.name}](${env.APP_BASE_URL}/${this.workspaceSlug}/projects/${issue.project}/issues/${issue.id})\n`
      )
      .join("");
  }
}
