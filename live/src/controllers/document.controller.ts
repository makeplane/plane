import type { Request, Response } from "express";
import { z } from "zod";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
// decorators
import { CatchErrors } from "@/lib/decorators";
// logger
import { Controller, Post } from "@plane/decorators";
import { AppError } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";

const convertDocumentSchema = z.object({
  description_html: z.string(),
  variant: z.enum(["rich", "document"]),
});

@Controller("/convert-document")
export class DocumentController {
  @Post("/")
  @CatchErrors()
  async convertDocument(req: Request, res: Response) {
    try {
      const validatedData = convertDocumentSchema.parse(req.body as TConvertDocumentRequestBody);
      const { description_html, variant } = validatedData;

      // Process document conversion
      const { description, description_binary } = convertHTMLDocumentToAllFormats({
        document_html: description_html,
        variant,
      });

      // Return successful response
      res.status(200).json({
        description,
        description_binary,
      });
    } catch (error) {
      let appError: AppError;
      if (error instanceof z.ZodError) {
        appError = handleError(error, {
          errorType: "unprocessable-entity",
          message: "Invalid request data",
          component: "document-conversion-controller",
          operation: "convertDocument",
          extraContext: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      } else {
        appError = handleError(error, {
          errorType: "internal",
          message: "Internal server error",
          component: "document-conversion-controller",
          operation: "convertDocument",
        });
      }
      res.status(appError.status).json({
        message: appError.message,
        status: appError.status,
        context: appError.context,
      });
    }
  }
}
