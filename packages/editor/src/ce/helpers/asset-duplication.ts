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
  const newId = uuidv4();
  const originalTag = element.outerHTML;
  const modifiedTag = originalTag
    .replace(`<image-component`, `<image-component status="duplicating"`)
    .replace(/id="[^"]*"/, `id="${newId}"`);

  const modifiedHtml = originalHtml.replace(originalTag, modifiedTag);
  return { modifiedHtml, shouldProcess: true };
};

export const assetDuplicationHandlers: Record<string, AssetDuplicationHandler> = {
  "image-component": imageComponentHandler,
};
