import { PageResource, PageSubType, SlackEventPayload, UnfurlBlock, UnfurlMap } from "@plane/etl/slack";
import { ExPage } from "@plane/sdk";
import { CONSTANTS } from "@/helpers/constants";
import { getProjectPageUrl, getPublishedPageUrl, getWorkspacePageUrl } from "@/helpers/urls";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { getSlackContentParser } from "../../helpers/content-parser";
import { extractRichTextElements, richTextBlockToMrkdwn } from "../../helpers/parse-issue-form";
import { extractPlaneResource } from "../../helpers/parse-plane-resources";
import { enhanceUserMapWithSlackLookup, getSlackToPlaneUserMapFromWC } from "../../helpers/user";
import { TSlackConnectionDetails } from "../../types/types";
import { createCycleLinkback } from "../../views/cycle-linkback";
import { createSlackLinkback } from "../../views/issue-linkback";
import { createModuleLinkback } from "../../views/module-linkback";
import { createPageLinkback } from "../../views/page-linkback";
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
    const details = await getConnectionDetails(data.team_id, {
      id: data.event.user,
    });
    if (!details) {
      logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
      return;
    }

    const { slackService } = details;

    const isPermissionError = error?.detail?.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.event.user, errorMessage, data.event.channel, data.event.event_ts);

    if (!isPermissionError) {
      throw error;
    }
  }
};

export const handleMessageEvent = async (data: SlackEventPayload) => {
  if (data.event.type === "message") {
    if (!data.event.thread_ts) return;

    const details = await getConnectionDetails(data.team_id, {
      id: data.event.user,
    });

    if (!details) {
      logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
      return;
    }

    const { workspaceConnection, planeClient, slackService } = details;
    // Get the associated entity connection with the message
    const entityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      entity_id: data.event.thread_ts.trim().toString(),
    });

    if (!entityConnection || entityConnection.length === 0) return;

    const eConnection = entityConnection[0];

    const members = await planeClient.users.list(workspaceConnection.workspace_slug, eConnection.project_id ?? "");
    const userInfo = await slackService.getUserInfo(data.event.user);
    const issueId = eConnection.entity_slug ?? eConnection.issue_id;

    const planeUser = members.find((member) => member.email === userInfo?.user.profile.email);

    const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);

    const parser = getSlackContentParser({
      userMap,
      teamDomain: workspaceConnection.connection_slug ?? "",
    });

    const richTextElements = extractRichTextElements(data.event.text, data.event.blocks);
    const richText = richTextBlockToMrkdwn({
      type: "rich_text",
      elements: richTextElements,
    });
    let parsedDescription = await parser.toPlaneHtml(richText ?? "<p></p>");

    // Add a simple line in the bottom of the comment, mentioneding `Commented from Slack
    parsedDescription = `<div>${parsedDescription}<div class="py-4 border-custom-border-400" data-type="horizontalRule"></div><span data-text-color="gray">Synced from Slack</span></div>`;

    await planeClient.issueComment.create(
      workspaceConnection.workspace_slug,
      eConnection.project_id ?? "",
      issueId ?? "",
      {
        comment_html: parsedDescription,
        external_source: "SLACK_COMMENT",
        external_id: data.event.event_ts,
        created_by: planeUser?.id,
      }
    );
  }
};

