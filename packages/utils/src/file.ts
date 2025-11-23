// plane imports
import { API_BASE_URL } from "@plane/constants";

/**
 * @description combine the file path with the base URL
 * @param {string} path
 * @returns {string} final URL with the base URL
 */
export const getFileURL = (path: string): string | undefined => {
  if (!path) return undefined;
  const isValidURL = path.startsWith("http");
  if (isValidURL) return path;
  return `${API_BASE_URL}${path}`;
};

/**
 * @description this function returns the assetId from the asset source
 * @param {string} src
 * @returns {string} assetId
 */
export const getAssetIdFromUrl = (src: string): string => {
  // remove the last char if it is a slash
  if (src.charAt(src.length - 1) === "/") src = src.slice(0, -1);
  const sourcePaths = src.split("/");
  const assetUrl = sourcePaths[sourcePaths.length - 1];
  return assetUrl;
};

/**
 * @description encode image via URL to base64
 * @param {string} url
 * @returns
 */
export const getBase64Image = async (url: string): Promise<string> => {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  // Try to create a URL object to validate the URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  const response = await fetch(url);
  // check if the response is OK
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("Failed to convert image to base64."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the image file."));
    };

    reader.readAsDataURL(blob);
  });
};

/**
 * @description downloads a CSV file
 * @param {Array<Array<string>> | { [key: string]: string }} data - The data to be exported to CSV
 * @param {string} name - The name of the file to be downloaded
 */
export const csvDownload = (data: Array<Array<string>> | { [key: string]: string }, name: string) => {
  const rows = Array.isArray(data) ? [...data] : [Object.keys(data), Object.values(data)];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.href = encodedUri;
  link.download = `${name}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
