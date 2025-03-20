import { SlackEventPayload, UnfurlMap } from "@plane/etl/slack";
import { CONSTANTS } from "@/helpers/constants";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { extractPlaneResource } from "../../helpers/parse-plane-resources";
import { createCycleLinkback } from "../../views/cycle-linkback";
import { createSlackLinkback } from "../../views/issue-linkback";
import { createModuleLinkback } from "../../views/module-linkback";
import { createProjectLinkback } from "../../views/project-linkback";

const apiClient = getAPIClient();

export const handleSlackEvent = async (data: SlackEventPayload) => {
  try {
    switch (data.event.type) {
      case "message":
        await handleMessageEvent(data);
        break;
      case "link_shared":
        await handleLinkSharedEvent(data);
        break;
      default:
        break;
    }
  } catch (error: any) {
    const { slackService } = await getConnectionDetails(data.team_id);

    console.log(error);

    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError
      ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE
      : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.event.user, errorMessage, data.event.channel, data.event.event_ts);

    if (!isPermissionError) {
      throw error;
    }
  }
};

export const handleMessageEvent = async (data: SlackEventPayload) => {
  if (data.event.type === "message") {
    if (!data.event.thread_ts) return;

    const { workspaceConnection, planeClient, slackService } = await getConnectionDetails(data.team_id);
    // Get the associated entity connection with the message
    const entityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      entity_id: data.event.thread_ts.trim().toString(),
    });

    if (!entityConnection || entityConnection.length === 0) return;

    const eConnection = entityConnection[0];

    const members = await planeClient.users.list(workspaceConnection.workspace_slug, eConnection.project_id ?? "");
    const userInfo = await slackService.getUserInfo(data.event.user);
    const issueId = eConnection.entity_slug;

    const planeUser = members.find((member) => member.email === userInfo?.user.profile.email);

    await planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      eConnection.project_id ?? "",
      issueId ?? "",
      {
        comment_html: `<p>${data.event.text}</p>`,
        external_source: "SLACK_COMMENT",
        external_id: data.event.event_ts,
        created_by: planeUser?.id,
      }
    );
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

        if (resource.type === "issue") {
          if (resource.workspaceSlug !== workspaceConnection.workspace_slug) return;

          const issue = await planeClient.issue.getIssueByIdentifier(
            workspaceConnection.workspace_slug,
            resource.projectIdentifier,
            Number(resource.issueKey)
          );

          const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, issue.project);
          const members = await planeClient.users.list(workspaceConnection.workspace_slug, issue.project);
          const states = await planeClient.state.list(workspaceConnection.workspace_slug, issue.project);

          const linkBack = createSlackLinkback(
            workspaceConnection.workspace_slug,
            project,
            members,
            states.results,
            issue,
            false,
            true
          );

          unfurlMap[link.url] = linkBack;
        } else {
          const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, resource.projectId);
          const members = await planeClient.users.list(workspaceConnection.workspace_slug, resource.projectId);
          if (resource.type === "project") {
            const projectLinkback = createProjectLinkback(project, members);
            unfurlMap[link.url] = projectLinkback;
          } else if (resource.type === "cycle") {
            const cycle = await planeClient.cycles.getCycle(
              workspaceConnection.workspace_slug,
              resource.projectId,
              resource.cycleId
            );

            const linkBack = createCycleLinkback(workspaceConnection.workspace_slug, project, cycle);
            unfurlMap[link.url] = linkBack;
          } else if (resource.type === "module") {
            const module = await planeClient.modules.getModule(
              workspaceConnection.workspace_slug,
              resource.projectId,
              resource.moduleId
            );

            const moduleLinkback = createModuleLinkback(workspaceConnection.workspace_slug, project, module);
            unfurlMap[link.url] = moduleLinkback;
          }
        }
      })
    );

    if (Object.keys(unfurlMap).length > 0) {
      await slackService.unfurlLink(data.event.channel, data.event.message_ts, unfurlMap);
    }
  }
};
