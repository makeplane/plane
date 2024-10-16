/* ----------------------------- Issue Creation Utilities ----------------------------- */
import { ExIssue, ExIssueComment, ExIssueLabel, Client as PlaneClient } from "@plane/sdk";
import { wait } from "@/helpers/delay";
import { downloadFile, removeSpanAroundImg, splitStringTillPart } from "@/helpers/utils";
import { AssertAPIErrorResponse, protect } from "@/lib";
import { logger } from "@/logger";
import { IssueCreatePayload, IssueWithParentPayload } from "./types";

// A wrapper for better readability
export const createOrphanIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> => {
  return await createIssues(payload);
};

// Attaches parent to the issues and creates them
export const createIssuesWithParent = async (payload: IssueWithParentPayload): Promise<ExIssue[]> => {
  const { jobId, meta, planeLabels, planeClient, workspaceSlug, projectId, issuesWithParent, createdOrphanIssues } =
    payload;
  let issueProcessIndex = payload.issueProcessIndex;
  let result: ExIssue[] = [];

  for (const issue of issuesWithParent) {
    if (issue.parent) {
      const parentIssue = createdOrphanIssues.find((orphanIssue: ExIssue) => orphanIssue.external_id === issue.parent);
      if (parentIssue) {
        issue.parent = parentIssue.id;
      } else {
        // If the parent issue is not found, then try to find the issue from
        // external id and source from the api
        try {
          const parent = (await protect(
            planeClient.issue.getIssueWithExternalId.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            issue.parent,
            issue.external_source
          )) as ExIssue;
          issue.parent = parent.id;
        } catch (error) {
          logger.error("Error while fetching the parent issue", error);
          // Even if we're getting error while fetching the issue, we need to
          // skip attaching the parent from the issue
          issue.parent = null;
        }
      }
    }
  }

  try {
    result = await createIssues({
      jobId,
      meta,
      planeLabels,
      issueProcessIndex,
      planeClient,
      workspaceSlug,
      projectId,
      users: payload.users,
      issues: issuesWithParent,
      sourceAccessToken: payload.sourceAccessToken,
    });
  } catch (error) {
    console.error("Error while creating issue at root", error);
  }

  return result;
};

