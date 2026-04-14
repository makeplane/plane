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

import type { Request, Response } from "express";
import { Effect, Layer, Schema, Cause, Duration, Fiber } from "effect";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { serverAgentManager } from "@/agents/server-agent";
import { AppError } from "@/lib/errors";
import { renderPlaneDocToPdfBuffer } from "@/lib/pdf";
import type { PDFExportMetadata } from "@/lib/pdf/types";
import { renderPlaneDocToDocxBuffer } from "@/lib/docx";
import type { DocxExportMetadata } from "@/lib/docx/types";
import {
  ExportRequestBody,
  ExportValidationError,
  ExportAuthenticationError,
  ExportContentFetchError,
  ExportGenerationError,
  ExportTimeoutError,
} from "@/schema/export";
import { ExportPipelineService, makeLiveDocumentLayer } from "@/services/export";
import type { ExportInput, PdfExportInput, ExportPipelineResult } from "@/services/export";

const RENDER_TIMEOUT_MS = 15000;
const KEEPALIVE_INTERVAL_MS = 15_000;

const CONTENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

const FILE_EXTENSIONS = {
  pdf: ".pdf",
  docx: ".docx",
} as const;

@Controller("/export")
export class ExportController {
  private parseRequest(
    req: Request,
    requestId: string
  ): Effect.Effect<ExportInput, ExportValidationError | ExportAuthenticationError> {
    return Effect.gen(function* () {
      const cookie = req.headers.cookie || "";
      if (!cookie) {
        return yield* Effect.fail(
          new ExportAuthenticationError({
            message: "Authentication required",
          })
        );
      }

      const body = yield* Schema.decodeUnknown(ExportRequestBody)(req.body).pipe(
        Effect.mapError(
          (cause) =>
            new ExportValidationError({
              message: "Invalid request body",
              cause,
            })
        )
      );

      const format = body.format ?? ("pdf" as const);

      if (format === "pdf") {
        return {
          pageId: body.pageId,
          workspaceSlug: body.workspaceSlug,
          projectId: body.projectId,
          teamspaceId: body.teamspaceId,
          title: body.title,
          author: body.author,
          subject: body.subject,
          pageSize: "pageSize" in body ? body.pageSize : undefined,
          pageOrientation: "pageOrientation" in body ? body.pageOrientation : undefined,
          fileName: body.fileName,
          noAssets: body.noAssets,
          format: "pdf" as const,
          cookie,
          requestId,
        } satisfies PdfExportInput;
      }

      return {
        pageId: body.pageId,
        workspaceSlug: body.workspaceSlug,
        projectId: body.projectId,
        teamspaceId: body.teamspaceId,
        title: body.title,
        author: body.author,
        subject: body.subject,
        fileName: body.fileName,
        noAssets: body.noAssets,
        format: "docx" as const,
        cookie,
        requestId,
      };
    });
  }

  private renderPdf(
    pipelineResult: ExportPipelineResult,
    input: PdfExportInput
  ): Effect.Effect<Buffer, ExportGenerationError | ExportTimeoutError> {
    return Effect.tryPromise({
      try: () =>
        renderPlaneDocToPdfBuffer(pipelineResult.contentJSON, {
          title: pipelineResult.documentTitle,
          author: input.author,
          subject: input.subject,
          pageSize: input.pageSize,
          pageOrientation: input.pageOrientation,
          metadata: pipelineResult.metadata as PDFExportMetadata,
          noAssets: input.noAssets,
        }),
      catch: (cause) =>
        new ExportGenerationError({
          message: "Failed to generate PDF",
          format: "pdf",
          cause,
        }),
    }).pipe(
      Effect.timeoutFail({
        duration: Duration.millis(RENDER_TIMEOUT_MS),
        onTimeout: () =>
          new ExportTimeoutError({
            message: `PDF rendering timed out after ${RENDER_TIMEOUT_MS}ms`,
            operation: "renderPdf",
          }),
      })
    );
  }

  private renderDocx(
    pipelineResult: ExportPipelineResult
  ): Effect.Effect<Buffer, ExportGenerationError | ExportTimeoutError> {
    return Effect.tryPromise({
      try: () =>
        renderPlaneDocToDocxBuffer(pipelineResult.contentJSON, {
          title: pipelineResult.documentTitle,
          author: pipelineResult.input.author,
          subject: pipelineResult.input.subject,
          metadata: pipelineResult.metadata as DocxExportMetadata,
          noAssets: pipelineResult.input.noAssets,
        }),
      catch: (cause) =>
        new ExportGenerationError({
          message: "Failed to generate DOCX",
          format: "docx",
          cause,
        }),
    }).pipe(
      Effect.timeoutFail({
        duration: Duration.millis(RENDER_TIMEOUT_MS),
        onTimeout: () =>
          new ExportTimeoutError({
            message: `DOCX rendering timed out after ${RENDER_TIMEOUT_MS}ms`,
            operation: "renderDocx",
          }),
      })
    );
  }

