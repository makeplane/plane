import { ExCycle, ExProject } from "@plane/sdk";
import { env } from "@/env";
import { formatTimestampToNaturalLanguage } from "../helpers/format-date";

export const createCycleLinkback = (workspaceSlug: string, project: ExProject, cycle: ExCycle) => {
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

  // Cycle header with name and dates
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `🔄 *${cycle.name}*`,
    },
  });

  // Cycle description
  if (cycle.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: cycle.description,
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

  if (cycle.start_date && cycle.end_date) {
    contextElements.push({
      type: "plain_text",
      text: `${formatTimestampToNaturalLanguage(cycle.start_date, false)} - ${formatTimestampToNaturalLanguage(cycle.end_date, false)}`,
      emoji: true,
    });
  }

  // Add status if cycle is active/upcoming/completed
  const today = new Date();
  const startDate = cycle.start_date ? new Date(cycle.start_date) : null;
  const endDate = cycle.end_date ? new Date(cycle.end_date) : null;

  let status = "🔄 Not started";
  if (startDate && endDate) {
    if (today > endDate) {
      status = "✅ Completed";
    } else if (today >= startDate && today <= endDate) {
      status = "▶️ Active";
    } else if (today < startDate) {
      status = "⏳ Upcoming";
    }
  }

  contextElements.push({
    type: "mrkdwn",
    text: status,
  });

  // Add progress if available
  if (typeof cycle.completed_issues === "number" && typeof cycle.total_issues === "number") {
    const progress = cycle.total_issues > 0 ? Math.round((cycle.completed_issues / cycle.total_issues) * 100) : 0;

    contextElements.push({
      type: "mrkdwn",
      text: `Progress: ${progress}% (${cycle.completed_issues}/${cycle.total_issues})`,
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
