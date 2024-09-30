import { EFileAssetType } from "./enums"

export type TFileMetaData = {
  entity_identifier: string;
  entity_type: EFileAssetType;
  name: string;
  // file size in bytes
  size: number;
  type: string;
};

export type TFileSignedURLResponse = {
  asset_id: string;
  asset_url: string;
  upload_data: {
    url: string;
    fields: {
      "Content-Type": string;
      key: string;
      "x-amz-algorithm": string;
      "x-amz-credential": string;
      "x-amz-date": string;
      policy: string;
      "x-amz-signature": string;
    };
  };
};

export type TFileUploadPayload = TFileSignedURLResponse["upload_data"]["fields"] & {
  file: File;
};