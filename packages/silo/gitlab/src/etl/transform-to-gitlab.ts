import { ExCycle, ExIssueLabel, ExIssue as PlaneIssue } from "@plane/sdk";
import { GitlabIssue, GitlabLabel, GitlabMilestone, GitlabUser } from "../types";

export const transformPlaneIssue = (
  issue: PlaneIssue,
  labels: ExIssueLabel[],
  projectId: number,
  userMap: Record<string, GitlabUser>
): Partial<GitlabIssue> => {
  const gitlabIssueIid = issue.links
    ?.find((link) => link.name === "Linked GitLab Issue")
    ?.url.split("/")
    .pop();

  const allAssignees = issue.assignees;
  const allLabels = issue.labels;
  let issueLabels = labels.filter((label) => allLabels.includes(label.id));

  // If there is a gitlab label, remove it and add a plane label
  issueLabels = issueLabels.filter((label) => label.name.toLowerCase() !== "gitlab");

  const assignees =
    allAssignees?.map((assignee) => userMap[assignee]).filter((assignee) => assignee != undefined) || [];

  const glLabels = issueLabels?.map((label) => transformPlaneLabel(label)) || [];
  glLabels.push({
    name: "plane",
    color: "#438bde",
  });

  // Remove the part from the issue body when we mention the creator
  const htmlToRemove = /<p><em>Issue (updated|created) on GitLab By <\/em><a[^>]*><em>[^<]*<\/em><\/a><\/p>/gi;
  const cleanHtml = issue.description_html.replace(htmlToRemove, "");

  return {
    id: parseInt(issue.external_id || "0"),
    iid: parseInt(gitlabIssueIid || "0"),
    title: issue.name,
    description: cleanHtml,
    project_id: projectId,
    state: issue.state === "Done" ? "closed" : "opened",
    created_at: issue.created_at,
    assignees: assignees,
    labels: glLabels.map((label) => label.name ?? ""),
  };
};

export const transformPlaneLabel = (label: ExIssueLabel): Partial<GitlabLabel> => ({
  name: label.name,
  color: label.color,
});

export const transformPlaneCycle = (cycle: ExCycle): Partial<GitlabMilestone> => ({
  id: parseInt(cycle.external_id || "0"),
  title: cycle.name,
  description: cycle.description,
  created_at: cycle.created_at,
  due_date: cycle.end_date,
});
