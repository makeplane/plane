import { HeadingExtensionStorage } from "@/extensions";
import { CustomImageExtensionStorage } from "@/extensions/custom-image";
import { CustomLinkStorage } from "@/extensions/custom-link";
import { ImageExtensionStorage } from "@/extensions/image";
import { MentionExtensionStorage } from "@/extensions/mentions";

export type ExtensionStorageMap = {
  imageComponent: CustomImageExtensionStorage;
  image: ImageExtensionStorage;
  link: CustomLinkStorage;
  headingList: HeadingExtensionStorage;
  mention: MentionExtensionStorage;
};

export type ExtensionFileSetStorageKey = Extract<keyof ImageExtensionStorage, "deletedImageSet">;
