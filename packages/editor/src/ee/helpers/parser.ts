/**
 * @description function to extract all additional assets from HTML content
 * @param htmlContent
 * @returns {string[]} array of additional asset sources
 */
export const extractAdditionalAssetsFromHTMLContent = (htmlContent: string): string[] => {
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // collect all unique asset sources
  const assetSources = new Set<string>();
  // extract sources from attachment components
  const attachmentComponents = doc.querySelectorAll("attachment-component");
  attachmentComponents.forEach((component) => {
    const src = component.getAttribute("src");
    if (src) assetSources.add(src);
  });
  return Array.from(assetSources);
};

/**
 * @description function to replace additional assets in HTML content with new IDs
 * @param props
 * @returns {string} HTML content with replaced additional assets
 */
export const replaceAdditionalAssetsInHTMLContent = (props: {
  htmlContent: string;
  assetMap: Record<string, string>;
}): string => {
  const { htmlContent, assetMap } = props;
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // replace sources in attachment components
  const attachmentComponents = doc.querySelectorAll("attachment-component");
  attachmentComponents.forEach((component) => {
    const oldSrc = component.getAttribute("src");
    if (oldSrc && assetMap[oldSrc]) {
      component.setAttribute("src", assetMap[oldSrc]);
    }
  });
  // serialize the document back into a string
  return doc.body.innerHTML;
};
