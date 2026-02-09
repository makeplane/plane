import type { Request, Response } from "express";
import { Effect, Schema, Cause } from "effect";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
import {
  PdfExportRequestBody,
  PdfValidationError,
  PdfAuthenticationError,
  PdfContentFetchError,
  PdfGenerationError,
  PdfTimeoutError,
} from "@/schema/pdf-export";
import { PdfExportService, exportToPdf } from "@/services/pdf-export";
import type { PdfExportInput } from "@/services/pdf-export";

type HttpErrorResponse = { status: number; error: string };

@Controller("/pdf-export")
export class PdfExportController {
  /**
   * Parses and validates the request, returning a typed input object
   */
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

      // Get baseUrl from request body or fall back to origin header
      const baseUrl = body.baseUrl || req.headers.origin || "";

      return {
        pageId: body.pageId,
        workspaceSlug: body.workspaceSlug,
        projectId: body.projectId,
        title: body.title,
        author: body.author,
        subject: body.subject,
        pageSize: body.pageSize,
        pageOrientation: body.pageOrientation,
        fileName: body.fileName,
        noAssets: body.noAssets,
        baseUrl,
        apiBaseUrl: body.apiBaseUrl,
        cookie,
        requestId,
      };
    });
  }

  @Post("/")
  async exportToPdf(req: Request, res: Response) {
    const requestId = crypto.randomUUID();

    const effect = Effect.gen(this, function* () {
      // Parse request
      const input = yield* this.parseRequest(req, requestId);

      // Delegate to service (fat model)
      return yield* exportToPdf(input);
    }).pipe(
      // Log errors before catching them - serialize error properly
      Effect.tapError((error) => {
        const errorInfo =
          error instanceof Error
            ? { name: error.name, message: error.message, stack: error.stack }
            : error;
        return Effect.logError("PDF_EXPORT: Export failed", { requestId, error: errorInfo });
      }),
      // Map tagged errors to HTTP responses using catchTags
      Effect.catchTags({
        PdfValidationError: (e: PdfValidationError): Effect.Effect<HttpErrorResponse> =>
          Effect.succeed({ status: 400, error: e.message }),
        PdfAuthenticationError: (e: PdfAuthenticationError): Effect.Effect<HttpErrorResponse> =>
          Effect.succeed({ status: 401, error: e.message }),
        PdfContentFetchError: (e: PdfContentFetchError): Effect.Effect<HttpErrorResponse> =>
          Effect.succeed({ status: e.message.includes("not found") ? 404 : 502, error: e.message }),
        PdfTimeoutError: (e: PdfTimeoutError): Effect.Effect<HttpErrorResponse> =>
          Effect.succeed({ status: 504, error: e.message }),
        PdfGenerationError: (e: PdfGenerationError): Effect.Effect<HttpErrorResponse> =>
          Effect.succeed({ status: 500, error: e.message }),
      }),
      // Handle unexpected defects
      Effect.catchAllDefect((defect) => {
        const appError = new AppError(Cause.pretty(Cause.die(defect)), {
          context: { requestId, operation: "exportToPdf" },
        });
        logger.error("PDF_EXPORT: Unexpected failure", appError);
        return Effect.succeed({ status: 500, error: "Failed to generate PDF" });
      })
    );

    const result = await Effect.runPromise(Effect.provide(effect, PdfExportService.Default));

    // Check if result is an error response
    if ("error" in result && "status" in result) {
      return res.status(result.status).json({ message: result.error });
    }

    // Success - send PDF
    const { pdfBuffer, outputFileName } = result;

    // Sanitize filename for Content-Disposition header to prevent header injection
    const sanitizedFileName = outputFileName
      .replace(/["\\\r\n]/g, "") // Remove quotes, backslashes, and CRLF
      .replace(/[^\x20-\x7E]/g, "_"); // Replace non-ASCII with underscore

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sanitizedFileName}"; filename*=UTF-8''${encodeURIComponent(outputFileName)}`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.send(pdfBuffer);
  }
}
