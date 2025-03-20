// hocuspocus extensions and core
import { Database } from "@hocuspocus/extension-database";
import { Extension } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { setupRedisExtension } from "@/core/extensions/redis";
// types
import { type HocusPocusServerContext, type TDocumentTypes } from "@/core/types/common";
import { logger } from "@plane/logger";
// error
import { catchAsync } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";
// document handlers
import { getDocumentHandler } from "../handlers/document-handlers";

export const getExtensions: () => Promise<Extension[]> = async () => {
  const extensions: Extension[] = [
    new Logger({
      onChange: false,
      log: (message) => {
        logger.info(message);
      },
    }),
    new Database({
      fetch: async ({
        context,
        documentName: pageId,
        requestParameters,
      }: {
        context: HocusPocusServerContext;
        documentName: TDocumentTypes;
        requestParameters: URLSearchParams;
      }) => {
        const { documentType } = context;
        const params = requestParameters;

        let fetchedData = null;
        fetchedData = await catchAsync(
          async () => {
            if (!documentType) {
              handleError(null, {
                errorType: "bad-request",
                message: "Document type is required",
                component: "database-extension",
                operation: "fetch",
                extraContext: { pageId },
                throw: true,
              });
            }

            const documentHandler = getDocumentHandler(documentType);
            fetchedData = await documentHandler.fetch({
              context: context as HocusPocusServerContext,
              pageId,
              params,
            });

            if (!fetchedData) {
              handleError(null, {
                errorType: "not-found",
                message: `Failed to fetch document: ${pageId}`,
                component: "database-extension",
                operation: "fetch",
                extraContext: { documentType, pageId },
              });
            }

            return fetchedData;
          },
          {
            params: { pageId, documentType },
            extra: { operation: "fetch" },
          }
        )();
        return fetchedData;
      },
      store: async ({
        context,
        state,
        documentName: pageId,
        requestParameters,
      }: {
        context: HocusPocusServerContext;
        state: Buffer;
        documentName: TDocumentTypes;
        requestParameters: URLSearchParams;
      }) => {
        const { agentId } = context as HocusPocusServerContext;
        const params = requestParameters;
        const documentType = params.get("documentType")?.toString() as TDocumentTypes | undefined;

        catchAsync(
          async () => {
            if (!documentType) {
              handleError(null, {
                errorType: "bad-request",
                message: "Document type is required",
                component: "database-extension",
                operation: "store",
                extraContext: { pageId },
                throw: true,
              });
            }

            const documentHandler = getDocumentHandler(documentType, { agentId });
            await documentHandler.store({
              context: context as HocusPocusServerContext,
              pageId,
              state,
              params,
            });
          },
          {
            params: { pageId, documentType },
            extra: { operation: "store" },
          }
        )();
      },
    }),
  ];

  // Set up Redis extension if available
  const redisExtension = await setupRedisExtension();
  if (redisExtension) {
    extensions.push(redisExtension);
  }

  return extensions;
};
