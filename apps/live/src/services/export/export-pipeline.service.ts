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

import { Context, Duration, Effect, Layer } from "effect";
import sharp from "sharp";
import * as Y from "yjs";
import { getAllDocumentFormatsFromDocumentEditorBinaryData } from "@plane/editor/lib";
import type { ServerAgentManager } from "@/agents/server-agent";
import type { TipTapDocument, ExportMetadata } from "@/lib/export-core";
import { getPageService } from "@/services/page/handler";
import type { TPageFetchMetadata } from "@/services/page/core.service";
import type { TDocumentTypes, HocusPocusServerContext } from "@/types";
import {
  ExportContentFetchError,
  ExportImageProcessingError,
  ExportMetadataFetchError,
  ExportTimeoutError,
} from "@/schema/export";
import { withTimeoutAndRetry, recoverWithDefault, tryAsync, abortableFetch } from "./effect-utils";
import type {
  PageContent,
  MetadataResult,
  ExportInputBase,
  ExportPipelineResult,
  ExportProgressReporter,
} from "./types";

export class LiveDocumentProvider extends Context.Tag("LiveDocumentProvider")<
  LiveDocumentProvider,
  ServerAgentManager
>() {}

export const makeLiveDocumentLayer = (agentManager: ServerAgentManager) =>
  Layer.succeed(LiveDocumentProvider, agentManager);

const readIntEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const IMAGE_CONCURRENCY = readIntEnv("PDF_EXPORT_IMAGE_CONCURRENCY", 4);
const URL_RESOLUTION_CONCURRENCY = readIntEnv("PDF_EXPORT_URL_RESOLUTION_CONCURRENCY", 6);
const IMAGE_TIMEOUT_MS = readIntEnv("PDF_EXPORT_IMAGE_TIMEOUT_MS", 8000);
const METADATA_TIMEOUT_MS = readIntEnv("PDF_EXPORT_METADATA_TIMEOUT_MS", 10000);
const CONTENT_FETCH_TIMEOUT_MS = readIntEnv("PDF_EXPORT_CONTENT_FETCH_TIMEOUT_MS", 15000);
const IMAGE_MAX_DIMENSION = readIntEnv("PDF_EXPORT_IMAGE_MAX_DIMENSION", 1200);

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

const getDocumentType = (input: ExportInputBase): TDocumentTypes => {
  if (input.projectId) return "project_page";
  if (input.teamspaceId) return "teamspace_page";
  return "workspace_page";
};

const extractAssetIds = (doc: TipTapNode): { imageIds: string[]; attachmentIds: string[] } => {
  const imageIds: string[] = [];
  const attachmentIds: string[] = [];

  const traverse = (node: TipTapNode) => {
    if ((node.type === "imageComponent" || node.type === "image") && node.attrs?.src) {
      const src = node.attrs.src as string;
      if (src && !src.startsWith("http") && !src.startsWith("data:")) {
        imageIds.push(src);
      }
    }
    if (node.type === "attachmentComponent" && node.attrs?.id) {
      const id = node.attrs.id as string;
      if (id) {
        attachmentIds.push(id);
      }
    }
    if (node.content) {
      for (const child of node.content) {
        traverse(child);
      }
    }
  };

  traverse(doc);
  return {
    imageIds: [...new Set(imageIds)],
    attachmentIds: [...new Set(attachmentIds)],
  };
};

