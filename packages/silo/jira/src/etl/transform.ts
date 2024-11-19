import {
  ExCycle,
  ExIssueComment,
  ExIssueLabel,
  ExModule,
  ExIssue as PlaneIssue,
  PlaneUser,
} from "@plane/sdk";
import {
  IJiraIssue,
  ImportedJiraUser,
  IPriorityConfig,
  IStateConfig,
  JiraComment,
  JiraComponent,
  JiraSprint,
} from "@/types";
import {
  getFormattedDate,
  getRandomColor,
  getTargetAttachments,
  getTargetPriority,
  getTargetState,
} from "../helpers";

export const transformIssue = (
  issue: IJiraIssue,
  resourceUrl: string,
  stateMap: IStateConfig[],
  priorityMap: IPriorityConfig[],
): Partial<PlaneIssue> => {
  const targetState = getTargetState(stateMap, issue.fields.status);
  const targetPriority = getTargetPriority(priorityMap, issue.fields.priority);
  const attachments = getTargetAttachments(issue.fields.attachment);
  const renderedFields = (issue.renderedFields as { description: string }) ?? {
    description: "<p></p>",
  };
  const links = [
    {
      name: "Linked Jira Issue",
      url: `${resourceUrl}/browse/${issue.key}`,
    },
  ];
  let description = renderedFields.description ?? "<p></p>";
  if (description === "") {
    description = "<p></p>";
  }

  issue.fields.labels.push("JIRA IMPORTED");

  return {
    assignees: issue.fields.assignee?.displayName
      ? [issue.fields.assignee.displayName]
      : [],
    links,
    external_id: issue.id,
    external_source: "JIRA",
    created_by: issue.fields.creator?.displayName,
    name: issue.fields.summary ?? "Untitled",
    description_html: description,
    target_date: issue.fields.duedate,
    start_date: issue.fields.customfield_10015,
    created_at: issue.fields.created,
    attachments: attachments,
    state: targetState?.id ?? "",
    external_source_state_id: targetState?.external_id ?? "",
    priority: targetPriority ?? "none",
    labels: issue.fields.labels,
    parent: issue.fields.parent?.id,
  } as unknown as PlaneIssue;
};

export const transformLabel = (label: string): Partial<ExIssueLabel> => {
  return {
    name: label,
    color: getRandomColor(),
  };
};

export const transformComment = (
  comment: JiraComment,
): Partial<ExIssueComment> => {
  return {
    external_id: comment.id,
    external_source: "JIRA",
    created_at: getFormattedDate(comment.created),
    created_by: comment.author?.displayName,
    comment_html: comment.renderedBody ?? "<p></p>",
    actor: comment.author?.displayName,
    issue: comment.issue_id,
  };
};

export const transformUser = (user: ImportedJiraUser): Partial<PlaneUser> => {
  const [first_name, last_name] = user.user_name.split(" ");
  const role =
    user.org_role && user.org_role.toLowerCase().includes("admin") ? 20 : 15;

  return {
    email: user.email,
    display_name: user.user_name,
    first_name: first_name ?? "",
    last_name: last_name ?? "",
    role,
  };
};

export const transformSprint = (sprint: JiraSprint): Partial<ExCycle> => {
  return {
    external_id: sprint.sprint.id.toString(),
    external_source: "JIRA",
    name: sprint.sprint.name,
    start_date: getFormattedDate(sprint.sprint.startDate),
    end_date: getFormattedDate(sprint.sprint.endDate),
    created_at: getFormattedDate(sprint.sprint.createdDate),
    issues: sprint.issues.map((issue) => issue.id),
  };
};

export const transformComponent = (
  component: JiraComponent,
): Partial<ExModule> => {
  return {
    external_id: component.component.id ?? "",
    external_source: "JIRA",
    name: component.component.name,
    issues: component.issues.map((issue) => issue.id),
  };
};
