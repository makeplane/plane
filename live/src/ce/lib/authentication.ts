import { ConnectionConfiguration } from "@hocuspocus/server";
// types
import { TDocumentTypes } from "@/core/types/common.js";

type TArgs = {
  connection: ConnectionConfiguration
  cookie: string;
  documentType: TDocumentTypes | undefined;
  params: URLSearchParams;
}

export const authenticateUser = async (args: TArgs): Promise<void> => {
  const { documentType } = args;
  throw Error(`Authentication failed: Invalid document type ${documentType} provided.`);
}