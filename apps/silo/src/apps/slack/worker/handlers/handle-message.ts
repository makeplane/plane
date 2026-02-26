/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { PageResource, SlackEventPayload, UnfurlBlock, UnfurlMap } from "@plane/etl/slack";
import { PageSubType } from "@plane/etl/slack";
import { logger } from "@plane/logger";
import type { ExPage } from "@plane/sdk";
import { CONSTANTS } from "@/helpers/constants";
import {
  getProfileConnectionPageUrl,
  getProjectPageUrl,
  getPublishedPageUrl,
  getWorkspacePageUrl,
} from "@/helpers/urls";
import { getAPIClient } from "@/services/client";
import { getConnectionDetails } from "../../helpers/connection-details";
import { getSlackContentParser } from "../../helpers/content-parser";
import { extractRichTextElements, richTextBlockToMrkdwn } from "../../helpers/parse-issue-form";
import { extractPlaneResource } from "../../helpers/parse-plane-resources";
import { enhanceUserMapWithSlackLookup, getSlackToPlaneUserMapFromWC } from "../../helpers/user";
import slackConnectionService from "../../services/connection.service";
import type { TSlackConnectionDetails } from "../../types/types";
import { createCycleLinkback } from "../../views/cycle-linkback";
import { createModuleLinkback } from "../../views/module-linkback";
import { createPageLinkback } from "../../views/page-linkback";
import { createProjectLinkback } from "../../views/project-linkback";
import { handleAppMentionEvent } from "./message-handlers/app-mention";
import { getIssueWorkObjectService } from "../../services/workobjects/issues";
import type { TWorkObjectView } from "../../types/workobjects";
import { getPlaneFeatureFlagService } from "@/helpers/plane-api-client";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { createSlackLinkback } from "../../views/issue-linkback";

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
      case "app_uninstalled":
        await handleAppUninstallEvent(data);
        break;
      case "app_mention":
        await handleAppMentionEvent(data);
        break;
      case "entity_details_requested":
        await handleEntityDetailsRequestedEvent(data);
        break;
      default:
        break;
    }
  } catch (error: unknown) {
    if (data.event.type === "app_uninstalled") {
      logger.error("[SLACK] App uninstalled event", { data });
      return;
    }
    const details = await getConnectionDetails(data.team_id, {
      id: data.event.user,
    });
    if (!details) {
      logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
      return;
    }

    const { slackService } = details;

    const errorObj = error as Record<string, unknown> | undefined;
    const isPermissionError =
      typeof errorObj?.detail === "string" && errorObj.detail.includes(CONSTANTS.NO_PERMISSION_ERROR);
    const errorMessage = isPermissionError ? CONSTANTS.NO_PERMISSION_ERROR_MESSAGE : CONSTANTS.SOMETHING_WENT_WRONG;

    await slackService.sendEphemeralMessage(data.event.user, errorMessage, data.event.channel, data.event.event_ts);

    if (!isPermissionError) {
      throw error;
    }
  }
};

