import { TFileSignedURLResponse } from "@plane/types";

export type TProjectAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  asset_url: string;
  project_id: string;
  // required
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type TProjectAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TProjectAttachment;
};

export type TProjectAttachmentMap = {
  [project_id: string]: TProjectAttachment;
};

export type TProjectAttachmentIdMap = {
  [project_id: string]: string[];
};
