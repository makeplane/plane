/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// types
import { logger } from "@plane/logger";
import type { IUser } from "@plane/types";
// services
import { AppError } from "@/lib/errors";
import { APIService } from "@/services/api.service";

export class UserService extends APIService {
  currentUserConfig() {
    return {
      url: `${this.baseURL}/api/users/me/`,
    };
  }

  async currentUser(cookie: string): Promise<IUser> {
    return this.get("/api/users/me/", {
      headers: {
        Cookie: cookie,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "currentUser" },
        });
        logger.error("Failed to fetch current user", appError);
        throw appError;
      });
  }

  /**
   * Asks Django whether the cookie's user may open a page, and returns the page's project and whether the user
   * may only read it. Rejects (404) when they may not. Both ids go into the URL path: the slug is encoded, and
   * the page id must be a UUID.
   */
  async getPageAccess(
    cookie: string,
    workspaceSlug: string,
    pageId: string,
    action: "view" | "edit" = "view"
  ): Promise<{ project_id: string; read_only?: boolean }> {
    if (
      typeof workspaceSlug !== "string" ||
      // Older slugs predate the [\w-] rule (some hold dots), so refuse only what could change the path.
      !/^(?!\.{1,2}$)[^/\\?#%\p{Cc}]+$/u.test(workspaceSlug) ||
      typeof pageId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pageId)
    ) {
      throw new AppError("Invalid workspace slug or page id", { code: "INVALID_PAGE_REFERENCE" });
    }
    return this.get(`/api/workspaces/${encodeURIComponent(workspaceSlug)}/pages/${pageId}/live-access/`, {
      headers: { Cookie: cookie },
      params: { action },
    }).then((response) => response?.data);
  }
}
