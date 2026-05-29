/**
 * @description function to extract all additional assets from HTML content
 * @param htmlContent
 * @returns {string[]} array of additional asset sources
 */
export const extractAdditionalAssetsFromHTMLContent = (_htmlContent: string): string[] => [];

/**
 * @description function to replace additional assets in HTML content with new IDs
 * @param props
 * @returns {string} HTML content with replaced additional assets
 */
export const replaceAdditionalAssetsInHTMLContent = (props: {
  htmlContent: string;
  assetMap: Record<string, string>;
}): string => {
  const { htmlContent } = props;
  return htmlContent;
};
