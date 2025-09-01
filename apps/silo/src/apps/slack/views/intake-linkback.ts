import { ExIntakeIssue, PlaneUser } from "@plane/sdk";
import { getIntakeUrl } from "@/helpers/urls";
import { invertStringMap } from "@/helpers/utils";
import { createSlackLinkbackMutationContext, E_MUTATION_CONTEXT_FORMAT_TYPE, E_MUTATION_CONTEXT_ITEM_TYPE } from "../helpers/blocks";
import { INTAKE_STATUSES } from "../helpers/constants";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";

export const createSlackIntakeLinkback = (
  workspaceSlug: string,
  issue: ExIntakeIssue,
  userMap: Map<string, string>,
  showLogo = false,
  createdBy: PlaneUser | undefined,
) => {
  const { issue_detail } = issue;
  const planeToSlackUserMap = invertStringMap(userMap);
  const blocks: any[] = [];

  // Get status info
  const statusInfo = INTAKE_STATUSES.find((s) => s.id === issue.status) || INTAKE_STATUSES[0];

  // Build markdown content for main section
  const title = `<${getIntakeUrl(workspaceSlug, issue.project, issue.id)}|Intake: *${issue_detail?.name || "Untitled"}*>`;

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: title,
    },
  });

  let sectionContent = `> Status: *${statusInfo.name}*`;

  // Priority
  if (issue_detail?.priority && issue_detail.priority !== "none") {
    sectionContent += `\n> Priority: *${titleCaseWord(issue_detail.priority)}*`;
  }

  // Target date
  if (issue_detail?.target_date) {
    sectionContent += `\n> Target Date: *${formatTimestampToNaturalLanguage(issue_detail.target_date, false)}*`;
  }

  // Snoozed until date (for snoozed status)
  if (issue.status === 0 && issue.snoozed_till) {
    sectionContent += `\n> Snoozed Until: *${formatTimestampToNaturalLanguage(issue.snoozed_till, false)}*`;
  }

  // Main section with intake details
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: sectionContent,
    },
  });

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
          text: `*Plane*`,
        },
      ],
    });
  }

  // Divider
  blocks.push({
    type: "divider",
  });

  // Build markdown content for creation/update info
  const mutationContext = createSlackLinkbackMutationContext({
    issueCtx: {
      createdBy: createdBy ? {
        id: createdBy.id,
        display_name: createdBy.display_name,
      } : undefined,
      updatedBy: undefined,
    },
    planeToSlackUserMap,
    workspaceSlug,
    options: {
      itemType: E_MUTATION_CONTEXT_ITEM_TYPE.INTAKE,
      format: E_MUTATION_CONTEXT_FORMAT_TYPE.CREATION_ONLY,
    },
  });

  // Context with creation and update info using mrkdwn
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: mutationContext,
      },
    ],
  });

  // View in Plane button
  if (issue.project) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View in Plane",
            emoji: true,
          },
          url: getIntakeUrl(workspaceSlug, issue.project, issue.id),
          action_id: "view_intake_in_plane",
        },
      ],
    });
  }
  return { blocks };
};

function titleCaseWord(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}
