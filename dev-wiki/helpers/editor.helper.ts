// plane imports
import { convertHTMLDocumentToAllFormats } from "@plane/editor";
import { TDocumentPayload } from "@plane/types";
import { TEditorAssetType } from "@plane/types/src/enums";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type TEditorSrcArgs = {
  assetId: string;
  projectId?: string;
  workspaceSlug: string;
};

/**
 * @description generate the file source using assetId
 * @param {TEditorSrcArgs} args
 */
export const getEditorAssetSrc = (args: TEditorSrcArgs): string | undefined => {
  const { assetId, projectId, workspaceSlug } = args;
  let url: string | undefined = "";
  if (projectId) {
    url = getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/`);
  } else {
    url = getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`);
  }
  return url;
};

export const getTextContent = (jsx: JSX.Element | React.ReactNode | null | undefined): string => {
  if (!jsx) return "";

  const div = document.createElement("div");
  div.innerHTML = jsx.toString();
  return div.textContent?.trim() ?? "";
};

export const isEditorEmpty = (description: string | undefined): boolean =>
  !description ||
  description === "<p></p>" ||
  description === `<p class="editor-paragraph-block"></p>` ||
  description.trim() === "";

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
