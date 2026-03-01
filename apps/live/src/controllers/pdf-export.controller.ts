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
import { Effect, Layer, Schema, Cause, Fiber } from "effect";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { serverAgentManager } from "@/agents/server-agent";
import { PdfExportRequestBody, PdfValidationError, PdfAuthenticationError } from "@/schema/pdf-export";
import { PdfExportService, makeLiveDocumentLayer, exportToPdf } from "@/services/pdf-export";
import type { PdfExportInput } from "@/services/pdf-export";

const KEEPALIVE_INTERVAL_MS = 15_000;

@Controller("/pdf-export")
export class PdfExportController {
  private parseRequest(
    req: Request,
    requestId: string
  ): Effect.Effect<PdfExportInput, PdfValidationError | PdfAuthenticationError> {
    return Effect.gen(function* () {
      const cookie = req.headers.cookie || "";
      if (!cookie) {
        return yield* Effect.fail(
          new PdfAuthenticationError({
            message: "Authentication required",
          })
        );
      }

      const body = yield* Schema.decodeUnknown(PdfExportRequestBody)(req.body).pipe(
        Effect.mapError(
          (cause) =>
            new PdfValidationError({
              message: "Invalid request body",
              cause,
            })
        )
      );

      return {
        pageId: body.pageId,
        workspaceSlug: body.workspaceSlug,
        projectId: body.projectId,
        teamspaceId: body.teamspaceId,
        title: body.title,
        author: body.author,
        subject: body.subject,
        pageSize: body.pageSize,
        pageOrientation: body.pageOrientation,
        fileName: body.fileName,
        noAssets: body.noAssets,
        cookie,
        requestId,
      };
    });
  }

  @Post("/")
  async startExport(req: Request, res: Response) {
    const requestId = crypto.randomUUID();

    const parseEffect = this.parseRequest(req, requestId).pipe(
      Effect.catchTags({
        PdfValidationError: (e: PdfValidationError) => Effect.fail({ code: "VALIDATION_ERROR", message: e.message }),
        PdfAuthenticationError: (e: PdfAuthenticationError) =>
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

    const inputWithProgress: PdfExportInput = {
      ...input,
      onProgress: (event) => {
        sendEvent("progress", {
          stage: event.stage,
          progress: event.progress,
          message: event.message,
        });
      },
    };

    const appLayer = Layer.merge(PdfExportService.Default, makeLiveDocumentLayer(serverAgentManager));

    const effect = exportToPdf(inputWithProgress).pipe(
      Effect.tapError((error) => {
        const errorInfo =
          error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error;
        return Effect.logError("PDF_EXPORT: Export failed", { requestId, error: errorInfo });
      }),
      Effect.catchTags({
        PdfContentFetchError: (e) => Effect.fail(e.message),
        PdfTimeoutError: (e) => Effect.fail(e.message),
        PdfGenerationError: (e) => Effect.fail(e.message),
      }),
      Effect.catchAllDefect((defect) => {
        logger.error("PDF_EXPORT: Unexpected failure", { requestId, error: Cause.pretty(Cause.die(defect)) });
        return Effect.fail("Failed to generate PDF");
      })
    );

    const fiber = Effect.runFork(
      Effect.provide(effect, appLayer).pipe(
        Effect.match({
          onSuccess: (result) => {
            sendEvent("complete", {
              fileName: result.outputFileName,
              data: result.pdfBuffer.toString("base64"),
            });
            clearInterval(keepAlive);
            res.end();
          },
          onFailure: (error) => {
            sendEvent("error", {
              code: "EXPORT_FAILED",
              message: typeof error === "string" ? error : "Failed to generate PDF",
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
        logger.info("PDF_EXPORT: Client disconnected, cancelling export", { requestId });
        Effect.runFork(Fiber.interrupt(fiber));
      } else {
        logger.info("PDF_EXPORT: Connection closed after export completed", { requestId });
      }
    });

    await Effect.runPromise(Fiber.await(fiber));
  }
}
