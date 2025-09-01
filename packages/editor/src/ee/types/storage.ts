import {
  ExtensionStorageMap as CoreExtensionStorageMap,
  ExtensionFileSetStorageKey as CoreExtensionFileSetStorageKey,
} from "@/ce/types/storage";
// local imports
import { ADDITIONAL_EXTENSIONS } from "../constants/extensions";
import { type AttachmentExtensionStorage } from "../extensions/attachments/types";
import { type CollaborationCursorStorage } from "../extensions/collaboration-cursor";
import { type TCommentMarkStorage } from "../extensions/comments";
import { ExternalEmbedExtensionStorage } from "../extensions/external-embed/types";
import { type MathematicsExtensionStorage } from "../extensions/mathematics/types";

export type ExtensionStorageMap = CoreExtensionStorageMap & {
  [ADDITIONAL_EXTENSIONS.ATTACHMENT]: AttachmentExtensionStorage;
  [ADDITIONAL_EXTENSIONS.COLLABORATION_CURSOR]: CollaborationCursorStorage;
  [ADDITIONAL_EXTENSIONS.COMMENTS]: TCommentMarkStorage;
  [ADDITIONAL_EXTENSIONS.MATHEMATICS]: MathematicsExtensionStorage;
  [ADDITIONAL_EXTENSIONS.EXTERNAL_EMBED]: ExternalEmbedExtensionStorage;
};

export type ExtensionFileSetStorageKey =
  | CoreExtensionFileSetStorageKey
  | Extract<keyof AttachmentExtensionStorage, "deletedAttachmentSet">;
