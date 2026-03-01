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

import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
import type { TEditorWorkItemEmbed, TEditorWorkItemMention } from "./core.service";
import { PageService } from "./extended.service";

type TeamspacePageServiceParams = {
  workspaceSlug: string | null;
  teamspaceId: string | null;
  cookie: string | null;
  [key: string]: unknown;
};
export class TeamspacePageService extends PageService {
  protected basePath: string;
  private workspaceSlug: string;
  private teamspaceId: string;

  constructor(params: TeamspacePageServiceParams) {
    super();
    const { workspaceSlug, teamspaceId } = params;
    if (!workspaceSlug || !teamspaceId) throw new AppError("Missing required fields.");
    // validate cookie
    if (!params.cookie) throw new AppError("Cookie is required.");
    // set cookie
    this.setHeader("Cookie", params.cookie);
    // store for API calls
    this.workspaceSlug = workspaceSlug;
    this.teamspaceId = teamspaceId;
    // set base path
    this.basePath = `/api/workspaces/${workspaceSlug}/teamspaces/${teamspaceId}`;
  }

  /**
   * Fetches work item embeds for a teamspace page
   * Uses workspace-level endpoint with teamspace_id query param
   */
  async fetchEmbeds(
    _workspaceSlug: string,
    pageId: string,
    embedType: string = "issue"
  ): Promise<TEditorWorkItemEmbed[]> {
    return this.get(`/api/workspaces/${this.workspaceSlug}/pages/${pageId}/embeds/`, {
      headers: this.getHeader(),
      params: {
        teamspace_id: this.teamspaceId,
        embed_type: embedType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "fetchEmbeds", pageId, embedType },
        });
        logger.error("Failed to fetch page embeds", appError);
        throw appError;
      });
  }

  /**
   * Fetches mentions for a teamspace page
   * Uses workspace-level endpoint with teamspace_id query param
   */
  async fetchMentions(
    _workspaceSlug: string,
    pageId: string,
    mentionType: string = "issue_mention"
  ): Promise<TEditorWorkItemMention[]> {
    return this.get(`/api/workspaces/${this.workspaceSlug}/pages/${pageId}/mentions/`, {
      headers: this.getHeader(),
      params: {
        teamspace_id: this.teamspaceId,
        mention_type: mentionType,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "fetchMentions", pageId, mentionType },
        });
        logger.error("Failed to fetch page mentions", appError);
        throw appError;
      });
  }
}
