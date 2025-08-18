import { GitlabMergeRequestEvent, MergeRequestEvent } from "@plane/etl/gitlab";
import { env } from "@/env";

// Implement this function to verify the GitLab webhook token
export function verifyGitlabToken(token: string | string[] | undefined): boolean {
  // Add your token verification logic here
  // For example, compare it with a stored secret token
  const secretToken = env.WEBHOOK_SECRET;
  return token === secretToken;
}

export function classifyMergeRequestEvent(event: GitlabMergeRequestEvent): MergeRequestEvent | undefined {
  const { object_attributes, changes } = event;

  // Helper function to check if reviewers were added
  const reviewersAdded = (): boolean => {
    if (!changes.reviewers) return false;
    const prevReviewers = changes.reviewers.previous || [];
    const currReviewers = changes.reviewers.current || [];
    return currReviewers.length > prevReviewers.length;
  };

  // 1. Check if the PR is work in progress
  if (object_attributes.work_in_progress) {
    return "DRAFT_MR_OPENED";
  }

  // 2. Check if review was requested
  if (reviewersAdded()) {
    return "MR_REVIEW_REQUESTED";
  }

  // 3. Check if the PR is approved and ready for merge
  if (object_attributes.merge_status === "can_be_merged" && object_attributes.state === "opened") {
    return "MR_READY_FOR_MERGE";
  }

  // 4. Check the final state of the PR
  switch (object_attributes.state) {
    case "merged":
      return "MR_MERGED";
    case "closed":
      return "MR_CLOSED";
    case "opened":
      return "MR_OPENED";
    default:
      return undefined;
  }
}
