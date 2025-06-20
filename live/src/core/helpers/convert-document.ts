// plane editor
import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getAllDocumentFormatsFromRichTextEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
  getBinaryDataFromRichTextEditorHTMLString,
} from "@plane/editor";
// plane types
import { TDocumentPayload } from "@plane/types";

type TArgs = {
  document_html: string;
  variant: "rich" | "document";
};

export const convertHTMLDocumentToAllFormats = (args: TArgs): TDocumentPayload => {
  const { document_html, variant } = args;

  let allFormats: TDocumentPayload;

  if (variant === "rich") {
    const contentBinary = getBinaryDataFromRichTextEditorHTMLString(document_html);
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromRichTextEditorBinaryData(contentBinary);
    allFormats = {
      description: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  } else if (variant === "document") {
    const contentBinary = getBinaryDataFromDocumentEditorHTMLString(document_html);
    const { contentBinaryEncoded, contentHTML, contentJSON } =
      getAllDocumentFormatsFromDocumentEditorBinaryData(contentBinary);
    allFormats = {
      description: contentJSON,
      description_html: contentHTML,
      description_binary: contentBinaryEncoded,
    };
  } else {
    throw new Error(`Invalid variant provided: ${variant}`);
  }

  return allFormats;
};
