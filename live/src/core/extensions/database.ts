import { Database } from "@hocuspocus/extension-database";
import { catchAsync } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { getDocumentHandler } from "../handlers/document-handlers";
import { type HocusPocusServerContext, type TDocumentTypes } from "@/core/types/common";
import { storePayload } from "@hocuspocus/server";
import { extractTextFromHTML } from "./title-update/title-utils";

export const createDatabaseExtension = () => {
  return new Database({
    fetch: handleFetch,
    store: handleStore,
  });
};

const handleFetch = async ({
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
      params: { pageId, documentType: context.documentType },
      extra: { operation: "fetch" },
    }
  )();
  return fetchedData;
};

const handleStore = async ({
  context,
  state,
  documentName: pageId,
  requestParameters,
  document,
}: Partial<storePayload> & {
  context: HocusPocusServerContext;
  documentName: TDocumentTypes;
}) => {
  catchAsync(
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
      const params = requestParameters;
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
        params,
        title,
      });
    },
    {
      params: { pageId, documentType: context.documentType },
      extra: { operation: "store" },
    }
  )();
};
