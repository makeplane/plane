import { ConnectionConfiguration } from "@hocuspocus/server";
// types
import { TDocumentTypes } from "@/core/types/common.js";

type TArgs = {
  connection: ConnectionConfiguration
  cookie: string | undefined;
  params: URLSearchParams;
}

export const authenticateUser = (args: TArgs): Promise<void> => {
  const { params } = args;
  const documentType = params.get("documentType")?.toString() as
    | TDocumentTypes
    | undefined;
  throw Error(`Authentication failed: Invalid document type ${documentType} provided.`);
}