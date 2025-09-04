import { Client, ExCycle, ExIssueLabel, ExIssue as PlaneIssue } from "@plane/sdk";
import { ContentParser } from "../helpers/content-parser";
import { GithubIssue, WebhookGitHubLabel, WebhookGitHubMilestone, WebhookGitHubUser } from "../types";

export const transformPlaneIssue = async (
  issue: PlaneIssue,
  imgSrcPrefix: string,
  labels: ExIssueLabel[],
  owner: string,
  repo: string,
  userMap: Record<string, WebhookGitHubUser>,
  planeClient: Client,
  workspaceSlug: string,
  projectId: string
): Promise<Partial<GithubIssue>> => {
  const githubIssueNumber = issue.links
    ?.find((link) => link.name === "Linked GitHub Issue")
    ?.url.split("/")
    .pop();

  const allAssignees = issue.assignees;
  const allLabels = issue.labels;
  let issueLabels = labels.filter((label) => allLabels.includes(label.id));

  // If there is a github label, remove it and add a plane label
  issueLabels = issueLabels.filter((label) => label.name.toLowerCase() !== "github");

  const assignees =
    allAssignees?.map((assignee) => userMap[assignee]?.login).filter((assignee) => assignee != undefined) || [];

  const ghLabels = issueLabels?.map((label) => transformPlaneLabel(label)) || [];
  ghLabels.push({
    name: "plane",
    color: "438bde",
  });

  // Remove the part from the issue body when we mention the creator
  const htmlToRemove = /<p><em>Issue (updated|created) on GitHub By <\/em><a[^>]*><em>[^<]*<\/em><\/a><\/p>/gi;
  const cleanHtml = issue.description_html.replace(htmlToRemove, "");

  // Convert the cleaned HTML to GitHub markdown using our ContentParser
  const githubBody = ContentParser.toMarkdown(cleanHtml, imgSrcPrefix);

  let targetState: string | undefined = undefined;
  if (issue.state) {
    const states = (await planeClient.state.list(workspaceSlug, projectId)).results;
    const issueState = states.find((state) => state.id === issue.state);
    if (issueState?.group === "completed") {
      targetState = "CLOSED";
    } else {
      targetState = "OPEN";
    }
  }

  return {
    id: parseInt(issue.external_id || "0"),
    number: parseInt(githubIssueNumber || "0"),
    title: issue.name,
    body: githubBody,
    owner: owner,
    repo: repo,
    state: targetState,
    created_at: issue.created_at,
    assignees: assignees as string[],
    labels: ghLabels,
  };
};

export const transformPlaneLabel = (label: ExIssueLabel): Partial<WebhookGitHubLabel> => ({
  name: label.name,
  color: label.color.replace("#", ""),
});

export const transformPlaneCycle = (cycle: ExCycle): Partial<WebhookGitHubMilestone> => ({
  id: parseInt(cycle.external_id || "0"),
  title: cycle.name,
  description: cycle.description,
  created_at: cycle.created_at,
  due_on: cycle.end_date,
});
