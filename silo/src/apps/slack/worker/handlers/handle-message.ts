import { SlackEventPayload } from "@silo/slack";
import { getConnectionDetails } from "../../helpers/connection-details";
import { getEntityConnectionByEntityId } from "@/db/query/connection";

export const handleMessageEvent = async (data: SlackEventPayload) => {
  if (!data.event.thread_ts) return;

  const { workspaceConnection, planeClient, slackService } = await getConnectionDetails(data.team_id);
  // Get the associated entity connection with the message
  const entityConnection = await getEntityConnectionByEntityId(data.event.thread_ts);
  if (!entityConnection || entityConnection.length === 0) return;

  const eConnection = entityConnection[0];

  const members = await planeClient.users.list(workspaceConnection.workspaceSlug, eConnection.projectId);
  const userInfo = await slackService.getUserInfo(data.event.user);
  const issueId = eConnection.entitySlug;

  const planeUser = members.find((member) => member.email === userInfo?.user.profile.email);

  await planeClient.issueComment.create(workspaceConnection.workspaceSlug, eConnection.projectId, issueId, {
    comment_html: `<p>${data.event.text}</p>`,
    external_source: "SLACK_COMMENT",
    external_id: data.event.event_ts,
    created_by: planeUser?.id,
  });
};
