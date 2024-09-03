// types
import { TDocumentTypes } from "@/core/types/common.js";

type TArgs = {
  params: URLSearchParams;
  pageId: string;
  updatedDescription: Uint8Array;
  cookie: string | undefined;
}

export const updateDocument = (args: TArgs): Promise<void> => {
  const { params } = args;
  const documentType = params.get("documentType")?.toString() as
    | TDocumentTypes
    | undefined;
  throw Error(`Update failed: Invalid document type ${documentType} provided.`);
}