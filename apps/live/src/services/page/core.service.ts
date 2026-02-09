import type { AxiosError } from "axios";
import { logger } from "@plane/logger";
import type { TPage } from "@plane/types";
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
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true &&
    "response" in error &&
    (error as AxiosError).response !== undefined
  );
}

export type TUserMention = {
  id: string;
  display_name: string;
  avatar_url?: string;
};

export type TPageDescriptionPayload = {
  description_binary: string;
  description_html: string;
  description: object;
};

export abstract class PageCoreService extends APIService {
  protected abstract basePath: string;

  constructor() {
    super();
  }

  async fetchDetails(pageId: string): Promise<TPage> {
    return this.get(`${this.basePath}/pages/${pageId}/`, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "fetchDetails", pageId },
        });
        logger.error("Failed to fetch page details", appError);
        throw appError;
      });
  }

  async fetchDescriptionBinary(pageId: string): Promise<any> {
    return this.get(`${this.basePath}/pages/${pageId}/description/`, {
      headers: {
        ...this.getHeader(),
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "fetchDescriptionBinary", pageId },
        });
        logger.error("Failed to fetch page description binary", appError);
        throw appError;
      });
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

  async updateDescriptionBinary(pageId: string, data: TPageDescriptionPayload): Promise<any> {
    return this.patch(`${this.basePath}/pages/${pageId}/description/`, data, {
      headers: this.getHeader(),
    })
      .then((response) => response?.data)
      .catch((error) => {
        const appError = new AppError(error, {
          context: { operation: "updateDescriptionBinary", pageId },
        });
        logger.error("Failed to update page description binary", appError);
        throw appError;
      });
  }

  /**
   * Fetches user mentions for a page
   * @param pageId - The page ID
   * @returns Array of user mentions
   */
  async fetchUserMentions(pageId: string): Promise<TUserMention[]> {
    try {
      const response = await this.get(`${this.basePath}/pages/${pageId}/user-mentions/`, {
        headers: this.getHeader(),
      });
      return (response?.data as TUserMention[]) || [];
    } catch (error) {
      logger.warn("Failed to fetch user mentions", {
        pageId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Resolves an image asset ID to its actual URL (presigned URL)
   * @param workspaceSlug - The workspace slug
   * @param assetId - The asset UUID
   * @param projectId - Optional project ID for project-specific assets
   * @param apiBaseUrl - Optional API base URL for generating correct presigned URLs
   * @returns The resolved URL or null if resolution fails
   */
  async resolveImageAssetUrl(
    workspaceSlug: string,
    assetId: string,
    projectId?: string | null,
    apiBaseUrl?: string
  ): Promise<string | null> {
    const assetPath = projectId
      ? `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/?disposition=inline`
      : `/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/?disposition=inline`;

    try {
      logger.debug("Resolving image asset URL", {
        assetId,
        workspaceSlug,
        projectId: projectId ?? "(workspace-level)",
        assetPath,
        apiBaseUrl: apiBaseUrl ?? "(default)",
      });

      // If apiBaseUrl is provided and non-empty, use fetch directly to that URL
      // This ensures the API sees the public host and generates correct presigned URLs
      if (apiBaseUrl && apiBaseUrl.trim() !== "") {
        const fullUrl = `${apiBaseUrl.replace(/\/$/, "")}${assetPath}`;
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: this.getHeader(),
          redirect: "manual",
        });

        if (response.status === 302 || response.status === 301) {
          const resolvedUrl = response.headers.get("location");
          logger.debug("Image asset URL resolved (via apiBaseUrl)", {
            assetId,
            resolvedUrl: resolvedUrl ? `${resolvedUrl.substring(0, 80)}...` : null,
          });
          return resolvedUrl;
        }
        logger.warn("Unexpected response status when resolving asset URL", {
          assetId,
          status: response.status,
          fullUrl,
        });
        return null;
      }

      // Fallback to axios-based request using internal API_BASE_URL
      const path = projectId
        ? `/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/?disposition=inline`
        : `/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/?disposition=inline`;
      const response = await this.get(path, {
        headers: this.getHeader(),
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      });
      // If we get a 302, the Location header contains the presigned URL
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
        apiPath: path,
      });
      return null;
    } catch (error) {
      // Axios throws on 3xx when maxRedirects is 0, so we need to handle the redirect from the error
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
}
