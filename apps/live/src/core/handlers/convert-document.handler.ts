import { Request, Response } from "express";
import { manualLogger } from "@/core/helpers/logger";
import { TConvertDocumentRequestBody } from "@/core/types/common";
import { convertHTMLDocumentToAllFormats } from "@plane/editor";

export const handleConvertDocument = (req: Request, res: Response) => {
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
    manualLogger.error(error, "Error in /convert-document endpoint:");
    res.status(500).send({
      message: `Internal server error. ${error}`,
    });
  }
};