const fetchFromLiveDocument = (
  pageId: string,
  workspaceSlug: string
): Effect.Effect<PageContent | null, never, LiveDocumentProvider> =>
  Effect.gen(function* () {
    const agentManager = yield* LiveDocumentProvider;
    if (!agentManager.hocuspocusServer) return null;

    const context: Partial<HocusPocusServerContext> = { workspaceSlug };

    return yield* Effect.acquireUseRelease(
      Effect.tryPromise({
        try: () => agentManager.getConnection(pageId, context),
        catch: (cause) => cause,
      }),
      ({ connection }) =>
        Effect.sync(() => {
          let result: PageContent | null = null;

          void connection.transact((doc) => {
            const type = doc.getXmlFragment("default");
            const contentDoc = type.doc;
            if (!contentDoc) return;

            const yjsBinary = Y.encodeStateAsUpdate(contentDoc);
            const { contentJSON, titleHTML } = getAllDocumentFormatsFromDocumentEditorBinaryData(yjsBinary, true);

            result = {
              contentJSON: contentJSON as TipTapDocument,
              titleHTML: titleHTML || null,
            };
          });

          return result;
        }),
      () =>
        Effect.promise(() => agentManager.releaseConnection(pageId)).pipe(
          Effect.tapError((cause) => Effect.logDebug("EXPORT: Failed to release connection", { pageId, cause })),
          Effect.orDie
        )
    ).pipe(
      Effect.tapError((cause) => Effect.logDebug("EXPORT: Live document fetch failed", { pageId, cause })),
      Effect.catchAll(() => Effect.succeed(null))
    );
  });

const fetchPageContent = (
  pageService: ReturnType<typeof getPageService>,
  pageId: string,
  workspaceSlug: string
): Effect.Effect<PageContent, ExportContentFetchError | ExportTimeoutError, LiveDocumentProvider> =>
  Effect.gen(function* () {
    const liveContent = yield* fetchFromLiveDocument(pageId, workspaceSlug);
    if (liveContent) {
      return liveContent;
    }

    const descriptionBinary = yield* tryAsync(
      () => pageService.fetchDescriptionBinary(pageId),
      (cause) =>
        new ExportContentFetchError({
          message: "Failed to fetch page content",
          cause,
        })
    ).pipe(
      withTimeoutAndRetry("fetch page content", {
        timeoutMs: CONTENT_FETCH_TIMEOUT_MS,
        maxRetries: 3,
      })
    );

    if (!descriptionBinary) {
      return yield* Effect.fail(
        new ExportContentFetchError({
          message: "Page content not found",
        })
      );
    }

    const binaryData = new Uint8Array(descriptionBinary);
    const { contentJSON, titleHTML } = getAllDocumentFormatsFromDocumentEditorBinaryData(binaryData, true);

    return {
      contentJSON: contentJSON as TipTapDocument,
      titleHTML: titleHTML || null,
    };
  });

const fetchMetadata = (
  pageService: ReturnType<typeof getPageService>,
  workspaceSlug: string,
  pageId: string,
  projectId: string | undefined,
  teamspaceId: string | undefined
): Effect.Effect<MetadataResult> =>
  Effect.gen(function* () {
    const metadata = yield* tryAsync(
      () => pageService.fetchPageMetadata(workspaceSlug, pageId, projectId, teamspaceId),
      (cause) =>
        new ExportMetadataFetchError({
          message: "Failed to fetch page metadata",
          source: "fetch-metadata",
          cause,
        })
    ).pipe(
      withTimeoutAndRetry("fetch page metadata", { timeoutMs: METADATA_TIMEOUT_MS }),
      recoverWithDefault({
        page_id: pageId,
        workspace_slug: workspaceSlug,
        work_item_embeds: [],
        work_item_mentions: [],
        user_mentions: [],
        page_embeds: [],
      } as TPageFetchMetadata)
    );

    return {
      workItemEmbeds: metadata.work_item_embeds,
      workItemMentions: metadata.work_item_mentions,
      userMentions: metadata.user_mentions,
      pageEmbeds: metadata.page_embeds,
    };
  });

const resolveAssetUrl = (
  pageService: ReturnType<typeof getPageService>,
  workspaceSlug: string,
  assetId: string,
  projectId: string | undefined
): Effect.Effect<readonly [string, string] | null> =>
  Effect.tryPromise({
    try: async () => {
      const url = await pageService.resolveImageAssetUrl?.(workspaceSlug, assetId, projectId);
      return url ? ([assetId, url] as const) : null;
    },
    catch: (cause) => cause,
  }).pipe(
    Effect.tapError((cause) => Effect.logDebug("EXPORT: Failed to resolve asset URL", { assetId, cause })),
    Effect.catchAll(() => Effect.succeed(null))
  );

