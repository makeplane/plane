import { IStateConfig, LinearComment, LinearCycle } from "@/types";
import {
  ExIssue as PlaneIssue,
  ExIssueComment,
  PlaneUser,
  ExCycle,
  ExIssueAttachment,
} from "@plane/sdk";
import { getTargetState, getFormattedDate } from "../helpers";
import { Issue, Comment, User, IssueLabel } from "@linear/sdk";

export const transformIssue = async (
  issue: Issue,
  teamUrl: string,
  users: User[],
  labels: IssueLabel[],
  stateMap: IStateConfig[],
): Promise<Partial<PlaneIssue>> => {
  let state;
  let resolvedLabels: string[] = [];
  await issue.assignee;

  if (issue.labelIds) {
    resolvedLabels = issue.labelIds.map((labelId) => {
      const foundLabel = labels.find((l) => l.id === labelId);
      return foundLabel?.name ?? "";
    });
  }

  const assignee = await breakAndGetAssignee(issue, users);
  const parent = await breakAndGetParent(issue);
  const creator = await breakAndGetCreator(issue, users);
  const targetState = state && getTargetState(stateMap, state);
  const links = [
    {
      name: "Linked Linear Issue",
      url: `${teamUrl}/issue/${issue.identifier}`,
    },
  ];

  const attachments = extractAttachmentsFromDescription(
    issue.description || "",
  );

  return {
    assignees: assignee ? [assignee] : [],
    links,
    attachments,
    external_id: issue.id,
    external_source: "LINEAR",
    created_by: creator,
    name: issue.title,
    description_html:
      !issue.description || issue.description == ""
        ? "<p></p>"
        : issue.description,
    target_date: getFormattedDate(issue.dueDate?.toString()),
    start_date: getFormattedDate(issue.startedAt?.toString()),
    created_at: issue.createdAt,
    // state: targetState?.id ?? "",
    // external_source_state_id: targetState?.external_id ?? "",
    priority: issue.priority == 0 ? "none" : issue.priorityLabel.toLowerCase(),
    labels: resolvedLabels,
    parent: parent,
  } as unknown as PlaneIssue;
};

export const extractAttachmentsFromDescription = (
  description: string,
): Partial<ExIssueAttachment>[] => {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Partial<ExIssueAttachment>[] = [];
  let match;

  while ((match = imageRegex.exec(description)) !== null) {
    const [, title, url] = match;
    // Get the last part of the url
    const id = url.split("/").pop();
    const attachment: Partial<ExIssueAttachment> = {
      external_id: id ?? "",
      external_source: "LINEAR",
      attributes: {
        name: title,
        size: 0,
      },
      asset: url ?? "",
    };

    images.push(attachment);
  }

  return images;
};

export const transformComment = (
  comment: LinearComment,
  users: User[],
): Partial<ExIssueComment> => {
  const creator = users.find((u) => u.id === comment.user_id);

  return {
    external_id: comment.id,
    external_source: "LINEAR",
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

  let role = user.admin ? 20 : 15;

  return {
    email: user.email,
    display_name: user.displayName,
    first_name,
    last_name,
    role,
  };
};

export const transformCycle = async (
  cycle: LinearCycle,
): Promise<Partial<ExCycle>> => {
  return {
    external_id: cycle.cycle.id,
    external_source: "LINEAR",
    name: cycle.cycle.name ?? `Cycle ${cycle.cycle.number}`,
    start_date: getFormattedDate(cycle.cycle.startsAt.toString()),
    end_date: getFormattedDate(cycle.cycle.endsAt.toString()),
    created_at: getFormattedDate(cycle.cycle.createdAt.toString()),
    issues: cycle.issues.map((issue) => issue.id),
  };
};

const breakAndGetAssignee = async (
  issue: Issue,
  users: User[],
): Promise<string | undefined> => {
  if (issue.assignee) {
    const assignee = await issue.assignee;
    return assignee.displayName;
  }

  // @ts-ignore
  const assigneeId = issue._assignee.id;
  const user = users.find((u) => u.id === assigneeId);
  if (user) {
    return user.displayName;
  }
};

const breakAndGetParent = async (issue: Issue): Promise<string | undefined> => {
  // @ts-ignore
  const parent = issue._parent;
  if (parent) {
    return parent.id;
  }
};

const breakAndGetCreator = async (
  issue: Issue,
  users: User[],
): Promise<string | undefined> => {
  // @ts-ignore
  const creatorId = issue._creator.id;
  const user = users.find((u) => u.id === creatorId);
  return user?.displayName;
};
