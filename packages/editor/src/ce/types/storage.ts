import { HeadingExtensionStorage } from "@/extensions";
import { CustomImageExtensionStorage } from "@/extensions/custom-image";
import { CustomLinkStorage } from "@/extensions/custom-link";
import { MentionExtensionStorage } from "@/extensions/mentions";
import { ImageExtensionStorage } from "@/plugins/image";

export type ExtensionStorageMap = {
  imageComponent: CustomImageExtensionStorage;
  image: ImageExtensionStorage;
  link: CustomLinkStorage;
  headingList: HeadingExtensionStorage;
  mention: MentionExtensionStorage;
};