export const createIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> => {
  const { jobId, meta, planeLabels, issues, planeClient, workspaceSlug, projectId } = payload;
  let issueProcessIndex = payload.issueProcessIndex;

  let result = [];

  const issueWaitTime = Number(process.env.REQUEST_INTERVAL) || 400;

  for (const issue of issues) {
    try {
      // If there are labels, then get the label ids from the created labels
      issue.labels = getPlaneIssueLabels(issue, planeLabels);
      issue.created_by = getIssueCreatedBy(issue, payload.users) ?? "";
      issue.assignees = getIssueAssignees(issue, payload.users);

      // Create the issue and issue assets
      const createdIssue = await protect(
        createOrUpdateIssue,
        issue,
        meta,
        issueProcessIndex,
        planeClient,
        workspaceSlug,
        projectId
      );
      await createIssueLinks(jobId, issue, createdIssue.id, planeClient, workspaceSlug, projectId);
      await createIssueAttachments(
        jobId,
        payload.sourceAccessToken,
        createdIssue.id,
        issue,
        planeClient,
        workspaceSlug,
        projectId
      );

      result.push(createdIssue);
      issueProcessIndex++;

      await wait(issueWaitTime);
    } catch (error) {
      console.log("Error occured inside `CreateIssues`", error);
      // Check if the error is an API error response
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the issue: ${issue.external_id}`, error);
    }
  }

  return result;
};

export const createOrUpdateIssue = async (
  issue: ExIssue,
  meta: any,
  issueProcessIndex: number,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<ExIssue> => {
  let createdIssue: ExIssue | undefined = undefined;

  try {
    createdIssue = await protect(planeClient.issue.create.bind(planeClient.issue), workspaceSlug, projectId, issue);
    logger.info(
      `[${issue.external_source}][${issue.external_id.slice(0, 5)}...][${meta.batchId}] Created Issue: ${issue.external_id.slice(0, 7)} ----------- [${issueProcessIndex} / ${meta.batch_end}][${meta.total.issues}]`
    );
    return createdIssue as ExIssue;
  } catch (error) {
    if (AssertAPIErrorResponse(error)) {
      // Update the issue if the issue already exist
      if (error.error.includes("already exists")) {
        createdIssue = await protect(
          planeClient.issue.update.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          error.id,
          issue
        );
        logger.info(
          `[${issue.external_source}][${issue.external_id.slice(0, 5)}...][${meta.batchId}] Updated Issue: ${issue.external_id.slice(0, 7)} ----------- [${issueProcessIndex} / ${meta.batch_end}][${meta.total.issues}]`
        );
      }
    } else {
      throw error;
    }
  }

  // I am aware that the issue will either be updated or created
  return createdIssue as ExIssue;
};

/* ------------------------------ Issue Comment Creation ---------------------------- */
export const createOrUpdateIssueComment = async (
  _jobId: string,
  issueComment: ExIssueComment,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string,
  issueId: string
): Promise<void> => {
  // Comment array is used to store the comments that failed to create
  try {
    await protect(
      planeClient.issueComment.create.bind(planeClient.issueComment),
      workspaceSlug,
      projectId,
      issueId,
      issueComment
    );
  } catch (error) {
    if (AssertAPIErrorResponse(error)) {
      // Update the comment if the comment already exist
      if (error.error.includes("already exists")) {
        try {
          await protect(
            planeClient.issueComment.update.bind(planeClient.issueComment),
            workspaceSlug,
            projectId,
            issueId,
            error.id,
            issueComment
          );
        } catch (error) {
          console.log("Error while updating comment", error);
        }
      }
    } else {
      console.log("Error while creating comment, other than already exist", error);
    }
  }
};

const createIssueAttachments = async (
  jobId: string,
  sourceAccessToken: string,
  createdIssueId: string,
  issue: ExIssue,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
) => {
  if (issue.attachments && issue.attachments.length > 0) {
    const attachmentPromises = issue.attachments.map(async (attachment) => {
      try {
        const existingAttachments: any = await protect(
          planeClient.issue.getIssueAttachments.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          createdIssueId
        );
        try {
          // Get the existing attachment for the issue
          // Create a temp file to download the attachment
          const blob = await downloadFile(attachment.asset, sourceAccessToken);
          // Prepare FormData
          const attachmentFormData = new FormData();
          attachmentFormData.append("asset", blob, attachment.attributes.name);
          attachmentFormData.append("external_id", attachment.external_id);
          attachmentFormData.append("external_source", attachment.external_source);
          attachmentFormData.append(
            "attributes",
            JSON.stringify({
              name: attachment.attributes.name,
              size: blob.size,
            })
          );

          // Upload the attachment
          const response: any = await protect(
            planeClient.issue.uploadIssueAttachment.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            createdIssueId,
            attachmentFormData
          );

          // Update the description html if the attachment is uploaded successfully
          if (response.asset) {
            const attachmentUrl = response.asset;
            const url = new URL(attachment.asset);
            let sourceAttachmentPathname = "";
            if (url.pathname.includes("rest")) {
              sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
            } else {
              sourceAttachmentPathname = attachment.asset;
            }
            issue.description_html = removeSpanAroundImg(
              issue.description_html.replace(sourceAttachmentPathname, attachmentUrl)
            );
          }
        } catch (error) {
          if (AssertAPIErrorResponse(error)) {
            if (error.error && error.error.includes("already exists")) {
              logger.info(
                `[${jobId.slice(0, 7)}] Attachment  already exists for the issue "${issue.name}". Skipping...`
              );
              // get the attachment from the existing attachments
              existingAttachments.find((existingAttachment: any) => {
                if (existingAttachment.external_id === attachment.external_id) {
                  const attachmentUrl = existingAttachment.asset;
                  const url = new URL(attachment.asset);
                  let sourceAttachmentPathname = "";
                  if (url.pathname.includes("rest")) {
                    sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
                  } else {
                    sourceAttachmentPathname = attachment.asset;
                  }
                  issue.description_html = removeSpanAroundImg(
                    issue.description_html.replace(sourceAttachmentPathname, attachmentUrl)
                  );
                }
              });
            }
          } else {
            logger.error(`[${jobId.slice(5)}] Error while creating the attachment: ${issue.name}`, error);
          }
        }
      } catch (error) {
        console.log("Something went wrong while creating the attachment", error);
        logger.error(`[${jobId.slice(0, 7)}] Error while fetching the attachments for the issue: ${issue.name}`, error);
      }
    });

    await Promise.all(attachmentPromises);
    // Finally update the issue with the updated description html
    await protect(planeClient.issue.update.bind(planeClient.issue), workspaceSlug, projectId, createdIssueId, issue);
  }
};

const createIssueLinks = async (
  jobId: string,
  issue: ExIssue,
  createdIssueId: string,
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
) => {
  if (issue.links) {
    try {
      const linkPromises = issue.links.map(async (link) => {
        await protect(
          planeClient.issue.createLink.bind(planeClient.issue),
          workspaceSlug,
          projectId,
          createdIssueId,
          link.name,
          link.url
        );
      });
      await Promise.all(linkPromises);
    } catch (error) {
      // @ts-ignore
      if (error.error && !error.error.includes("already exists")) {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the link for the issue: ${issue.external_id}`, error);
      }
    }
  }
};

/* ------------------------------ Helper Methods ---------------------------- */
const getPlaneIssueLabels = (issue: ExIssue, planeLabels: ExIssueLabel[]): string[] => {
  if (issue.labels) {
    return issue.labels
      .map((label) => {
        const createdLabel = planeLabels.find((createdLabel) => createdLabel.name === label);
        if (createdLabel) {
          return createdLabel.id;
        }
      })
      .filter((label) => label !== undefined) as string[];
  }
  return [];
};

const getIssueCreatedBy = (issue: ExIssue, users: any[]): string | undefined => {
  return users.find((user) => user.display_name === issue.created_by)?.id;
};

const getIssueAssignees = (issue: ExIssue, users: any[]): string[] => {
  const assignedUsers = issue.assignees.map((assignee) => {
    const assignedTo = users.find((user) => user.display_name === assignee)?.id;
    if (assignedTo) {
      return assignedTo;
    }
  });
  return assignedUsers.filter((user) => user !== undefined) as string[];
};
