import type { Request, Response } from "express";
import { logger } from "@plane/logger";
import { Controller, Post } from "@plane/decorators";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";

@Controller("/collaboration")
export class ConvertDocumentController {
  @Post("/")
  handleConvertDocument(req: Request, res: Response) {
    const { description_html, variant } = req.body as TConvertDocumentRequestBody;
    try {
      if (description_html === undefined || variant === undefined) {
        res.status(400).send({
          message: "Missing required fields",
        });
        return;
      }
      const { description, description_binary } = convertHTMLDocumentToAllFormats({
        document_html: description_html,
        variant,
      });
      res.status(200).json({
        description,
        description_binary,
      });
    } catch (error) {
      logger.error("Error in /convert-document endpoint:", error);
      res.status(500).json({
        message: `Internal server error.`,
      });
    }
  }
}
