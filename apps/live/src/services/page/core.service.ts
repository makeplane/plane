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

import type { AxiosError } from "axios";
import { logger } from "@plane/logger";
import type { TDocumentPayload, TPage } from "@plane/types";
// services
import { AppError } from "@/lib/errors";
import { APIService } from "../api.service";

/**
 * Type guard to check if an error is an Axios error with a response
 */
function isAxiosErrorWithResponse(
  error: unknown
): error is AxiosError & { response: NonNullable<AxiosError["response"]> } {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as AxiosError).response === "object" &&
    (error as AxiosError).response !== null
  );
}

export type TPageDescriptionPayload = {
  description_binary: string;
  description_html: string;
  description: object;
};

export type TEditorWorkItemMention = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  type_id: string | null;
  project__identifier: string;
  state__group: string;
  state__name: string;
  state__color: string;
};

export type TEditorWorkItemEmbed = TEditorWorkItemMention & {
  priority: string | null;
};

export type TUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};

export type TPageEmbed = {
  id: string;
  name: string;
  project_id?: string;
  teamspace_id?: string;
};

export type TPageFetchMetadata = {
  page_id: string;
  workspace_slug: string;
  work_item_embeds: TEditorWorkItemEmbed[];
  work_item_mentions: TEditorWorkItemMention[];
  user_mentions: TUserMention[];
  page_embeds: TPageEmbed[];
};

export abstract class PageCoreService extends APIService {
  protected abstract basePath: string;

  constructor() {
    super();
  }