export const handleEntityDetailsRequestedEvent = async (data: SlackEventPayload) => {
  if (data.event.type !== "entity_details_requested")
    throw new Error(`Assertion Failed, expected "entity_details_requested" event, received ${data.event.type}`);
  const teamId = data.team_id;
  const userId = data.event.user;

  const details = await getConnectionDetails(teamId, {
    id: userId,
  });

  if (!details) {
    logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
    return;
  }

  const { slackService, missingUserCredentials } = details;

  if (missingUserCredentials) {
    // If we are missing user credentials, we'll show the user unauthenticated, and ask to connect account first
    const authUrl = getProfileConnectionPageUrl(
      details.workspaceConnection.workspace_slug,
      details.workspaceConnection.workspace_id
    );

    const response: unknown = await slackService.entityPresentDetails(data.event.trigger_id, {
      userAuthRequired: true,
      userAuthUrl: authUrl,
    });

    logger.info("Missing user credentials for presenting user details", response);
    return;
  }

  const workItemUrl = data.event.link.url;

  // Extract issue identifier from URL (e.g., "HEYTHERE-1" from URL with or without trailing slash)
  const urlParts = workItemUrl.replace(/\/$/, "").split("/");
  const issueIdentifier = urlParts[urlParts.length - 1];

  // Split issue identifier into project identifier and sequence (e.g., "HEYTHERE-1" -> "HEYTHERE" and 1)
  const dashIndex = issueIdentifier.lastIndexOf("-");
  const projectIdentifier = issueIdentifier.substring(0, dashIndex);
  const issueSequence = parseInt(issueIdentifier.substring(dashIndex + 1), 10);

  try {
    const issueWorkObjectService = getIssueWorkObjectService("DETAILED", teamId, userId);
    const workObject = await issueWorkObjectService.getWorkObject({
      strategy: "sequence",
      projectIdentifier: projectIdentifier,
      issueSequence: issueSequence,
    });

    logger.info("Presented Work Object", workObject);

    const response: unknown = await slackService.entityPresentDetails(data.event.trigger_id, {
      metadata: workObject,
    });

    logger.info("Detailed Presented to Slack", response);
  } catch (error: unknown) {
    const errorObj = error as Record<string, unknown> | undefined;
    const errorString = errorObj?.detail || errorObj?.error;

    if (errorString && typeof errorString === "string") {
      const response: unknown = await slackService.entityPresentDetails(data.event.trigger_id, {
        error: {
          custom_title: "Woops, an error occured",
          custom_message: errorString,
          status: "custom",
        },
      });

      logger.error("Error response posted", response, error);
    } else {
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
      slackService,
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
    parsedDescription = `<div>${parsedDescription}<div class="py-4 border-strong-1" data-type="horizontalRule"></div><span data-text-color="gray">Synced from Slack</span></div>`;

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

    const userId = data.event.user;
    if (!details) {
      logger.info(`[SLACK] No connection details found for team ${data.team_id}`);
      return;
    }

    const { workspaceConnection, planeClient, slackService } = details;

    const userMap = getSlackToPlaneUserMapFromWC(workspaceConnection);

    const unfurlMap: UnfurlMap = {};
    const metadataEntities: TWorkObjectView[] = [];

    let workObjectEnabled = false;

    try {
      const featureFlagService = await getPlaneFeatureFlagService();
      const planeUserId = userMap.get(userId);

      const featureFlagResponse = await featureFlagService.featureFlags({
        workspace_slug: workspaceConnection.workspace_slug,
        flag_key: E_FEATURE_FLAGS.SLACK_WORK_OBJECTS,
        user_id: planeUserId || "",
      });

      workObjectEnabled = featureFlagResponse || false;
    } catch (error) {
      logger.error("Work Object feature flag error", error);
    }

    await Promise.all(
      data.event.links.map(async (link) => {
        const resource = extractPlaneResource(link.url);
        if (resource === null) return;

        if (resource.type === "issue") {
          if (resource.workspaceSlug !== workspaceConnection.workspace_slug) return;

          if (workObjectEnabled) {
            /* ----------------- Work Object Creation --------------------- */
            const issueWorkObjectService = getIssueWorkObjectService("MINIMAL", data.team_id, userId);
            const workObject = await issueWorkObjectService.getWorkObject({
              strategy: "sequence",
              projectIdentifier: resource.projectIdentifier,
              issueSequence: Number(resource.issueKey),
              appUnfurlUrl: link.url,
            });

            // Push the work object inside the metadata entity
            metadataEntities.push(workObject);
          } else {
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
          }
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

    if (Object.keys(unfurlMap).length > 0 || metadataEntities.length > 0) {
      const unfurlResponse: unknown = await slackService.unfurlLink(
        data.event.channel,
        data.event.message_ts,
        unfurlMap,
        {
          /*
        Note: here we are typecasting as, when we are creating work object, it provides us with app_unfurl_url as optional
        as we can use work object for sending notifications as well, there `app_unfurl_url` need not be present.
        */
          entities: metadataEntities as { app_unfurl_url: string }[],
        }
      );
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

/**
 * Slack App Uninstalled Event. We need to handle this event and disconnect slack integration
 * on Plane side.
 * @param data
 */
export const handleAppUninstallEvent = async (data: SlackEventPayload) => {
  await slackConnectionService.disconnectAppWithTeamId(data.team_id);
};
