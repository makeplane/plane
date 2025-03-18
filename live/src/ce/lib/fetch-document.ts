// types
import { AppError, catchAsync } from "@/core/helpers/error-handling/error-handler";
import { TDocumentTypes } from "@/core/types/common";

interface TArgs {
  cookie: string;
  documentType: TDocumentTypes;
  pageId: string;
  params: URLSearchParams;
}

export const fetchDocument = async (args: TArgs): Promise<Uint8Array | null> => {
  const { cookie, documentType, pageId, params } = args;

  if (!documentType) {
    throw new AppError("Document type is required");
  }

  if (!pageId) {
    throw new AppError("Page ID is required");
  }

  return catchAsync(
    async () => {
      switch (documentType) {
        default:
          throw new AppError(`Invalid document type: ${documentType}`);
      }
    },
    {
      params: { pageId, documentType },
      extra: { operation: "fetch" },
    }
  );
};

