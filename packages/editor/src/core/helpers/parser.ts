// plane imports
import type { TDocumentPayload, TDuplicateAssetData, TDuplicateAssetResponse, TEditorAssetType } from "@plane/types";
// plane web imports
import {
  extractAdditionalAssetsFromHTMLContent,
  replaceAdditionalAssetsInHTMLContent,
} from "@/plane-editor/helpers/parser";
// local imports
import { convertHTMLDocumentToAllFormats } from "./yjs-utils";

/**
 * @description function to extract all assets from HTML content
 * @param htmlContent
 * @returns {string[]} array of asset sources
 */
const extractAssetsFromHTMLContent = (htmlContent: string): string[] => {
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // collect all unique asset sources
  const assetSources = new Set<string>();
  // extract sources from image components
  const imageComponents = doc.querySelectorAll("image-component");
  imageComponents.forEach((component) => {
    const src = component.getAttribute("src");
    if (src) assetSources.add(src);
  });
  const additionalAssetIds = extractAdditionalAssetsFromHTMLContent(htmlContent);
  return [...Array.from(assetSources), ...additionalAssetIds];
};

/**
 * @description function to replace assets in HTML content with new IDs
 * @param props
 * @returns {string} HTML content with replaced assets
 */
const replaceAssetsInHTMLContent = (props: { htmlContent: string; assetMap: Record<string, string> }): string => {
  const { htmlContent, assetMap } = props;
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // replace sources in image components
  const imageComponents = doc.querySelectorAll("image-component");
  imageComponents.forEach((component) => {
    const oldSrc = component.getAttribute("src");
    if (oldSrc && assetMap[oldSrc]) {
      component.setAttribute("src", assetMap[oldSrc]);
    }
  });
  // replace additional sources
  const replacedHTMLContent = replaceAdditionalAssetsInHTMLContent({
    htmlContent: doc.body.innerHTML,
    assetMap,
  });
  return replacedHTMLContent;
};

export const getEditorContentWithReplacedAssets = async (props: {
  descriptionHTML: string;
  entityId: string;
  entityType: TEditorAssetType;
  projectId: string | undefined;
  variant: "rich" | "document";
  duplicateAssetService: (params: TDuplicateAssetData) => Promise<TDuplicateAssetResponse>;
}): Promise<TDocumentPayload> => {
  const { descriptionHTML, entityId, entityType, projectId, variant, duplicateAssetService } = props;
  let replacedDescription = descriptionHTML;
  // step 1: extract image assets from the description
  const assetIds = extractAssetsFromHTMLContent(descriptionHTML);
  if (assetIds.length !== 0) {
    // step 2: duplicate the image assets
    const duplicateAssetsResponse = await duplicateAssetService({
      entity_id: entityId,
      entity_type: entityType,
      project_id: projectId,
      asset_ids: assetIds,
    });
    if (Object.keys(duplicateAssetsResponse ?? {}).length > 0) {
      // step 3: replace the image assets in the description
      replacedDescription = replaceAssetsInHTMLContent({
        htmlContent: descriptionHTML,
        assetMap: duplicateAssetsResponse,
      });
    }
  }
  // step 4: convert the description to the document payload
  const documentPayload = convertHTMLDocumentToAllFormats({
    document_html: replacedDescription,
    variant,
  });
  return documentPayload;
};
