// local imports
import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";

export type TEditorAttachmentAsset = {
  href: string;
  id: string;
  name: string;
  size: number;
  src: string;
  type: ADDITIONAL_EXTENSIONS.ATTACHMENT;
};

export type TAdditionalEditorAsset = TEditorAttachmentAsset;
