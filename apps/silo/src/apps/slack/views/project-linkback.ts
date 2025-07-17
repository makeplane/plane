import { ExProject, PlaneUser } from "@plane/sdk";
import { convertUnicodeToSlackEmoji } from "../helpers/emoji-converter";

export const createProjectLinkback = (project: ExProject, members: PlaneUser[]) => {
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

  // Project header with emoji and name
  const emoji =
    project.logo_props &&
    project.logo_props?.in_use === "emoji" &&
    project.logo_props?.emoji &&
    project.logo_props?.emoji?.value
      ? convertUnicodeToSlackEmoji(project.logo_props?.emoji?.value)
      : "📋";
  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `${emoji} *${project.name}*`,
    },
  });

  // Project description
  if (project.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: project.description,
      },
    });
  }

  // Stats context (cycles, modules, members)
  const contextElements: any[] = [];

  if (project.total_cycles && project.total_cycles > 0) {
    contextElements.push({
      type: "mrkdwn",
      text: `*${project.total_cycles}* ${project.total_cycles > 1 ? "cycles" : "cycle"}`,
    });
  }

  if (project.total_modules && project.total_modules > 0) {
    contextElements.push({
      type: "mrkdwn",
      text: `*${project.total_modules}* ${project.total_modules > 1 ? "modules" : "module"}`,
    });
  }

  if (project.total_members && project.total_members > 0) {
    contextElements.push({
      type: "mrkdwn",
      text: `*${project.total_members}* ${project.total_members > 1 ? "members" : "member"}`,
    });

    const memberCtxElements = members
      .filter((member) => member.id !== project.project_lead && member.avatar)
      .slice(0, 3)
      .map((member) => ({
        type: "image",
        image_url: member.avatar,
        alt_text: `${member.first_name} ${member.last_name}`,
      }));

    if (memberCtxElements.length === 3) {
      contextElements.push(...memberCtxElements);
    }
  }

  if (contextElements.length > 0) {
    blocks.push({
      type: "context",
      elements: contextElements,
    });
  }

  // Project lead and default assignee context
  const userCtxElements: any[] = [];

  if (project.project_lead) {
    const lead = members.find((member) => member.id === project.project_lead);
    if (lead) {
      userCtxElements.push(
        {
          type: "image",
          image_url: lead.avatar,
          alt_text: `${lead.first_name} ${lead.last_name}`,
        },
        {
          type: "plain_text",
          text: `Lead by ${lead.first_name} ${lead.last_name}`,
        }
      );
    }
  }

  if (project.default_assignee) {
    const assignee = members.find((member) => member.id === project.default_assignee);
    if (assignee) {
      userCtxElements.push(
        {
          type: "plain_text",
          text: `Default assignee: ${assignee.first_name} ${assignee.last_name}`,
        },
        {
          type: "image",
          image_url: assignee.avatar,
          alt_text: `${assignee.first_name} ${assignee.last_name}`,
        }
      );
    }
  }

  if (userCtxElements.length > 0) {
    blocks.push({
      type: "context",
      elements: userCtxElements,
    });
  }

  return { blocks };
};
