// plane editor
import {
  applyUpdates,
  convertBase64StringToBinaryData,
  getAllDocumentFormatsFromRichTextEditorBinaryData,
} from "@plane/editor/lib";

export type TResolveConflictsRequestBody = {
  original_document: string;
  updates: string;
};

export type TResolveConflictsResponse = {
  description_binary: string;
  description_html: string;
  description: object;
};

export const resolveDocumentConflicts = (body: TResolveConflictsRequestBody): TResolveConflictsResponse => {
  const { original_document, updates } = body;
  try {
    // convert from base64 to buffer
    const originalDocumentBuffer = original_document ? convertBase64StringToBinaryData(original_document) : null;
    const updatesBuffer = updates ? convertBase64StringToBinaryData(updates) : null;
    // decode req.body
    const decodedOriginalDocument = originalDocumentBuffer ? new Uint8Array(originalDocumentBuffer) : new Uint8Array();
    const decodedUpdates = updatesBuffer ? new Uint8Array(updatesBuffer) : new Uint8Array();
    // resolve conflicts
    let resolvedDocument: Uint8Array;
    if (decodedOriginalDocument.length === 0) {
      // use updates to create the document id original_description is null
      resolvedDocument = applyUpdates(decodedUpdates);
    } else {
      // use original document and updates to resolve conflicts
      resolvedDocument = applyUpdates(decodedOriginalDocument, decodedUpdates);
    }

    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromRichTextEditorBinaryData(resolvedDocument);

    return {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
    };
  } catch (error) {
    throw new Error("Internal server error");
  }
};
