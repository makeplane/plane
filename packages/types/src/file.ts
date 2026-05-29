import type { EFileAssetType } from "./enums";

export type TFileMetaDataLite = {
  name: string;
  // file size in bytes
  size: number;
  type: string;
};

export type TFileEntityInfo = {
  entity_identifier: string;
  entity_type: EFileAssetType;
};

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

export type TDuplicateAssetData = {
  entity_id: string;
  entity_type: EFileAssetType;
  project_id?: string;
  asset_ids: string[];
};

export type TDuplicateAssetResponse = Record<string, string>; // asset_id -> new_asset_id
