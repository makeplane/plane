import { EFileAssetType } from "./enums"

export type TFileMetaDataLite = {
  name: string;
  // file size in bytes
  size: number;
  type: string;
}

export type TFileEntityInfo = {
  entity_identifier: string;
  entity_type: EFileAssetType;
}

export type TFileMetaData = TFileMetaDataLite & TFileEntityInfo;

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