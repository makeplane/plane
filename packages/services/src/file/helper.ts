import { TFileMetaDataLite, TFileSignedURLResponse } from "@plane/types";

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
  const sourcePaths = src.split("/");
  const assetUrl = sourcePaths[sourcePaths.length - 1];
  return assetUrl;
};
