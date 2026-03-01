/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * PDF Export Service - Fat Model pattern with Effect-TS dependency injection
 */

import { Context, Effect, Layer } from "effect";
import sharp from "sharp";
import * as Y from "yjs";
import { getAllDocumentFormatsFromDocumentEditorBinaryData } from "@plane/editor/lib";
import type { ServerAgentManager } from "@/agents/server-agent";
import type { PDFExportMetadata, TipTapDocument } from "@/lib/pdf";
import { renderPlaneDocToPdfBuffer } from "@/lib/pdf";
import { getPageService } from "@/services/page/handler";
import type { TPageFetchMetadata } from "@/services/page/core.service";
import type { TDocumentTypes, HocusPocusServerContext } from "@/types";
import {
  PdfContentFetchError,
  PdfGenerationError,
  PdfImageProcessingError,
  PdfMetadataFetchError,
  PdfTimeoutError,
} from "@/schema/pdf-export";
import { withTimeoutAndRetry, recoverWithDefault, tryAsync } from "./effect-utils";
import type { PdfExportInput, PdfExportResult, PageContent, MetadataResult, TJobStage } from "./types";

export class LiveDocumentProvider extends Context.Tag("LiveDocumentProvider")<
  LiveDocumentProvider,
  ServerAgentManager
>() {}

export const makeLiveDocumentLayer = (agentManager: ServerAgentManager) =>
  Layer.succeed(LiveDocumentProvider, agentManager);

const IMAGE_CONCURRENCY = 4;
const IMAGE_TIMEOUT_MS = 8000;
const METADATA_TIMEOUT_MS = 5000;
const CONTENT_FETCH_TIMEOUT_MS = 7000;
const PDF_RENDER_TIMEOUT_MS = 15000;
const IMAGE_MAX_DIMENSION = 1200;

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
};

/**
 * PDF Export Service - Main business logic for PDF generation
 * Follows the "fat model, lean controller" pattern
 */
