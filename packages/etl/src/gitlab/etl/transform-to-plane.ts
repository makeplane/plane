import { ExCycle, ExIssueComment, ExIssueLabel, ExIssue as PlaneIssue, PlaneUser } from "@plane/sdk";
import { GitlabIssue, GitlabLabel, GitlabMilestone, GitlabNote } from "../types";
import { replaceIssueNumber, replaceMentionedGlUsers } from "../helpers";
import { E_INTEGRATION_KEYS } from "@/core";

export const transformGitlabIssue = (
  issue: GitlabIssue,
  projectId: number,
  userMap: Record<string, string>,
  workspaceSlug: string,
  planeUsers: PlaneUser[],
  isUpdate: boolean = false
): Partial<PlaneIssue> => {
  const links = [
    {
      name: "Linked GitLab Issue",
      url: issue.web_url,
    },
  ];

  let planeAssignees: string[] = [];

  let creator: string | undefined;

  if (issue.author) {
    creator = userMap[issue.author.username];
  }

  let issue_html = `<p>${issue.description || ""}</p>`;

  if (!creator) {
    const issueBody = issue.description || "";
    const currentUserReference = `<a href="${issue.author?.web_url}">${issue.author?.name}</a>`;

    const creatorReferenceRegex = /Issue (created|updated) on GitLab By <a href="[^"]*">[^<]*<\/a>/;

    if (creatorReferenceRegex.test(issueBody)) {
      const updatedBody = issueBody.replace(creatorReferenceRegex, "");
      issue_html = `<p>${updatedBody}\n\n\nIssue ${isUpdate ? "updated" : "created"} on GitLab By ${currentUserReference}</p>`;
    } else {
      issue_html = `<p>${issueBody}\n\n\nIssue ${isUpdate ? "updated" : "created"} on GitLab By ${currentUserReference}</p>`;
    }
  }

  issue_html = replaceMentionedGlUsers(issue_html, workspaceSlug, userMap, planeUsers);

  issue_html = replaceIssueNumber(issue_html, projectId.toString());

  if (issue.assignees) {
    planeAssignees = issue.assignees
      .map((assignee) => userMap[assignee.username])
      .filter((assignee) => assignee != undefined) as string[];
  }

  let labels = issue.labels || [];
  labels = labels.filter((label) => label.toLowerCase() !== "plane");
  labels.push(E_INTEGRATION_KEYS.GITLAB.toLowerCase());

  return {
    external_id: issue.iid.toString(),
    external_source: E_INTEGRATION_KEYS.GITLAB,
    created_by: creator,
    name: issue.title,
    description_html: issue_html,
    created_at: issue.created_at,
    state: issue.state === "opened" ? "Backlog" : "Done",
    priority: "none",
    labels: labels,
    assignees: planeAssignees,
    links,
  };
};

export const transformGitlabLabel = (label: GitlabLabel): Partial<ExIssueLabel> => ({
  name: label.name,
  color: label.color,
  external_id: label.id.toString(),
  external_source: E_INTEGRATION_KEYS.GITLAB,
});

export const transformGitlabComment = (
  comment: GitlabNote,
  issueId: string,
  projectId: number,
  workspaceSlug: string,
  userMap: Record<string, string>,
  planeUsers: PlaneUser[],
  isUpdate: boolean = false
): Partial<ExIssueComment> => {
  let creator: string | undefined;

  if (comment.author) {
    creator = userMap[comment.author.username];
  }

  let comment_html = `<p>${comment.body || ""}</p>`;

  if (!creator) {
    const commentBody = (comment.body || "").trim();
    // const currentUserReference = `<a href="${comment.author?.web_url}">${comment.author?.name}</a>`;
    const currentUserReference = `<a href="${"https://gitlab.com"}">${comment.author?.name}</a>`;

    const creatorReferenceRegex = /Comment (created|updated) on GitLab By <a href="[^"]*">[^<]*<\/a>_/;

    let updatedBody: string;
    if (creatorReferenceRegex.test(commentBody)) {
      updatedBody = commentBody.replace(creatorReferenceRegex, "").trim();
    } else {
      updatedBody = commentBody;
    }

    const creatorReference = `Comment ${isUpdate ? "updated" : "created"} on GitLab By ${currentUserReference}`;

    comment_html = `${updatedBody}\n\n${creatorReference}`
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s*(<\/?p>)\s*/g, "$1");

    if (!comment_html.startsWith("<p>") && !comment_html.endsWith("</p>")) {
      comment_html = `<p>${comment_html}</p>`;
    }
  }

  comment_html = replaceMentionedGlUsers(comment_html, workspaceSlug, userMap, planeUsers);
  comment_html = replaceIssueNumber(comment_html!, projectId.toString());

  return {
    external_id: comment.id.toString(),
    external_source: E_INTEGRATION_KEYS.GITLAB,
    created_at: comment.created_at,
    created_by: creator || undefined,
    comment_html: comment_html,
    actor: creator || undefined,
    issue: issueId,
  };
};

export const transformGitlabMilestone = (milestone: GitlabMilestone): Partial<ExCycle> => ({
  external_id: milestone.id.toString(),
  external_source: E_INTEGRATION_KEYS.GITLAB,
  name: milestone.title,
  description: milestone.description || undefined,
  start_date: milestone.start_date || milestone.created_at,
  end_date: milestone.due_date || undefined,
});
