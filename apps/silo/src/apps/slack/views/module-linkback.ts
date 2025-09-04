import { ExModule, ExProject, TModuleStatus } from "@plane/sdk";
import { getModuleUrl, getPlaneLogoUrl } from "@/helpers/urls";
import { ACTIONS } from "../helpers/constants";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";

export const createModuleLinkback = (workspaceSlug: string, project: ExProject, module: ExModule, showLogo = false) => {
  const blocks: any[] = [];

  // Status mapping without emojis for clean look
  const statusMap: { [key in TModuleStatus]: string } = {
    backlog: "Backlog",
    planned: "Planned",
    "in-progress": "In Progress",
    paused: "Paused",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  // Build markdown content for main section
  let sectionContent = `Module: *${module.name}*`;

  // Project
  sectionContent += `\nProject: *${project.name}*`;

  // Status
  const moduleStatus = module.status ? statusMap[module.status] : "Not started";
  sectionContent += `\nStatus: *${moduleStatus}*`;

  // Duration
  if (module.start_date && module.target_date) {
    sectionContent += `\nDuration: *${formatTimestampToNaturalLanguage(module.start_date, false)} - ${formatTimestampToNaturalLanguage(module.target_date, false)}*`;
  }

  // Progress
  if (typeof module.completed_issues === "number" && typeof module.total_issues === "number") {
    const progress = module.total_issues > 0 ? Math.round((module.completed_issues / module.total_issues) * 100) : 0;
    sectionContent += `\nProgress: *${progress}% (${module.completed_issues}/${module.total_issues} issues)*`;
  }

  // Main section with module details
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: sectionContent,
    },
  });

  // Divider
  blocks.push({
    type: "divider",
  });

  // Action buttons
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
        url: getModuleUrl(workspaceSlug, project.id ?? "", module.id ?? ""),
        action_id: "view_module_in_plane",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Create Work Item",
          emoji: true,
        },
        value: `${project.id}`,
        action_id: ACTIONS.CREATE_WORK_ITEM,
      },
    ],
  });

  if (showLogo) {
    // Add Plane Logo with Title on top
    blocks.push({
      type: "context",
      elements: [
        {
          type: "image",
          image_url: getPlaneLogoUrl(),
          alt_text: "Plane",
        },
        {
          type: "mrkdwn",
          text: `*Plane*`,
        },
      ],
    });
  }

  return { blocks };
};
