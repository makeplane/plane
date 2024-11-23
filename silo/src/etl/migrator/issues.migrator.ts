/* ----------------------------- Issue Creation Utilities ----------------------------- */
import { env } from "@/env";
import { wait } from "@/helpers/delay";
import { downloadFile, removeSpanAroundImg, splitStringTillPart, uploadFile } from "@/helpers/utils";
import { AssertAPIErrorResponse, protect } from "@/lib";
import { logger } from "@/logger";
import {
  AttachmentResponse,
  ExIssue,
  ExIssueComment,
  ExIssueLabel,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssuePropertyValue,
  ExIssueType,
  Client as PlaneClient,
  PlaneUser,
  TIssuePropertyRelationType,
  TIssuePropertyType,
  TIssuePropertyTypeKeys,
} from "@plane/sdk";
import { TPropertyValuesPayload, TServiceCredentials } from "@silo/core";
import { HTMLElement, parse } from "node-html-parser";
import { IssueCreatePayload, IssueWithParentPayload } from "./types";

// A wrapper for better readability
export const createOrphanIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> => {
  return await createIssues(payload);
};

// Attaches parent to the issues and creates them
export const createIssuesWithParent = async (payload: IssueWithParentPayload): Promise<ExIssue[]> => {
  const {
    jobId,
    meta,
    planeLabels,
    planeClient,
    workspaceSlug,
    projectId,
    issuesWithParent,
    createdOrphanIssues,
    planeIssueTypes,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;
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
      credentials: payload.credentials,
      planeIssueTypes,
      planeIssueProperties,
      planeIssuePropertiesOptions,
      planeIssuePropertyValues,
    });
  } catch (error) {
    console.error("Error while creating issue at root", error);
  }

  return result;
};

