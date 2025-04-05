import type { Request, Response } from "express";
import { z } from "zod";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
// decorators
import { CatchErrors } from "@/lib/decorators";
// logger
import { logger } from "@plane/logger";
import { Controller, Post } from "@plane/decorators";
import { AppError } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";

// Define the schema with more robust validation
const convertDocumentSchema = z.object({
  description_html: z
    .string()
    .min(1, "HTML content cannot be empty")
    .refine((html) => html.trim().length > 0, "HTML content cannot be just whitespace")
    .refine((html) => html.includes("<") && html.includes(">"), "Content must be valid HTML"),
  variant: z.enum(["rich", "document"]),
});

@Controller("/convert-document")
export class DocumentController {
  private metrics = {
    conversions: 0,
    errors: 0,
  };

  @Post("/")
  @CatchErrors()
  async convertDocument(req: Request, res: Response) {
    const requestId = req.id || crypto.randomUUID();
    const clientInfo = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      requestId,
    };

    try {
      // Validate request body
      const validatedData = convertDocumentSchema.parse(req.body as TConvertDocumentRequestBody);
      const { description_html, variant } = validatedData;

      // Log validated data
      logger.info("Validated document conversion request", {
        ...clientInfo,
        variant,
        contentLength: description_html.length,
      });

      // Process document conversion
      const { description, description_binary } = convertHTMLDocumentToAllFormats({
        document_html: description_html,
        variant,
      });

      // Update metrics
      this.metrics.conversions++;

      // Log successful conversion
      logger.info("Document conversion successful", {
        ...clientInfo,
        variant,
        outputLength: description_html.length,
      });

      // Return successful response
      res.status(200).json({
        description,
        description_binary,
      });
    } catch (error) {
      // Update error metrics
      this.metrics.errors++;

      let appError: AppError;

      if (error instanceof z.ZodError) {
        // Handle validation errors
        appError = handleError(error, {
          errorType: "unprocessable-entity",
          message: "Invalid request data",
          component: "document-conversion-controller",
          operation: "convertDocument",
          extraContext: {
            ...clientInfo,
            validationErrors: error.errors.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
        });
      } else {
        // Handle other errors
        appError = handleError(error, {
          errorType: "internal",
          message: "Internal server error",
          component: "document-conversion-controller",
          operation: "convertDocument",
          extraContext: clientInfo,
        });
      }

      // Log the error
      logger.error("Document conversion failed", {
        error: appError,
        status: appError.status,
        context: appError.context,
      });

      res.status(appError.status).json({
        message: appError.message,
        status: appError.status,
        context: appError.context,
      });
    }
  }

  getMetrics() {
    return {
      conversions: this.metrics.conversions,
      errors: this.metrics.errors,
    };
  }
}
