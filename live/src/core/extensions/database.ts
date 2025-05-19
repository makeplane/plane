import { Database } from "@hocuspocus/extension-database";
import { catchAsync } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { type HocusPocusServerContext, type TDocumentTypes } from "@/core/types/common";
import { storePayload } from "@hocuspocus/server";
import { extractTextFromHTML } from "./title-update/title-utils";
import { getDocumentHandler } from "../handlers/page-handlers";

export const createDatabaseExtension = () => {
  return new Database({
    fetch: handleFetch,
    store: handleStore as (data: storePayload) => Promise<void>,
  });
};

const handleFetch = async ({
  context,
  documentName,
}: {
  context: HocusPocusServerContext;
  documentName: string;
  requestParameters: URLSearchParams;
}) => {
  const { documentType } = context;
  const pageId = documentName as TDocumentTypes;

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
      params: { pageId, documentType: context.documentType },
      extra: { operation: "fetch" },
    }
  )();
  return fetchedData;
};

const handleStore = async ({
  context,
  state,
  documentName,
  document,
}: Partial<storePayload> & {
  context: HocusPocusServerContext;
  documentName: string;
}) => {
  const pageId = documentName;

  if (!context) {
    console.error("Context is undefined in handleStore for document:", pageId);
    return;
  }

  await catchAsync(
    async () => {
      if (!state) {
        handleError(null, {
          errorType: "bad-request",
          message: "Loaded binary state is required",
          component: "database-extension",
          operation: "store",
          extraContext: { pageId },
          throw: true,
        });
      }
      let title = "";
      if (document) {
        title = extractTextFromHTML(document?.getXmlFragment("title")?.toJSON());
      }
      const { documentType } = context as HocusPocusServerContext;

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

      const documentHandler = getDocumentHandler(documentType);
      await documentHandler.store({
        context: context as HocusPocusServerContext,
        pageId,
        state,
        title,
      });
    },
    {
      params: {
        pageId,
        documentType: context?.documentType || "unknown",
      },
      extra: { operation: "store" },
    }
  )();
};
