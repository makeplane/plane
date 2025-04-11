import { TFileSignedURLResponse } from "../file";

export type TCreateUpdateInitiativeModal = {
  isOpen: boolean;
  initiativeId: string | undefined;
};

export type TInitiativeAttachment = {
  id: string;
  attributes: {
    name: string;
    size: number;
  };
  asset: string;
  asset_url: string;
  Initiative_id: string;
  // required
  created_by: string;
  updated_at: string;
  updated_by: string;
};

export type TInitiativeAttachmentUploadResponse = TFileSignedURLResponse & {
  attachment: TInitiativeAttachment;
};

export type TInitiativeAttachmentMap = {
  [initiative_id: string]: TInitiativeAttachment;
};

export type TInitiativeAttachmentIdMap = {
  [initiative_id: string]: string[];
};
