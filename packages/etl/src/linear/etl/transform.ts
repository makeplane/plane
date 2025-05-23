import { Issue, IssueLabel, User, Document } from "@linear/sdk";
import { ExCycle, ExIssueAttachment, ExIssueComment, ExPage, ExIssue as PlaneIssue, PlaneUser } from "@plane/sdk";
import { E_IMPORTER_KEYS } from "@/core";
import { IStateConfig, LinearComment, LinearCycle } from "@/linear/types";
import { getFormattedDate, getTargetState, getContentParser } from "../helpers";
import { LinearContentParserConfig } from "../types";

export const transformIssue = async (
  issue: Issue,
  teamUrl: string,
  users: User[],
  labels: IssueLabel[],
  stateMap: IStateConfig[]
): Promise<Partial<PlaneIssue>> => {
  let resolvedLabels: string[] = [];
  await issue.assignee;

  if (issue.labelIds) {
    resolvedLabels = issue.labelIds.map((labelId) => {
      const foundLabel = labels.find((l) => l.id === labelId);
      return foundLabel?.name ?? "";
    });
  }

  const assignee = await breakAndGetAssignee(issue, users);
  const parent = breakAndGetParent(issue);
  const creator = breakAndGetCreator(issue, users);
  const state = breakAndGetState(issue);
  const targetState = state && getTargetState(stateMap, state);

  const links = [
    {
      name: "Linked Linear Issue",
      url: `${teamUrl}/issue/${issue.identifier}`,
    },
  ];

  const attachments = extractAttachmentsFromDescription(issue.description || "");

  return {
    assignees: assignee ? [assignee] : [],
    links,
    attachments,
    external_id: issue.id,
    external_source: E_IMPORTER_KEYS.LINEAR,
    created_by: creator,
    name: issue.title,
    description_html: !issue.description || issue.description == "" ? "<p></p>" : issue.description,
    target_date: getFormattedDate(issue.dueDate?.toString()),
    start_date: getFormattedDate(issue.startedAt?.toString()),
    created_at: issue.createdAt,
    // @ts-expect-error
    state: targetState.id ?? "",
    // external_source_state_id: targetState?.external_id ?? "",
    priority: issue.priority == 0 ? "none" : issue.priorityLabel.toLowerCase(),
    labels: resolvedLabels,
    parent: parent,
  } as unknown as PlaneIssue;
};

export const extractAttachmentsFromDescription = (description: string): Partial<ExIssueAttachment>[] => {
  // Match both image syntax ![alt](url) and link syntax [text](url)
  const attachmentRegex = /(?:!\[([^\]]*)\]|\[([^\]]+)\])\(([^)]+)\)/g;
  const attachments: Partial<ExIssueAttachment>[] = [];
  let match;

  while ((match = attachmentRegex.exec(description)) !== null) {
    const [fullMatch, imageTitle, linkText, url] = match;
    // Check if it's from Linear uploads
    if (url.includes("uploads.linear.app")) {
      // Get the last part of the url as the ID
      const id = url.split("/").pop() || "";
      const title = imageTitle || linkText || ""; // Use imageTitle for images, linkText for links
      const attachment: Partial<ExIssueAttachment> = {
        external_id: id,
        external_source: E_IMPORTER_KEYS.LINEAR,
        attributes: {
          name: title,
          size: 0,
        },
        asset: url,
      };

      attachments.push(attachment);
    }
  }

  return attachments;
};

export const transformComment = (comment: LinearComment, users: User[]): Partial<ExIssueComment> => {
  const creator = users.find((u) => u.id === comment.user_id);

  return {
    external_id: comment.id,
    external_source: E_IMPORTER_KEYS.LINEAR,
    created_at: getFormattedDate(comment.createdAt.toString()),
    created_by: creator?.displayName,
    comment_html: comment.body ?? "<p></p>",
    actor: creator?.displayName,
    issue: comment.issue_id,
  };
};

export const transformUser = (user: User): Partial<PlaneUser> => {
  const [first_name, ...lastNameParts] = user.name.split(" ");
  const last_name = lastNameParts.join(" ");
  const role = user.admin ? 20 : 15;
  return {
    email: user.email,
    display_name: user.displayName,
    first_name,
    last_name,
    role,
  };
};

export const transformCycle = (cycle: LinearCycle): Partial<ExCycle> => ({
  external_id: cycle.cycle.id,
  external_source: E_IMPORTER_KEYS.LINEAR,
  name: cycle.cycle.name ?? `Cycle ${cycle.cycle.number}`,
  start_date: getFormattedDate(cycle.cycle.startsAt.toString()),
  end_date: getFormattedDate(cycle.cycle.endsAt.toString()),
  created_at: getFormattedDate(cycle.cycle.createdAt.toString()),
  issues: cycle.issues.map((issue) => issue.id),
});

export const transformDocument = async (document: Document, options: LinearContentParserConfig): Promise<Partial<ExPage>> => {
  const content = document.content ?? "<p></p>";
  const linearContentParser = getContentParser(options);
  const contentHtml = await linearContentParser.toPlaneHtml(content);
  return {
    name: document.title,
    description_html: contentHtml,
  };
};

const breakAndGetAssignee = async (issue: Issue, users: User[]): Promise<string | undefined> => {
  // @ts-expect-error
  if (issue._assignee) {
    // @ts-expect-error
    const assigneeId = issue._assignee.id;
    const user = users.find((u) => u.id === assigneeId);
    if (user) {
      return user.displayName;
    }
  }

  if (issue.assignee) {
    const assignee = await issue.assignee;
    return assignee.displayName;
  }
};

const breakAndGetParent = (issue: Issue): string | undefined => {
  // @ts-expect-error
  const parent = issue._parent;
  if (parent) {
    return parent.id;
  }
};

const breakAndGetCreator = (issue: Issue, users: User[]): string | undefined => {
  // @ts-expect-error
  if (issue._creator) {
    // @ts-expect-error
    const creatorId = issue._creator.id;
    const user = users.find((u) => u.id === creatorId);
    return user?.displayName;
  }
};

const breakAndGetState = (issue: Issue): string | undefined => {
  // @ts-expect-error
  if (issue._state) {
    // @ts-expect-error
    return issue._state.id;
  }
};