export const handleLinkSharedEvent = async (data: SlackEventPayload) => {
  if (data.event.type === "link_shared") {
    const details = await getConnectionDetails(data.team_id, {
      id: data.event.user,
    });
    if (!details) {
      logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
      return;
    }

    const { workspaceConnection, planeClient, slackService } = details;

    const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);

    const unfurlMap: UnfurlMap = {};

    await Promise.all(
      data.event.links.map(async (link) => {
        const resource = extractPlaneResource(link.url);
        if (resource === null) return;

        if (resource.type === "issue") {
          if (resource.workspaceSlug !== workspaceConnection.workspace_slug) return;

          const issue = await planeClient.issue.getIssueByIdentifierWithFields(
            workspaceConnection.workspace_slug,
            resource.projectIdentifier,
            Number(resource.issueKey),
            ["state", "project", "assignees", "labels", "type", "created_by", "updated_by"],
            true
          );

          const enhancedUserMap = await enhanceUserMapWithSlackLookup({
            planeUsers: issue.assignees,
            currentUserMap: userMap,
            slackService,
          });

          const hideActions = issue.type?.is_epic ?? false;

          const linkBack = createSlackLinkback(
            workspaceConnection.workspace_slug,
            issue,
            enhancedUserMap,
            false,
            hideActions,
            true
          );
          unfurlMap[link.url] = {
            blocks: linkBack.blocks,
          };
        } else if (resource.type === "page") {
          const linkBack = await getPageLinkback(resource, details);
          if (!linkBack) return;
          unfurlMap[link.url] = {
            blocks: linkBack.blocks,
          };
        } else {
          const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, resource.projectId);
          const members = await planeClient.users.list(workspaceConnection.workspace_slug, resource.projectId);
          if (resource.type === "project") {
            const projectLinkback = createProjectLinkback(
              workspaceConnection.workspace_slug,
              project,
              members,
              userMap,
              true
            );
            unfurlMap[link.url] = {
              blocks: projectLinkback.blocks,
            };
          } else if (resource.type === "cycle") {
            const cycle = await planeClient.cycles.getCycle(
              workspaceConnection.workspace_slug,
              resource.projectId,
              resource.cycleId
            );

            const linkBack = createCycleLinkback(workspaceConnection.workspace_slug, project, cycle);
            unfurlMap[link.url] = {
              blocks: linkBack.blocks,
            };
          } else if (resource.type === "module") {
            const module = await planeClient.modules.getModule(
              workspaceConnection.workspace_slug,
              resource.projectId,
              resource.moduleId
            );

            const moduleLinkback = createModuleLinkback(workspaceConnection.workspace_slug, project, module);
            unfurlMap[link.url] = {
              blocks: moduleLinkback.blocks,
            };
          }
        }
      })
    );

    if (Object.keys(unfurlMap).length > 0) {
      const unfurlResponse = await slackService.unfurlLink(data.event.channel, data.event.message_ts, unfurlMap);
      logger.info(`[SLACK] Unfurl response`, { unfurlResponse });
    }
  }
};

export const getPageLinkback = async (
  pageResource: PageResource,
  details: TSlackConnectionDetails
): Promise<UnfurlBlock | undefined> => {
  const { workspaceConnection, planeClient } = details;

  let page: ExPage | undefined;
  let pageURL = "";

  switch (pageResource.subType) {
    case PageSubType.PUBLISHED:
      page = await planeClient.page.getPublishedPage(pageResource.pageId);
      pageURL = getPublishedPageUrl(pageResource.pageId);
      break;
    case PageSubType.WIKI:
      if (pageResource.workspaceSlug !== workspaceConnection.workspace_slug) {
        logger.error(`[SLACK] Workspace slug mismatch for page`, { pageResource });
        return;
      }
      page = await planeClient.page.getWorkspacePage(workspaceConnection.workspace_slug, pageResource.pageId);
      pageURL = getWorkspacePageUrl(workspaceConnection.workspace_slug, pageResource.pageId);
      break;
    case PageSubType.PROJECT:
      if (!pageResource.projectId) {
        logger.error(`[SLACK] No project ID found for page`, { pageResource });
        return;
      }
      page = await planeClient.page.getProjectPage(
        workspaceConnection.workspace_slug,
        pageResource.projectId,
        pageResource.pageId
      );
      pageURL = getProjectPageUrl(workspaceConnection.workspace_slug, pageResource.projectId, pageResource.pageId);
      break;
    default:
      logger.error(`[SLACK] Unknown page sub type`, { pageResource });
      return;
  }

  if (!page) {
    logger.error(`[SLACK] No page found`, { pageResource });
    return;
  }

  const linkBack = createPageLinkback(page, pageURL);
  return linkBack;
};
