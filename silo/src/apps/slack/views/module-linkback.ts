import { ExModule, ExProject, TModuleStatus } from "@plane/sdk";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";
import { env } from "@/env";

export const createModuleLinkback = (workspaceSlug: string, project: ExProject, module: ExModule) => {
  const blocks: any[] = [];

  // Add Plane Logo with Title on top
  blocks.push({
    type: "context",
    elements: [
      {
        type: "image",
        image_url: "https://res.cloudinary.com/ddglxo0l3/image/upload/v1732200793/xljpcpmftawmjkv4x61s.png",
        alt_text: "Plane",
      },
      {
        type: "mrkdwn",
        text: `*Plane*`,
      },
    ],
  });

  // Module header with name
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `📦 *${module.name}*`,
    },
  });

  // Module description
  if (module.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: module.description,
      },
    });
  }

  // Project and dates context
  const contextElements: any[] = [
    {
      type: "mrkdwn",
      text: `<${env.APP_BASE_URL}/${workspaceSlug}/projects/${project.id}|${project.name}>`,
    },
  ];

  if (module.start_date && module.target_date) {
    contextElements.push({
      type: "plain_text",
      text: `${formatTimestampToNaturalLanguage(module.start_date, false)} - ${formatTimestampToNaturalLanguage(module.target_date, false)}`,
      emoji: true,
    });
  }

  // Add status based on TModuleStatus
  const statusMap: { [key in TModuleStatus]: string } = {
    backlog: "🗂️ Backlog",
    planned: "📅 Planned",
    "in-progress": "▶️ In Progress",
    paused: "⏸️ Paused",
    completed: "✅ Completed",
    cancelled: "❌ Cancelled",
  };

  const moduleStatus = module.status ? statusMap[module.status] : "🔄 Not started";

  contextElements.push({
    type: "mrkdwn",
    text: moduleStatus,
  });

  // Add progress if available
  if (typeof module.completed_issues === "number" && typeof module.total_issues === "number") {
    const progress = module.total_issues > 0 ? Math.round((module.completed_issues / module.total_issues) * 100) : 0;

    contextElements.push({
      type: "mrkdwn",
      text: `Progress: ${progress}% (${module.completed_issues}/${module.total_issues})`,
    });
  }

  if (contextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: contextElements,
    });
  }

  return { blocks };
};
