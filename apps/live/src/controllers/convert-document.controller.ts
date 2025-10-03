import type { Request, Response } from "express";
// plane imports
import { Controller, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
// types
import type { TConvertDocumentRequestBody } from "@/types";
// utils
import { convertHTMLDocumentToAllFormats } from "@/utils";

@Controller("/convert-document")
export class ConvertDocumentController {
  @Post("/")
  handleConvertDocument(req: Request, res: Response) {
    const { description_html, variant } = req.body as TConvertDocumentRequestBody;
    try {
      if (typeof description_html !== "string" || variant === undefined) {
        res.status(400).json({
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
