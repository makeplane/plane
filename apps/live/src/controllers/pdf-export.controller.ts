import type { Request, Response } from "express";
import { Effect, Schema, Cause } from "effect";
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { AppError } from "@/lib/errors";
import { PdfExportRequestBody, PdfValidationError, PdfAuthenticationError } from "@/schema/pdf-export";
import { PdfExportService, exportToPdf } from "@/services/pdf-export";
import type { PdfExportInput } from "@/services/pdf-export";

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
        cookie,
        requestId,
      };
    });
  }

  /**
   * Maps domain errors to HTTP responses
   */
  private mapErrorToHttpResponse(error: unknown): { status: number; error: string } {
    if (error && typeof error === "object" && "_tag" in error) {
      const tag = (error as { _tag: string })._tag;
      const message = (error as { message?: string }).message || "Unknown error";

      switch (tag) {
        case "PdfValidationError":
          return { status: 400, error: message };
        case "PdfAuthenticationError":
          return { status: 401, error: message };
        case "PdfContentFetchError":
          return {
            status: message.includes("not found") ? 404 : 502,
            error: message,
          };
        case "PdfTimeoutError":
          return { status: 504, error: message };
        case "PdfGenerationError":
          return { status: 500, error: message };
        case "PdfMetadataFetchError":
        case "PdfImageProcessingError":
          return { status: 502, error: message };
        default:
          return { status: 500, error: message };
      }
    }
    return { status: 500, error: "Failed to generate PDF" };
  }

  @Post("/")
  async exportToPdf(req: Request, res: Response) {
    const requestId = crypto.randomUUID();

    const effect = Effect.gen(this, function* () {
      // Parse request
      const input = yield* this.parseRequest(req, requestId);

      // Delegate to service
      return yield* exportToPdf(input);
    }).pipe(
      // Log errors before catching them
      Effect.tapError((error) => Effect.logError("PDF_EXPORT: Export failed", { requestId, error })),
      // Map all tagged errors to HTTP responses
      Effect.catchAll((error) => Effect.succeed(this.mapErrorToHttpResponse(error))),
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