export class PdfExportService extends Effect.Service<PdfExportService>()("PdfExportService", {
  sync: () => ({
    /**
     * Determines document type based on input parameters
     */
    getDocumentType: (input: PdfExportInput): TDocumentTypes => {
      if (input.projectId) return "project_page";
      if (input.teamspaceId) return "teamspace_page";
      return "workspace_page";
    },

    /**
     * Extracts image asset IDs from document content
     */
    extractAssetIds: (doc: TipTapNode): { imageIds: string[]; attachmentIds: string[] } => {
      const imageIds: string[] = [];
      const attachmentIds: string[] = [];

      const traverse = (node: TipTapNode) => {
        // Extract image asset IDs
        if ((node.type === "imageComponent" || node.type === "image") && node.attrs?.src) {
          const src = node.attrs.src as string;
          if (src && !src.startsWith("http") && !src.startsWith("data:")) {
            imageIds.push(src);
          }
        }
        // Extract attachment asset IDs
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
    },

    /**
     * Tries to read the document directly from the live Hocuspocus in-memory Yjs doc.
     * Returns null if the document is not currently loaded in memory.
     */
    fetchFromLiveDocument: (
      pageId: string,
      workspaceSlug: string
    ): Effect.Effect<PageContent | null, never, LiveDocumentProvider> =>
      Effect.gen(function* () {
        const agentManager = yield* LiveDocumentProvider;

        return yield* tryAsync(
          async () => {
            if (!agentManager.hocuspocusServer) return null;

            const context: Partial<HocusPocusServerContext> = { workspaceSlug };
            const { connection } = await agentManager.getConnection(pageId, context);

            let result: PageContent | null = null;

            connection.transact((doc) => {
              const type = doc.getXmlFragment("default");
              const contentDoc = type.doc;
              if (!contentDoc) return;

              const yjsBinary = Y.encodeStateAsUpdate(contentDoc);
              const { contentJSON, titleHTML } = getAllDocumentFormatsFromDocumentEditorBinaryData(yjsBinary, true);

              result = {
                contentJSON: contentJSON as TipTapDocument,
                titleHTML: titleHTML || null,
                descriptionBinary: Buffer.from(yjsBinary),
              };
            });

            await agentManager.releaseConnection(pageId);
            return result;
          },
          () => null as unknown as never
        ).pipe(Effect.catchAll(() => Effect.succeed(null)));
      }),

    /**
     * Fetches page content — tries the live in-memory document first,
     * then falls back to fetching description binary from the API.
     */
    fetchPageContent: (
      pageService: ReturnType<typeof getPageService>,
      pageId: string,
      workspaceSlug: string
    ): Effect.Effect<PageContent, PdfContentFetchError | PdfTimeoutError, LiveDocumentProvider | PdfExportService> =>
      Effect.gen(function* () {
        const service = yield* PdfExportService;

        const liveContent = yield* service.fetchFromLiveDocument(pageId, workspaceSlug);
        if (liveContent) {
          return liveContent;
        }

        const descriptionBinary = yield* tryAsync(
          () => pageService.fetchDescriptionBinary(pageId),
          (cause) =>
            new PdfContentFetchError({
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
            new PdfContentFetchError({
              message: "Page content not found",
            })
          );
        }

        const binaryData = new Uint8Array(descriptionBinary);
        const { contentJSON, titleHTML } = getAllDocumentFormatsFromDocumentEditorBinaryData(binaryData, true);

        return {
          contentJSON: contentJSON as TipTapDocument,
          titleHTML: titleHTML || null,
          descriptionBinary,
        };
      }),

    /**
     * Fetches all metadata (embeds, mentions, etc.) in a single API call
     * Uses the combined fetch-metadata endpoint for efficiency
     */
    fetchMetadata: (
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
            new PdfMetadataFetchError({
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
      }),

    /**
     * Resolves attachment URLs (returns presigned URLs directly without processing)
     */
    resolveAttachmentUrls: (
      pageService: ReturnType<typeof getPageService>,
      workspaceSlug: string,
      projectId: string | undefined,
      attachmentIds: string[]
    ): Effect.Effect<Record<string, string>> =>
      Effect.gen(function* () {
        if (attachmentIds.length === 0) {
          return {};
        }

        const resolvedUrlMap = yield* tryAsync(
          async () => {
            const urlMap = new Map<string, string>();
            for (const assetId of attachmentIds) {
              const url = await pageService.resolveImageAssetUrl?.(workspaceSlug, assetId, projectId);
              if (url) urlMap.set(assetId, url);
            }
            return urlMap;
          },
          () => new Map<string, string>()
        ).pipe(recoverWithDefault(new Map<string, string>()));

        return Object.fromEntries(resolvedUrlMap.entries());
      }),

    /**
     * Resolves and processes images for PDF embedding
     */
    processImages: (
      pageService: ReturnType<typeof getPageService>,
      workspaceSlug: string,
      projectId: string | undefined,
      imageIds: string[]
    ): Effect.Effect<Record<string, string>> =>
      Effect.gen(function* () {
        if (imageIds.length === 0) {
          return {};
        }

        const resolvedUrlMap = yield* tryAsync(
          async () => {
            const urlMap = new Map<string, string>();
            for (const assetId of imageIds) {
              const url = await pageService.resolveImageAssetUrl?.(workspaceSlug, assetId, projectId);
              if (url) urlMap.set(assetId, url);
            }
            return urlMap;
          },
          () => new Map<string, string>()
        ).pipe(recoverWithDefault(new Map<string, string>()));

        if (resolvedUrlMap.size === 0) {
          return {};
        }

        // Process each image
        const processSingleImage = ([assetId, url]: [string, string]) =>
          Effect.gen(function* () {
            const response = yield* tryAsync(
              () => fetch(url),
              (cause) =>
                new PdfImageProcessingError({
                  message: "Failed to fetch image",
                  assetId,
                  url,
                  cause,
                })
            );

            if (!response.ok) {
              return yield* Effect.fail(
                new PdfImageProcessingError({
                  message: `Image fetch returned ${response.status}`,
                  assetId,
                  url,
                })
              );
            }

            const arrayBuffer = yield* tryAsync(
              () => response.arrayBuffer(),
              (cause) =>
                new PdfImageProcessingError({
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
                new PdfImageProcessingError({
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
              Effect.logWarning("PDF_EXPORT: Image processing failed", {
                assetId,
                error,
              })
            ),
            Effect.catchAll(() => Effect.succeed(null as readonly [string, string] | null))
          );

        const entries = Array.from(resolvedUrlMap.entries());
        const pairs = yield* Effect.forEach(entries, processSingleImage, {
          concurrency: IMAGE_CONCURRENCY,
        });

        const filtered = pairs.filter((p): p is readonly [string, string] => p !== null);
        return Object.fromEntries(filtered);
      }),

    /**
     * Renders document to PDF buffer
     */
    renderPdf: (
      contentJSON: TipTapDocument,
      metadata: PDFExportMetadata,
      options: {
        title?: string;
        author?: string;
        subject?: string;
        pageSize?: "A4" | "A3" | "A2" | "LETTER" | "LEGAL" | "TABLOID";
        pageOrientation?: "portrait" | "landscape";
        noAssets?: boolean;
      }
    ): Effect.Effect<Buffer, PdfGenerationError | PdfTimeoutError> =>
      Effect.gen(function* () {
        const pdfBuffer = yield* tryAsync(
          () =>
            renderPlaneDocToPdfBuffer(contentJSON, {
              title: options.title,
              author: options.author,
              subject: options.subject,
              pageSize: options.pageSize,
              pageOrientation: options.pageOrientation,
              metadata,
              noAssets: options.noAssets,
            }),
          (cause) => {
            // Extract meaningful error information since Error objects don't serialize well
            const errorMessage =
              cause instanceof Error
                ? `${cause.name}: ${cause.message}${cause.stack ? `\n${cause.stack}` : ""}`
                : String(cause);
            return new PdfGenerationError({
              message: `Failed to render PDF: ${errorMessage}`,
              cause: cause instanceof Error ? { name: cause.name, message: cause.message, stack: cause.stack } : cause,
            });
          }
        ).pipe(withTimeoutAndRetry("render PDF", { timeoutMs: PDF_RENDER_TIMEOUT_MS, maxRetries: 0 }));

        return pdfBuffer;
      }),
  }),
}) {}

/**
 * Main export pipeline - orchestrates the entire PDF export process
 * Separate function to avoid circular dependency in service definition
 */
export const exportToPdf = (
  input: PdfExportInput
): Effect.Effect<
  PdfExportResult,
  PdfContentFetchError | PdfGenerationError | PdfTimeoutError,
  PdfExportService | LiveDocumentProvider
> =>
  Effect.gen(function* () {
    const service = yield* PdfExportService;
    const { pageId, workspaceSlug, projectId, teamspaceId, noAssets } = input;

    const reportProgress = (stage: TJobStage, progress: number, message: string) =>
      Effect.sync(() => {
        input.onProgress?.({
          jobId: input.requestId,
          stage,
          progress,
          message,
          timestamp: Date.now(),
        });
      });

    // Create page service
    const documentType = service.getDocumentType(input);
    const pageService = getPageService(documentType, {
      workspaceSlug,
      projectId: projectId || null,
      teamspaceId: teamspaceId || null,
      cookie: input.cookie,
      documentType,
      userId: "",
      parentId: null,
    });

    yield* reportProgress("fetching-content", 10, "Fetching page content...");

    // Fetch content (tries live in-memory doc first, then API fallback)
    const content = yield* service.fetchPageContent(pageService, pageId, workspaceSlug);

    // Extract image and attachment asset IDs
    const { imageIds, attachmentIds } = service.extractAssetIds(content.contentJSON as TipTapNode);

    // Fetch metadata using combined endpoint
    let metadata = yield* service.fetchMetadata(pageService, workspaceSlug, pageId, projectId, teamspaceId);

    // Process images and resolve attachment URLs if needed
    if (!noAssets) {
      let resolvedUrls: Record<string, string> = {};

      // Process images (download and convert to base64)
      if (imageIds.length > 0) {
        yield* reportProgress("processing-images", 30, "Processing images...");
        const resolvedImages = yield* service.processImages(pageService, workspaceSlug, projectId, imageIds);
        resolvedUrls = { ...resolvedUrls, ...resolvedImages };
      }

      // Resolve attachment URLs (just get presigned URLs, no processing)
      if (attachmentIds.length > 0) {
        const resolvedAttachments = yield* service.resolveAttachmentUrls(
          pageService,
          workspaceSlug,
          projectId,
          attachmentIds
        );
        resolvedUrls = { ...resolvedUrls, ...resolvedAttachments };
      }

      metadata = { ...metadata, resolvedImageUrls: resolvedUrls };
    }

    // Note: strip trailing slash since node renderers use `${baseUrl}/${path}` pattern
    const baseURL = process.env.WEB_BASE_URL || process.env.APP_BASE_URL || "";
    const resolvedBaseURL = baseURL[baseURL.length - 1] === "/" ? baseURL.slice(0, -1) : baseURL;
    metadata = { ...metadata, baseUrl: resolvedBaseURL, workspaceSlug };

    yield* reportProgress("rendering-pdf", 70, "Rendering PDF...");

    // Render PDF
    const documentTitle = input.title || content.titleHTML || "Untitled";
    const pdfBuffer = yield* service.renderPdf(content.contentJSON, metadata, {
      title: documentTitle,
      author: input.author,
      subject: input.subject,
      pageSize: input.pageSize,
      pageOrientation: input.pageOrientation,
      noAssets,
    });

    yield* Effect.logInfo("PDF_EXPORT: Export complete", {
      pageId,
      size: pdfBuffer.length,
    });

    yield* reportProgress("complete", 100, "Export complete");

    return {
      pdfBuffer,
      outputFileName: input.fileName || `page-${pageId}.pdf`,
      pageId,
    };
  });