  @Post("/")
  async export(req: Request, res: Response) {
    const requestId = crypto.randomUUID();

    const parseEffect = this.parseRequest(req, requestId).pipe(
      Effect.catchTags({
        ExportValidationError: (e: ExportValidationError) =>
          Effect.fail({ code: "VALIDATION_ERROR", message: e.message }),
        ExportAuthenticationError: (e: ExportAuthenticationError) =>
          Effect.fail({ code: "AUTHENTICATION_ERROR", message: e.message }),
      })
    );

    const parseResult = await Effect.runPromise(
      parseEffect.pipe(
        Effect.match({
          onSuccess: (v) => ({ ok: true as const, value: v }),
          onFailure: (e) => ({ ok: false as const, error: e }),
        })
      )
    );

    if (!parseResult.ok) {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write(`event: error\ndata: ${JSON.stringify(parseResult.error)}\n\n`);
      res.end();
      return;
    }

    const input = parseResult.value;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const keepAlive = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(keepAlive);
        return;
      }
      res.write(":keepalive\n\n");
    }, KEEPALIVE_INTERVAL_MS);

    const sendEvent = (event: string, data: Record<string, unknown>) => {
      if (res.writableEnded) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const format = input.format;

    const effect = Effect.gen(this, function* () {
      sendEvent("progress", { stage: "fetching-content", progress: 0, message: "Fetching page content..." });

      const service = yield* ExportPipelineService;
      const pipelineResult = yield* service.runPipeline(input);

      sendEvent("progress", {
        stage: `rendering-${format}`,
        progress: 50,
        message: `Rendering ${format.toUpperCase()}...`,
      });

      const buffer =
        format === "pdf"
          ? yield* this.renderPdf(pipelineResult, input as PdfExportInput)
          : yield* this.renderDocx(pipelineResult);

      const baseFileName = input.fileName || pipelineResult.documentTitle || "export";
      const extension = FILE_EXTENSIONS[format];
      const outputFileName = baseFileName.endsWith(extension) ? baseFileName : `${baseFileName}${extension}`;

      return { buffer, outputFileName, format };
    }).pipe(
      Effect.tapError((error) => {
        const errorInfo =
          error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
        return Effect.logError("EXPORT: Export failed", { requestId, error: errorInfo });
      }),
      Effect.catchTags({
        ExportContentFetchError: (e: ExportContentFetchError) => Effect.fail(e.message),
        ExportTimeoutError: (e: ExportTimeoutError) => Effect.fail(e.message),
        ExportGenerationError: (e: ExportGenerationError) => Effect.fail(e.message),
      }),
      Effect.catchAllDefect((defect) => {
        const appError = new AppError(Cause.pretty(Cause.die(defect)), {
          context: { requestId, operation: "export" },
        });
        logger.error("EXPORT: Unexpected failure", appError);
        return Effect.fail("Failed to generate export");
      })
    );

    const appLayer = Layer.merge(ExportPipelineService.Default, makeLiveDocumentLayer(serverAgentManager));

    const fiber = Effect.runFork(
      Effect.provide(effect, appLayer).pipe(
        Effect.match({
          onSuccess: (result) => {
            sendEvent("complete", {
              fileName: result.outputFileName,
              data: result.buffer.toString("base64"),
              contentType: CONTENT_TYPES[result.format],
            });
            clearInterval(keepAlive);
            res.end();
          },
          onFailure: (error) => {
            sendEvent("error", {
              code: "EXPORT_FAILED",
              message: typeof error === "string" ? error : "Failed to generate export",
            });
            clearInterval(keepAlive);
            res.end();
          },
        })
      )
    );

    res.on("close", () => {
      clearInterval(keepAlive);
      if (!res.writableFinished) {
        logger.info("EXPORT: Client disconnected, cancelling export", { requestId });
        Effect.runFork(Fiber.interrupt(fiber));
      } else {
        logger.info("EXPORT: Connection closed after export completed", { requestId });
      }
    });

    await Effect.runPromise(Fiber.await(fiber));
  }
}
