// types
import { TFileMetaDataLite, TFileSignedURLResponse } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";

/**
 * @description from the provided signed URL response, generate a payload to be used to upload the file
 * @param {TFileSignedURLResponse} signedURLResponse
 * @param {File} file
 * @returns {FormData} file upload request payload
 */
export const generateFileUploadPayload = (signedURLResponse: TFileSignedURLResponse, file: File): FormData => {
  const formData = new FormData();
  Object.entries(signedURLResponse.upload_data.fields).forEach(([key, value]) => formData.append(key, value));
  formData.append("file", file);
  return formData;
};

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
 * @description returns the necessary file meta data to upload a file
 * @param {File} file
 * @returns {TFileMetaDataLite} payload with file info
 */
export const getFileMetaDataForUpload = (file: File): TFileMetaDataLite => ({
  name: file.name,
  size: file.size,
  type: file.type,
});

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
  } catch (error) {
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
