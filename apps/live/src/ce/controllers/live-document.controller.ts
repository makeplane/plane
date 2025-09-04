import type { Request, Response } from "express";
import * as Y from "yjs";
import { z } from "zod";
import { Controller, Get } from "@plane/decorators";

// Server agent
import { getAllDocumentFormatsFromDocumentEditorBinaryData } from "@plane/editor/lib";
import { serverAgentManager } from "@/core/agents/server-agent";

// Helpers
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { AppError } from "@/core/helpers/error-handling/error-handler";
import { manualLogger } from "@/core/helpers/logger";
import { HocusPocusServerContext } from "@/core/types/common";
import { env } from "@/env";

// Types

// Schema for request validation
const getLiveDocumentValuesSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  variant: z.enum(["document"]),
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

@Controller("/live-document")
export class LiveDocumentController {
  @Get("/")
  async getLiveDocumentValues(req: Request, res: Response) {
    const requestId = req.id || crypto.randomUUID();

    try {
      if (req.headers["live-server-secret-key"] !== env.LIVE_SERVER_SECRET_KEY) {
        return res.status(401).json({
          message: "Unauthorized access",
          status: 401,
          context: {
            component: "get-live-document-values-controller",
            operation: "getLiveDocumentValues",
            requestId,
          },
        });
      }

      const validatedData = getLiveDocumentValuesSchema.parse(req.query);
      const { documentId, workspaceSlug } = validatedData;

      const context: Partial<HocusPocusServerContext> = {
        workspaceSlug,
      };

      try {
        const { connection } = await serverAgentManager.getConnection(documentId, context);

        // Define the document type
        type DocumentData = {
          description_binary: string;
          description: object;
          description_html: string;
          name?: string;
        };

        // Create a promise to wrap the setTimeout
        const loadDocumentWithDelay = new Promise<DocumentData | null>((resolve) => {
          let documentData: DocumentData;

          connection.transact((doc) => {
            const type = doc.getXmlFragment("default");
            const contentDoc = type.doc;

            if (!contentDoc) {
              resolve(null);
              return;
            }

            const yjsBinary = Y.encodeStateAsUpdate(contentDoc);
            const { contentBinaryEncoded, contentJSON, contentHTML, titleHTML } =
              getAllDocumentFormatsFromDocumentEditorBinaryData(yjsBinary, true);

            documentData = {
              description_binary: contentBinaryEncoded,
              description: contentJSON,
              description_html: contentHTML,
            };

            if (titleHTML) {
              documentData.name = titleHTML;
            }

            resolve(documentData);
          });
        });

        // Await the delayed document loading
        const documentLoaded = await loadDocumentWithDelay;

        await serverAgentManager.releaseConnection(documentId);

        // Return the converted document
        res.status(200).json(documentLoaded);
      } catch (error) {
        // Error during server agent connection or conversion
        manualLogger.error(error, `Error processing document ${documentId}:`);

        res.status(400).json({
          loaded: false,
          message: "Document not currently loaded in memory",
        });
      }
    } catch (error) {
      let appError: AppError;

      if (error instanceof z.ZodError) {
        // Handle validation errors
        appError = handleError(error, {
          errorType: "unprocessable-entity",
          message: "Invalid request data",
          component: "get-live-document-values-controller",
          operation: "getLiveDocumentValues",
          extraContext: {
            requestId,
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
          component: "get-live-document-values-controller",
          operation: "getLiveDocumentValues",
          extraContext: { requestId },
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
