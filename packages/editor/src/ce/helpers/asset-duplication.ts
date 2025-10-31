import { v4 as uuidv4 } from "uuid";

export type AssetDuplicationContext = {
  element: Element;
  originalHtml: string;
};

export type AssetDuplicationResult = {
  modifiedHtml: string;
  shouldProcess: boolean;
};

export type AssetDuplicationHandler = (context: AssetDuplicationContext) => AssetDuplicationResult;

const imageComponentHandler: AssetDuplicationHandler = ({ element, originalHtml }) => {
  const src = element.getAttribute("src");
  if (!src) {
    return { modifiedHtml: originalHtml, shouldProcess: false };
  }

  // Capture the original HTML BEFORE making any modifications
  const originalTag = element.outerHTML;

  // Use setAttribute to update attributes
  const newId = uuidv4();
  element.setAttribute("status", "duplicating");
  element.setAttribute("id", newId);

  // Get the modified HTML AFTER the changes
  const modifiedTag = element.outerHTML;
  const modifiedHtml = originalHtml.replace(originalTag, modifiedTag);

  return { modifiedHtml, shouldProcess: true };
};

export const assetDuplicationHandlers: Record<string, AssetDuplicationHandler> = {
  "image-component": imageComponentHandler,
};
