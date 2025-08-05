import { ExIntakeIssue } from "@plane/sdk";
import { env } from "@/env";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";

// Intake issue statuses based on the Django model
export const INTAKE_STATUSES = [
  { id: -2, name: "Pending", emoji: "⏳" },
  { id: -1, name: "Rejected", emoji: "❌" },
  { id: 0, name: "Snoozed", emoji: "😴" },
  { id: 1, name: "Accepted", emoji: "✅" },
  { id: 2, name: "Duplicate", emoji: "🔄" },
];

export const createSlackIntakeLinkback = (workspaceSlug: string, issue: ExIntakeIssue, showLogo = false) => {
  const { issue_detail } = issue;

  // Get status info
  const statusInfo = INTAKE_STATUSES.find((s) => s.id === issue.status) || INTAKE_STATUSES[0];

  const blocks: any[] = [];

  if (showLogo) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "image",
          image_url: "https://media.docs.plane.so/logo/favicon-512x512.png",
          alt_text: "Plane",
        },
        {
          type: "mrkdwn",
          text: `*Plane Intake*`,
        },
      ],
    });
  }

  // Main title with link to issue (if we have the issue detail)
  const titleText = issue_detail?.project
    ? `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue_detail.project}/intake|📥 ${issue_detail.name}>`
    : `📥 *${issue_detail.name}*`;

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: titleText,
    },
  });

  // Create context elements array with intake-specific information
  const contextElements: any[] = [];

  // Status information
  contextElements.push({
    type: "mrkdwn",
    text: `*Status:* ${statusInfo.emoji} ${statusInfo.name}`,
  });

  // Source information
  if (issue.source) {
    let sourceText = `*Source:* ${issue.source}`;
    if (issue.source_email) {
      sourceText += ` (${issue.source_email})`;
    }
    contextElements.push({
      type: "mrkdwn",
      text: sourceText,
    });
  }

  // External source if available
  if (issue.external_source) {
    contextElements.push({
      type: "mrkdwn",
      text: `*External Source:* ${issue.external_source}`,
    });
  }

  // Project information (if available)
  if (issue_detail?.project) {
    contextElements.push({
      type: "mrkdwn",
      text: `📋 <${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue_detail.project}/issues|Project>`,
    });
  }

  // Add context block for intake-specific info
  if (contextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: contextElements,
    });
  }

  // Issue details context (state, priority, assignees, dates)
  const issueContextElements: any[] = [];

  // State and priority information
  if (issue_detail?.state || issue_detail?.priority) {
    // @ts-expect-error
    const stateLabel = issue_detail?.state ? `*State:* ${issue_detail.state.name}` : "*State:* Not set";
    const priorityLabel =
      issue_detail?.priority && issue_detail.priority !== "none"
        ? `*Priority:* ${titleCaseWord(issue_detail.priority)}`
        : "*Priority:* Not set";

    issueContextElements.push({
      type: "mrkdwn",
      text: `${stateLabel}    ${priorityLabel}`,
    });
  }

  // Assignees information
  if (issue_detail?.assignees && issue_detail.assignees.length > 0) {
    const assigneeCount = issue_detail.assignees.length;
    const assigneeText = assigneeCount === 1 ? "Assignee" : "Assignees";

    issueContextElements.push({
      type: "mrkdwn",
      text: `*${assigneeText}:* ${assigneeCount} assigned`,
    });
  }

  // Target date
  if (issue_detail?.target_date) {
    issueContextElements.push({
      type: "plain_text",
      text: `Target Date: ${formatTimestampToNaturalLanguage(issue_detail.target_date)}`,
    });
  }

  // Created date
  if (issue.created_at) {
    issueContextElements.push({
      type: "plain_text",
      text: `Created: ${formatTimestampToNaturalLanguage(issue.created_at)}`,
    });
  }

  // Snoozed until date (for snoozed status)
  if (issue.status === 0 && issue.snoozed_till) {
    issueContextElements.push({
      type: "plain_text",
      text: `Snoozed until: ${formatTimestampToNaturalLanguage(issue.snoozed_till)}`,
    });
  }

  // Add issue context block if there are any elements
  if (issueContextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: issueContextElements,
    });
  }

  // Duplicate issue information (for duplicate status)
  if (issue.status === 2 && issue.duplicate_to) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `🔄 *Duplicate of:* <${env.APP_BASE_URL}/${workspaceSlug}/projects/${issue_detail.project}/issues/${issue.duplicate_to}|View Original Issue>`,
        },
      ],
    });
  }

  blocks.push({
    type: "divider",
  });

  return { blocks };
};

function titleCaseWord(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}
