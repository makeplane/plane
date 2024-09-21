// types
import { TDocumentTypes } from "@/core/types/common.js";
// lib
import { fetchWorkspacePageDescriptionBinary } from "./workspace-page.js";

type TArgs = {
  cookie: string | undefined;
  documentType: TDocumentTypes | undefined;
  pageId: string;
  params: URLSearchParams;
}

export const fetchDocument = async (args: TArgs): Promise<Uint8Array | null> => {
  const { cookie, documentType, pageId, params } = args;

  if (documentType === "workspace_page") {
    const fetchedData = await fetchWorkspacePageDescriptionBinary(
      params,
      pageId,
      cookie,
    );
    return fetchedData;
  } else {
    throw Error(`Fetch failed: Invalid document type ${documentType} provided.`);
  }
}
