// ce imports
import { NODE_FILE_MAP as CORE_NODE_FILE_MAP } from "src/ce/constants/utility";
// local imports
import { ExtensionFileSetStorageKey } from "../types/storage";
import { ADDITIONAL_EXTENSIONS } from "./extensions";

export const NODE_FILE_MAP: {
  [key: string]: {
    fileSetName: ExtensionFileSetStorageKey;
  };
} = {
  ...CORE_NODE_FILE_MAP,
  [ADDITIONAL_EXTENSIONS.ATTACHMENT]: {
    fileSetName: "deletedAttachmentSet",
  },
};