const resolveAttachmentUrls = (
  pageService: ReturnType<typeof getPageService>,
  workspaceSlug: string,
  projectId: string | undefined,
  attachmentIds: string[]
): Effect.Effect<Record<string, string>> =>
  Effect.gen(function* () {
    if (attachmentIds.length === 0) return {};

    const pairs = yield* Effect.forEach(
      attachmentIds,
      (assetId) => resolveAssetUrl(pageService, workspaceSlug, assetId, projectId),
      { concurrency: URL_RESOLUTION_CONCURRENCY }
    );

    return Object.fromEntries(pairs.filter((p): p is readonly [string, string] => p !== null));
  });

const processImages = (
  pageService: ReturnType<typeof getPageService>,
  workspaceSlug: string,
  projectId: string | undefined,
  imageIds: string[],
  onImageProcessed?: (completed: number, total: number) => void
): Effect.Effect<Record<string, string>> =>
  Effect.gen(function* () {
    if (imageIds.length === 0) return {};

    const resolvedPairs = yield* Effect.forEach(
      imageIds,
      (assetId) => resolveAssetUrl(pageService, workspaceSlug, assetId, projectId),
      { concurrency: URL_RESOLUTION_CONCURRENCY }
    );

    const entries = resolvedPairs.filter((p): p is readonly [string, string] => p !== null);
    if (entries.length === 0) return {};
    const total = entries.length;
    let completed = 0;

    const processSingleImage = ([assetId, url]: readonly [string, string]) =>
      Effect.gen(function* () {
        const response = yield* abortableFetch(url).pipe(
          Effect.mapError(
            (cause) =>
              new ExportImageProcessingError({
                message: "Failed to fetch image",
                assetId,
                url,
                cause,
              })
          )
        );

        if (!response.ok) {
          return yield* Effect.fail(
            new ExportImageProcessingError({
              message: `Image fetch returned ${response.status}`,
              assetId,
              url,
            })
          );
        }

        const arrayBuffer = yield* tryAsync(
          () => response.arrayBuffer(),
          (cause) =>
            new ExportImageProcessingError({
              message: "Failed to read image body",
              assetId,
              cause,
            })
        );

        const processedBuffer = yield* tryAsync(
          () =>
            sharp(Buffer.from(arrayBuffer))
              .rotate()
              .flatten({ background: { r: 255, g: 255, b: 255 } })
              .resize(IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer(),
          (cause) =>
            new ExportImageProcessingError({
              message: "Failed to process image",
              assetId,
              cause,
            })
        );

        const base64 = processedBuffer.toString("base64");
        return [assetId, `data:image/jpeg;base64,${base64}`] as const;
      }).pipe(
        withTimeoutAndRetry(`process image ${assetId}`, {
          timeoutMs: IMAGE_TIMEOUT_MS,
          maxRetries: 1,
        }),
        Effect.tapError((error) =>
          Effect.logWarning("EXPORT: Image processing failed", {
            assetId,
            error,
          })
        ),
        Effect.catchAll(() => Effect.succeed(null as readonly [string, string] | null)),
        Effect.tap(() =>
          Effect.sync(() => {
            completed += 1;
            onImageProcessed?.(completed, total);
          })
        )
      );

    const pairs = yield* Effect.forEach(entries, processSingleImage, {
      concurrency: IMAGE_CONCURRENCY,
    });

    const filtered = pairs.filter((p): p is readonly [string, string] => p !== null);
    return Object.fromEntries(filtered);
  });

const timedStage = <A, E, R>(stage: string, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    const [duration, value] = yield* Effect.timed(effect);
    yield* Effect.logInfo("EXPORT: stage complete", {
      stage,
      ms: Math.round(Duration.toMillis(duration)),
    });
    return value;
  });