export const createIssues = async (payload: IssueCreatePayload): Promise<ExIssue[]> => {
  const {
    jobId,
    meta,
    planeLabels,
    issues,
    planeClient,
    workspaceSlug,
    projectId,
    users,
    planeIssueTypes,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    planeIssuePropertyValues,
  } = payload;
  let issueProcessIndex = payload.issueProcessIndex;

  let result = [];

  const issueWaitTime = Number(process.env.REQUEST_INTERVAL) || 400;

  for (const issue of issues) {
    try {
      // If there are labels, then get the label ids from the created labels
      issue.labels = getPlaneIssueLabels(issue, planeLabels);
      issue.created_by = getIssueCreatedBy(issue, users) ?? "";
      issue.assignees = getIssueAssignees(issue, users);
      issue.type_id = getIssueType(issue, planeIssueTypes)?.id;

      if (issue?.parent) {
        const parentIssue = result.find((createdIssue) => createdIssue.external_id === issue.parent)?.id;
        if (parentIssue) {
          issue.parent = parentIssue;
        } else {
          //TODO: This is an edge case and shouldn't be encountered. Create the parent issue if it doesn't exist
          issue.parent = null;
          console.warn(`[${jobId.slice(0, 7)}] Parent issue not found for the issue: ${issue.external_id}`);
        }
      }

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
        payload.credentials,
        createdIssue.id,
        issue,
        planeClient,
        workspaceSlug,
        projectId
      );
      if (planeIssuePropertyValues && planeIssuePropertyValues[createdIssue.external_id]) {
        await createIssuePropertyValues({
          createdIssueId: createdIssue.id,
          planeUsers: users,
          planeIssueProperties,
          planeIssuePropertiesOptions,
          issuePropertyValues: planeIssuePropertyValues[createdIssue.external_id],
          planeClient,
          workspaceSlug,
          projectId,
        });
      }

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
  credentials: TServiceCredentials,
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
          let sourceAccessToken = credentials.source_access_token;
          let authPrefix = "Bearer";

          if (credentials.source === "JIRA" && env.JIRA_OAUTH_ENABLED == "0") {
            const token = `${credentials.user_email}:${credentials.source_access_token}`;
            sourceAccessToken = Buffer.from(token).toString("base64");
            authPrefix = "Basic";
          }

          let authToken: string | undefined = `${authPrefix} ${sourceAccessToken}`;
          if (credentials.source === "ASANA") {
            sourceAccessToken = "";
            authPrefix = "";
            authToken = undefined;
          }

          if (credentials.source === "LINEAR" && env.LINEAR_OAUTH_ENABLED !== "1") {
            sourceAccessToken = credentials.source_access_token;
            authToken = sourceAccessToken;
          }

          const blob = await downloadFile(attachment.asset, authToken);

          if (!blob) return;

          // Upload the attachment
          const response = await protect<AttachmentResponse>(
            planeClient.issue.getIssueAttachmentUrl.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            createdIssueId,
            attachment.attributes.name,
            blob.size,
            blob.type,
            attachment.external_id,
            attachment.external_source
          );

          const data = generateFileUploadPayload(response, blob, attachment.attributes.name);

          const upload = await uploadFile({
            url: response.upload_data.url,
            data: data,
          });

          if (!upload) {
            logger.error(`[${jobId.slice(0, 7)}] Error while uploading the attachment: ${issue.name}`);
            return;
          }

          // Upload the attachment
          await protect(
            planeClient.issue.updateIssueAttachment.bind(planeClient.issue),
            workspaceSlug,
            projectId,
            createdIssueId,
            response.attachment.id,
            {
              is_uploaded: true,
            }
          );

          // Update the description html if the attachment is uploaded successfully
          if (response.attachment.asset) {
            const attachmentUrl = response.attachment.asset;
            const url = new URL(attachment.asset);
            let sourceAttachmentPathname = "";
            if (url.pathname.includes("rest")) {
              sourceAttachmentPathname = splitStringTillPart(new URL(attachment.asset).pathname, "rest");
            } else {
              sourceAttachmentPathname = attachment.asset;
            }
            console.log("BEFORE", issue.description_html);
            issue.description_html = replaceImageComponent(
              issue.description_html,
              response.asset_id,
              sourceAttachmentPathname,
              credentials.source
            );
            console.log("AFTER", issue.description_html);
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
            logger.error(`[${jobId.slice(5)}] Error while creating the attachment: ${issue.name}`);
            console.log(error);
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

const createIssuePropertyValues = async (props: {
  createdIssueId: string;
  planeUsers: PlaneUser[];
  planeIssueProperties: ExIssueProperty[];
  planeIssuePropertiesOptions: ExIssuePropertyOption[];
  issuePropertyValues: TPropertyValuesPayload;
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
}) => {
  const {
    createdIssueId,
    planeUsers,
    planeIssueProperties,
    planeIssuePropertiesOptions,
    issuePropertyValues,
    planeClient,
    workspaceSlug,
    projectId,
  } = props;
  // If there are no issue property values, then return
  if (!issuePropertyValues || Object.keys(issuePropertyValues).length === 0) return;

  // Create a map for the issue properties and options
  const issuePropertiesMap = new Map(
    planeIssueProperties.map((issueProperty) => [issueProperty.external_id, issueProperty])
  );
  const issuePropertiesOptionsMap = new Map(
    planeIssuePropertiesOptions.map((issuePropertyOption) => [issuePropertyOption.external_id, issuePropertyOption])
  );

  // Create the issue property values
  const issuePropertyValuePromises = Object.entries(issuePropertyValues)
    .map(async ([propertyId, propertyValues]) => {
      // Check if the issue property is valid
      const issueProperty = issuePropertiesMap.get(propertyId);
      if (!issueProperty || !issueProperty.id) return;
      // Get the issue property type key
      const issuePropertyTypeKey = getIssuePropertyTypeKey(issueProperty.property_type, issueProperty.relation_type);
      if (!issuePropertyTypeKey) return;
      // Create the property values payload
      const propertyValuesPayload = generatePropertyValuesPayload(
        issuePropertyTypeKey,
        propertyValues,
        issuePropertiesOptionsMap,
        planeUsers
      );
      // Create the issue property values if the property values payload is not empty
      if (propertyValuesPayload.length > 0) {
        await protect(
          planeClient.issuePropertyValue.create.bind(planeClient.issuePropertyValue),
          workspaceSlug,
          projectId,
          createdIssueId,
          issueProperty.id,
          { values: propertyValuesPayload }
        );
      }
    })
    .filter(Boolean);
  // Create the issue property values
  await Promise.all(issuePropertyValuePromises);
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

export const generateFileUploadPayload = (
  signedURLResponse: AttachmentResponse,
  blob: Blob,
  name: string
): FormData => {
  const formData = new FormData();
  Object.entries(signedURLResponse.upload_data.fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", blob, name);
  return formData;
};

export const getIssueType = (issue: ExIssue, planeIssueTypes: ExIssueType[]): ExIssueType | undefined => {
  if (issue.type_id) {
    return planeIssueTypes.find((issueType) => issueType.external_id === issue.type_id);
  }
  return undefined;
};

// Get the key for the issue property type based on the property type and relation type
export const getIssuePropertyTypeKey = (
  issuePropertyType: TIssuePropertyType | undefined,
  issuePropertyRelationType: TIssuePropertyRelationType | null | undefined
) =>
  `${issuePropertyType}${issuePropertyRelationType ? `_${issuePropertyRelationType}` : ""}` as TIssuePropertyTypeKeys;

const generatePropertyValuesPayload = (
  issuePropertyTypeKey: TIssuePropertyTypeKeys,
  propertyValues: any[],
  issuePropertiesOptionsMap: Map<string, ExIssuePropertyOption>,
  planeUsers: PlaneUser[]
): ExIssuePropertyValue => {
  switch (issuePropertyTypeKey) {
    case "TEXT":
    case "BOOLEAN":
    case "DECIMAL":
    case "DATETIME":
      return propertyValues;
    case "OPTION":
      return propertyValues
        .map((value) => {
          const option = issuePropertiesOptionsMap.get(value.external_id);
          return option ? { ...value, value: option.id } : undefined;
        })
        .filter(Boolean);
    case "RELATION_USER":
      return propertyValues
        .map((value) => {
          const user = planeUsers.find((user) => user.display_name === value.value);
          return user ? { ...value, value: user.id } : undefined;
        })
        .filter(Boolean);
    case "RELATION_ISSUE":
      return [];
    default:
      return [];
  }
};

const replaceImageComponent = (
  description_html: string,
  assetId: string,
  existingURL: string,
  source: string
): string => {
  if (!description_html || !assetId || !existingURL) {
    return description_html;
  }

  if (source === "LINEAR") {
    // Handle Linear's markdown image format
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;

    return description_html.replace(imageRegex, (match, altText, url) => {
      // Check if this is the image we want to replace
      if (url === existingURL) {
        return `<image-component src="${assetId}" alt="${altText}"/>`;
      }
      return match;
    });
  } else {
    try {
      // Parse the HTML string
      const root = parse(description_html);

      // Remove surrounding <p> tags if present
      const pTag = root.querySelector("p");
      if (pTag && pTag.childNodes.length === 1 && pTag.parentNode === root) {
        root.innerHTML = pTag.innerHTML;
      }

      const spanTag = root.querySelector("span");
      if (spanTag && spanTag.childNodes.length === 1 && spanTag.parentNode === root) {
        root.innerHTML = spanTag.innerHTML;
      }
      // Find all img tags
      const imgTags = root.querySelectorAll("img");

      // Replace only img tags that match the existingURL
      imgTags.forEach((img: HTMLElement) => {
        const imgSrc = img.getAttribute("src");

        // Check if the image source matches the existing URL
        if (imgSrc === existingURL) {
          // Get height and width from original img tag
          const height = img.getAttribute("height");
          const width = img.getAttribute("width");

          // Build attributes string
          const heightAttr = height ? ` height="${height}"` : "";
          const widthAttr = width ? ` width="${width}"` : "";

          // Create new component with preserved dimensions
          const imageComponent = `<image-component src=${assetId} ${heightAttr}${widthAttr}/>`;
          img.replaceWith(imageComponent);
        }
      });

      return root.toString();
    } catch (error) {
      return description_html;
    }
  }
};
