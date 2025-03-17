import { Router } from "express";
import type { Request, Response } from "express";
import { manualLogger } from "@/core/helpers/logger";
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
import { TConvertDocumentRequestBody } from "@/core/types/common";
import { IController } from "@/lib/controller.interface";
import { Post } from "@/lib/decorators";

export class DocumentController implements IController {
  @Post("/convert-document")
  async convertDocument(req: Request, res: Response) {
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
      manualLogger.error("Error in /convert-document endpoint:", error);
      res.status(500).send({
        message: `Internal server error. ${error}`,
      });
    }
  }

  registerRoutes(router: Router): void {
    // Routes are registered via decorators
  }
}
