import type { Request, Response } from "express";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
// decorators
import { CatchErrors } from "@/lib/decorators";
// logger
import { logger } from "@plane/logger";
// error handling
import validate from "@/core/helpers/error-handling/error-validation";
import { Controller, Post } from "@plane/decorators";

@Controller("/convert-document")
export class DocumentController {
  @Post("/")
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