  async fetchDetails(pageId: string): Promise<TPage> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/`, {
        headers: this.getHeader(),
      });
      return response?.data as TPage;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchDetails", pageId },
      });
      logger.error("Failed to fetch page details", appError);
      throw appError;
    }
  }

  async fetchDescriptionBinary(pageId: string): Promise<Buffer> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/description/`, {
        headers: {
          ...this.getHeader(),
          "Content-Type": "application/octet-stream",
        },
        responseType: "arraybuffer",
      });
      const data = response?.data;
      if (!Buffer.isBuffer(data)) {
        throw new Error("Expected response to be a Buffer");
      }
      return data;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchDescriptionBinary", pageId },
      });
      logger.error("Failed to fetch page description binary", appError);
      throw appError;
    }
  }

  /**
   * Updates the title of a page
   */
  async updatePageProperties(
    pageId: string,
    params: { data: Partial<TPage>; abortSignal?: AbortSignal }
  ): Promise<TPage> {
    const { data, abortSignal } = params;

    // Early abort check
    if (abortSignal?.aborted) {
      throw new AppError(new DOMException("Aborted", "AbortError"));
    }

    // Create an abort listener that will reject the pending promise
    let abortListener: (() => void) | undefined;
    const abortPromise = new Promise((_, reject) => {
      if (abortSignal) {
        abortListener = () => {
          reject(new AppError(new DOMException("Aborted", "AbortError")));
        };
        abortSignal.addEventListener("abort", abortListener);
      }
    });

    try {
      return await Promise.race([
        this.patch(`${this.basePath}/pages/${pageId}/`, data, {
          headers: this.getHeader(),
          signal: abortSignal,
        })
          .then((response) => response?.data)
          .catch((error) => {
            const appError = new AppError(error, {
              context: { operation: "updatePageProperties", pageId },
            });

            if (appError.code === "ABORT_ERROR") {
              throw appError;
            }

            logger.error("Failed to update page properties", appError);
            throw appError;
          }),
        abortPromise,
      ]);
    } finally {
      // Clean up abort listener
      if (abortSignal && abortListener) {
        abortSignal.removeEventListener("abort", abortListener);
      }
    }
  }

  async updateDescriptionBinary(pageId: string, data: TDocumentPayload): Promise<unknown> {
    try {
      const response = await this.patch(`${this.basePath}/pages/${pageId}/description/`, data, {
        headers: this.getHeader(),
      });
      return response?.data as unknown;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "updateDescriptionBinary", pageId },
      });
      logger.error("Failed to update page description binary", appError);
      throw appError;
    }
  }

  /**
   * Fetches work item embeds for a page
   * @param workspaceSlug - The workspace slug
   * @param pageId - The page ID
   * @param embedType - Type of embed to fetch (default: "issue")
   * @returns Array of work item embeds
   */
  async fetchEmbeds(
    _workspaceSlug: string,
    pageId: string,
    embedType: string = "issue"
  ): Promise<TEditorWorkItemEmbed[]> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/embeds/`, {
        headers: this.getHeader(),
        params: {
          embed_type: embedType,
        },
      });
      return (response?.data as TEditorWorkItemEmbed[]) ?? [];
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchEmbeds", pageId, embedType },
      });
      logger.error("Failed to fetch page embeds", appError);
      throw appError;
    }
  }

  /**
   * Fetches mentions for a page (issue mentions or user mentions)
   * @param workspaceSlug - The workspace slug
   * @param pageId - The page ID
   * @param mentionType - Type of mention to fetch (default: "issue_mention")
   * @returns Array of work item mentions
   */
  async fetchMentions(
    _workspaceSlug: string,
    pageId: string,
    mentionType: string = "issue_mention"
  ): Promise<TEditorWorkItemMention[]> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/mentions/`, {
        headers: this.getHeader(),
        params: {
          mention_type: mentionType,
        },
      });
      return (response?.data as TEditorWorkItemMention[]) ?? [];
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchMentions", pageId, mentionType },
      });
      logger.error("Failed to fetch page mentions", appError);
      throw appError;
    }
  }

  /**
   * Fetches workspace members for resolving user mentions
   * @param workspaceSlug - The workspace slug
   * @returns Array of workspace members with id and display_name
   */
  async fetchWorkspaceMembers(workspaceSlug: string): Promise<TUserMention[]> {
    try {
      const response = await this.get(`/api/workspaces/${workspaceSlug}/members/`, {
        headers: this.getHeader(),
      });
      // Transform workspace member response to TUserMention format
      const members =
        (response?.data as Array<{ member?: { id?: string; display_name?: string; avatar_url?: string } }>) || [];
      return members
        .filter((member): member is { member: { id: string; display_name: string; avatar_url?: string } } =>
          Boolean(member.member?.id && member.member?.display_name)
        )
        .map((member) => ({
          id: member.member.id,
          display_name: member.member.display_name,
          avatar_url: member.member.avatar_url,
        }));
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchWorkspaceMembers", workspaceSlug },
      });
      logger.error("Failed to fetch workspace members", appError);
      throw appError;
    }
  }

  /**
   * Resolves an image asset ID to its actual URL by following the 302 redirect
   * @param workspaceSlug - The workspace slug
   * @param assetId - The asset UUID
   * @param projectId - Optional project ID for project-specific assets
   * @returns The resolved image URL (presigned S3 URL)
   */
  async resolveImageAssetUrl(
    workspaceSlug: string,
    assetId: string,
    projectId?: string | null
  ): Promise<string | null> {
    const assetPath = projectId
      ? `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/server/`
      : `/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/server/`;

    try {
      logger.debug("Resolving image asset URL", {
        assetId,
        workspaceSlug,
        projectId: projectId ?? "(workspace-level)",
        assetPath,
      });

      const response = await this.get(assetPath, {
        headers: this.getHeader(),
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      });
      if (response.status === 302 || response.status === 301) {
        const resolvedUrl = response.headers?.location || null;
        logger.debug("Image asset URL resolved", {
          assetId,
          resolvedUrl: resolvedUrl ? `${resolvedUrl.substring(0, 80)}...` : null,
        });
        return resolvedUrl;
      }
      logger.warn("Unexpected response status when resolving asset URL", {
        assetId,
        status: response.status,
        assetPath,
      });
      return null;
    } catch (error) {
      if (isAxiosErrorWithResponse(error)) {
        const { status, headers } = error.response;
        if (status === 302 || status === 301) {
          const resolvedUrl = (headers?.location as string) || null;
          logger.debug("Image asset URL resolved (from redirect error)", {
            assetId,
            resolvedUrl: resolvedUrl ? `${resolvedUrl.substring(0, 80)}...` : null,
          });
          return resolvedUrl;
        }
        logger.error("Failed to resolve image asset URL", {
          assetId,
          workspaceSlug,
          projectId: projectId ?? "(workspace-level)",
          assetPath,
          status,
          error: error.message,
        });
        return null;
      }
      logger.error("Failed to resolve image asset URL", {
        assetId,
        workspaceSlug,
        projectId: projectId ?? "(workspace-level)",
        assetPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Resolves multiple image asset IDs to their actual URLs
   * @param workspaceSlug - The workspace slug
   * @param assetIds - Array of asset UUIDs
   * @param projectId - Optional project ID for project-specific assets
   * @returns Map of assetId to resolved URL
   */
  async resolveImageAssetUrls(
    workspaceSlug: string,
    assetIds: string[],
    projectId?: string | null
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    // Resolve all asset URLs in parallel
    const results = await Promise.allSettled(
      assetIds.map(async (assetId) => {
        const url = await this.resolveImageAssetUrl(workspaceSlug, assetId, projectId);
        return { assetId, url };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.url) {
        urlMap.set(result.value.assetId, result.value.url);
      }
    }

    return urlMap;
  }

  /**
   * Fetches all page metadata (embeds, mentions, user mentions, page embeds) in a single API call
   * @param workspaceSlug - The workspace slug
   * @param pageId - The page ID
   * @param projectId - Optional project ID for project pages
   * @param teamspaceId - Optional teamspace ID for teamspace pages
   * @returns Combined page metadata
   */
  async fetchPageMetadata(
    workspaceSlug: string,
    pageId: string,
    projectId?: string | null,
    teamspaceId?: string | null
  ): Promise<TPageFetchMetadata> {
    try {
      const params: Record<string, string> = {};
      if (projectId) params.project_id = projectId;
      if (teamspaceId) params.team_space_id = teamspaceId;

      const response = await this.get(`/api/workspaces/${workspaceSlug}/pages/${pageId}/fetch-metadata/`, {
        headers: this.getHeader(),
        params,
      });
      return response?.data as TPageFetchMetadata;
    } catch (error) {
      const appError = new AppError(error, {
        context: { operation: "fetchPageMetadata", pageId, workspaceSlug },
      });
      logger.error("Failed to fetch page metadata", appError);
      throw appError;
    }
  }
}
