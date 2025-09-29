import { Client, ExCycle, ExIssueComment, ExIssueLabel, ExIssue as PlaneIssue, PlaneUser } from "@plane/sdk";
import { E_ISSUE_STATE_MAP_KEYS, TIssueStateMap, E_INTEGRATION_KEYS } from "@plane/types";
import { ContentParser, replaceIssueNumber, replaceMentionedGhUsers } from "../helpers";
import { GithubService } from "../services";
import { WebhookGitHubComment, WebhookGitHubIssue, WebhookGitHubLabel, WebhookGitHubMilestone } from "../types";

export const transformGitHubIssue = async (
  issue: WebhookGitHubIssue,
  issueHTML: string,
  imagePrefix: string,
  planeClient: Client,
  repository: string,
  userMap: Record<string, string>,
  issueStateMap: TIssueStateMap | undefined,
  workspaceSlug: string,
  projectId: string,
  planeUsers: PlaneUser[],
  githubService: GithubService,
  ghIntegrationKey: E_INTEGRATION_KEYS,
  isUpdate: boolean = false
): Promise<Partial<PlaneIssue>> => {
  const links = [
    {
      name: "Linked GitHub Issue",
      url: `https://github.com/${repository}/issues/${issue.number}`,
    },
  ];

  let planeAssignees: string[] = [];

  let creator: string | undefined;

  if (issue.user && issue.user.type === "User") {
    creator = userMap[issue.user.login];
  }

  let issue_html = `<p>${issue.body || ""}</p>`;

  if (!creator) {
    const issueBody = issue.body || "";
    const currentUserReference = `<a href="${issue.user?.html_url}">${issue.user?.login}</a>`;

    // Regular expression to match the existing creator reference
    const creatorReferenceRegex = /Issue (updated|created) on GitHub By \[(.*?)\]\((.*?)\)/gim;

    if (creatorReferenceRegex.test(issueBody)) {
      // Update existing reference and add new one
      const updatedBody = issueBody.replace(creatorReferenceRegex, "");
      issue_html = `<p>${updatedBody}\n\n\nIssue ${isUpdate ? "updated" : "created"} on GitHub By ${currentUserReference}</p>`;
    } else {
      // Add new creator reference
      issue_html = `<p>${issueBody}\n\n\nIssue ${isUpdate ? "updated" : "created"} on GitHub By ${currentUserReference}</p>`;
    }
  }

  const imageMap = ContentParser.extractImageInfo(issueHTML);
  issue_html = await ContentParser.toPlaneHtml(issue_html, imagePrefix, imageMap, {
    planeClient,
    workspaceSlug,
    projectId,
    userMap,
    planeUsers,
    repo: repository,
    githubService,
  });

  // Replace the issue number with the actual issue number in github
  issue_html = replaceIssueNumber(issue_html, repository);
  // Replace the mentioned github users in the issue body
  issue_html = replaceMentionedGhUsers(issue_html, workspaceSlug, userMap, planeUsers);

  if (issue.assignees) {
    planeAssignees = issue.assignees
      .map((assignee) => {
        if (assignee != null) {
          return userMap[assignee.login];
        }
      })
      .filter((assignee) => assignee != undefined) as string[];
  }

  let labels = issue.labels?.map((label) => (typeof label === "string" ? label : label.name)) || [];
  labels = labels.filter((label) => label.toLowerCase() !== "plane");

  let targetState: string | undefined = undefined;
  if (issue.state) {
    const states = (await planeClient.state.list(workspaceSlug, projectId)).results;
    const backlogState = states.find((state) => state.group === "backlog");
    const doneState = states.find((state) => state.group === "completed");
    if (issue.state === "open") {
      targetState = backlogState?.id;
    } else if (issue.state === "closed") {
      targetState = doneState?.id;
    }
  }

  // if they have configured the issue state map, use it to set the target state
  if (issueStateMap && Object.keys(issueStateMap).length > 0) {
    if (issue.state === "open") {
      targetState = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_OPEN]?.id;
    } else if (issue.state === "closed") {
      targetState = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_CLOSED]?.id;
    }
  }

  return {
    external_id: issue.number.toString(),
    external_source: ghIntegrationKey,
    created_by: creator,
    name: issue.title,
    description_html: issue_html,
    created_at: issue.created_at,
    state: targetState,
    priority: "none",
    labels: labels,
    assignees: planeAssignees,
    links,
  };
};

export const transformGitHubLabel = (label: WebhookGitHubLabel): Partial<ExIssueLabel> => ({
  name: label.name,
  color: `#${label.color}`,
  external_id: label.id.toString(),
  external_source: E_INTEGRATION_KEYS.GITHUB,
});

export const transformGitHubComment = async (
  comment: WebhookGitHubComment,
  commentHtml: string,
  imagePrefix: string,
  issueId: string,
  repository: string,
  workspaceSlug: string,
  projectId: string,
  planeClient: Client,
  githubService: GithubService,
  userMap: Record<string, string>,
  planeUsers: PlaneUser[],
  isUpdate: boolean = false
): Promise<Partial<ExIssueComment>> => {
  let creator: string | undefined;

  if (comment.user && comment.user.type === "User") {
    creator = userMap[comment.user.login];
  }

  let comment_html = `<p>${comment.body || ""}</p>`;

  if (!creator) {
    const commentBody = (comment.body || "").trim();
    const currentUserReference = `<a href="${comment.user?.html_url}">${comment.user?.login}</a>`;

    // Regular expression to match the existing creator reference
    const creatorReferenceRegex = /Comment (updated|created) on GitHub By \[(.*?)\]\((.*?)\)/gim;

    let updatedBody;
    if (creatorReferenceRegex.test(commentBody)) {
      // Update existing reference and add new one
      updatedBody = commentBody.replace(creatorReferenceRegex, "").trim();
    } else {
      // Use the original comment body
      updatedBody = commentBody;
    }

    // Add new creator reference
    const creatorReference = `Comment ${isUpdate ? "updated" : "created"} on GitHub By ${currentUserReference}`;

    // Combine the body and creator reference, replacing multiple newlines with a single one
    comment_html = `${updatedBody}\n\n${creatorReference}`
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "") // Remove leading and trailing whitespace
      .replace(/\s*(<\/?p>)\s*/g, "$1"); // Remove spaces around <p> tags

    // Only wrap in <p> tags if it's not already wrapped
    if (!comment_html.startsWith("<p>") && !comment_html.endsWith("</p>")) {
      comment_html = `<p>${comment_html}</p>`;
    }
  }

  const imageMap = ContentParser.extractImageInfo(commentHtml);
  comment_html = await ContentParser.toPlaneHtml(comment_html, imagePrefix, imageMap, {
    planeClient,
    workspaceSlug,
    projectId,
    userMap,
    planeUsers,
    repo: repository,
    githubService,
  });

  comment_html = replaceIssueNumber(comment_html!, repository);
  comment_html = replaceMentionedGhUsers(comment_html, workspaceSlug, userMap, planeUsers);

  return {
    external_id: comment.id.toString(),
    external_source: E_INTEGRATION_KEYS.GITHUB,
    created_at: comment.created_at,
    created_by: creator || undefined,
    comment_html: comment_html,
    actor: creator || undefined,
    issue: issueId,
  };
};

export const transformGitHubMilestone = (milestone: WebhookGitHubMilestone): Partial<ExCycle> => ({
  external_id: milestone.id.toString(),
  external_source: E_INTEGRATION_KEYS.GITHUB,
  name: milestone.title,
  description: milestone.description || undefined,
  start_date: milestone.created_at,
  end_date: milestone.due_on || undefined,
});
