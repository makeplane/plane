import { SlackEventPayload, SlackLinkSharedEvent, UnfurlMap } from "@plane/etl/slack";
import { getConnectionDetails } from "../../helpers/connection-details";
import { getEntityConnectionByEntityId } from "@/db/query/connection";
import { extractPlaneResource } from "../../helpers/parse-plane-resources";
import { createSlackLinkback } from "../../views/issue-linkback";
import { convertUnicodeToSlackEmoji } from "../../helpers/emoji-converter";
import { createProjectLinkback } from "../../views/project-linkback";
import { createCycleLinkback } from "../../views/cycle-linkback";
import { createModuleLinkback } from "../../views/module-linkback";
import axios from "axios";

export const handleSlackEvent = async (data: SlackEventPayload) => {
  switch (data.event.type) {
    case "message":
      await handleMessageEvent(data);
      break;
    case "link_shared":
      await handleLinkSharedEvent(data);
    default:
      break;
  }
};

export const handleMessageEvent = async (data: SlackEventPayload) => {
  if (data.event.type === "message") {
    if (!data.event.thread_ts) return;

    const { workspaceConnection, planeClient, slackService } = await getConnectionDetails(data.team_id);
    // Get the associated entity connection with the message
    const entityConnection = await getEntityConnectionByEntityId(data.event.thread_ts);
    if (!entityConnection || entityConnection.length === 0) return;

    const eConnection = entityConnection[0];

    const members = await planeClient.users.list(workspaceConnection.workspaceSlug, eConnection.projectId ?? "");
    const userInfo = await slackService.getUserInfo(data.event.user);
    const issueId = eConnection.entitySlug;

    const planeUser = members.find((member) => member.email === userInfo?.user.profile.email);

    await planeClient.issueComment.create(workspaceConnection.workspaceSlug, eConnection.projectId ?? "", issueId ?? "", {
      comment_html: `<p>${data.event.text}</p>`,
      external_source: "SLACK_COMMENT",
      external_id: data.event.event_ts,
      created_by: planeUser?.id,
    });
  }
};

export const handleLinkSharedEvent = async (data: SlackEventPayload) => {
  if (data.event.type === "link_shared") {
    const { workspaceConnection, planeClient, slackService } = await getConnectionDetails(data.team_id);
    const unfurlMap: UnfurlMap = {};

    await Promise.all(
      data.event.links.map(async (link) => {
        const resource = extractPlaneResource(link.url);
        if (resource === null) return;

        const project = await planeClient.project.getProject(workspaceConnection.workspaceSlug, resource.projectId);
        const members = await planeClient.users.list(workspaceConnection.workspaceSlug, resource.projectId);

        if (resource.type === "issue") {
          if (resource.workspaceSlug !== workspaceConnection.workspaceSlug) return;

          const issue = await planeClient.issue.getIssue(
            workspaceConnection.workspaceSlug,
            resource.projectId,
            resource.issueId
          );

          const states = await planeClient.state.list(workspaceConnection.workspaceSlug, issue.project);
          const cycles = await planeClient.cycles.list(workspaceConnection.workspaceSlug, issue.project);

          const linkBack = createSlackLinkback(
            workspaceConnection.workspaceSlug,
            project,
            members,
            states.results,
            cycles.results,
            issue
          );

          unfurlMap[link.url] = linkBack;
        } else if (resource.type === "project") {
          const projectLinkback = createProjectLinkback(project, members);
          unfurlMap[link.url] = projectLinkback;
        } else if (resource.type === "cycle") {
          const cycle = await planeClient.cycles.getCycle(
            workspaceConnection.workspaceSlug,
            resource.projectId,
            resource.cycleId
          );

          const linkBack = createCycleLinkback(workspaceConnection.workspaceSlug, project, cycle);
          unfurlMap[link.url] = linkBack;
        } else if (resource.type === "module") {
          const module = await planeClient.modules.getModule(
            workspaceConnection.workspaceSlug,
            resource.projectId,
            resource.moduleId
          );

          const moduleLinkback = createModuleLinkback(workspaceConnection.workspaceSlug, project, module);
          unfurlMap[link.url] = moduleLinkback;
        }
      })
    );

    if (Object.keys(unfurlMap).length > 0) {
      await slackService.unfurlLink(data.event.channel, data.event.message_ts, unfurlMap);
    }
  }
};
