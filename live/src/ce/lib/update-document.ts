// types
import { TDocumentTypes } from "@/core/types/common.js";

type TArgs = {
  cookie: string | undefined;
  documentType: TDocumentTypes | undefined;
  pageId: string;
  params: URLSearchParams;
  updatedDescription: Uint8Array;
}

export const updateDocument = async (args: TArgs): Promise<void> => {
  const { documentType } = args;
  throw Error(`Update failed: Invalid document type ${documentType} provided.`);
}