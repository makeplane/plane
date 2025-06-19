import {
  ExtensionStorageMap as CoreExtensionStorageMap,
  ExtensionFileSetStorageKey as CoreExtensionFileSetStorageKey,
} from "src/ce/types/storage";
// local imports
import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { type AttachmentExtensionStorage } from "../extensions/attachments/types";

export type ExtensionStorageMap = CoreExtensionStorageMap & {
  [ADDITIONAL_EXTENSIONS.ATTACHMENT]: AttachmentExtensionStorage;
};

export type ExtensionFileSetStorageKey =
  | CoreExtensionFileSetStorageKey
  | Extract<keyof AttachmentExtensionStorage, "deletedAttachmentSet">;