const runPipeline = (
  input: ExportInputBase,
  reportProgress?: ExportProgressReporter
): Effect.Effect<ExportPipelineResult, ExportContentFetchError | ExportTimeoutError, LiveDocumentProvider> =>
  Effect.gen(function* () {
    const { pageId, workspaceSlug, projectId, teamspaceId, noAssets, requestId } = input;

    const documentType = getDocumentType(input);
    const pageService = getPageService(documentType, {
      workspaceSlug,
      projectId: projectId || null,
      teamspaceId: teamspaceId || null,
      cookie: input.cookie,
      documentType,
      userId: "",
      parentId: null,
    });

    const content = yield* timedStage("fetchContent", fetchPageContent(pageService, pageId, workspaceSlug));
    const { imageIds, attachmentIds } = extractAssetIds(content.contentJSON as TipTapNode);

    const willProcessImages = !noAssets && imageIds.length > 0;
    const willResolveAttachments = !noAssets && attachmentIds.length > 0;

    if (willProcessImages) {
      reportProgress?.({
        stage: "processing-images",
        progress: 20,
        message: `Processing ${imageIds.length} image${imageIds.length === 1 ? "" : "s"}...`,
      });
    } else if (willResolveAttachments) {
      reportProgress?.({
        stage: "resolving-attachments",
        progress: 25,
        message: "Resolving attachments...",
      });
    } else {
      reportProgress?.({
        stage: "fetching-metadata",
        progress: 30,
        message: "Fetching metadata...",
      });
    }

    // Metadata, images, and attachment-URL resolution are independent — run them in parallel
    // instead of sequentially. On pages with images this typically halves the pre-render stage.
    const metadataEffect = timedStage(
      "fetchMetadata",
      fetchMetadata(pageService, workspaceSlug, pageId, projectId, teamspaceId)
    );
    // Image processing reports per-image so the client sees progress on
    // long-running asset-heavy exports instead of being stuck at one stage.
    const reportImageProgress = reportProgress
      ? (completed: number, total: number) => {
          // Map 0..total → 20..45 so this stage occupies the chunk before render.
          const span = 25;
          const progress = 20 + Math.round((completed / total) * span);
          reportProgress({
            stage: "processing-images",
            progress,
            message: `Processing images (${completed}/${total})`,
          });
        }
      : undefined;
    const imagesEffect = !willProcessImages
      ? Effect.succeed({} as Record<string, string>)
      : timedStage(
          "processImages",
          processImages(pageService, workspaceSlug, projectId, imageIds, reportImageProgress)
        );
    const attachmentsEffect = !willResolveAttachments
      ? Effect.succeed({} as Record<string, string>)
      : timedStage("resolveAttachments", resolveAttachmentUrls(pageService, workspaceSlug, projectId, attachmentIds));

    const [metadataResult, resolvedImages, resolvedAttachments] = yield* Effect.all(
      [metadataEffect, imagesEffect, attachmentsEffect],
      { concurrency: "unbounded" }
    );

    let metadata: MetadataResult = metadataResult;
    if (!noAssets) {
      metadata = { ...metadata, resolvedImageUrls: { ...resolvedImages, ...resolvedAttachments } };
    }

    const baseURL = process.env.WEB_BASE_URL || process.env.APP_BASE_URL || "";
    const resolvedBaseURL = baseURL[baseURL.length - 1] === "/" ? baseURL.slice(0, -1) : baseURL;
    metadata = { ...metadata, baseUrl: resolvedBaseURL, workspaceSlug };

    const documentTitle = input.title || content.titleHTML || "Untitled";

    yield* Effect.logInfo("EXPORT: pipeline summary", {
      requestId,
      pageId,
      imageCount: imageIds.length,
      attachmentCount: attachmentIds.length,
    });

    return {
      contentJSON: content.contentJSON,
      metadata: {
        ...metadata,
        noAssets,
      } as ExportMetadata,
      documentTitle,
      input: input as ExportPipelineResult["input"],
    };
  });

export class ExportPipelineService extends Effect.Service<ExportPipelineService>()("ExportPipelineService", {
  sync: () => ({
    getDocumentType,
    extractAssetIds,
    fetchFromLiveDocument,
    fetchPageContent,
    fetchMetadata,
    resolveAttachmentUrls,
    processImages,
    runPipeline,
  }),
}) {}
