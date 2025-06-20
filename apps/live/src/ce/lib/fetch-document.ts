// types
import { TDocumentTypes } from "@/core/types/common.js";

type TArgs = {
  cookie: string | undefined;
  documentType: TDocumentTypes | undefined;
  pageId: string;
  params: URLSearchParams;
}

export const fetchDocument = async (args: TArgs): Promise<Uint8Array | null> => {
  const { documentType } = args;
  throw Error(`Fetch failed: Invalid document type ${documentType} provided.`);
}