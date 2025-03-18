import type { Request, Response } from "express";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
// controller
import { BaseController } from "@/lib/base.controller";
// decorators
import { Post, CatchErrors } from "@/lib/decorators";
// logger
import { logger } from "@plane/logger";
// error handling
import validate from "@/core/helpers/error-handling/error-validation";

export class DocumentController extends BaseController {
  @Post("/convert-document")
  @CatchErrors()
  async convertDocument(req: Request, res: Response) {
    const { description_html, variant } = req.body as TConvertDocumentRequestBody;

    // Validate input parameters using our new validation utility
    validate(description_html, "description_html").required().string();
    validate(variant, "variant").required().string();

    logger.info("Converting document", { variant });

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
  }
}
