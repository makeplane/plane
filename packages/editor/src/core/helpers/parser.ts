// plane imports
import { FileService } from "@plane/services";
import { TDocumentPayload } from "@plane/types";
import { TEditorAssetType } from "@plane/types/src/enums";
// local imports
import { convertHTMLDocumentToAllFormats } from "./yjs-utils";

const fileService = new FileService();

/**
 * @description function to extract all image assets from HTML content
 * @param htmlContent
 * @returns {string[]} array of image asset sources
 */
export const extractImageAssetsFromHTMLContent = (htmlContent: string): string[] => {
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // get all image components
  const imageComponents = doc.querySelectorAll("image-component");
  // collect all unique image sources
  const imageSources = new Set<string>();
  // extract sources from image components
  imageComponents.forEach((component) => {
    const src = component.getAttribute("src");
    if (src) imageSources.add(src);
  });
  return Array.from(imageSources);
};

/**
 * @description function to replace image assets in HTML content with new IDs
 * @param props
 * @returns {string} HTML content with replaced image assets
 */
export const replaceImageAssetsInHTMLContent = (props: {
  htmlContent: string;
  assetMap: Record<string, string>;
}): string => {
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
  // serialize the document back into a string
  return doc.body.innerHTML;
};

export const getEditorContentWithReplacedImageAssets = async (props: {
  descriptionHTML: string;
  entityId: string;
  entityType: TEditorAssetType;
  projectId: string | undefined;
  variant: "rich" | "document";
  workspaceSlug: string;
}): Promise<TDocumentPayload> => {
  const { descriptionHTML, entityId, entityType, projectId, variant, workspaceSlug } = props;
  let replacedDescription = descriptionHTML;
  // step 1: extract image assets from the description
  const imageAssets = extractImageAssetsFromHTMLContent(descriptionHTML);
  if (imageAssets.length !== 0) {
    // step 2: duplicate the image assets
    const duplicateAssetsResponse = await fileService.duplicateAssets(workspaceSlug, {
      entity_id: entityId,
      entity_type: entityType,
      project_id: projectId,
      asset_ids: imageAssets,
    });
    if (Object.keys(duplicateAssetsResponse ?? {}).length > 0) {
      // step 3: replace the image assets in the description
      replacedDescription = replaceImageAssetsInHTMLContent({
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
