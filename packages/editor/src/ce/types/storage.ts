import { CharacterCountStorage } from "@tiptap/extension-character-count";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { type HeadingExtensionStorage } from "@/extensions";
import { type CustomImageExtensionStorage } from "@/extensions/custom-image/types";
import { type CustomLinkStorage } from "@/extensions/custom-link";
import { type ImageExtensionStorage } from "@/extensions/image";
import { type MentionExtensionStorage } from "@/extensions/mentions";
import { type UtilityExtensionStorage } from "@/extensions/utility";

export type ExtensionStorageMap = {
  [CORE_EXTENSIONS.CUSTOM_IMAGE]: CustomImageExtensionStorage;
  [CORE_EXTENSIONS.IMAGE]: ImageExtensionStorage;
  [CORE_EXTENSIONS.CUSTOM_LINK]: CustomLinkStorage;
  [CORE_EXTENSIONS.HEADINGS_LIST]: HeadingExtensionStorage;
  [CORE_EXTENSIONS.MENTION]: MentionExtensionStorage;
  [CORE_EXTENSIONS.UTILITY]: UtilityExtensionStorage;
  [CORE_EXTENSIONS.CHARACTER_COUNT]: CharacterCountStorage;
};

export type ExtensionFileSetStorageKey = Extract<keyof ImageExtensionStorage, "deletedImageSet">;
